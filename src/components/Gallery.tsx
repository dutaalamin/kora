import { useState } from "react";
import { X, Search, Heart, Sparkles } from "lucide-react";

interface Kartu {
  gambar: string;
  judul: string;
  korea: string;
  arti: string;
  kategori: string;
}

const KARTU: Kartu[] = [
  { gambar: "/img/hangul.svg", judul: "Hangul Dasar", korea: "한글", arti: "Alfabet Korea", kategori: "Dasar" },
  { gambar: "/img/makanan.svg", judul: "Makanan Korea", korea: "한식", arti: "Masakan Korea", kategori: "Makanan" },
  { gambar: "/img/travel.svg", judul: "Jalan-jalan", korea: "여행", arti: "Perjalanan", kategori: "Travel" },
  { gambar: "/img/kerja.svg", judul: "Dunia Kerja", korea: "회사", arti: "Kantor / Perusahaan", kategori: "Kerja" },
];

const KATEGORI = ["Semua", "Dasar", "Makanan", "Travel", "Kerja"];

export default function Gallery({ onTutup }: { onTutup: () => void }) {
  const [filter, setFilter] = useState("Semua");
  const [cari, setCari] = useState("");
  const [suka, setSuka] = useState<Record<string, boolean>>({});

  const tampil = KARTU.filter((k) => {
    const cocokKategori = filter === "Semua" || k.kategori === filter;
    const q = cari.trim().toLowerCase();
    const cocokCari =
      !q ||
      k.judul.toLowerCase().includes(q) ||
      k.arti.toLowerCase().includes(q) ||
      k.korea.includes(cari.trim());
    return cocokKategori && cocokCari;
  });

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-black text-white">
      <div className="mx-auto w-full max-w-[900px] px-6 pb-10 pt-6">
        {/* Judul + tutup */}
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-semibold tracking-tight">Images</h1>
          <button
            onClick={onTutup}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-[#1a1a1a] hover:text-white"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        {/* Bar "describe" gaya ChatGPT */}
        <div className="mt-5 flex items-center gap-2 rounded-full bg-[#1a1a1a] py-3 pl-5 pr-3">
          <Search size={17} className="shrink-0 text-neutral-500" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Describe a new image"
            className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-neutral-500"
          />
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-neutral-200"
            aria-label="Generate"
          >
            <Sparkles size={16} />
          </button>
        </div>

        {/* Filter kategori */}
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {KATEGORI.map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                filter === k
                  ? "bg-white text-black"
                  : "bg-[#1a1a1a] text-neutral-300 hover:bg-[#242424]"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Judul seksi */}
        <h2 className="mt-7 text-[16px] font-semibold">Create an image</h2>

        {/* Grid */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tampil.map((k) => (
            <div
              key={k.judul}
              className="group relative overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f]"
            >
              <img
                src={k.gambar}
                alt={k.judul}
                className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <button
                onClick={() => setSuka((s) => ({ ...s, [k.judul]: !s[k.judul] }))}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur transition hover:bg-black/70"
                aria-label="Favorite"
              >
                <Heart
                  size={14}
                  className={suka[k.judul] ? "fill-red-500 text-red-500" : "text-white"}
                />
              </button>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2.5">
                <p className="text-[13px] font-semibold text-white">{k.judul}</p>
                <p className="text-[11px] text-neutral-300">
                  <span className="kr">{k.korea}</span> · {k.arti}
                </p>
              </div>
            </div>
          ))}
        </div>

        {tampil.length === 0 && (
          <p className="py-16 text-center text-[14px] text-neutral-500">
            Tidak ada gambar yang cocok.
          </p>
        )}
      </div>
    </div>
  );
}
