export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface Percakapan {
  id: string;
  judul: string;
  pesan: ChatMessage[];
  dibuat: number;
  diubah: number;
}

const KUNCI = "korean_chats_v2";

export const SAPAAN = [
  "Terjemahkan ke Korea: 'Besok saya akan perbaiki komputer di ruang kontrol'",
  "Apa artinya '수고하셨습니다'?",
  "Bedanya 안녕하세요 dan 안녕하십니까?",
  "Bagaimana cara sopan minta tolong ke atasan Korea?",
  "Istilah Korea untuk 'rapat', 'laporan', 'jadwal'?",
  "Koreksi kalimat Korea saya: 저는 내일 회의 준비합니다",
];

export function idBaru(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Ambil judul dari pesan pertama (maks 40 huruf). */
export function judulDari(teks: string): string {
  const t = teks.trim().replace(/\s+/g, " ");
  return t.length > 40 ? t.slice(0, 40) + "…" : t || "Percakapan baru";
}

/** Muat semua percakapan dari localStorage. */
export function muatSemua(): Percakapan[] {
  try {
    const s = localStorage.getItem(KUNCI);
    if (!s) return [];
    const arr = JSON.parse(s) as Percakapan[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Simpan semua percakapan ke localStorage. */
export function simpanSemua(list: Percakapan[]) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(list.slice(0, 100)));
  } catch {
    /* abaikan */
  }
}

/** Kirim percakapan ke server, dapat balasan AI. */
export async function kirimChat(messages: ChatMessage[]): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const j = (await res.json().catch(() => ({}))) as { error?: string; reply?: string };

  if (res.status === 429) {
    throw new Error("Kuota AI habis. Tunggu sebentar lalu coba lagi.");
  }
  if (!res.ok) throw new Error(j.error ?? "Gagal menghubungi AI.");
  if (!j.reply) throw new Error("AI tidak memberi jawaban.");

  return j.reply;
}
