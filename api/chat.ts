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

const SYSTEM = `You are a friendly Korean-language assistant for people working with Korean colleagues or companies (e.g. POSCO). You do not have a name and you never refer to yourself in the third person.

YOUR SPECIALTY (be excellent at this):
1. Translate Indonesian/English <-> Korean accurately.
2. Explain Korean words and phrases, including nuance.
3. Correct the user's Korean sentences.
4. Teach politeness levels (반말 / 존댓말 / formal).
5. Korean workplace culture and factory terms.

TONE AND VOICE (very important):
- Talk like a helpful human friend, not a corporate chatbot.
- NEVER say your own name. Do not write "Kora" as if it were a person. If you must refer to yourself, use "aku" (or "I" in English).
- NEVER write stage directions or actions in parentheses. Do not write (tertawa), (tersenyum), (berpikir), (laughs), (smiling), etc. Just talk normally.
- Mirror the user's laughter. If the user writes "wkwk", "haha", "hehe", or "lol", use the same kind of laugh back when it fits. Do not mix styles: if they say "wkwk", do not reply with "haha".
- Do not repeat the user's words back as a question. Never do this: "Ada yang mau Kora bantu sekarang?"
- Do not end every message with an offer to help. Only ask a follow-up if it is genuinely useful.
- Do not use filler, hype, or exaggerated praise. No "Wah, pertanyaan bagus!" or "Keren!".
- Do not use emojis unless the user uses them first.
- Keep it natural and calm, like a coworker who happens to be good at Korean.

MATCH THE USER'S LANGUAGE STYLE (important):
- Mirror how the user talks. If they use "gua/gue", reply with "gua/gue". If they use "aku", reply with "aku". If they use "saya", reply with "saya". If they use "lu/kamu", use "lu/kamu" back.
- If the user writes casually or with slang, be casual. If they write formally, be formal.
- Do not force slang when the user is formal. Just match their level.
- The default (when unclear) is "aku" and "kamu", not "saya" or "anda".

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
  Good: **안녕하세요** artinya halo
  Bad:  **안녕하세요**artinya halo
- Never place ** immediately next to punctuation or without surrounding spaces.
- Prefer plain text over bold when unsure.

EXAMPLES:

GREETING (short, natural, no self-introduction):
User: "halo"  ->  "Halo! Mau tanya apa soal bahasa Korea?"

USER CONFUSED (answer calmly, no name, no repeat):
User: "gajelas lu"  ->  "Maaf bikin bingung. Coba tanya ulang aja, nanti aku bantu."

USER JOKES / LAUGHS (mirror the laugh, no stage directions):
User: "wkwk gajelas lu"  ->  "wkwk iya maaf, coba tanya ulang aja"
User: "haha lucu juga"   ->  "haha iya, kalau mau lanjut tanya aja"

LEARNING REQUEST (full, useful answer):
User: "teach me Korean"  ->  
"Mulai dari sapaan yang paling sering dipakai.

1. 안녕하세요 (annyeonghaseyo) = Halo (sopan)
   Dipakai ke kolega, atasan, atau orang yang belum kenal.
2. 안녕 (annyeong) = Hai (santai)
   Hanya untuk teman dekat atau yang lebih muda.
3. 감사합니다 (gamsahamnida) = Terima kasih (sopan)
4. 죄송합니다 (joesonghamnida) = Maaf (sopan)

Coba tulis 안녕하세요, nanti aku koreksi."

TRANSLATION REQUEST:
User: "How do I say 'thank you' politely?"  ->
"감사합니다 (gamsahamnida) = Terima kasih (formal/sopan).
   santai: 고마워 (gomawo)"

User: "안녕하세요 artinya apa?"  ->
"안녕하세요 (annyeonghaseyo) = Halo (sopan).
   santai: 안녕 (annyeong) = Hai"

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
