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

/** Dicoba berurutan; kalau sibuk, lanjut ke berikutnya. */
const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.8-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
];

const PUTARAN = 2; // berapa kali mencoba seluruh daftar
const JEDA_MS = 700; // jeda antar putaran

const SYSTEM = `Kamu adalah "Kora" — asisten bahasa Korea untuk orang Indonesia yang bekerja di perusahaan Korea (POSCO).

TUGAS UTAMA:
1. Menerjemahkan Indonesia <-> Korea dengan akurat.
2. Menjelaskan arti kata/frasa Korea, termasuk nuansa.
3. Mengoreksi kalimat Korea yang ditulis pengguna.
4. Mengajarkan tingkat kesopanan (반말 / 존댓말 / formal).

ATURAN MENJAWAB:
- Selalu tulis Hangul, lalu cara baca (romanisasi) dalam tanda kurung.
- Untuk terjemahan, beri 2 versi bila relevan: (a) santai/반말, (b) sopan/존댓말.
- Jelaskan istilah yang mungkin asing bagi orang Indonesia.
- Kalau konteksnya kerja kantor (laporan, rapat, instruksi ke atasan/bawahan), gunakan bahasa yang tepat secara budaya Korea.
- Kalau istilah teknis (HMI, furnace, PLC, shearing, dll), sebutkan padanan Korea yang umum dipakai di pabrik.
- Jawab ringkas, rapi, pakai poin-poin bila perlu. Jangan bertele-tele.
- Kalau pengguna salah tulis Korea, tunjukkan bentuk yang benar dan jelaskan alasannya.
- Gunakan bahasa Indonesia sebagai bahasa penjelasan.

FORMAT CONTOH:
안녕하세요 (annyeonghaseyo) = Halo (sopan)
   반말: 안녕 (annyeong) = Hai (ke teman dekat)

Kalau pengguna menyapa atau bertanya siapa kamu, perkenalkan diri singkat sebagai Kora lalu tawarkan bantuan.`;

interface Pesan {
  role: "user" | "model";
  text: string;
}

const tidur = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metode tidak diizinkan." });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "Server belum dikonfigurasi." });
  }

  const messages = req.body?.messages as Pesan[] | undefined;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Tidak ada pesan." });
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

  let adaErrorLain: string | null = null;

  for (let putaran = 0; putaran < PUTARAN; putaran++) {
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

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
          continue; // kosong -> coba berikutnya
        }

        const pesan = data.error?.message ?? "";
        const sibuk =
          r.status === 503 ||
          r.status === 429 ||
          r.status === 500 ||
          /high demand|overloaded|temporarily|unavailable|try again|busy/i.test(pesan);

        if (sibuk) continue; // coba model berikutnya

        // Error nyata (mis. API key salah) -> hentikan, tapi tetap beri pesan ramah
        adaErrorLain = pesan || "Terjadi masalah pada AI.";
        break;
      } catch {
        continue; // jaringan bermasalah -> coba lagi
      }
    }
    if (adaErrorLain) break;
    await tidur(JEDA_MS);
  }

  // Semua percobaan gagal — tetap balas dengan pesan ramah.
  return res.status(503).json({
    error: adaErrorLain
      ? "AI sedang tidak bisa dihubungi. Coba kirim ulang."
      : "Koneksi ke AI terputus sebentar. Coba kirim ulang.",
  });
}
