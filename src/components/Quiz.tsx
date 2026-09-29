import { useEffect, useMemo, useState } from "react";
import {
  X, Check, Flame, Star, Trophy, Loader2, ArrowRight,
  Heart, Zap,
} from "lucide-react";
import {
  ambilSoal, muatProgres, simpanProgres, updateProgres, levelDari,
  sudahMainHariIni, type Soal, type Progres,
} from "../quiz";
import {
  siapkanAudio, suaraBenar, suaraSalah, suaraKetuk, suaraSelesai, suaraGagal,
} from "../suara";

// ============================================================
// Halaman Quiz — gaya Duolingo (terang, tombol 3D, ada suara)
// ============================================================

type Layar = "menu" | "main" | "hasil";

const TOPIK = [
  { id: "kosakata sehari-hari", label: "Sehari-hari", emoji: "💬" },
  { id: "sapaan dan perkenalan", label: "Sapaan", emoji: "👋" },
  { id: "istilah kerja pabrik", label: "Kerja Pabrik", emoji: "🏭" },
  { id: "angka dan waktu", label: "Angka & Waktu", emoji: "🕐" },
  { id: "makanan dan minuman", label: "Makanan", emoji: "🍜" },
];

const LEVEL = [
  { id: "pemula", label: "Pemula" },
  { id: "menengah", label: "Menengah" },
  { id: "mahir", label: "Mahir" },
];

const MAKS_NYAWA = 3;

