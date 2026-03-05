// Alarm sound using Web Audio API - no external files needed
export const playAlarmSound = (durationMs = 4000) => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const end = ctx.currentTime + durationMs / 1000;

  const schedule = (freq: number, start: number, dur: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.18, start);
    gain.gain.exponentialRampToValueAtTime(0.01, start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur);
  };

  // Alternating high-low siren pattern
  let t = ctx.currentTime;
  while (t < end) {
    schedule(880, t, 0.15);
    schedule(440, t + 0.15, 0.15);
    t += 0.3;
  }

  // Auto-close context after sound ends
  setTimeout(() => ctx.close(), durationMs + 500);
};
