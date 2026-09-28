import type { VercelRequest, VercelResponse } from "@vercel/node";

// ============================================================
// API Quiz — Kora bikin soal kosakata Korea, dinilai otomatis
// ============================================================
//
// Cara kerja:
//   1. Front-end kirim level + topik + jumlah soal
//   2. API minta Gemini bikin soal (JSON)
//   3. Front-end tampilkan, user jawab, dinilai di front-end
//
// ============================================================

const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash-lite",
  "gemini-flash-latest",
];

const ROUNDS = 2;
const GAP_MS = 500;
const TIMEOUT_MS = 15000;

const PROMPT_SOAL = `You generate Korean vocabulary quiz questions for an Indonesian learner who works at a steel company (POSCO) in Indonesia.

Generate exactly {JUMLAH} multiple-choice questions about: {TOPIK}
Difficulty level: {LEVEL}

Rules:
- Each question asks the meaning of a Korean word/phrase, OR asks for the Korean word given the Indonesian meaning.
- Use vocabulary appropriate for the level.
- Since the learner works at a factory, prefer workplace and daily-life words when the topic allows.
- 4 options per question. Exactly ONE correct answer.
- Options must be plausible but clearly wrong for the incorrect ones.
- Write Hangul with romanization for Korean words, e.g. 안녕하세요 (annyeonghaseyo).
- Explanation must be short (max 2 sentences), in Indonesian, and helpful.

Return ONLY valid JSON, no markdown fences, no extra text:
{
  "soal": [
    {
      "pertanyaan": "Apa arti dari 안녕하세요 (annyeonghaseyo)?",
      "pilihan": ["Terima kasih", "Halo", "Selamat tinggal", "Maaf"],
      "jawaban": 1,
      "penjelasan": "안녕하세요 berarti halo, dipakai untuk sapaan sopan."
    }
  ]
}

"jawaban" is the index (0-3) of the correct option.`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "Server belum dikonfigurasi." });
  }

  const jumlah = Math.min(Math.max(Number(req.body?.jumlah) || 5, 3), 10);
  const level = String(req.body?.level ?? "pemula");
  const topik = String(req.body?.topik ?? "kosakata sehari-hari");

  const prompt = PROMPT_SOAL
    .replace("{JUMLAH}", String(jumlah))
    .replace("{LEVEL}", level)
    .replace("{TOPIK}", topik);

  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 2500,
      responseMimeType: "application/json",
    },
  });

  for (let round = 0; round < 2; round++) {
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
          error?: { message?: string };
        };

        if (r.ok) {
          const teks =
            data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
          if (!teks.trim()) continue;

          // Bersihkan kalau ada markdown fence
          const bersih = teks.replace(/```json|```/g, "").trim();

          try {
            const parsed = JSON.parse(bersih) as { soal?: unknown[] };
            if (Array.isArray(parsed.soal) && parsed.soal.length > 0) {
              res.setHeader("Cache-Control", "no-store");
              return res.status(200).json({ soal: parsed.soal, model });
            }
          } catch {
            continue; // JSON rusak, coba model berikutnya
          }
          continue;
        }

        const pesan = data.error?.message ?? "";
        const busy =
          r.status === 503 ||
          r.status === 429 ||
          r.status === 500 ||
          /high demand|overloaded|temporarily|unavailable|try again|busy/i.test(pesan);
        if (busy) continue;
        break;
      } catch {
        continue;
      }
    }
    await sleep(500);
  }

  return res.status(503).json({
    error: "Gagal membuat soal. Coba lagi sebentar.",
  });
}