/** Confetti sederhana. */
function Confetti() {
  const potongan = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        durasi: 2 + Math.random() * 1.6,
        warna: ["#58cc02", "#1cb0f6", "#ffc800", "#ff4b4b", "#ce82ff"][i % 5],
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {potongan.map((p) => (
        <span
          key={p.id}
          className="dl-confetti"
          style={{
            left: `${p.left}%`,
            background: p.warna,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.durasi}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Quiz({ onTutup }: { onTutup: () => void }) {
  const [layar, setLayar] = useState<Layar>("menu");
  const [progres, setProgres] = useState<Progres>(() => muatProgres());
  const [topik, setTopik] = useState(TOPIK[0].id);
  const [level, setLevel] = useState(LEVEL[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sesi berjalan
  const [soal, setSoal] = useState<Soal[]>([]);
  const [nomor, setNomor] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [dinilai, setDinilai] = useState(false);
  const [benar, setBenar] = useState(0);
  const [nyawa, setNyawa] = useState(MAKS_NYAWA);
  const [combo, setCombo] = useState(0);
  const [nyawaHabis, setNyawaHabis] = useState(false);

  // Animasi
  const [getar, setGetar] = useState(false);

  // Hasil
  const [xpDidapat, setXpDidapat] = useState(0);
  const [streakNaik, setStreakNaik] = useState(false);

  const lv = levelDari(progres.xp);
  const soalKini = soal[nomor];
  const persenLevel = Math.round((lv.xpLevelIni / lv.xpLevelDepan) * 100);
  const persenSelesai = soal.length ? Math.round((nomor / soal.length) * 100) : 0;

  // Aktifkan audio pada interaksi pertama
  useEffect(() => {
    const aktifkan = () => siapkanAudio();
    window.addEventListener("pointerdown", aktifkan, { once: true });
    window.addEventListener("keydown", aktifkan, { once: true });
    return () => {
      window.removeEventListener("pointerdown", aktifkan);
      window.removeEventListener("keydown", aktifkan);
    };
  }, []);

  async function mulai() {
    siapkanAudio();
    setLoading(true);
    setError("");
    try {
      const s = await ambilSoal(level, topik, 5);
      setSoal(s);
      setNomor(0);
      setPilih(null);
      setDinilai(false);
      setBenar(0);
      setNyawa(MAKS_NYAWA);
      setCombo(0);
      setNyawaHabis(false);
      setLayar("main");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat soal.");
    } finally {
      setLoading(false);
    }
  }

  function jawab(i: number) {
    if (dinilai) return;
    suaraKetuk();
    setPilih(i);
  }

  function cek() {
    if (pilih === null) return;
    setDinilai(true);
    const tepat = pilih === soalKini.jawaban;
    if (tepat) {
      suaraBenar();
      setBenar((b) => b + 1);
      setCombo((c) => c + 1);
    } else {
      suaraSalah();
      setCombo(0);
      setGetar(true);
      setTimeout(() => setGetar(false), 450);
      setNyawa((n) => {
        const sisa = n - 1;
        if (sisa <= 0) {
          setTimeout(() => {
            suaraGagal();
            setNyawaHabis(true);
          }, 900);
        }
        return sisa;
      });
    }
  }

  function selesaikan(benarAkhir: number) {
    const { baru, xpDidapat: xp, streakNaik: naik } = updateProgres(
      progres,
      benarAkhir,
      soal.length
    );
    setProgres(baru);
    simpanProgres(baru);
    setXpDidapat(xp);
    setStreakNaik(naik);
    setLayar("hasil");
    if (benarAkhir === soal.length) suaraSelesai();
  }

  function lanjut() {
    if (nyawaHabis) {
      selesaikan(benar);
      return;
    }
    if (nomor + 1 >= soal.length) {
      selesaikan(benar);
    } else {
      setNomor((n) => n + 1);
      setPilih(null);
      setDinilai(false);
    }
  }

  // ================= LAYAR MENU =================
  if (layar === "menu") {
    return (
      <div className="dl-bg fixed inset-0 z-50 flex flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-[560px] px-5 py-7">
          <div className="flex items-center justify-between">
            <h1 className="text-[24px] font-extrabold text-[#3c3c3c]">
              Latihan Korea 🇰🇷
            </h1>
            <button
              onClick={onTutup}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#afafaf] transition hover:bg-[#f0f0f0]"
            >
              <X size={20} />
            </button>
          </div>

          {/* Statistik */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border-2 border-[#e5e5e5] bg-white p-4 text-center">
              <Flame size={22} className="mx-auto mb-1 text-orange-500" />
              <p className="text-[23px] font-extrabold text-[#3c3c3c]">
                {progres.streak}
              </p>
              <p className="text-[11px] font-bold uppercase text-[#afafaf]">
                Streak
              </p>
            </div>
            <div className="rounded-2xl border-2 border-[#e5e5e5] bg-white p-4 text-center">
              <Star size={22} className="mx-auto mb-1 text-yellow-500" />
              <p className="text-[23px] font-extrabold text-[#3c3c3c]">
                {progres.xp}
              </p>
              <p className="text-[11px] font-bold uppercase text-[#afafaf]">
                Total XP
              </p>
            </div>
            <div className="rounded-2xl border-2 border-[#e5e5e5] bg-white p-4 text-center">
              <Trophy size={22} className="mx-auto mb-1 text-sky-500" />
              <p className="text-[23px] font-extrabold text-[#3c3c3c]">
                {lv.level}
              </p>
              <p className="text-[11px] font-bold uppercase text-[#afafaf]">
                Level
              </p>
            </div>
          </div>

          {/* Progres level */}
          <div className="mt-4 rounded-2xl border-2 border-[#e5e5e5] bg-white p-4">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-bold text-[#3c3c3c]">Level {lv.level}</span>
              <span className="font-semibold text-[#afafaf]">
                {lv.xpLevelIni} / {lv.xpLevelDepan} XP
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e5e5e5]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#58cc02] to-[#89e219] transition-all"
                style={{ width: `${persenLevel}%` }}
              />
            </div>
          </div>

          {sudahMainHariIni(progres) && (
            <p className="mt-3 text-center text-[13px] font-bold text-[#58cc02]">
              ✓ Kamu sudah latihan hari ini. Mantap!
            </p>
          )}

          {/* Topik */}
          <p className="mt-7 mb-2 text-[13px] font-extrabold uppercase tracking-wide text-[#afafaf]">
            Pilih Topik
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {TOPIK.map((t) => {
              const aktif = topik === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTopik(t.id)}
                  className={`flex items-center gap-2 rounded-2xl border-2 px-3.5 py-3.5 text-left text-[14px] font-bold transition ${
                    aktif
                      ? "border-[#1cb0f6] bg-[#ddf4ff] text-[#1899d6]"
                      : "border-[#e5e5e5] bg-white text-[#3c3c3c] hover:bg-[#f7f7f7]"
                  }`}
                >
                  <span className="text-[19px]">{t.emoji}</span>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Level */}
          <p className="mt-6 mb-2 text-[13px] font-extrabold uppercase tracking-wide text-[#afafaf]">
            Tingkat
          </p>
          <div className="flex gap-2">
            {LEVEL.map((l) => {
              const aktif = level === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={`flex-1 rounded-2xl border-2 py-3 text-[13.5px] font-bold transition ${
                    aktif
                      ? "border-[#1cb0f6] bg-[#ddf4ff] text-[#1899d6]"
                      : "border-[#e5e5e5] bg-white text-[#3c3c3c] hover:bg-[#f7f7f7]"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="mt-5 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={mulai}
            disabled={loading}
            className="dl-btn dl-green mt-7 flex w-full items-center justify-center gap-2 py-4 text-[16px]"
          >
            {loading ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Menyiapkan...
              </>
            ) : (
              <>
                <Zap size={19} />
                Mulai Latihan
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ================= LAYAR HASIL =================
  if (layar === "hasil") {
    const sempurna = benar === soal.length && !nyawaHabis;
    const persen = soal.length ? Math.round((benar / soal.length) * 100) : 0;
    return (
      <div className="dl-bg fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto px-5">
        {sempurna && <Confetti />}
        <div className="w-full max-w-[440px] py-10 text-center">
          <div
            className={`text-[72px] ${sempurna ? "dl-denyut" : ""}`}
          >
            {nyawaHabis ? "💔" : sempurna ? "🏆" : persen >= 60 ? "🎉" : "💪"}
          </div>
          <h2 className="mt-3 text-[28px] font-extrabold text-[#3c3c3c]">
            {nyawaHabis
              ? "Nyawa Habis!"
              : sempurna
              ? "Sempurna!"
              : persen >= 60
              ? "Bagus Sekali!"
              : "Terus Semangat!"}
          </h2>
          <p className="mt-2 text-[15px] font-semibold text-[#afafaf]">
            Kamu benar {benar} dari {soal.length} soal
          </p>

          <div className="mt-7 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border-2 border-[#e5e5e5] bg-white p-4">
              <p className="text-[23px] font-extrabold text-yellow-500">
                +{xpDidapat}
              </p>
              <p className="text-[11px] font-bold uppercase text-[#afafaf]">
                XP
              </p>
            </div>
            <div className="rounded-2xl border-2 border-[#e5e5e5] bg-white p-4">
              <p className="text-[23px] font-extrabold text-[#3c3c3c]">
                {persen}%
              </p>
              <p className="text-[11px] font-bold uppercase text-[#afafaf]">
                Akurasi
              </p>
            </div>
            <div className="rounded-2xl border-2 border-[#e5e5e5] bg-white p-4">
              <p className="text-[23px] font-extrabold text-orange-500">
                {progres.streak}
              </p>
              <p className="text-[11px] font-bold uppercase text-[#afafaf]">
                Streak
              </p>
            </div>
          </div>

          {streakNaik && (
            <p className="mt-4 text-[14px] font-bold text-orange-500">
              🔥 Streak kamu sekarang {progres.streak} hari!
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={mulai}
              className="dl-btn dl-green py-4 text-[16px]"
            >
              Latihan Lagi
            </button>
            <button
              onClick={() => setLayar("menu")}
              className="dl-btn dl-white py-4 text-[16px]"
            >
              Kembali ke Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= LAYAR MAIN =================
  const tepat = pilih === soalKini.jawaban;

  return (
    <div className="dl-bg fixed inset-0 z-50 flex flex-col">
      {/* Header */}
      <div className="border-b-2 border-[#e5e5e5] px-5 py-4">
        <div className="mx-auto flex max-w-[560px] items-center gap-3">
          <button
            onClick={() => setLayar("menu")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#afafaf] transition hover:bg-[#f0f0f0]"
          >
            <X size={20} />
          </button>

          <div className="h-4 flex-1 overflow-hidden rounded-full bg-[#e5e5e5]">
            <div
              className="h-full rounded-full bg-[#58cc02] transition-all duration-300"
              style={{ width: `${persenSelesai}%` }}
            />
          </div>

          {/* Combo */}
          {combo >= 2 && (
            <span className="dl-pop shrink-0 text-[14px] font-extrabold text-orange-500">
              🔥{combo}
            </span>
          )}

          {/* Nyawa */}
          <div className="flex shrink-0 items-center gap-0.5">
            {Array.from({ length: MAKS_NYAWA }, (_, i) => (
              <Heart
                key={i}
                size={18}
                className={
                  i < nyawa
                    ? "fill-[#ff4b4b] text-[#ff4b4b]"
                    : "fill-[#e5e5e5] text-[#e5e5e5]"
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Soal */}
      <div className="flex-1 overflow-y-auto px-5 py-8">
        <div className="mx-auto max-w-[560px]">
          <p className="text-[13px] font-extrabold uppercase tracking-wide text-[#afafaf]">
            Soal {nomor + 1} dari {soal.length}
          </p>
          <h2
            className={`mt-2 text-[21px] font-extrabold leading-snug text-[#3c3c3c] ${
              getar ? "dl-shake" : ""
            }`}
          >
            {soalKini.pertanyaan}
          </h2>

          <div className="mt-7 flex flex-col gap-3">
            {soalKini.pilihan.map((p, i) => {
              const dipilih = pilih === i;
              const benarIni = i === soalKini.jawaban;
              let kelas = "dl-pilih";
              if (dinilai) {
                if (benarIni) kelas = "dl-pilih dl-pilih-benar";
                else if (dipilih) kelas = "dl-pilih dl-pilih-salah";
                else kelas = "dl-pilih dl-pilih-mati";
              } else if (dipilih) {
                kelas = "dl-pilih dl-pilih-aktif";
              }
              return (
                <button
                  key={i}
                  onClick={() => jawab(i)}
                  disabled={dinilai}
                  className={`${kelas} flex items-center gap-3 rounded-2xl px-4 py-4 text-left text-[15.5px] font-bold`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-current text-[12.5px] font-extrabold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="kr flex-1">{p}</span>
                  {dinilai && benarIni && (
                    <Check size={20} className="text-[#58a700]" />
                  )}
                  {dinilai && dipilih && !benarIni && (
                    <X size={20} className="text-[#ea2b2b]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Banner feedback + tombol */}
      <div
        className={`border-t-2 px-5 py-5 ${
          dinilai
            ? tepat
              ? "border-[#d7ffb8] bg-[#d7ffb8]"
              : "border-[#ffdfe0] bg-[#ffdfe0]"
            : "border-[#e5e5e5] bg-white"
        }`}
      >
        <div className="mx-auto flex max-w-[560px] items-center gap-4">
          {dinilai && (
            <div className="dl-pop flex flex-1 items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                  tepat ? "bg-white" : "bg-white"
                }`}
              >
                {tepat ? (
                  <Check size={26} className="text-[#58a700]" />
                ) : (
                  <X size={26} className="text-[#ea2b2b]" />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-[16px] font-extrabold ${
                    tepat ? "text-[#58a700]" : "text-[#ea2b2b]"
                  }`}
                >
                  {tepat ? "Benar!" : "Belum Tepat"}
                </p>
                <p className="text-[13px] font-semibold leading-snug text-[#3c3c3c]">
                  {soalKini.penjelasan}
                </p>
              </div>
            </div>
          )}

          {!dinilai ? (
            <button
              onClick={cek}
              disabled={pilih === null}
              className={`w-full py-4 text-[16px] ${
                pilih === null ? "dl-btn dl-gray" : "dl-btn dl-green"
              }`}
            >
              Periksa
            </button>
          ) : (
            <button
              onClick={lanjut}
              className={`dl-btn ${
                tepat ? "dl-green" : "dl-red"
              } shrink-0 px-7 py-4 text-[16px]`}
            >
              <span className="flex items-center gap-2">
                {nyawaHabis || nomor + 1 >= soal.length
                  ? "Lihat Hasil"
                  : "Lanjut"}
                <ArrowRight size={18} />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
