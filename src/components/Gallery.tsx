import { useState } from "react";
import { X, Heart } from "lucide-react";

interface Kartu {
  gambar: string;
  judul: string;
  korea: string;
  arti: string;
}

const KARTU: Kartu[] = [
  { gambar: "/img/hangul.svg", judul: "Hangul Dasar", korea: "한글", arti: "Alfabet Korea" },
  { gambar: "/img/makanan.svg", judul: "Makanan Korea", korea: "한식", arti: "Masakan Korea" },
  { gambar: "/img/travel.svg", judul: "Jalan-jalan", korea: "여행", arti: "Perjalanan" },
  { gambar: "/img/kerja.svg", judul: "Dunia Kerja", korea: "회사", arti: "Kantor / Perusahaan" },
];

export default function Gallery({ onTutup }: { onTutup: () => void }) {
  const [suka, setSuka] = useState<Record<string, boolean>>({});

  const tampil = KARTU;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-black text-white">
      <div className="mx-auto w-full max-w-[900px] px-6 pb-10 pt-6">
        {/* Judul */}
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

        {/* Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
