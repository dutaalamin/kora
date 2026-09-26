import { useEffect, useRef, useState } from "react";
import {
  Send, Loader2, Trash2, Copy, Check, Sparkles, AlertCircle, Languages,
} from "lucide-react";
import { kirimChat, STORAGE_KEY, SAPAAN, type ChatMessage } from "./chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const bawah = useRef<HTMLDivElement>(null);
  const areaTeks = useRef<HTMLTextAreaElement>(null);

  // Muat riwayat
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setMessages(JSON.parse(s) as ChatMessage[]);
    } catch {
      /* abaikan */
    }
  }, []);

  // Simpan riwayat
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      /* abaikan */
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    bawah.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function kirim(teks?: string) {
    const isi = (teks ?? input).trim();
    if (!isi || loading) return;

    const baru: ChatMessage[] = [...messages, { role: "user", text: isi }];
    setMessages(baru);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const balas = await kirimChat(baru);
      setMessages([...baru, { role: "model", text: balas }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      // tetap tampilkan pesan user, hapus yang gagal
      setMessages(baru);
    } finally {
      setLoading(false);
      areaTeks.current?.focus();
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      kirim();
    }
  }

  function salin(i: number, teks: string) {
    navigator.clipboard.writeText(teks);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  }

  function hapusSemua() {
    if (!confirm("Hapus semua riwayat percakapan?")) return;
    setMessages([]);
    setError("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* abaikan */
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[860px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white">
              <Languages size={19} />
            </span>
            <div>
              <h1 className="text-base font-semibold text-slate-900">Asisten Bahasa Korea</h1>
              <p className="text-xs text-slate-500">Kerja &amp; sehari-hari — Indonesia ↔ 한국어</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={hapusSemua}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          )}
        </div>
      </header>

      {/* Percakapan */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[860px] px-4 py-6 sm:px-6">
          {messages.length === 0 && (
            <div className="py-10 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Sparkles size={24} />
              </span>
              <h2 className="text-lg font-semibold text-slate-900">
                Mau tanya apa tentang bahasa Korea?
              </h2>
              <p className="mx-auto mt-1.5 max-w-[420px] text-sm text-slate-500">
                Terjemah, arti kata, koreksi kalimat, atau tingkat kesopanan — tanya saja pakai
                bahasa Indonesia.
              </p>

              <div className="mx-auto mt-7 grid max-w-[640px] gap-2 sm:grid-cols-2">
                {SAPAAN.map((s) => (
                  <button
                    key={s}
                    onClick={() => kirim(s)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-[13px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] ${m.role === "user" ? "order-1" : ""}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                      m.role === "user"
                        ? "whitespace-pre-wrap bg-slate-900 text-white"
                        : "kr border border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    {m.role === "user" ? (
                      m.text
                    ) : (
                      <div className="markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {m.role === "model" && (
                    <button
                      onClick={() => salin(i, m.text)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 transition hover:text-slate-700"
                    >
                      {copied === i ? <Check size={12} /> : <Copy size={12} />}
                      {copied === i ? "Tersalin" : "Salin"}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-500">
                  <Loader2 size={15} className="animate-spin" />
                  Sedang menyusun jawaban…
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-slate-400 bg-slate-200 px-3.5 py-2.5 text-[13px] text-slate-900"
              >
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <div ref={bawah} />
          </div>
        </div>
      </main>

      {/* Input */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[860px] px-4 py-3.5 sm:px-6">
          <div className="flex items-end gap-2">
            <textarea
              ref={areaTeks}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder="Tulis pertanyaan… (Enter untuk kirim, Shift+Enter baris baru)"
              className="max-h-[160px] min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
            <button
              onClick={() => kirim()}
              disabled={loading || !input.trim()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-40"
              aria-label="Kirim"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Jawaban AI bisa keliru — untuk hal penting, cek ulang ke orang yang paham.
          </p>
        </div>
      </footer>
    </div>
  );
}
