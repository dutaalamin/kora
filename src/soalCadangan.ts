// ============================================================
// Soal cadangan — dipakai kalau AI gagal (offline / kunci belum ada).
// Bank besar supaya tidak terasa berulang.
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
    { pertanyaan: "Apa arti dari 안녕하세요 (annyeonghaseyo)?", pilihan: ["Terima kasih", "Halo", "Selamat tinggal", "Maaf"], jawaban: 1, penjelasan: "안녕하세요 berarti halo, sapaan sopan." },
    { pertanyaan: "Bahasa Korea untuk \"terima kasih\" adalah?", pilihan: ["감사합니다", "안녕히 가세요", "죄송합니다", "반갑습니다"], jawaban: 0, penjelasan: "감사합니다 (gamsahamnida) berarti terima kasih." },
    { pertanyaan: "Apa arti dari 죄송합니다 (joesonghamnida)?", pilihan: ["Selamat pagi", "Maaf", "Sampai jumpa", "Senang bertemu"], jawaban: 1, penjelasan: "죄송합니다 berarti maaf (formal)." },
    { pertanyaan: "Bahasa Korea untuk \"senang bertemu denganmu\" adalah?", pilihan: ["반갑습니다", "잘 자요", "안녕히 계세요", "실례합니다"], jawaban: 0, penjelasan: "반갑습니다 dipakai saat pertama bertemu." },
    { pertanyaan: "Apa arti dari 안녕히 가세요 (annyeonghi gaseyo)?", pilihan: ["Selamat datang", "Selamat tinggal (ke yang pergi)", "Selamat makan", "Selamat tidur"], jawaban: 1, penjelasan: "Diucapkan kepada orang yang pergi." },
    { pertanyaan: "Apa arti dari 이름 (ireum)?", pilihan: ["Alamat", "Nama", "Umur", "Pekerjaan"], jawaban: 1, penjelasan: "이름 (ireum) berarti nama." },
    { pertanyaan: "Bahasa Korea untuk \"selamat datang\" adalah?", pilihan: ["환영합니다", "축하합니다", "감사합니다", "안녕하세요"], jawaban: 0, penjelasan: "환영합니다 (hwanyeonghamnida) berarti selamat datang." },
    { pertanyaan: "Apa arti dari 잘 자요 (jal jayo)?", pilihan: ["Selamat pagi", "Selamat malam/tidur", "Selamat jalan", "Sampai jumpa"], jawaban: 1, penjelasan: "잘 자요 diucapkan sebelum tidur." },
    { pertanyaan: "Bahasa Korea untuk \"sampai jumpa\" adalah?", pilihan: ["또 봐요", "잘 먹겠습니다", "어서 오세요", "실례합니다"], jawaban: 0, penjelasan: "또 봐요 (tto bwayo) berarti sampai jumpa lagi." },
    { pertanyaan: "Apa arti dari 실례합니다 (sillyehamnida)?", pilihan: ["Permisi", "Selamat tinggal", "Terima kasih", "Maaf sekali"], jawaban: 0, penjelasan: "실례합니다 dipakai untuk minta permisi." },
    { pertanyaan: "Bahasa Korea untuk \"selamat makan\" adalah?", pilihan: ["잘 먹겠습니다", "맛있어요", "배고파요", "고마워요"], jawaban: 0, penjelasan: "잘 먹겠습니다 diucapkan sebelum makan." },
    { pertanyaan: "Apa arti dari 어서 오세요 (eoseo oseyo)?", pilihan: ["Ayo pergi", "Selamat datang (di toko)", "Hati-hati", "Terima kasih"], jawaban: 1, penjelasan: "Dipakai menyambut tamu di toko/restoran." },
    { pertanyaan: "Bahasa Korea untuk \"berapa umurmu?\" (sopan) adalah?", pilihan: ["연세가 어떻게 되세요?", "어디에 사세요?", "무슨 일을 하세요?", "이름이 뭐예요?"], jawaban: 0, penjelasan: "연세 dipakai untuk menanyakan umur orang yang dihormati." },
    { pertanyaan: "Apa arti dari 만나서 반갑습니다?", pilihan: ["Maaf atas keterlambatan", "Senang bertemu denganmu", "Terima kasih banyak", "Selamat ulang tahun"], jawaban: 1, penjelasan: "Ungkapan lengkap saat berkenalan." },
    { pertanyaan: "Bahasa Korea untuk \"permisi\" (memanggil pelayan) adalah?", pilihan: ["저기요", "여기요", "거기요", "이거요"], jawaban: 0, penjelasan: "저기요 dipakai memanggil seseorang dengan sopan." },
  ],

  "kosakata sehari-hari": [
    { pertanyaan: "Apa arti dari 물 (mul)?", pilihan: ["Api", "Air", "Angin", "Tanah"], jawaban: 1, penjelasan: "물 (mul) berarti air." },
    { pertanyaan: "Bahasa Korea untuk \"rumah\" adalah?", pilihan: ["집", "밥", "책", "문"], jawaban: 0, penjelasan: "집 (jip) berarti rumah." },
    { pertanyaan: "Apa arti dari 친구 (chingu)?", pilihan: ["Keluarga", "Teman", "Guru", "Tetangga"], jawaban: 1, penjelasan: "친구 (chingu) berarti teman." },
    { pertanyaan: "Bahasa Korea untuk \"buku\" adalah?", pilihan: ["책", "물", "옷", "돈"], jawaban: 0, penjelasan: "책 (chaek) berarti buku." },
    { pertanyaan: "Apa arti dari 돈 (don)?", pilihan: ["Waktu", "Uang", "Jalan", "Mobil"], jawaban: 1, penjelasan: "돈 (don) berarti uang." },
    { pertanyaan: "Bahasa Korea untuk \"makanan/nasi\" adalah?", pilihan: ["밥", "국", "차", "과일"], jawaban: 0, penjelasan: "밥 (bap) berarti nasi/makanan." },
    { pertanyaan: "Apa arti dari 옷 (ot)?", pilihan: ["Sepatu", "Pakaian", "Topi", "Tas"], jawaban: 1, penjelasan: "옷 (ot) berarti pakaian." },
    { pertanyaan: "Bahasa Korea untuk \"sekolah\" adalah?", pilihan: ["학교", "병원", "시장", "공원"], jawaban: 0, penjelasan: "학교 (hakgyo) berarti sekolah." },
    { pertanyaan: "Apa arti dari 시간 (sigan)?", pilihan: ["Waktu", "Tempat", "Orang", "Barang"], jawaban: 0, penjelasan: "시간 (sigan) berarti waktu." },
    { pertanyaan: "Bahasa Korea untuk \"rumah sakit\" adalah?", pilihan: ["병원", "약국", "은행", "학교"], jawaban: 0, penjelasan: "병원 (byeongwon) berarti rumah sakit." },
    { pertanyaan: "Apa arti dari 자동차 (jadongcha)?", pilihan: ["Sepeda", "Mobil", "Bus", "Kereta"], jawaban: 1, penjelasan: "자동차 (jadongcha) berarti mobil." },
    { pertanyaan: "Bahasa Korea untuk \"uang\" adalah?", pilihan: ["돈", "시간", "사람", "물"], jawaban: 0, penjelasan: "돈 (don) berarti uang." },
    { pertanyaan: "Apa arti dari 사람 (saram)?", pilihan: ["동물", "Orang", "음식", "장소"], jawaban: 1, penjelasan: "사람 (saram) berarti orang." },
    { pertanyaan: "Bahasa Korea untuk \"teman\" adalah?", pilihan: ["친구", "가족", "이웃", "선생님"], jawaban: 0, penjelasan: "친구 (chingu) berarti teman." },
    { pertanyaan: "Apa arti dari 가족 (gajok)?", pilihan: ["Keluarga", "Teman", "Kerabat", "Tetangga"], jawaban: 0, penjelasan: "가족 (gajok) berarti keluarga." },
  ],

  "istilah kerja pabrik": [
    { pertanyaan: "Apa arti dari 공장 (gongjang)?", pilihan: ["Kantor", "Pabrik", "Gudang", "Laboratorium"], jawaban: 1, penjelasan: "공장 (gongjang) berarti pabrik." },
    { pertanyaan: "Bahasa Korea untuk \"mesin\" adalah?", pilihan: ["기계", "전기", "안전", "작업"], jawaban: 0, penjelasan: "기계 (gigye) berarti mesin." },
    { pertanyaan: "Apa arti dari 안전 (anjeon)?", pilihan: ["Bahaya", "Keselamatan", "Pekerjaan", "Perbaikan"], jawaban: 1, penjelasan: "안전 (anjeon) berarti keselamatan." },
    { pertanyaan: "Bahasa Korea untuk \"pekerja\" adalah?", pilihan: ["작업자", "관리자", "기사", "사장"], jawaban: 0, penjelasan: "작업자 (jageopja) berarti pekerja/operator." },
    { pertanyaan: "Apa arti dari 점검 (jeomgeom)?", pilihan: ["Pembersihan", "Pemeriksaan", "Pemasangan", "Pembongkaran"], jawaban: 1, penjelasan: "점검 (jeomgeom) berarti pemeriksaan/inspeksi." },
    { pertanyaan: "Bahasa Korea untuk \"produksi\" adalah?", pilihan: ["생산", "소비", "판매", "구매"], jawaban: 0, penjelasan: "생산 (saengsan) berarti produksi." },
    { pertanyaan: "Apa arti dari 품질 (pumjil)?", pilihan: ["Kuantitas", "Kualitas", "Kecepatan", "Harga"], jawaban: 1, penjelasan: "품질 (pumjil) berarti kualitas/mutu." },
    { pertanyaan: "Bahasa Korea untuk \"perbaikan\" adalah?", pilihan: ["수리", "교체", "설치", "청소"], jawaban: 0, penjelasan: "수리 (suri) berarti perbaikan." },
    { pertanyaan: "Apa arti dari 사고 (sago)?", pilihan: ["Kecelakaan", "Rapat", "Libur", "Upah"], jawaban: 0, penjelasan: "사고 (sago) berarti kecelakaan/insiden." },
    { pertanyaan: "Bahasa Korea untuk \"bahan\" adalah?", pilihan: ["자재", "제품", "기계", "공구"], jawaban: 0, penjelasan: "자재 (jajae) berarti material/bahan." },
    { pertanyaan: "Apa arti dari 교대 (gyodae)?", pilihan: ["Lembur", "Shift kerja", "Istirahat", "Cuti"], jawaban: 1, penjelasan: "교대 (gyodae) berarti pergantian shift." },
    { pertanyaan: "Bahasa Korea untuk \"peralatan\" adalah?", pilihan: ["공구", "제품", "자재", "부품"], jawaban: 0, penjelasan: "공구 (gonggu) berarti peralatan/alat kerja." },
    { pertanyaan: "Apa arti dari 고장 (gojang)?", pilihan: ["Kerusakan", "Pembersihan", "Pemeriksaan", "Pengiriman"], jawaban: 0, penjelasan: "고장 (gojang) berarti kerusakan/malfungsi." },
    { pertanyaan: "Bahasa Korea untuk \"laporan\" adalah?", pilihan: ["보고", "회의", "점검", "생산"], jawaban: 0, penjelasan: "보고 (bogo) berarti laporan." },
    { pertanyaan: "Apa arti dari 출근 (chulgeun)?", pilihan: ["Pulang kerja", "Masuk kerja", "Lembur", "Cuti"], jawaban: 1, penjelasan: "출근 (chulgeun) berarti berangkat/masuk kerja." },
  ],

  "angka dan waktu": [
    { pertanyaan: "Angka Korea Sino untuk \"3\" adalah?", pilihan: ["이", "삼", "사", "오"], jawaban: 1, penjelasan: "삼 (sam) adalah angka 3 Sino-Korea." },
    { pertanyaan: "Apa arti dari 오늘 (oneul)?", pilihan: ["Kemarin", "Besok", "Hari ini", "Minggu depan"], jawaban: 2, penjelasan: "오늘 (oneul) berarti hari ini." },
    { pertanyaan: "Bahasa Korea untuk \"jam\" (waktu) adalah?", pilihan: ["분", "시", "일", "월"], jawaban: 1, penjelasan: "시 (si) dipakai menyebut jam." },
    { pertanyaan: "Apa arti dari 내일 (naeil)?", pilihan: ["Kemarin", "Besok", "Sekarang", "Nanti"], jawaban: 1, penjelasan: "내일 (naeil) berarti besok." },
    { pertanyaan: "Angka Korea Sino untuk \"10\" adalah?", pilihan: ["십", "구", "칠", "팔"], jawaban: 0, penjelasan: "십 (sip) adalah angka 10 Sino-Korea." },
    { pertanyaan: "Apa arti dari 어제 (eoje)?", pilihan: ["Besok", "Kemarin", "Hari ini", "Lusa"], jawaban: 1, penjelasan: "어제 (eoje) berarti kemarin." },
    { pertanyaan: "Angka Korea Sino untuk \"5\" adalah?", pilihan: ["오", "사", "육", "칠"], jawaban: 0, penjelasan: "오 (o) adalah angka 5 Sino-Korea." },
    { pertanyaan: "Bahasa Korea untuk \"menit\" adalah?", pilihan: ["시", "분", "초", "일"], jawaban: 1, penjelasan: "분 (bun) berarti menit." },
    { pertanyaan: "Apa arti dari 아침 (achim)?", pilihan: ["Siang", "Pagi", "Malam", "Sore"], jawaban: 1, penjelasan: "아침 (achim) berarti pagi." },
    { pertanyaan: "Angka Korea Sino untuk \"1\" adalah?", pilihan: ["일", "이", "삼", "사"], jawaban: 0, penjelasan: "일 (il) adalah angka 1 Sino-Korea." },
    { pertanyaan: "Bahasa Korea untuk \"malam\" adalah?", pilihan: ["밤", "낮", "아침", "저녁"], jawaban: 0, penjelasan: "밤 (bam) berarti malam." },
    { pertanyaan: "Apa arti dari 주말 (jumal)?", pilihan: ["Hari kerja", "Akhir pekan", "Libur nasional", "Hari ini"], jawaban: 1, penjelasan: "주말 (jumal) berarti akhir pekan." },
    { pertanyaan: "Angka Korea Sino untuk \"7\" adalah?", pilihan: ["칠", "팔", "육", "오"], jawaban: 0, penjelasan: "칠 (chil) adalah angka 7 Sino-Korea." },
    { pertanyaan: "Bahasa Korea untuk \"hari\" adalah?", pilihan: ["일", "월", "년", "시"], jawaban: 0, penjelasan: "일 (il) juga berarti hari." },
    { pertanyaan: "Apa arti dari 지금 (jigeum)?", pilihan: ["Nanti", "Sekarang", "Kemarin", "Besok"], jawaban: 1, penjelasan: "지금 (jigeum) berarti sekarang." },
  ],

  "makanan dan minuman": [
    { pertanyaan: "Apa arti dari 밥 (bap)?", pilihan: ["Mie", "Nasi", "Roti", "Sup"], jawaban: 1, penjelasan: "밥 (bap) berarti nasi/makanan." },
    { pertanyaan: "Bahasa Korea untuk \"kopi\" adalah?", pilihan: ["커피", "차", "주스", "우유"], jawaban: 0, penjelasan: "커피 (keopi) berarti kopi." },
    { pertanyaan: "Apa arti dari 김치 (kimchi)?", pilihan: ["Sup rumput laut", "Kimchi (asinan sayur)", "Daging bakar", "Mie dingin"], jawaban: 1, penjelasan: "김치 (kimchi) adalah asinan sayur khas Korea." },
    { pertanyaan: "Bahasa Korea untuk \"air\" (minum) adalah?", pilihan: ["물", "술", "차", "국"], jawaban: 0, penjelasan: "물 (mul) berarti air." },
    { pertanyaan: "Apa arti dari 불고기 (bulgogi)?", pilihan: ["Daging bakar berbumbu", "Ikan mentah", "Tahu goreng", "Bubur"], jawaban: 0, penjelasan: "불고기 adalah daging bakar berbumbu." },
    { pertanyaan: "Bahasa Korea untuk \"teh\" adalah?", pilihan: ["차", "커피", "주스", "우유"], jawaban: 0, penjelasan: "차 (cha) berarti teh." },
    { pertanyaan: "Apa arti dari 라면 (ramyeon)?", pilihan: ["Mie instan", "Nasi goreng", "Sup kimchi", "Sate"], jawaban: 0, penjelasan: "라면 (ramyeon) berarti mie instan." },
    { pertanyaan: "Bahasa Korea untuk \"susu\" adalah?", pilihan: ["우유", "주스", "물", "술"], jawaban: 0, penjelasan: "우유 (uyu) berarti susu." },
    { pertanyaan: "Apa arti dari 고기 (gogi)?", pilihan: ["Sayur", "Daging", "Ikan", "Buah"], jawaban: 1, penjelasan: "고기 (gogi) berarti daging." },
    { pertanyaan: "Bahasa Korea untuk \"buah\" adalah?", pilihan: ["과일", "야채", "고기", "밥"], jawaban: 0, penjelasan: "과일 (gwail) berarti buah." },
    { pertanyaan: "Apa arti dari 맥주 (maekju)?", pilihan: ["Bir", "Anggur", "Air soda", "Kopi"], jawaban: 0, penjelasan: "맥주 (maekju) berarti bir." },
    { pertanyaan: "Bahasa Korea untuk \"pedas\" adalah?", pilihan: ["매워요", "달아요", "짜요", "써요"], jawaban: 0, penjelasan: "매워요 (maewoyo) berarti pedas." },
    { pertanyaan: "Apa arti dari 맛있어요 (masisseoyo)?", pilihan: ["Tidak enak", "Enak/lezat", "Terlalu asin", "Terlalu manis"], jawaban: 1, penjelasan: "맛있어요 berarti enak." },
    { pertanyaan: "Bahasa Korea untuk \"sayur\" adalah?", pilihan: ["야채", "과일", "고기", "밥"], jawaban: 0, penjelasan: "야채 (yachae) berarti sayuran." },
    { pertanyaan: "Apa arti dari 냉면 (naengmyeon)?", pilihan: ["Mie dingin", "Mie panas", "Nasi campur", "Sup daging"], jawaban: 0, penjelasan: "냉면 (naengmyeon) adalah mie dingin khas Korea." },
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
