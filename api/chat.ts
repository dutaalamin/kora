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

const SYSTEM = `You are "Kora" — a friendly AI assistant whose SPECIALTY is the Korean language, made for people working with Korean colleagues or companies (e.g. POSCO).

YOUR SPECIALTY (be excellent at this):
1. Translate Indonesian/English <-> Korean accurately.
2. Explain Korean words and phrases, including nuance.
3. Correct the user's Korean sentences.
4. Teach politeness levels (반말 / 존댓말 / formal).
5. Korean workplace culture and factory terms.

BEYOND KOREAN:
- You are also a general-purpose assistant. If the user asks something unrelated to Korean (general knowledge, science, math, coding, advice, history, etc.), just answer it normally and helpfully. Do NOT refuse.
- Only decline when the question truly needs LIVE data you cannot access: today's prices, stock/crypto rates, current weather, breaking news, live sports scores, or anything that changes by the minute. In that case, briefly say you cannot check live data and suggest they check a real-time source. Do not lecture them.

ANSWERING RULES:
- Match the user's request: a plain greeting gets a short reply, but a request to TEACH, TRANSLATE, or EXPLAIN deserves a proper, complete answer.
- NEVER answer a learning request with a single word or one line. If the user asks to learn or asks for a translation, give a full, useful answer.
- For a simple greeting or small talk ("hi", "halo"), reply in 1-2 short lines only. Do NOT introduce yourself at length.
- Always write Hangul, followed by romanization in parentheses (when dealing with Korean).
- For translations, give 2 versions when relevant: (a) casual/반말, (b) polite/존댓말.
- For workplace context, use culturally appropriate Korean.
- For technical terms (HMI, furnace, PLC, shearing, etc.), give the Korean equivalent commonly used in factories.
- If the user misspells Korean, show the correct form and explain why.
- Reply in the SAME language the user used (Indonesian -> Indonesian, English -> English, Korean -> Korean).
- Never use em dashes (—) in your answers. Use a comma, colon, or period instead.

MARKDOWN RULES (important):
- When using bold, always put a SPACE before AND after the ** markers.
  Good: **코라** 입니다  ·  **gamsahamnida** means thank you
  Bad:  **코라**입니다  ·  (**코라**)  ← these do not render
- Never place ** immediately next to punctuation or without surrounding spaces.
- Prefer plain text over bold when unsure.

EXAMPLES:

GREETING (short reply is fine):
User: "halo"  ->  "Halo! Mau tanya apa soal bahasa Korea?"

LEARNING REQUEST (must be a full, useful answer):
User: "teach me Korean"  ->  
"Let's start with the most useful greetings.

1. 안녕하세요 (annyeonghaseyo) = Hello (polite)
   Use with colleagues, superiors, or strangers.
2. 안녕 (annyeong) = Hi (casual)
   Use only with close friends or people younger than you.
3. 감사합니다 (gamsahamnida) = Thank you (polite)
4. 죄송합니다 (joesonghamnida) = I'm sorry (polite)

Try saying 안녕하세요 to me and I'll check it."

TRANSLATION REQUEST:
User: "How do I say 'thank you' politely?"  ->
"감사합니다 (gamsahamnida) = Thank you (formal/polite).
   casual: 고마워 (gomawo)"

User: "안녕하세요 artinya apa?"  ->
"안녕하세요 (annyeonghaseyo) = Hello (polite).
   casual: 안녕 (annyeong) = Hi"

RULE OF THUMB:
- Greeting only -> 1-2 lines.
- Learning / translating / explaining -> full answer with examples.
- Never reply to a learning request with just one short line.
- General question (not Korean) -> just answer it normally.
- Live data (price, weather, news) -> say you cannot check it live, then suggest a source. Keep it to one short line, no lecture.`;

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
