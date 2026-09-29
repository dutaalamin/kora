import { useEffect, useRef, useState } from "react";
import { X, Mic, Square } from "lucide-react";
import { kirimChat, type ChatMessage } from "../chat";

interface Props {
  onTutup: () => void;
  onSimpan: (pesan: ChatMessage[]) => void;
  riwayatAwal: ChatMessage[];
}

type Status = "diam" | "dengar" | "pikir" | "bicara";

export default function VoiceMode({ onTutup, onSimpan, riwayatAwal }: Props) {
  const [status, setStatus] = useState<Status>("diam");
  const [transkrip, setTranskrip] = useState("");
  const [riwayat, setRiwayat] = useState<ChatMessage[]>(riwayatAwal);
  const [didengar, setDidengar] = useState("");
  const recRef = useRef<any>(null);
  const aktifRef = useRef(true);

  const dukung =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  function ucapkan(teks: string) {
    setStatus("bicara");
    setTranskrip(teks);
    const bersih = teks.replace(/[*_`#>]/g, "").slice(0, 500);
    const u = new SpeechSynthesisUtterance(bersih);
    u.lang = "id-ID";
    u.rate = 1.02;
    u.onend = () => {
      if (aktifRef.current) mulaiDengar();
    };
    u.onerror = () => {
      if (aktifRef.current) mulaiDengar();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function kirimSuara(teks: string) {
    setStatus("pikir");
    const baru: ChatMessage[] = [...riwayat, { role: "user", text: teks }];
    setRiwayat(baru);
    onSimpan(baru);
    try {
      const balas = await kirimChat(baru);
      const final: ChatMessage[] = [...baru, { role: "model", text: balas }];
      setRiwayat(final);
      onSimpan(final);
      ucapkan(balas);
    } catch {
      ucapkan("Maaf, ada gangguan koneksi. Coba lagi ya.");
    }
  }

  function mulaiDengar() {
    if (!dukung || !aktifRef.current) return;
    try {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SR();
      recRef.current = rec;
      rec.lang = "id-ID";
      rec.interimResults = true;
      rec.continuous = false;

      let teksAkhir = "";
      setDidengar("");
      setStatus("dengar");

      rec.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) teksAkhir += t;
          else interim += t;
        }
        setDidengar(teksAkhir || interim);
      };

      rec.onerror = () => {
        if (aktifRef.current) setStatus("diam");
      };

      rec.onend = () => {
        const isi = teksAkhir.trim();
        if (aktifRef.current && isi) kirimSuara(isi);
        else if (aktifRef.current) setStatus("diam");
      };

      rec.start();
    } catch {
      setStatus("diam");
    }
  }

  function berhenti() {
    aktifRef.current = false;
    recRef.current?.stop?.();
    window.speechSynthesis.cancel();
    setStatus("diam");
  }

  function tutup() {
    berhenti();
    onTutup();
  }

  useEffect(() => {
    return () => {
      aktifRef.current = false;
      recRef.current?.stop?.();
      window.speechSynthesis.cancel();
    };
  }, []);

  const label: Record<Status, string> = {
    diam: dukung ? "Ketuk untuk mulai bicara" : "Browser tidak mendukung suara",
    dengar: "Mendengarkan...",
    pikir: "Berpikir...",
    bicara: "Menjawab...",
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black px-6 text-white">
      <button
        onClick={tutup}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 transition hover:bg-[#1a1a1a] hover:text-white"
        aria-label="Close"
      >
        <X size={22} />
      </button>

      {/* Orb animasi */}
      <div className="relative flex h-56 w-56 items-center justify-center">
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br from-[#1cb0f6] to-[#7c3aed] blur-2xl transition-all duration-500 ${
            status === "dengar" ? "scale-110 opacity-60" : "opacity-30"
          }`}
        />
        <div
          className={`absolute inset-6 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#8b5cf6] transition-transform duration-300 ${
            status === "dengar" ? "vo-pulse" : status === "bicara" ? "vo-pulse" : ""
          }`}
        />
        <button
          onClick={() => (status === "diam" ? mulaiDengar() : berhenti())}
          className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20"
          aria-label={status === "diam" ? "Mulai" : "Berhenti"}
        >
          {status === "diam" ? (
            <Mic size={34} className="text-white" />
          ) : (
            <Square size={30} className="fill-white text-white" />
          )}
        </button>
      </div>

      {/* Status */}
      <p className="mt-8 text-[15px] font-medium text-neutral-400">{label[status]}</p>

      {/* Transkrip */}
      <div className="mt-4 max-h-[34vh] w-full max-w-[560px] overflow-y-auto text-center">
        {didengar && status === "dengar" && (
          <p className="text-[17px] leading-relaxed text-white">{didengar}</p>
        )}
        {status !== "dengar" && transkrip && (
          <p className="text-[17px] leading-relaxed text-white">{transkrip}</p>
        )}
      </div>

      <p className="absolute bottom-8 text-[12px] text-neutral-600">
        Kora Voice · ngobrol langsung pakai suara
      </p>
    </div>
  );
}
