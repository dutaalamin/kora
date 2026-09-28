import { useState } from "react";
import { X, Check, Flame, Star, Trophy, Loader2, ArrowRight } from "lucide-react";
import {
  ambilSoal, muatProgres, simpanProgres, updateProgres, levelDari,
  sudahMainHariIni, type Soal, type Progres,
} from "../quiz";

// ============================================================
// Halaman Quiz — gaya Duolingo
// ============================================================

type Layar = "menu" | "main" | "hasil";

const TOPIK = [
  { id: "kosakata sehari-hari", label: "Kosakata Sehari-hari" },
  { id: "sapaan dan perkenalan", label: "Sapaan & Perkenalan" },
  { id: "istilah kerja pabrik", label: "Istilah Kerja Pabrik" },
  { id: "angka dan waktu", label: "Angka & Waktu" },
  { id: "makanan dan minuman", label: "Makanan & Minuman" },
];

const LEVEL = [
  { id: "pemula", label: "Pemula" },
  { id: "menengah", label: "Menengah" },
  { id: "mahir", label: "Mahir" },
];

export default function Quiz({ onTutup }: { onTutup: () => void }) {
  const [layar, setLayar] = useState<Layar>("menu");
  const [progres, setProgres] = useState<Progres>(() => muatProgres());
  const [topik, setTopik] = useState(TOPIK[0].id);
  const [level, setLevel] = useState(LEVEL[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Data sesi berjalan
  const [soal, setSoal] = useState<Soal[]>([]);
  const [nomor, setNomor] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [dinilai, setDinilai] = useState(false);
  const [benar, setBenar] = useState(0);

  // Hasil
  const [xpDidapat, setXpDidapat] = useState(0);
  const [streakNaik, setStreakNaik] = useState(false);

  const lv = levelDari(progres.xp);
  const soalKini = soal[nomor];
  const persenLevel = Math.round((lv.xpLevelIni / lv.xpLevelDepan) * 100);

  async function mulai() {
    setLoading(true);
    setError("");
    try {
      const s = await ambilSoal(level, topik, 5);
      setSoal(s);
      setNomor(0);
      setPilih(null);
      setDinilai(false);
      setBenar(0);
      setLayar("main");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat soal.");
    } finally {
      setLoading(false);
    }
  }

  function jawab(i: number) {
    if (dinilai) return;
    setPilih(i);
  }

  function cek() {
    if (pilih === null) return;
    setDinilai(true);
    if (pilih === soalKini.jawaban) setBenar((b) => b + 1);
  }

  function lanjut() {
    if (nomor + 1 >= soal.length) {
      // Selesai
      const benarAkhir = benar;
      const { baru, xpDidapat: xp, streakNaik: naik } = updateProgres(
        progres,
        benarAkhir,
        soal.length,
      );
      setProgres(baru);
      simpanProgres(baru);
      setXpDidapat(xp);
      setStreakNaik(naik);
      setLayar("hasil");
    } else {
      setNomor((n) => n + 1);
      setPilih(null);
      setDinilai(false);
    }
  }

  // ---------------- LAYAR MENU ----------------
  if (layar === "menu") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-black">
        <div className="mx-auto w-full max-w-[560px] px-5 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-[22px] font-bold text-white">Latihan Korea</h1>
            <button
              onClick={onTutup}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-[#1a1a1a] hover:text-white"
            >
              <X size={19} />
            </button>
          </div>

          {/* Statistik */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#232323] bg-[#101010] p-4 text-center">
              <Flame size={20} className="mx-auto mb-1 text-orange-400" />
              <p className="text-[22px] font-bold text-white">{progres.streak}</p>
              <p className="text-[11px] text-neutral-500">Streak</p>
            </div>
            <div className="rounded-2xl border border-[#232323] bg-[#101010] p-4 text-center">
              <Star size={20} className="mx-auto mb-1 text-yellow-400" />
              <p className="text-[22px] font-bold text-white">{progres.xp}</p>
              <p className="text-[11px] text-neutral-500">Total XP</p>
            </div>
            <div className="rounded-2xl border border-[#232323] bg-[#101010] p-4 text-center">
              <Trophy size={20} className="mx-auto mb-1 text-sky-400" />
              <p className="text-[22px] font-bold text-white">{lv.level}</p>
              <p className="text-[11px] text-neutral-500">Level</p>
            </div>
          </div>

          {/* Progres level */}
          <div className="mt-5 rounded-2xl border border-[#232323] bg-[#101010] p-4">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-medium text-white">Level {lv.level}</span>
              <span className="text-neutral-500">
                {lv.xpLevelIni} / {lv.xpLevelDepan} XP
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#232323]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all"
                style={{ width: `${persenLevel}%` }}
              />
            </div>
          </div>

          {sudahMainHariIni(progres) && (
            <p className="mt-3 text-center text-[12.5px] text-emerald-400">
              Kamu sudah latihan hari ini. Mantap!
            </p>
          )}

          {/* Pilih topik */}
          <p className="mt-7 mb-2 text-[13px] font-medium text-neutral-400">Topik</p>
          <div className="flex flex-wrap gap-2">
            {TOPIK.map((t) => (
              <button
                key={t.id}
                onClick={() => setTopik(t.id)}
                className={`rounded-full px-4 py-2 text-[13.5px] transition ${
                  topik === t.id
                    ? "bg-white font-medium text-black"
                    : "border border-[#2a2a2a] text-neutral-300 hover:bg-[#151515]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Pilih level */}
          <p className="mt-6 mb-2 text-[13px] font-medium text-neutral-400">Tingkat</p>
          <div className="flex gap-2">
            {LEVEL.map((l) => (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`flex-1 rounded-xl py-2.5 text-[13.5px] transition ${
                  level === l.id
                    ? "bg-white font-medium text-black"
                    : "border border-[#2a2a2a] text-neutral-300 hover:bg-[#151515]"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-5 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-[13.5px] text-red-300">
              {error}
            </p>
          )}

          <button
            onClick={mulai}
            disabled={loading}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-[15px] font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Menyiapkan soal...
              </>
            ) : (
              "Mulai Latihan (5 soal)"
            )}
          </button>
        </div>
      </div>
    );
  }

  // ---------------- LAYAR HASIL ----------------
  if (layar === "hasil") {
    const sempurna = benar === soal.length;
    const persen = Math.round((benar / soal.length) * 100);
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-5">
        <div className="w-full max-w-[440px] text-center">
          <div className="text-[64px]">{sempurna ? "🏆" : persen >= 60 ? "🎉" : "💪"}</div>
          <h2 className="mt-4 text-[26px] font-bold text-white">
            {sempurna ? "Sempurna!" : persen >= 60 ? "Bagus!" : "Terus Semangat!"}
          </h2>
          <p className="mt-2 text-[15px] text-neutral-400">
            Kamu benar {benar} dari {soal.length} soal
          </p>

          <div className="mt-7 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#232323] bg-[#101010] p-4">
              <p className="text-[22px] font-bold text-yellow-400">+{xpDidapat}</p>
              <p className="text-[11px] text-neutral-500">XP</p>
            </div>
            <div className="rounded-2xl border border-[#232323] bg-[#101010] p-4">
              <p className="text-[22px] font-bold text-white">{persen}%</p>
              <p className="text-[11px] text-neutral-500">Akurasi</p>
            </div>
            <div className="rounded-2xl border border-[#232323] bg-[#101010] p-4">
              <p className="text-[22px] font-bold text-orange-400">
                {progres.streak}
                <Flame size={13} className="mb-1 ml-0.5 inline" />
              </p>
              <p className="text-[11px] text-neutral-500">Streak</p>
            </div>
          </div>

          {streakNaik && (
            <p className="mt-4 text-[13.5px] text-orange-400">
              🔥 Streak kamu sekarang {progres.streak} hari!
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={mulai}
              className="rounded-xl bg-emerald-500 py-3.5 text-[15px] font-semibold text-black transition hover:bg-emerald-400"
            >
              Latihan Lagi
            </button>
            <button
              onClick={() => setLayar("menu")}
              className="rounded-xl border border-[#2a2a2a] py-3.5 text-[15px] text-neutral-300 transition hover:bg-[#151515]"
            >
              Kembali ke Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- LAYAR MAIN ----------------
  const persenSelesai = Math.round((nomor / soal.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="border-b border-[#1a1a1a] px-5 py-4">
        <div className="mx-auto flex max-w-[560px] items-center gap-4">
          <button
            onClick={() => setLayar("menu")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-[#1a1a1a] hover:text-white"
          >
            <X size={18} />
          </button>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#1f1f1f]">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${persenSelesai}%` }}
            />
          </div>
          <span className="shrink-0 text-[13px] font-medium text-neutral-400">
            {nomor + 1}/{soal.length}
          </span>
        </div>
      </div>

      {/* Soal */}
      <div className="flex-1 overflow-y-auto px-5 py-8">
        <div className="mx-auto max-w-[560px]">
          <h2 className="text-[20px] font-semibold leading-snug text-white">
            {soalKini.pertanyaan}
          </h2>

          <div className="mt-7 flex flex-col gap-3">
            {soalKini.pilihan.map((p, i) => {
              const dipilih = pilih === i;
              const benarIni = i === soalKini.jawaban;
              let gaya =
                "border-[#2a2a2a] bg-[#0d0d0d] hover:bg-[#151515] text-white";
              if (dinilai) {
                if (benarIni) gaya = "border-emerald-500 bg-emerald-950/40 text-white";
                else if (dipilih) gaya = "border-red-500 bg-red-950/40 text-white";
                else gaya = "border-[#232323] bg-[#0a0a0a] text-neutral-500";
              } else if (dipilih) {
                gaya = "border-sky-500 bg-sky-950/30 text-white";
              }
              return (
                <button
                  key={i}
                  onClick={() => jawab(i)}
                  disabled={dinilai}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-4 text-left text-[15.5px] transition ${gaya}`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-[12px] font-semibold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{p}</span>
                  {dinilai && benarIni && <Check size={18} className="text-emerald-400" />}
                </button>
              );
            })}
          </div>

          {/* Penjelasan */}
          {dinilai && (
            <div
              className={`mt-5 rounded-xl border px-4 py-3.5 ${
                pilih === soalKini.jawaban
                  ? "border-emerald-800/50 bg-emerald-950/30"
                  : "border-red-800/50 bg-red-950/30"
              }`}
            >
              <p className="text-[13.5px] font-semibold text-white">
                {pilih === soalKini.jawaban ? "Benar!" : "Belum tepat"}
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-neutral-300">
                {soalKini.penjelasan}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tombol bawah */}
      <div className="border-t border-[#1a1a1a] px-5 py-4">
        <div className="mx-auto max-w-[560px]">
          {!dinilai ? (
            <button
              onClick={cek}
              disabled={pilih === null}
              className="w-full rounded-xl bg-emerald-500 py-3.5 text-[15px] font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-[#1f1f1f] disabled:text-neutral-600"
            >
              Periksa
            </button>
          ) : (
            <button
              onClick={lanjut}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-[15px] font-semibold text-black transition hover:bg-emerald-400"
            >
              {nomor + 1 >= soal.length ? "Lihat Hasil" : "Lanjut"}
              <ArrowRight size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
