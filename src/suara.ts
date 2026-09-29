// ============================================================
// Suara — dibuat pakai Web Audio API (tanpa file audio).
// Jadi tidak perlu download aset, langsung bunyi.
// ============================================================

let ctx: AudioContext | null = null;

/** Aktifkan audio setelah interaksi user (aturan browser). */
export function siapkanAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx?.state === "suspended") void ctx.resume();
}

type Nada = { f: number; t: number; d: number; v?: number; jenis?: OscillatorType };

function mainkan(nada: Nada[]) {
  if (!ctx) siapkanAudio();
  if (!ctx) return;
  const mulai = ctx.currentTime;
  for (const n of nada) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = n.jenis ?? "sine";
    osc.frequency.setValueAtTime(n.f, mulai + n.t);
    const vol = n.v ?? 0.18;
    gain.gain.setValueAtTime(0, mulai + n.t);
    gain.gain.linearRampToValueAtTime(vol, mulai + n.t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, mulai + n.t + n.d);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(mulai + n.t);
    osc.stop(mulai + n.t + n.d + 0.02);
  }
}

/** Suara benar: nada naik ceria (C-E-G). */
export function suaraBenar() {
  mainkan([
    { f: 659.25, t: 0, d: 0.14 },
    { f: 783.99, t: 0.09, d: 0.14 },
    { f: 1046.5, t: 0.18, d: 0.28 },
  ]);
}

/** Suara salah: "uh-oh" lembut menurun (tidak kasar). */
export function suaraSalah() {
  mainkan([
    { f: 440.0, t: 0, d: 0.12, jenis: "sine", v: 0.15 },
    { f: 349.23, t: 0.11, d: 0.14, jenis: "sine", v: 0.15 },
    { f: 261.63, t: 0.23, d: 0.34, jenis: "sine", v: 0.16 },
  ]);
}

/** Suara ketuk saat memilih jawaban. */
export function suaraKetuk() {
  mainkan([{ f: 523.25, t: 0, d: 0.06, v: 0.1, jenis: "square" }]);
}

/**
 * Suara selesai sesi — SELALU berbunyi saat latihan berakhir.
 * Nada menyesuaikan skor:
 *   - sempurna : fanfare besar "ta-da!"
 *   - bagus    : fanfare sedang
 *   - kurang   : nada lembut
 */
export function suaraSelesai(benar = 0, total = 1) {
  const rasio = total > 0 ? benar / total : 0;

  if (rasio >= 1) {
    // Sempurna — fanfare besar
    mainkan([
      { f: 523.25, t: 0.0, d: 0.12, v: 0.2 },
      { f: 659.25, t: 0.11, d: 0.12, v: 0.2 },
      { f: 783.99, t: 0.22, d: 0.12, v: 0.2 },
      { f: 1046.5, t: 0.33, d: 0.2, v: 0.22 },
      { f: 783.99, t: 0.53, d: 0.1, v: 0.18 },
      { f: 1046.5, t: 0.63, d: 0.5, v: 0.22 },
      { f: 1318.5, t: 0.63, d: 0.5, v: 0.1 },
    ]);
  } else if (rasio >= 0.6) {
    // Bagus — fanfare sedang
    mainkan([
      { f: 523.25, t: 0.0, d: 0.13, v: 0.2 },
      { f: 659.25, t: 0.12, d: 0.13, v: 0.2 },
      { f: 783.99, t: 0.24, d: 0.38, v: 0.22 },
    ]);
  } else {
    // Kurang — nada lembut, tetap positif
    mainkan([
      { f: 440.0, t: 0.0, d: 0.14, v: 0.16 },
      { f: 523.25, t: 0.14, d: 0.32, v: 0.18 },
    ]);
  }
}

/** Suara nyawa habis / gagal. */
export function suaraGagal() {
  mainkan([
    { f: 392, t: 0, d: 0.2, jenis: "sine", v: 0.14 },
    { f: 311.13, t: 0.16, d: 0.2, jenis: "sine", v: 0.14 },
    { f: 233.08, t: 0.32, d: 0.4, jenis: "sine", v: 0.14 },
  ]);
}
