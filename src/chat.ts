export interface Lampiran {
  nama: string;
  tipe: string; // MIME, mis. image/png atau text/plain
  data: string; // base64 tanpa prefix (gambar) atau isi teks (teks/dokumen)
  jenis: "gambar" | "teks";
  ukuran: number; // byte
  ekstensi?: string; // mis. "pdf", "docx" untuk ikon
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  lampiran?: Lampiran[];
}

export interface Percakapan {
  id: string;
  judul: string;
  pesan: ChatMessage[];
  dibuat: number;
  diubah: number;
}

const KUNCI = "korean_chats_v2";

export function idBaru(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Ambil judul dari pesan pertama (maks 40 huruf). */
export function judulDari(teks: string): string {
  const t = teks.trim().replace(/\s+/g, " ");
  return t.length > 40 ? t.slice(0, 40) + "…" : t || "New chat";
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
    throw new Error("AI quota reached. Please try again in a moment.");
  }
  if (!res.ok) throw new Error(j.error ?? "Could not reach the AI.");
  if (!j.reply) throw new Error("The AI did not return an answer.");

  return j.reply;
}
