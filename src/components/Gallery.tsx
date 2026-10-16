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
    <div className="relative h-full bg-[#f4efe6] text-[#2b2620]">
      {/* Area gulir */}
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-[1100px] px-6 pb-32 pt-6">
          {/* Judul */}
          <h1 className="text-[28px] font-semibold tracking-tight">Images</h1>

          {/* Bar "Describe a new image" */}
          <div className="mt-5 flex items-center gap-2 rounded-full bg-[#faf6ee] border border-[#ddd3c2] py-2 pl-4 pr-2">
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8a7f6c] transition hover:bg-[#efe8db] hover:text-[#2b2620]"
              aria-label="Attach"
            >
              <Paperclip size={18} />
            </button>
            <input
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              placeholder="Describe a new image"
              className="w-full bg-transparent text-[16px] text-[#2b2620] outline-none placeholder:text-[#8a7f6c]"
            />
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8a7f6c] transition hover:bg-[#efe8db] hover:text-[#2b2620]"
              aria-label="Voice"
            >
              <Mic size={18} />
            </button>
            <button
              onClick={onTutup}
              disabled={!teks.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#b3402e] text-[#2b2620] transition hover:bg-[#9c3626] disabled:opacity-40"
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
                className="group relative overflow-hidden rounded-2xl border border-[#ddd3c2] bg-[#faf6ee] text-left"
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f4efe6] via-[#f4efe6]/80 to-transparent" />

      {/* Tombol bawah gaya ChatGPT */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-7">
        <button
          onClick={onTutup}
          className="pointer-events-auto rounded-full border border-[#ddd3c2] bg-[#faf6ee] px-5 py-2.5 text-[14px] font-semibold text-[#2b2620] shadow-md transition hover:bg-[#efe8db]"
        >
          Log in or sign up to see more
        </button>
      </div>
    </div>
  );
}
