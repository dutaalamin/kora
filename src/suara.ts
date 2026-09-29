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

/** Suara salah: nada turun (buzz lembut). */
export function suaraSalah() {
  mainkan([
    { f: 311.13, t: 0, d: 0.18, jenis: "triangle", v: 0.2 },
    { f: 207.65, t: 0.13, d: 0.34, jenis: "triangle", v: 0.2 },
  ]);
}

/** Suara ketuk saat memilih jawaban. */
export function suaraKetuk() {
  mainkan([{ f: 523.25, t: 0, d: 0.06, v: 0.1, jenis: "square" }]);
}

/** Suara selesai sesi: fanfare singkat. */
export function suaraSelesai() {
  mainkan([
    { f: 523.25, t: 0, d: 0.15 },
    { f: 659.25, t: 0.13, d: 0.15 },
    { f: 783.99, t: 0.26, d: 0.15 },
    { f: 1046.5, t: 0.39, d: 0.4 },
  ]);
}

/** Suara nyawa habis / gagal. */
export function suaraGagal() {
  mainkan([
    { f: 392, t: 0, d: 0.2, jenis: "sawtooth", v: 0.12 },
    { f: 311.13, t: 0.16, d: 0.2, jenis: "sawtooth", v: 0.12 },
    { f: 233.08, t: 0.32, d: 0.4, jenis: "sawtooth", v: 0.12 },
  ]);
}
