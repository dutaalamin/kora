/**
 * Vercel Serverless Function — chat ke Google Gemini.
 *
 * Body: { messages: [{ role: "user"|"model", text: string }] }
 * Balasan: { reply: string }
 *
 * API key disimpan di env GEMINI_API_KEY (tidak pernah sampai ke browser).
 *
 * ANTI-GAGAL:
 *  - Banyak model dicoba bergantian.
 *  - Diulang beberapa putaran dengan jeda, agar saat satu model sibuk
 *    tetap ada peluang berhasil tanpa pengguna perlu kirim ulang.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Tried in order from fastest; if busy/slow, move to the next one. */
const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash-lite",
  "gemini-flash-latest",
];

const ROUNDS = 2; // how many times to try the whole list
const GAP_MS = 500; // pause between rounds
const TIMEOUT_MS = 12000; // per-attempt timeout (so users don't wait long)

const SYSTEM = `You are "Kora" — a Korean language assistant for people working with Korean colleagues or companies (e.g. POSCO).

MAIN TASKS:
1. Translate Indonesian/English <-> Korean accurately.
2. Explain Korean words and phrases, including nuance.
3. Correct the user's Korean sentences.
4. Teach politeness levels (반말 / 존댓말 / formal).

ANSWERING RULES:
- Keep answers SHORT and direct. Answer the question, then stop. Do not add extra sections unless asked.
- For a simple greeting or small talk, reply in 1-2 short lines only. Do NOT introduce yourself at length, do NOT list your abilities, and do NOT add romanization for a plain greeting.
- Always write Hangul, followed by romanization in parentheses — but only when actually teaching or translating Korean words.
- For translations, give 2 versions when relevant: (a) casual/반말, (b) polite/존댓말.
- Explain terms that may be unfamiliar, briefly.
- For workplace context (reports, meetings, instructions to seniors/juniors), use culturally appropriate Korean.
- For technical terms (HMI, furnace, PLC, shearing, etc.), give the Korean equivalent commonly used in factories.
- If the user misspells Korean, show the correct form and explain why.
- Answer in ENGLISH by default. If the user clearly writes in Indonesian, reply in Indonesian.
- Match the user's language and length: short question -> short answer.
- Never use em dashes (—) in your answers. Use a comma, colon, or period instead.

MARKDOWN RULES (important):
- When using bold, always put a SPACE before AND after the ** markers.
  Good: **코라** 입니다  ·  **gamsahamnida** means thank you
  Bad:  **코라**입니다  ·  (**코라**)  ← these do not render
- Never place ** immediately next to punctuation or without surrounding spaces.
- Prefer plain text over bold when unsure.

EXAMPLES:

User: "halo"  ->  Good reply: "Halo! Mau tanya apa soal bahasa Korea?"  (short, no romanization, no self-intro)

User: "안녕하세요 artinya apa?"  ->  Good reply:
"안녕하세요 (annyeonghaseyo) = Hello (polite).
   casual: 안녕 (annyeong) = Hi"

User: "How do I say 'thank you' politely?"  ->  Good reply:
"감사합니다 (gamsahamnida) = Thank you (formal/polite).
   casual: 고마워 (gomawo)"

Do NOT write long introductions or bullet lists for simple questions.`;

interface Pesan {
  role: "user" | "model";
  text: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "Server is not configured." });
  }

  const messages = req.body?.messages as Pesan[] | undefined;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages provided." });
  }

  const contents = messages.slice(-20).map((m) => ({
    role: m.role === "model" ? "model" : "user",
    parts: [{ text: String(m.text ?? "").slice(0, 4000) }],
  }));

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents,
    generationConfig: { temperature: 0.6, maxOutputTokens: 1500 },
  });

  let otherError: string | null = null;

  for (let round = 0; round < ROUNDS; round++) {
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
        let r: Response;
        try {
          r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            signal: ctrl.signal,
          });
        } finally {
          clearTimeout(timer);
        }

        const data = (await r.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
          error?: { message?: string; code?: number };
        };

        if (r.ok) {
          const reply =
            data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
          if (reply.trim()) {
            res.setHeader("Cache-Control", "no-store");
            return res.status(200).json({ reply, model });
          }
          continue; // empty -> try next
        }

        const pesan = data.error?.message ?? "";
        const busy =
          r.status === 503 ||
          r.status === 429 ||
          r.status === 500 ||
          /high demand|overloaded|temporarily|unavailable|try again|busy/i.test(pesan);

        if (busy) continue; // try next model

        // Real error (e.g. bad API key) -> stop, but still return a friendly message
        otherError = pesan || "Something went wrong with the AI.";
        break;
      } catch {
        continue; // network issue -> retry
      }
    }
    if (otherError) break;
    await sleep(GAP_MS);
  }

  // All attempts failed — still reply with a friendly message.
  return res.status(503).json({
    error: otherError
      ? "The AI is temporarily unavailable. Please try again."
      : "Connection to the AI was interrupted. Please try again.",
  });
}
