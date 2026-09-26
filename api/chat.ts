/**
 * Vercel Serverless Function — chat ke Google Gemini.
 *
 * Body: { messages: [{ role: "user"|"model", text: string }] }
 * Balasan: { reply: string }
 *
 * API key disimpan di env GEMINI_API_KEY (tidak pernah sampai ke browser).
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const MODEL = "gemini-2.0-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM = `Kamu adalah "Asisten Bahasa Korea" untuk orang Indonesia yang bekerja di perusahaan Korea (POSCO).

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

Kalau pengguna hanya menyapa, balas ramah dan tawarkan bantuan.`;

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
    return res.status(500).json({
      error: "GEMINI_API_KEY belum di-set. Hubungi admin.",
    });
  }

  const messages = req.body?.messages as Pesan[] | undefined;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Tidak ada pesan." });
  }

  // Batasi panjang agar tidak boros kuota
  const trimmed = messages.slice(-20).map((m) => ({
    role: m.role === "model" ? "model" : "user",
    parts: [{ text: String(m.text ?? "").slice(0, 4000) }],
  }));

  try {
    const r = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: trimmed,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 1500,
        },
      }),
    });

    const data = (await r.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };

    if (!r.ok) {
      const pesan = data.error?.message ?? "Gagal menghubungi AI.";
      return res.status(r.status === 429 ? 429 : 502).json({ error: pesan });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

    if (!reply.trim()) {
      return res.status(502).json({ error: "AI tidak memberi jawaban. Coba lagi." });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Terjadi kesalahan.",
    });
  }
}
