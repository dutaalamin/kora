import { useEffect, useRef, useState } from "react";
import {
  Send, Loader2, Copy, Check, RotateCw,
  Plus, PanelLeft, Trash2, SquarePen,
} from "lucide-react";
import {
  kirimChat, idBaru, judulDari, muatSemua, simpanSemua,
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

  // Load from localStorage
  useEffect(() => {
    const list = muatSemua();
    if (list.length) {
      setDaftar(list);
      setAktifId(list[0].id);
    }
    if (window.innerWidth >= 768) setSidebar(true);
  }, []);

  // Persist
  useEffect(() => {
    if (daftar.length) simpanSemua(daftar);
  }, [daftar]);

  // Auto-scroll
  useEffect(() => {
    bawah.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan.length, loading]);

  function newChat() {
    const p: Percakapan = {
      id: idBaru(),
      judul: "New chat",
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

  function removeChat(id: string) {
    if (!confirm("Delete this chat?")) return;
    setDaftar((d) => {
      const sisa = d.filter((p) => p.id !== id);
      if (id === aktifId) setAktifId(sisa[0]?.id ?? "");
      return sisa;
    });
  }

  async function kirim(teks?: string) {
    const isi = (teks ?? input).trim();
    if (!isi || loading) return;

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
      // Coba beberapa kali otomatis sebelum menyerah
      let balas = "";
      let sukses = false;
      for (let coba = 0; coba < 3; coba++) {
        try {
          balas = await kirimChat(baru);
          sukses = true;
          break;
        } catch {
          if (coba < 2) await new Promise((r) => setTimeout(r, 800 * (coba + 1)));
        }
      }

      if (sukses) {
        setDaftar((d) =>
          d.map((p) =>
            p.id === id
              ? { ...p, pesan: [...baru, { role: "model", text: balas }], diubah: Date.now() }
              : p,
          ),
        );
      } else {
        setError("gagal");
      }
    } catch {
      setError("gagal");
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

  /** Chat input box (used both on the empty state and inside a conversation). */
  const kotakChat = (
    <div className="flex items-center gap-2 rounded-full bg-[#1f1f1f] py-2 pl-7 pr-2">
      <textarea
        ref={areaTeks}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        rows={1}
        placeholder="Ask Kora"
        className="max-h-[180px] min-h-[30px] flex-1 resize-none self-center bg-transparent py-1.5 text-[16px] text-white outline-none placeholder:text-neutral-400"
      />
      <button
        onClick={() => kirim()}
        disabled={loading || !input.trim()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3a3a3a] text-white transition hover:bg-[#4a4a4a] disabled:opacity-40"
        aria-label="Send"
      >
        {loading ? <Loader2 size={19} className="animate-spin" /> : <Send size={18} />}
      </button>
    </div>
  );

  return (
    <div className="flex h-full bg-black text-white">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] shrink-0 flex-col bg-black transition-transform duration-200 md:static md:translate-x-0 ${
          sidebar ? "translate-x-0" : "-translate-x-full md:hidden"
        }`}
      >
        {/* Logo + name */}
        <div className="flex items-center justify-between px-3 pb-1 pt-3">
          <div className="flex items-center gap-2.5 px-1">
            <img src="/logo.svg" alt="Kora" className="h-9 w-9 rounded-lg" />
            <span className="text-[20px] font-semibold tracking-tight text-white">Kora</span>
          </div>
          <button
            onClick={() => setSidebar(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-[#1a1a1a] hover:text-white"
            aria-label="Close sidebar"
          >
            <PanelLeft size={17} />
          </button>
        </div>

        {/* New chat */}
        <div className="px-2 pb-2 pt-2">
          <button
            onClick={newChat}
            className="flex w-full items-center gap-2.5 rounded-lg bg-[#1a1a1a] px-3 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#242424]"
          >
            <SquarePen size={17} />
            New chat
          </button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {urut.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12px] text-neutral-500">
              No conversations yet
            </p>
          ) : (
            <>
              <p className="px-3 pb-1 pt-3 text-[11.5px] font-medium text-neutral-500">
                Recents
              </p>
              {urut.map((p) => (
                <div
                  key={p.id}
                  className={`group flex items-center gap-1 rounded-lg pr-1 transition ${
                    p.id === aktifId ? "bg-[#1a1a1a]" : "hover:bg-[#141414]"
                  }`}
                >
                  <button
                    onClick={() => {
                      setAktifId(p.id);
                      setError("");
                      if (window.innerWidth < 768) setSidebar(false);
                    }}
                    className="flex min-w-0 flex-1 items-center px-3 py-2.5 text-left"
                  >
                    <span className="truncate text-[14px] text-neutral-200">{p.judul}</span>
                  </button>
                  <button
                    onClick={() => removeChat(p.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 opacity-0 transition group-hover:opacity-100 hover:bg-[#242424] hover:text-white"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </aside>

      {/* Lapisan gelap saat sidebar terbuka di HP */}
      {sidebar && (
        <div
          onClick={() => setSidebar(false)}
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Area utama */}
      <div className="flex min-w-0 flex-1 flex-col bg-black">
        {/* Open-sidebar buttons (shown when sidebar is closed) */}
        {!sidebar && (
          <>
            <button
              onClick={() => setSidebar(true)}
              className="fixed left-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a1a] text-neutral-300 transition hover:bg-[#242424] hover:text-white"
              aria-label="Open sidebar"
            >
              <PanelLeft size={18} />
            </button>
            <button
              onClick={newChat}
              className="fixed right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a1a] text-neutral-300 transition hover:bg-[#242424] hover:text-white md:hidden"
              aria-label="New chat"
            >
              <Plus size={18} />
            </button>
          </>
        )}

        {/* Conversation */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-[760px] flex-col px-4 pb-6 pt-16 md:pt-6">
            {pesan.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center pb-[12vh]">
                <h2 className="text-[28px] font-semibold text-white sm:text-[32px]">
                  How can I help you?
                </h2>
                <p className="mt-3 text-[15px] text-neutral-400">
                  Ask me anything about Korean
                </p>
                {/* Chat box right under the greeting */}
                <div className="mt-8 w-full">{kotakChat}</div>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-6">
                  {pesan.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[88%]">
                        {m.role === "user" ? (
                          <div className="whitespace-pre-wrap rounded-3xl bg-[#1f1f1f] px-4 py-2.5 text-[16px] leading-relaxed text-white">
                            {m.text}
                          </div>
                        ) : (
                          <div className="kr text-[16px] leading-relaxed text-white">
                            <div className="markdown">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                            </div>
                            <button
                              onClick={() => salin(i, m.text)}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-medium text-neutral-500 transition hover:bg-[#1a1a1a] hover:text-neutral-200"
                            >
                              {copied === i ? <Check size={12} /> : <Copy size={12} />}
                              {copied === i ? "Copied" : "Copy"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="kora-dot" />
                        <span className="kora-dot" style={{ animationDelay: "0.16s" }} />
                        <span className="kora-dot" style={{ animationDelay: "0.32s" }} />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex justify-start">
                      <button
                        onClick={() => {
                          const terakhir = pesan.filter((p) => p.role === "user").pop();
                          if (terakhir) kirim(terakhir.text);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-[#3a3a3a] bg-[#1f1f1f] px-4 py-2 text-[13.5px] font-medium text-white transition hover:bg-[#2a2a2a]"
                      >
                        <RotateCw size={14} />
                        Retry
                      </button>
                    </div>
                  )}

                  <div ref={bawah} />
                </div>

                {/* Chat box at the bottom when a conversation exists */}
                <div className="w-full pt-4">{kotakChat}</div>
              </>
            )}
          </div>
        </main>
      </div>

    </div>
  );
}
