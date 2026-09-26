export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export const STORAGE_KEY = "korean_chat_v1";

export const SAPAAN = [
  "Terjemahkan ke Korea: 'Besok saya akan perbaiki komputer di ruang kontrol'",
  "Apa artinya '수고하셨습니다'?",
  "Bedanya 안녕하세요 dan 안녕하십니까?",
  "Bagaimana cara sopan minta tolong ke atasan Korea?",
  "Istilah Korea untuk 'rapat', 'laporan', 'jadwal'?",
  "Koreksi kalimat Korea saya: 저는 내일 회의 준비합니다",
];

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
