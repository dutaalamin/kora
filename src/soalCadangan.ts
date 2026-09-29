// ============================================================
// Soal cadangan — dipakai kalau API gagal (offline / kunci belum ada).
// Jadi latihan selalu bisa jalan.
// ============================================================

export interface Soal {
  pertanyaan: string;
  pilihan: string[];
  jawaban: number;
  penjelasan: string;
}

type Bank = Record<string, Soal[]>;

const BANK: Bank = {
  "sapaan dan perkenalan": [
    {
      pertanyaan: "Apa arti dari 안녕하세요 (annyeonghaseyo)?",
      pilihan: ["Terima kasih", "Halo", "Selamat tinggal", "Maaf"],
      jawaban: 1,
      penjelasan: "안녕하세요 berarti halo, dipakai untuk sapaan sopan.",
    },
    {
      pertanyaan: "Bahasa Korea untuk \"terima kasih\" adalah?",
      pilihan: ["감사합니다", "안녕히 가세요", "죄송합니다", "반갑습니다"],
      jawaban: 0,
      penjelasan: "감사합니다 (gamsahamnida) berarti terima kasih.",
    },
    {
      pertanyaan: "Apa arti dari 죄송합니다 (joesonghamnida)?",
      pilihan: ["Selamat pagi", "Maaf", "Sampai jumpa", "Senang bertemu"],
      jawaban: 1,
      penjelasan: "죄송합니다 berarti maaf, dipakai dalam situasi formal.",
    },
    {
      pertanyaan: "Bahasa Korea untuk \"senang bertemu denganmu\" adalah?",
      pilihan: ["반갑습니다", "잘 자요", "안녕히 계세요", "실례합니다"],
      jawaban: 0,
      penjelasan: "반갑습니다 (bangapseumnida) dipakai saat pertama bertemu.",
    },
    {
      pertanyaan: "Apa arti dari 안녕히 가세요 (annyeonghi gaseyo)?",
      pilihan: ["Selamat datang", "Selamat tinggal (ke yang pergi)", "Selamat makan", "Selamat tidur"],
      jawaban: 1,
      penjelasan: "Dipakai untuk mengucapkan selamat tinggal kepada yang pergi.",
    },
  ],
  "kosakata sehari-hari": [
    {
      pertanyaan: "Apa arti dari 물 (mul)?",
      pilihan: ["Api", "Air", "Angin", "Tanah"],
      jawaban: 1,
      penjelasan: "물 (mul) berarti air.",
    },
    {
      pertanyaan: "Bahasa Korea untuk \"rumah\" adalah?",
      pilihan: ["집", "밥", "책", "문"],
      jawaban: 0,
      penjelasan: "집 (jip) berarti rumah.",
    },
    {
      pertanyaan: "Apa arti dari 친구 (chingu)?",
      pilihan: ["Keluarga", "Teman", "Guru", "Tetangga"],
      jawaban: 1,
      penjelasan: "친구 (chingu) berarti teman.",
    },
    {
      pertanyaan: "Bahasa Korea untuk \"buku\" adalah?",
      pilihan: ["책", "물", "옷", "돈"],
      jawaban: 0,
      penjelasan: "책 (chaek) berarti buku.",
    },
    {
      pertanyaan: "Apa arti dari 돈 (don)?",
      pilihan: ["Waktu", "Uang", "Jalan", "Mobil"],
      jawaban: 1,
      penjelasan: "돈 (don) berarti uang.",
    },
  ],
  "istilah kerja pabrik": [
    {
      pertanyaan: "Apa arti dari 공장 (gongjang)?",
      pilihan: ["Kantor", "Pabrik", "Gudang", "Laboratorium"],
      jawaban: 1,
      penjelasan: "공장 (gongjang) berarti pabrik.",
    },
    {
      pertanyaan: "Bahasa Korea untuk \"mesin\" adalah?",
      pilihan: ["기계", "전기", "안전", "작업"],
      jawaban: 0,
      penjelasan: "기계 (gigye) berarti mesin.",
    },
    {
      pertanyaan: "Apa arti dari 안전 (anjeon)?",
      pilihan: ["Bahaya", "Keselamatan", "Pekerjaan", "Perbaikan"],
      jawaban: 1,
      penjelasan: "안전 (anjeon) berarti keselamatan/keamanan.",
    },
    {
      pertanyaan: "Bahasa Korea untuk \"pekerja\" adalah?",
      pilihan: ["작업자", "관리자", "기사", "사장"],
      jawaban: 0,
      penjelasan: "작업자 (jageopja) berarti pekerja/operator.",
    },
    {
      pertanyaan: "Apa arti dari 점검 (jeomgeom)?",
      pilihan: ["Pembersihan", "Pemeriksaan", "Pemasangan", "Pembongkaran"],
      jawaban: 1,
      penjelasan: "점검 (jeomgeom) berarti pemeriksaan/inspeksi.",
    },
  ],
  "angka dan waktu": [
    {
      pertanyaan: "Angka Korea Sino untuk \"3\" adalah?",
      pilihan: ["이", "삼", "사", "오"],
      jawaban: 1,
      penjelasan: "삼 (sam) adalah angka 3 dalam sistem Sino-Korea.",
    },
    {
      pertanyaan: "Apa arti dari 오늘 (oneul)?",
      pilihan: ["Kemarin", "Besok", "Hari ini", "Minggu depan"],
      jawaban: 2,
      penjelasan: "오늘 (oneul) berarti hari ini.",
    },
    {
      pertanyaan: "Bahasa Korea untuk \"jam\" (waktu) adalah?",
      pilihan: ["분", "시", "일", "월"],
      jawaban: 1,
      penjelasan: "시 (si) dipakai untuk menyebut jam.",
    },
    {
      pertanyaan: "Apa arti dari 내일 (naeil)?",
      pilihan: ["Kemarin", "Besok", "Sekarang", "Nanti"],
      jawaban: 1,
      penjelasan: "내일 (naeil) berarti besok.",
    },
    {
      pertanyaan: "Angka Korea Sino untuk \"10\" adalah?",
      pilihan: ["십", "구", "칠", "팔"],
      jawaban: 0,
      penjelasan: "십 (sip) adalah angka 10 dalam sistem Sino-Korea.",
    },
  ],
  "makanan dan minuman": [
    {
      pertanyaan: "Apa arti dari 밥 (bap)?",
      pilihan: ["Mie", "Nasi", "Roti", "Sup"],
      jawaban: 1,
      penjelasan: "밥 (bap) berarti nasi/makanan.",
    },
    {
      pertanyaan: "Bahasa Korea untuk \"kopi\" adalah?",
      pilihan: ["커피", "차", "주스", "우유"],
      jawaban: 0,
      penjelasan: "커피 (keopi) berarti kopi.",
    },
    {
      pertanyaan: "Apa arti dari 김치 (kimchi)?",
      pilihan: ["Sup rumput laut", "Kimchi (asinan sayur)", "Daging bakar", "Mie dingin"],
      jawaban: 1,
      penjelasan: "김치 (kimchi) adalah asinan sayur khas Korea.",
    },
    {
      pertanyaan: "Bahasa Korea untuk \"air\" (minum) adalah?",
      pilihan: ["물", "술", "차", "국"],
      jawaban: 0,
      penjelasan: "물 (mul) berarti air.",
    },
    {
      pertanyaan: "Apa arti dari 불고기 (bulgogi)?",
      pilihan: ["Daging bakar berbumbu", "Ikan mentah", "Tahu goreng", "Bubur"],
      jawaban: 0,
      penjelasan: "불고기 (bulgogi) adalah daging bakar berbumbu khas Korea.",
    },
  ],
};

/** Ambil soal cadangan, acak pilihan & urutannya. */
export function soalCadangan(topik: string, jumlah: number): Soal[] {
  const dasar = BANK[topik] ?? BANK["kosakata sehari-hari"];

  const acak = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  return acak(dasar)
    .slice(0, jumlah)
    .map((s) => {
      // Acak urutan pilihan, sesuaikan index jawaban
      const berpasangan = s.pilihan.map((p, i) => ({ p, benar: i === s.jawaban }));
      const diacak = acak(berpasangan);
      return {
        ...s,
        pilihan: diacak.map((x) => x.p),
        jawaban: diacak.findIndex((x) => x.benar),
      };
    });
}
