import { useState } from "react";
import { X, Search, Heart } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f1f1f] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[17px] font-semibold">Images</span>
          <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[11px] text-neutral-400">
            {tampil.length}
          </span>
        </div>
        <button
          onClick={onTutup}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-[#1a1a1a] hover:text-white"
          aria-label="Close"
        >
          <X size={19} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="mx-auto flex max-w-[900px] items-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2.5">
          <Search size={16} className="shrink-0 text-neutral-500" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari gambar... (mis. makanan, 여행)"
            className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-neutral-500"
          />
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
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

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="mx-auto grid max-w-[900px] grid-cols-2 gap-3 sm:grid-cols-3">
          {tampil.map((k) => (
            <div
              key={k.judul}
              className="group relative overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#0f0f0f]"
            >
              <img
                src={k.gambar}
                alt={k.judul}
                className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105"
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
              <div className="p-3">
                <p className="text-[14px] font-semibold text-white">{k.judul}</p>
                <p className="mt-0.5 text-[12px] text-neutral-400">
                  <span className="kr text-neutral-300">{k.korea}</span> · {k.arti}
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
