import { MUTE_KEY } from "./constants";

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "true";
}

export function setMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MUTE_KEY, String(muted));
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15
): void {
  if (isMuted()) return;
  const ctx = getContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

export function playClick(): void {
  playTone(800, 0.08, "square", 0.08);
}

export function playFlip(): void {
  playTone(600, 0.06, "triangle", 0.1);
  setTimeout(() => playTone(900, 0.06, "triangle", 0.08), 60);
}

export function playWin(): void {
  playTone(523, 0.12, "sine", 0.12);
  setTimeout(() => playTone(659, 0.12, "sine", 0.12), 100);
  setTimeout(() => playTone(784, 0.2, "sine", 0.12), 200);
}

export function playLose(): void {
  playTone(300, 0.15, "sawtooth", 0.08);
  setTimeout(() => playTone(200, 0.25, "sawtooth", 0.08), 120);
}

export function playTie(): void {
  playTone(440, 0.15, "sine", 0.1);
}

export function playRoll(): void {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => playTone(400 + Math.random() * 200, 0.05, "square", 0.06), i * 80);
  }
}

export function playMatch(): void {
  playTone(880, 0.1, "sine", 0.1);
  setTimeout(() => playTone(1100, 0.15, "sine", 0.1), 80);
}

export function playDraw(): void {
  playTone(500, 0.08, "triangle", 0.1);
}
