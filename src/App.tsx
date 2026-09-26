import { useEffect, useRef, useState } from "react";
import {
  Send, Loader2, Copy, Check, Sparkles, AlertCircle, Languages,
  Plus, PanelLeft, Trash2, MessageSquare, SquarePen,
} from "lucide-react";
import {
  kirimChat, SAPAAN, idBaru, judulDari, muatSemua, simpanSemua,
  type ChatMessage, type Percakapan,
} from "./chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function App() {
  const [daftar, setDaftar] = useState<Percakapan[]>([]);
  const [aktifId, setAktifId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const bawah = useRef<HTMLDivElement>(null);
  const areaTeks = useRef<HTMLTextAreaElement>(null);

  const aktif = daftar.find((p) => p.id === aktifId) ?? null;
  const pesan = aktif?.pesan ?? [];

  // Muat dari localStorage
  useEffect(() => {
    const list = muatSemua();
    if (list.length) {
      setDaftar(list);
      setAktifId(list[0].id);
    }
    // layar lebar: sidebar terbuka
    if (window.innerWidth >= 768) setSidebar(true);
  }, []);

  // Simpan
  useEffect(() => {
    if (daftar.length) simpanSemua(daftar);
  }, [daftar]);

  // Auto-scroll
  useEffect(() => {
    bawah.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan.length, loading]);

  function baru() {
    const p: Percakapan = {
      id: idBaru(),
      judul: "Percakapan baru",
      pesan: [],
      dibuat: Date.now(),
      diubah: Date.now(),
    };
    setDaftar((d) => [p, ...d]);
    setAktifId(p.id);
    setError("");
    setInput("");
    if (window.innerWidth < 768) setSidebar(false);
    setTimeout(() => areaTeks.current?.focus(), 50);
  }

  function hapus(id: string) {
    if (!confirm("Hapus percakapan ini?")) return;
    setDaftar((d) => {
      const sisa = d.filter((p) => p.id !== id);
      if (id === aktifId) setAktifId(sisa[0]?.id ?? "");
      return sisa;
    });
  }

  async function kirim(teks?: string) {
    const isi = (teks ?? input).trim();
    if (!isi || loading) return;

    // Buat percakapan bila belum ada
    let id = aktifId;
    if (!id || !aktif) {
      const p: Percakapan = {
        id: idBaru(),
        judul: judulDari(isi),
        pesan: [],
        dibuat: Date.now(),
        diubah: Date.now(),
      };
      id = p.id;
      setDaftar((d) => [p, ...d]);
      setAktifId(p.id);
    }

    const pesanLama = aktif?.pesan ?? [];
    const baru: ChatMessage[] = [...pesanLama, { role: "user", text: isi }];
    setInput("");
    setLoading(true);
    setError("");

    setDaftar((d) =>
      d.map((p) =>
        p.id === id
          ? {
              ...p,
              judul: p.pesan.length === 0 ? judulDari(isi) : p.judul,
              pesan: baru,
              diubah: Date.now(),
            }
          : p,
      ),
    );

    try {
      const balas = await kirimChat(baru);
      setDaftar((d) =>
        d.map((p) =>
          p.id === id
            ? { ...p, pesan: [...baru, { role: "model", text: balas }], diubah: Date.now() }
            : p,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
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

  const urut = [...daftar].sort((a, b) => b.diubah - a.diubah);

  return (
    <div className="flex h-full bg-[#0d0d0d] text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] shrink-0 flex-col bg-[#000000] transition-transform duration-200 md:static md:translate-x-0 ${
          sidebar ? "translate-x-0" : "-translate-x-full md:hidden"
        }`}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <button
            onClick={baru}
            className="flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-200 transition hover:bg-[#1a1a1a]"
          >
            <SquarePen size={17} />
            Chat baru
          </button>
          <button
            onClick={() => setSidebar(false)}
            className="ml-1 hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#1a1a1a] hover:text-slate-100 md:flex"
            aria-label="Tutup sidebar"
          >
            <PanelLeft size={17} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {urut.length === 0 && (
            <p className="px-3 py-6 text-center text-[12px] text-slate-500">
              Belum ada riwayat
            </p>
          )}
          {urut.map((p) => (
            <div
              key={p.id}
              className={`group flex items-center gap-1 rounded-lg pr-1 transition ${
                p.id === aktifId ? "bg-[#1a1a1a]" : "hover:bg-[#0d0d0d]"
              }`}
            >
              <button
                onClick={() => {
                  setAktifId(p.id);
                  setError("");
                  if (window.innerWidth < 768) setSidebar(false);
                }}
                className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2.5 text-left"
              >
                <MessageSquare size={15} className="shrink-0 text-slate-500" />
                <span className="truncate text-[13px] text-slate-300">{p.judul}</span>
              </button>
              <button
                onClick={() => hapus(p.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-[#242424] hover:text-slate-200"
                aria-label="Hapus"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Lapisan gelap saat sidebar terbuka di HP */}
      {sidebar && (
        <div
          onClick={() => setSidebar(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      {/* Area utama */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-2 border-b border-[#1f1f1f] px-3 py-2.5">
          <button
            onClick={() => setSidebar((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#1a1a1a] hover:text-slate-100"
            aria-label="Buka sidebar"
          >
            <PanelLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Languages size={17} className="text-slate-300" />
            <h1 className="text-[14px] font-medium text-slate-200">
              Asisten Bahasa Korea
            </h1>
          </div>
        </header>

        {/* Percakapan */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[760px] px-4 py-6">
            {pesan.length === 0 && (
              <div className="py-12 text-center">
                <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a1a1a] text-slate-200">
                  <Sparkles size={24} />
                </span>
                <h2 className="text-xl font-semibold text-slate-100">
                  Mau tanya apa tentang bahasa Korea?
                </h2>
                <p className="mx-auto mt-2 max-w-[440px] text-[13px] text-slate-400">
                  Terjemah, arti kata, koreksi kalimat, atau tingkat kesopanan — tanya saja pakai
                  bahasa Indonesia.
                </p>

                <div className="mx-auto mt-8 grid max-w-[620px] gap-2 sm:grid-cols-2">
                  {SAPAAN.map((s) => (
                    <button
                      key={s}
                      onClick={() => kirim(s)}
                      className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-left text-[12.5px] text-slate-300 transition hover:bg-[#242424]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {pesan.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[88%]">
                    {m.role === "user" ? (
                      <div className="whitespace-pre-wrap rounded-3xl bg-[#1f1f1f] px-4 py-2.5 text-[14px] leading-relaxed text-slate-100">
                        {m.text}
                      </div>
                    ) : (
                      <div className="kr text-[14px] leading-relaxed text-slate-200">
                        <div className="markdown">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                        </div>
                        <button
                          onClick={() => salin(i, m.text)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-[#1a1a1a] hover:text-slate-300"
                        >
                          {copied === i ? <Check size={12} /> : <Copy size={12} />}
                          {copied === i ? "Tersalin" : "Salin"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 text-[13px] text-slate-400">
                    <Loader2 size={15} className="animate-spin" />
                    Sedang menyusun jawaban…
                  </div>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-3 rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-4 py-3 text-[13px] text-slate-200"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button
                    onClick={() => {
                      const terakhir = pesan.filter((p) => p.role === "user").pop();
                      if (terakhir) kirim(terakhir.text);
                    }}
                    className="shrink-0 rounded-lg border border-[#4a4a4a] px-3 py-1.5 text-[12px] font-medium text-slate-200 transition hover:bg-[#2a2a2a]"
                  >
                    Coba lagi
                  </button>
                </div>
              )}

              <div ref={bawah} />
            </div>
          </div>
        </main>

        {/* Input */}
        <footer className="px-4 pb-5 pt-2">
          <div className="mx-auto max-w-[760px]">
            <div className="flex items-end gap-2 rounded-3xl border border-[#2a2a2a] bg-[#1a1a1a] p-2 pl-4 focus-within:border-[#4a4a4a]">
              <textarea
                ref={areaTeks}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                rows={1}
                placeholder="Tanya apa saja tentang bahasa Korea…"
                className="max-h-[180px] min-h-[28px] flex-1 resize-none bg-transparent py-1.5 text-[14px] text-slate-100 outline-none placeholder:text-slate-500"
              />
              <button
                onClick={() => kirim()}
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0d0d0d] transition hover:bg-slate-200 disabled:opacity-30"
                aria-label="Kirim"
              >
                {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <p className="mt-2.5 text-center text-[11px] text-slate-500">
              Jawaban AI bisa keliru — untuk hal penting, cek ulang ke orang yang paham.
            </p>
          </div>
        </footer>
      </div>

      {/* Tombol chat baru (HP) */}
      <button
        onClick={baru}
        className="fixed bottom-32 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#1f1f1f] text-slate-200 shadow-lg transition hover:bg-[#2a2a2a] md:hidden"
        aria-label="Chat baru"
      >
        <Plus size={19} />
      </button>
    </div>
  );
}
