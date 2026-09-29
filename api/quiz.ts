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

const ROUNDS = 3;
const GAP_MS = 500;
const TIMEOUT_MS = 40000;

const PROMPT_SOAL = `You generate Korean vocabulary quiz questions for an Indonesian learner who works at a steel company (POSCO) in Indonesia.

Generate exactly {JUMLAH} multiple-choice questions about: {TOPIK}
Difficulty level: {LEVEL}

{VARIASI}

CRITICAL RULES (do not break these):
- NEVER reveal the answer inside the question. The question must NOT contain the Indonesian meaning that is the correct option.
  BAD : "Apa bahasa Korea 'kopi' (커피)?" -> option "Kopi"  (answer is given away)
  GOOD: "Apa arti dari 커피 (keopi)?"      -> options include "Kopi"
- Do NOT put the romanization of a Korean word next to its own Indonesian meaning.
- Each question must be DIFFERENT. Do not repeat the same word or the same question twice.
- Cover {JUMLAH} different words. No duplicates.

FORMAT:
- Mix two question types across the set:
  (a) Korean -> Indonesian: ask the meaning of a Korean word.
  (b) Indonesian -> Korean: ask the Korean word for an Indonesian meaning.
- 4 options per question. Exactly ONE correct answer.
- The 3 wrong options must be plausible (same category), not random.
- If the question asks for a Korean word, all 4 options must be Korean words (Hangul with romanization).
- If the question asks for a meaning, all 4 options must be Indonesian meanings.
- Explanation: short (max 2 sentences), in Indonesian.

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

/** Buang soal yang cacat (jawaban bocor di pertanyaan, duplikat, dll). */
function soalValid(s: any): boolean {
  if (!s || typeof s.pertanyaan !== "string") return false;
  if (!Array.isArray(s.pilihan) || s.pilihan.length !== 4) return false;
  if (typeof s.jawaban !== "number" || s.jawaban < 0 || s.jawaban > 3) return false;

  const tanya = s.pertanyaan.toLowerCase();
  const jawabBenar = String(s.pilihan[s.jawaban] ?? "").toLowerCase().trim();
  if (!jawabBenar) return false;

  // 1. Jawaban benar tidak boleh tertulis di pertanyaan
  //    (buang romanization dalam tanda kurung dulu biar tidak salah deteksi)
  const tanyaTanpaKurung = tanya.replace(/\([^)]*\)/g, " ");
  if (jawabBenar.length >= 3 && tanyaTanpaKurung.includes(jawabBenar)) return false;

  // 2. Pilihan tidak boleh duplikat
  const unik = new Set(s.pilihan.map((p: any) => String(p).toLowerCase().trim()));
  if (unik.size !== 4) return false;

  return true;
}

/** Bersihkan & filter daftar soal. */
function bersihkanSoal(arr: any[]): any[] {
  const hasil: any[] = [];
  const sudahAda = new Set<string>();
  for (const s of arr) {
    if (!soalValid(s)) continue;
    const kunci = String(s.pertanyaan).toLowerCase().trim();
    if (sudahAda.has(kunci)) continue;
    sudahAda.add(kunci);
    hasil.push(s);
  }
  return hasil;
}

/** Acak urutan array (Fisher-Yates). */
function acakArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

  // Variasi acak supaya AI tidak mengulang kata yang sama tiap kali
  const sudut = [
    "benda di sekitar",
    "kegiatan harian",
    "perasaan dan sifat",
    "tempat umum",
    "keluarga dan orang",
    "pekerjaan dan kantor",
    "alam dan cuaca",
    "transportasi",
    "teknologi",
    "kesehatan",
    "belanja dan uang",
    "waktu dan jadwal",
  ];
  const acakSudut = [...sudut].sort(() => Math.random() - 0.5).slice(0, 3);
  const nonce = Math.random().toString(36).slice(2, 8);

  const prompt = PROMPT_SOAL
    .replace("{JUMLAH}", String(jumlah))
    .replace("{LEVEL}", level)
    .replace("{TOPIK}", topik)
    .replace(
      "{VARIASI}",
      `Sesi acak #${nonce}. WAJIB pilih kata yang BERBEDA dari sesi sebelumnya — ` +
        `jangan selalu mulai dari kata yang paling umum. ` +
        `Fokuskan variasi pada sudut ini: ${acakSudut.join(", ")}. ` +
        `Gunakan kata benda, kerja, sifat, dan keterangan yang beragam. ` +
        `HINDARI kata yang terlalu sering muncul berikut (kecuali tidak ada pilihan lain): ` +
        `물, 밥, 친구, 집, 학교, 안녕하세요, 감사합니다, 고기, 김치, 사람, 시간, 커피.`,
    );

  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 2500,
      responseMimeType: "application/json",
    },
  });

  const kumpulan: any[] = []; // soal yang sudah lolos validasi (kalau kurang, kumpulkan)

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
            const parsed = JSON.parse(bersih) as { soal?: any[] };
            if (Array.isArray(parsed.soal) && parsed.soal.length > 0) {
              // Buang soal cacat & duplikat
              const bersihSoal = bersihkanSoal(parsed.soal);

              // Kalau masih cukup, langsung pakai
              if (bersihSoal.length >= Math.min(jumlah, 3)) {
                res.setHeader("Cache-Control", "no-store");
                return res.status(200).json({
                  soal: acakArray(bersihSoal).slice(0, jumlah),
                  model,
                });
              }

              // Kalau kurang, simpan dulu & coba minta lagi
              kumpulan.push(...bersihSoal);
              if (kumpulan.length >= Math.min(jumlah, 3)) {
                res.setHeader("Cache-Control", "no-store");
                return res.status(200).json({
                  soal: acakArray(bersihkanSoal(kumpulan)).slice(0, jumlah),
                  model,
                });
              }
              continue;
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

  // Kalau semua percobaan habis tapi ada soal terkumpul, pakai itu
  if (kumpulan.length >= 3) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ soal: acakArray(bersihkanSoal(kumpulan)).slice(0, jumlah) });
  }

  return res.status(503).json({
    error: "Gagal membuat soal. Coba lagi sebentar.",
  });
}
