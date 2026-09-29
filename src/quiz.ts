// ============================================================
// Logika Quiz & Progres (gaya Duolingo)
// ============================================================

import { soalCadangan } from "./soalCadangan";

export interface Soal {
  pertanyaan: string;
  pilihan: string[];
  jawaban: number; // index jawaban benar
  penjelasan: string;
}

export interface Progres {
  xp: number; // total XP
  streak: number; // hari berturut-turut
  terakhirMain: string; // tanggal terakhir main (YYYY-MM-DD)
  totalBenar: number;
  totalSoal: number;
  riwayat: { tanggal: string; benar: number; total: number }[];
}

const KUNCI_PROGRES = "kora_quiz_progres_v1";

/** Tanggal hari ini dalam format YYYY-MM-DD (waktu lokal). */
export function hariIni(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Muat progres dari localStorage. */
export function muatProgres(): Progres {
  try {
    const s = localStorage.getItem(KUNCI_PROGRES);
    if (!s) return kosong();
    const p = JSON.parse(s) as Progres;
    return { ...kosong(), ...p };
  } catch {
    return kosong();
  }
}

function kosong(): Progres {
  return { xp: 0, streak: 0, terakhirMain: "", totalBenar: 0, totalSoal: 0, riwayat: [] };
}

/** Simpan progres. */
export function simpanProgres(p: Progres) {
  try {
    localStorage.setItem(KUNCI_PROGRES, JSON.stringify(p));
  } catch {
    /* abaikan */
  }
}

/** Hitung level dari XP. Tiap level butuh XP makin banyak. */
export function levelDari(xp: number): { level: number; xpLevelIni: number; xpLevelDepan: number } {
  let level = 1;
  let sisa = xp;
  let butuh = 100;
  while (sisa >= butuh) {
    sisa -= butuh;
    level++;
    butuh = Math.round(butuh * 1.3); // tiap level makin berat
  }
  return { level, xpLevelIni: sisa, xpLevelDepan: butuh };
}

/** Update progres setelah selesai satu sesi quiz. */
export function updateProgres(
  lama: Progres,
  benar: number,
  total: number,
): { baru: Progres; xpDidapat: number; streakNaik: boolean } {
  const hari = hariIni();

  // Hitung XP: 10 per soal benar + bonus 20 kalau semua benar
  let xpDidapat = benar * 10;
  if (benar === total && total > 0) xpDidapat += 20;

  // Hitung streak
  let streak = lama.streak;
  let streakNaik = false;
  if (lama.terakhirMain !== hari) {
    // Cek apakah kemarin main (biar streak nyambung)
    const kemarin = new Date();
    kemarin.setDate(kemarin.getDate() - 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    const strKemarin = `${kemarin.getFullYear()}-${pad(kemarin.getMonth() + 1)}-${pad(kemarin.getDate())}`;

    if (lama.terakhirMain === strKemarin) {
      streak = lama.streak + 1; // lanjut streak
    } else if (lama.terakhirMain === "") {
      streak = 1; // pertama kali
    } else {
      streak = 1; // putus, mulai lagi
    }
    streakNaik = true;
  }

  const baru: Progres = {
    xp: lama.xp + xpDidapat,
    streak,
    terakhirMain: hari,
    totalBenar: lama.totalBenar + benar,
    totalSoal: lama.totalSoal + total,
    riwayat: [...lama.riwayat, { tanggal: hari, benar, total }].slice(-60),
  };

  return { baru, xpDidapat, streakNaik };
}

/** Cek apakah hari ini sudah main. */
export function sudahMainHariIni(p: Progres): boolean {
  return p.terakhirMain === hariIni();
}

/** Ambil soal dari API. Kalau gagal, pakai soal cadangan. */
export async function ambilSoal(
  level: string,
  topik: string,
  jumlah: number,
): Promise<Soal[]> {
  try {
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, topik, jumlah }),
    });

    const j = (await res.json().catch(() => ({}))) as { error?: string; soal?: Soal[] };

    if (!res.ok) throw new Error(j.error ?? "Gagal memuat soal.");
    if (!Array.isArray(j.soal) || j.soal.length === 0) throw new Error("Soal kosong.");

    return j.soal;
  } catch {
    // Mode luring: pakai soal cadangan supaya latihan tetap jalan
    return soalCadangan(topik, jumlah);
  }
}
