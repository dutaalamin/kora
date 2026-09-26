/**
 * Vercel Serverless Function — chat ke Google Gemini.
 *
 * Body: { messages: [{ role: "user"|"model", text: string }] }
 * Balasan: { reply: string }
 *
 * API key disimpan di env GEMINI_API_KEY (tidak pernah sampai ke browser).
 * Model dicoba berurutan (fallback) supaya tidak gagal saat satu model sibuk.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Dicoba dari atas ke bawah sampai ada yang berhasil. */
const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest",
];

const SYSTEM = `Kamu adalah "Sejong" — asisten bahasa Korea untuk orang Indonesia yang bekerja di perusahaan Korea (POSCO).

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

Kalau pengguna menyapa atau bertanya siapa kamu, perkenalkan diri singkat sebagai Sejong lalu tawarkan bantuan.`;

interface Pesan {
  role: "user" | "model";
  text: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metode tidak diizinkan." });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "GEMINI_API_KEY belum di-set. Hubungi admin." });
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

  let terakhirSibuk = false;

  // Coba tiap model sampai berhasil
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
        continue;
      }

      const pesan = data.error?.message ?? "";
      // 503 / sibuk / 429 -> coba model berikutnya
      if (
        r.status === 503 ||
        r.status === 429 ||
        /high demand|overloaded|temporarily|unavailable/i.test(pesan)
      ) {
        terakhirSibuk = true;
        continue;
      }
      // error lain (mis. key salah) -> langsung berhenti
      return res.status(r.status === 400 ? 400 : 502).json({
        error: pesan || "Gagal menghubungi AI.",
      });
    } catch {
      terakhirSibuk = true;
      continue;
    }
  }

  if (terakhirSibuk) {
    return res.status(503).json({
      error: "Server AI sedang ramai. Tunggu sebentar lalu coba lagi.",
    });
  }
  return res.status(502).json({ error: "Gagal menghubungi AI. Coba lagi." });
}
