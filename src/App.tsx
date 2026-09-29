import { useEffect, useRef, useState } from "react";
import {
  Send, Loader2, Copy, Check, RotateCw,
  PanelLeft, Trash2, SquarePen,
  Search, Images, Gamepad2, X,
  Paperclip, Mic, AudioLines, FileText, Square, Pencil,
} from "lucide-react";
import {
  kirimChatStream, idBaru, judulDari, muatSemua, simpanSemua,
  type ChatMessage, type Percakapan, type Lampiran,
} from "./chat";
import Quiz from "./components/Quiz";
import Gallery from "./components/Gallery";
import VoiceMode from "./components/VoiceMode";
import { bacaJadiTeks, jenisFile } from "./bacaFile";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function App() {
  const [daftar, setDaftar] = useState<Percakapan[]>([]);
  const [aktifId, setAktifId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [sidebar, setSidebar] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );
  const [isMobile, setIsMobile] = useState(false);
  const [quizTerbuka, setQuizTerbuka] = useState(false);
  const [cari, setCari] = useState("");
  const [cariBuka, setCariBuka] = useState(false);
  const [galeriTerbuka, setGaleriTerbuka] = useState(false);
  // TODO: ganti jadi true kalau fitur login sudah jadi
  const [sudahLogin] = useState(false);
  const [lampiran, setLampiran] = useState<Lampiran[]>([]);
  const [merekam, setMerekam] = useState(false);
  const [voiceTerbuka, setVoiceTerbuka] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editTeks, setEditTeks] = useState("");
  const [seret, setSeret] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);
  const teksRecRef = useRef("");
  const dasarRecRef = useRef("");
  const bawah = useRef<HTMLDivElement>(null);
  const areaTeks = useRef<HTMLTextAreaElement>(null);

  const aktif = daftar.find((p) => p.id === aktifId) ?? null;
  const pesan = aktif?.pesan ?? [];

  // Deteksi layar kecil (mobile) untuk menaruh chat bar di bawah
  useEffect(() => {
    const cek = () => setIsMobile(window.innerWidth < 768);
    cek();
    window.addEventListener("resize", cek);
    return () => window.removeEventListener("resize", cek);
  }, []);

  // Load from localStorage
  useEffect(() => {
    const list = muatSemua();
    if (list.length) {
      setDaftar(list);
      setAktifId(list[0].id);
    }
    if (window.innerWidth >= 768) setSidebar(true);
    // Fokus otomatis ke kotak chat saat halaman dibuka (desktop saja,
    // agar di HP keyboard tidak langsung terbuka)
    if (window.innerWidth >= 768) {
      const jam = setTimeout(() => areaTeks.current?.focus(), 120);
      return () => clearTimeout(jam);
    }
  }, []);

  // Persist
  useEffect(() => {
    if (daftar.length) simpanSemua(daftar);
  }, [daftar]);

  // Auto-scroll
  useEffect(() => {
    bawah.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan.length, loading]);

  // Fokus kotak chat saat ganti percakapan
  useEffect(() => {
    if (aktifId) setTimeout(() => areaTeks.current?.focus(), 50);
  }, [aktifId]);

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
    setGaleriTerbuka(false);
    setQuizTerbuka(false);
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
    if ((!isi && lampiran.length === 0) || loading) return;
    setGaleriTerbuka(false);
    setQuizTerbuka(false);

    const kiriman: Lampiran[] = lampiran;

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
    const baru: ChatMessage[] = [
      ...pesanLama,
      { role: "user", text: isi, lampiran: kiriman.length ? kiriman : undefined },
    ];
    setInput("");
    setLampiran([]);
    setLoading(true);
    setError("");

    setDaftar((d) =>
      d.map((p) =>
        p.id === id
          ? {
              ...p,
              judul: p.pesan.length === 0 ? judulDari(isi || kiriman[0]?.nama || "") : p.judul,
              pesan: baru,
              diubah: Date.now(),
            }
          : p,
      ),
    );

    try {
      await jalankan(baru, id);
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

  /** Kirim ulang riwayat ke AI (dipakai kirim, regenerate & edit). */
  async function jalankan(riwayat: ChatMessage[], id: string) {
    setLoading(true);
    setError("");
    // Sisipkan balon jawaban kosong yang akan terisi bertahap
    setDaftar((d) =>
      d.map((p) =>
        p.id === id
          ? { ...p, pesan: [...riwayat, { role: "model", text: "" }] }
          : p,
      ),
    );

    const tulis = (teks: string) => {
      setDaftar((d) =>
        d.map((p) => {
          if (p.id !== id) return p;
          const ps = [...p.pesan];
          ps[ps.length - 1] = { role: "model", text: teks };
          return { ...p, pesan: ps };
        }),
      );
    };

    let sukses = false;
    for (let coba = 0; coba < 3 && !sukses; coba++) {
      try {
        await kirimChatStream(riwayat, tulis);
        sukses = true;
      } catch {
        if (coba < 2) await new Promise((r) => setTimeout(r, 800 * (coba + 1)));
      }
    }

    setLoading(false);
    if (sukses) {
      setDaftar((d) =>
        d.map((p) => (p.id === id ? { ...p, diubah: Date.now() } : p)),
      );
    } else {
      // Gagal -> buang balon kosong
      setDaftar((d) =>
        d.map((p) => (p.id === id ? { ...p, pesan: riwayat } : p)),
      );
      setError("gagal");
    }
  }

  /** Coba lagi jawaban AI terakhir. */
  function ulangi() {
    if (loading || !aktif) return;
    const tanpaModelTerakhir = [...pesan];
    while (
      tanpaModelTerakhir.length &&
      tanpaModelTerakhir[tanpaModelTerakhir.length - 1].role === "model"
    ) {
      tanpaModelTerakhir.pop();
    }
    if (!tanpaModelTerakhir.length) return;
    setDaftar((d) =>
      d.map((p) => (p.id === aktifId ? { ...p, pesan: tanpaModelTerakhir } : p)),
    );
    jalankan(tanpaModelTerakhir, aktifId);
  }

  /** Mulai edit pesan user pada index tertentu. */
  function mulaiEdit(i: number) {
    setEditIdx(i);
    setEditTeks(pesan[i].text);
  }

  /** Simpan hasil edit, buang pesan setelahnya, kirim ulang. */
  function simpanEdit() {
    if (editIdx === null || !aktif) return;
    const isi = editTeks.trim();
    if (!isi) return;
    const sebelum = pesan.slice(0, editIdx);
    const baru: ChatMessage[] = [
      ...sebelum,
      { ...pesan[editIdx], text: isi },
    ];
    setEditIdx(null);
    setEditTeks("");
    setDaftar((d) =>
      d.map((p) =>
        p.id === aktifId
          ? { ...p, pesan: baru, judul: sebelum.length === 0 ? judulDari(isi) : p.judul, diubah: Date.now() }
          : p,
      ),
    );
    jalankan(baru, aktifId);
  }

  /** Baca file yang dipilih/di-drop jadi lampiran. */
  async function tambahFile(files: FileList | File[] | null) {
    if (!files) return;
    const daftar = Array.from(files).slice(0, 4);
    const baru: Lampiran[] = [];
    for (const f of daftar) {
      const maks = 10 * 1024 * 1024; // 10 MB
      if (f.size > maks) {
        alert(`"${f.name}" terlalu besar (maks 10 MB).`);
        continue;
      }
      const tipe = f.type || "";
      const jns = jenisFile(f.name, tipe);
      const ext = f.name.split(".").pop()?.toLowerCase();

      if (jns === "gambar") {
        const b64 = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result).split(",")[1] ?? "");
          r.readAsDataURL(f);
        });
        baru.push({ nama: f.name, tipe, data: b64, jenis: "gambar", ukuran: f.size, ekstensi: ext });
      } else if (jns === "teks" || jns === "dokumen") {
        try {
          const isi = await bacaJadiTeks(f);
          baru.push({
            nama: f.name,
            tipe: tipe || "text/plain",
            data: isi.slice(0, 30000),
            jenis: "teks",
            ukuran: f.size,
            ekstensi: ext,
          });
        } catch (e) {
          alert(
            `Gagal membaca "${f.name}": ${
              e instanceof Error ? e.message : "format tidak didukung"
            }`,
          );
        }
      } else {
        alert(`Jenis file "${f.name}" belum didukung.`);
      }
    }
    if (baru.length) setLampiran((l) => [...l, ...baru].slice(0, 4));
  }

  /** Mulai/stop rekam suara jadi teks (isi kotak chat). */
  function rekamSuara() {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Browser kamu belum mendukung input suara. Coba pakai Chrome.");
      return;
    }
    if (merekam) {
      recRef.current?.stop?.();
      return;
    }
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "id-ID";
    rec.interimResults = true;
    rec.continuous = false;
    teksRecRef.current = "";
    dasarRecRef.current = input;

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) teksRecRef.current += t;
        else interim += t;
      }
      const dasar = dasarRecRef.current ? dasarRecRef.current.trim() + " " : "";
      setInput(dasar + teksRecRef.current + interim);
    };
    rec.onend = () => setMerekam(false);
    rec.onerror = () => setMerekam(false);
    setMerekam(true);
    rec.start();
  }

  const urut = [...daftar]
    .sort((a, b) => b.diubah - a.diubah)
    .filter((p) =>
      cari.trim() ? p.judul.toLowerCase().includes(cari.trim().toLowerCase()) : true,
    );

  /** Chat input box (used both on the empty state and inside a conversation). */
  const kotakChat = (
    <div className="rounded-[26px] bg-[#1f1f1f] p-2">
      {/* Preview lampiran */}
      {lampiran.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1 pb-2 pt-1">
          {lampiran.map((l, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-[#333] bg-[#2a2a2a]"
            >
              {l.jenis === "gambar" ? (
                /* Gambar besar seperti ChatGPT */
                <img
                  src={`data:${l.tipe};base64,${l.data}`}
                  alt={l.nama}
                  className="h-[140px] w-[140px] object-cover"
                />
              ) : (
                /* Kartu file dokumen */
                <div className="flex h-[140px] w-[180px] flex-col justify-between p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3a3a3a] text-[11px] font-bold uppercase text-white">
                      {l.ekstensi?.slice(0, 4) ?? "FILE"}
                    </span>
                    <FileText size={16} className="text-neutral-400" />
                  </div>
                  <p className="line-clamp-3 break-all text-[12px] leading-snug text-neutral-300">
                    {l.nama}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {Math.max(1, Math.round(l.ukuran / 1024))} KB
                  </p>
                </div>
              )}
              <button
                onClick={() => setLampiran((a) => a.filter((_, k) => k !== i))}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black"
                aria-label="Hapus lampiran"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1">
        {/* Lampiran */}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.json,.js,.ts,.tsx,.jsx,.py,.html,.css,.log,.xml,.yml,.yaml,.sql"
          className="hidden"
          onChange={(e) => {
            tambahFile(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-[#2a2a2a] hover:text-white"
          aria-label="Tambah file"
          title="Tambah file"
        >
          <Paperclip size={19} />
        </button>

        <textarea
          ref={areaTeks}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          placeholder="Ask Kora"
          className="max-h-[180px] min-h-[36px] flex-1 resize-none self-center bg-transparent px-1 py-2 text-[16px] text-white outline-none placeholder:text-neutral-400"
        />

        {/* Voice mode penuh */}
        <button
          onClick={() => setVoiceTerbuka(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-[#2a2a2a] hover:text-white"
          aria-label="Mode suara"
          title="Mode suara"
        >
          <AudioLines size={19} />
        </button>

        {/* Mic isi teks / kirim */}
        {input.trim() || lampiran.length > 0 ? (
          <button
            onClick={() => kirim()}
            disabled={loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-neutral-200 disabled:opacity-40"
            aria-label="Kirim"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />}
          </button>
        ) : (
          <button
            onClick={rekamSuara}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
              merekam
                ? "animate-pulse bg-red-500 text-white"
                : "text-neutral-400 hover:bg-[#2a2a2a] hover:text-white"
            }`}
            aria-label={merekam ? "Berhenti merekam" : "Bicara"}
            title={merekam ? "Berhenti merekam" : "Bicara"}
          >
            {merekam ? <Square size={16} className="fill-white" /> : <Mic size={19} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="flex h-full bg-black text-white"
      onDragOver={(e) => {
        e.preventDefault();
        if (!seret) setSeret(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setSeret(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setSeret(false);
        if (e.dataTransfer?.files?.length) tambahFile(e.dataTransfer.files);
      }}
    >
      {/* Overlay saat file diseret */}
      {seret && (
        <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="rounded-3xl border-2 border-dashed border-[#4a4a4a] bg-[#111] px-12 py-10 text-center">
            <Paperclip size={38} className="mx-auto mb-3 text-neutral-300" />
            <p className="text-[17px] font-semibold text-white">Lepaskan file di sini</p>
            <p className="mt-1 text-[13px] text-neutral-400">
              Gambar, PDF, Word, Excel, atau teks
            </p>
          </div>
        </div>
      )}
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
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setCariBuka((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-[#1a1a1a] hover:text-white"
              aria-label="Search"
            >
              <Search size={17} />
            </button>
            <button
              onClick={() => setSidebar(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-[#1a1a1a] hover:text-white"
              aria-label="Close sidebar"
            >
              <PanelLeft size={17} />
            </button>
          </div>
        </div>

        {/* Search box */}
        {cariBuka && (
          <div className="px-2 pb-1 pt-1">
            <div className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-3 py-2">
              <Search size={15} className="shrink-0 text-neutral-500" />
              <input
                autoFocus
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Search chats"
                className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-neutral-500"
              />
              {cari && (
                <button
                  onClick={() => setCari("")}
                  className="shrink-0 text-neutral-500 hover:text-white"
                  aria-label="Clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* New chat */}
        <div className="px-2 pb-1 pt-2">
          <button
            onClick={newChat}
            className="flex w-full items-center gap-2.5 rounded-lg bg-[#1a1a1a] px-3 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#242424]"
          >
            <SquarePen size={17} />
            New chat
          </button>
        </div>

        {/* Menu utama — gaya ChatGPT */}
        <div className="px-2 pb-1">
          <button
            onClick={() => {
              setGaleriTerbuka(true);
              setQuizTerbuka(false);
              if (window.innerWidth < 768) setSidebar(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#1a1a1a]"
          >
            <Images size={17} className="text-neutral-300" />
            Images
          </button>

          <button
            onClick={() => {
              setQuizTerbuka(true);
              setGaleriTerbuka(false);
              if (window.innerWidth < 768) setSidebar(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#1a1a1a]"
          >
            <Gamepad2 size={17} className="text-neutral-300" />
            Games
          </button>
        </div>

        {/* History — hanya tampil kalau sudah login */}
        {sudahLogin ? (
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
                        setGaleriTerbuka(false);
                        setQuizTerbuka(false);
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
        ) : (
          <div className="flex-1" />
        )}

        {/* Prompt login (tampil kalau belum login) */}
        {!sudahLogin && (
          <div className="px-3 pb-3">
            <button
              onClick={() => alert("Fitur login belum tersedia.")}
              className="w-full rounded-full border border-[#3a3a3a] bg-transparent py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#1a1a1a]"
            >
              Log in
            </button>
          </div>
        )}
      </aside>

      {/* Lapisan gelap saat sidebar terbuka di HP */}
      {sidebar && (
        <div
          onClick={() => setSidebar(false)}
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Mode suara penuh */}
      {voiceTerbuka && (
        <VoiceMode
          riwayatAwal={pesan}
          onTutup={() => setVoiceTerbuka(false)}
          onSimpan={(p) => {
            setDaftar((d) => {
              if (aktifId && d.some((x) => x.id === aktifId)) {
                return d.map((x) =>
                  x.id === aktifId ? { ...x, pesan: p, diubah: Date.now() } : x,
                );
              }
              const baru: Percakapan = {
                id: idBaru(),
                judul: judulDari(p[0]?.text ?? "Voice chat"),
                pesan: p,
                dibuat: Date.now(),
                diubah: Date.now(),
              };
              setAktifId(baru.id);
              return [baru, ...d];
            });
          }}
        />
      )}

      {/* Area utama */}
      <div className="flex min-w-0 flex-1 flex-col bg-black">
        {/* Open-sidebar button (shown when sidebar is closed) */}
        {!sidebar && (
          <button
            onClick={() => setSidebar(true)}
            className="fixed left-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a1a] text-neutral-300 transition hover:bg-[#242424] hover:text-white"
            aria-label="Open sidebar"
          >
            <PanelLeft size={18} />
          </button>
        )}

        {/* Conversation / Images / Quiz */}
        {quizTerbuka ? (
          <main className="flex-1 overflow-hidden">
            <Quiz denganSidebar onTutup={() => setQuizTerbuka(false)} />
          </main>
        ) : galeriTerbuka ? (
          <main className="flex-1 overflow-hidden">
            <Gallery onTutup={() => setGaleriTerbuka(false)} />
          </main>
        ) : (
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-[760px] flex-col px-4 pb-6 pt-16 md:pt-6">
            {pesan.length === 0 ? (
              <>
                {/* Greeting */}
                <div
                  className={`flex flex-1 flex-col items-center justify-center ${
                    isMobile ? "" : "pb-[12vh]"
                  }`}
                >
                  <h2 className="text-[28px] font-semibold text-white sm:text-[32px]">
                    How can I help you?
                  </h2>
                  {/* Desktop: chat box right under the greeting */}
                  {!isMobile && <div className="mt-8 w-full">{kotakChat}</div>}
                </div>
                {/* Mobile: chat bar at the bottom */}
                {isMobile && <div className="w-full pb-2">{kotakChat}</div>}
              </>
            ) : (
              <>
                <div className="flex-1 space-y-6">
                  {pesan.map((m, i) => (
                    <div key={i} className={`group flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[88%]">
                        {m.role === "user" ? (
                          editIdx === i ? (
                            /* Mode edit pesan */
                            <div className="rounded-2xl border border-[#3a3a3a] bg-[#1f1f1f] p-2">
                              <textarea
                                value={editTeks}
                                onChange={(e) => setEditTeks(e.target.value)}
                                rows={Math.min(6, editTeks.split("\n").length + 1)}
                                autoFocus
                                className="w-full resize-none bg-transparent px-2 py-1.5 text-[16px] text-white outline-none"
                              />
                              <div className="mt-1 flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditIdx(null);
                                    setEditTeks("");
                                  }}
                                  className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-neutral-300 transition hover:bg-[#2a2a2a]"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={simpanEdit}
                                  disabled={!editTeks.trim()}
                                  className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-black transition hover:bg-neutral-200 disabled:opacity-40"
                                >
                                  Send
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Tombol edit (muncul saat hover) */}
                              <button
                                onClick={() => mulaiEdit(i)}
                                className="order-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 opacity-0 transition group-hover:opacity-100 hover:bg-[#1a1a1a] hover:text-white"
                                aria-label="Edit pesan"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <div className="rounded-3xl bg-[#1f1f1f] px-4 py-2.5 text-[16px] leading-relaxed text-white">
                                {m.lampiran && m.lampiran.length > 0 && (
                                  <div className="mb-2 flex flex-wrap gap-2">
                                    {m.lampiran.map((l, k) => (
                                      <div key={k}>
                                        {l.jenis === "gambar" ? (
                                          <img
                                            src={`data:${l.tipe};base64,${l.data}`}
                                            alt={l.nama}
                                            className="max-h-[320px] w-auto max-w-full rounded-2xl object-cover"
                                          />
                                        ) : (
                                          <span className="flex items-center gap-2 rounded-xl border border-[#333] bg-[#2a2a2a] px-3 py-2 text-[12.5px] text-neutral-300">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3a3a3a] text-[10px] font-bold uppercase text-white">
                                              {l.ekstensi?.slice(0, 4) ?? "FILE"}
                                            </span>
                                            <span className="max-w-[180px] truncate">{l.nama}</span>
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {m.text && <span className="whitespace-pre-wrap">{m.text}</span>}
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="kr text-[16px] leading-relaxed text-white">
                            <div className="markdown">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                              {loading && i === pesan.length - 1 && (
                                <span className="kursor-tulis" />
                              )}
                            </div>
                            <div className="mt-2 flex items-center gap-1">
                              <button
                                onClick={() => salin(i, m.text)}
                                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-medium text-neutral-500 transition hover:bg-[#1a1a1a] hover:text-neutral-200"
                              >
                                {copied === i ? <Check size={12} /> : <Copy size={12} />}
                                {copied === i ? "Copied" : "Copy"}
                              </button>
                              {/* Regenerate hanya di jawaban AI terakhir */}
                              {i === pesan.length - 1 && !loading && (
                                <button
                                  onClick={ulangi}
                                  className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-medium text-neutral-500 transition hover:bg-[#1a1a1a] hover:text-neutral-200"
                                >
                                  <RotateCw size={12} />
                                  Regenerate
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && pesan[pesan.length - 1]?.text === "" && (
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
        )}
      </div>

    </div>
  );
}
