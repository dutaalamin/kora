import { useState } from "react";
import { Mic, ArrowUp, Paperclip } from "lucide-react";

interface Kartu {
  gambar: string;
  judul: string;
}

const KARTU: Kartu[] = [
  { gambar: "/img/stiker.svg", judul: "Stickers" },
  { gambar: "/img/retro.svg", judul: "'80s flashback" },
  { gambar: "/img/karikatur.svg", judul: "Create a caricature" },
  { gambar: "/img/anime.svg", judul: "Anime" },
  { gambar: "/img/bawah_air.svg", judul: "Underwater" },
  { gambar: "/img/pin.svg", judul: "Pin collection" },
  { gambar: "/img/tulisan.svg", judul: "Handwritten style" },
  { gambar: "/img/interior.svg", judul: "Interior design" },
];

export default function Gallery({ onTutup }: { onTutup: () => void }) {
  const [teks, setTeks] = useState("");

  return (
    <div className="relative h-full bg-black text-white">
      {/* Area gulir */}
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-[1100px] px-6 pb-32 pt-6">
          {/* Judul */}
          <h1 className="text-[28px] font-semibold tracking-tight">Images</h1>

          {/* Bar "Describe a new image" */}
          <div className="mt-5 flex items-center gap-2 rounded-full bg-[#1f1f1f] py-2 pl-4 pr-2">
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-[#2a2a2a] hover:text-white"
              aria-label="Attach"
            >
              <Paperclip size={18} />
            </button>
            <input
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              placeholder="Describe a new image"
              className="w-full bg-transparent text-[16px] text-white outline-none placeholder:text-neutral-400"
            />
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-[#2a2a2a] hover:text-white"
              aria-label="Voice"
            >
              <Mic size={18} />
            </button>
            <button
              onClick={onTutup}
              disabled={!teks.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3a3a3a] text-white transition hover:bg-[#4a4a4a] disabled:opacity-40"
              aria-label="Generate"
            >
              <ArrowUp size={18} />
            </button>
          </div>

          {/* Judul seksi */}
          <h2 className="mt-7 text-[16px] font-semibold">Create an image</h2>

          {/* Grid 4 kolom */}
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {KARTU.map((k) => (
              <button
                key={k.judul}
                onClick={() => {}}
                className="group relative overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] text-left"
              >
                <img
                  src={k.gambar}
                  alt={k.judul}
                  className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-[13.5px] font-semibold text-white">{k.judul}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gradasi pudar di bawah (hanya area konten) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/80 to-transparent" />

      {/* Tombol bawah gaya ChatGPT */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-7">
        <button
          onClick={onTutup}
          className="pointer-events-auto rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-black shadow-lg transition hover:bg-neutral-200"
        >
          Log in or sign up to see more
        </button>
      </div>
    </div>
  );
}
