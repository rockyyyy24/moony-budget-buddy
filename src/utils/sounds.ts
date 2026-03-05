// Dramatic alarm sound using Web Audio API - descending warble pattern
export const playAlarmSound = (durationMs = 4000) => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const end = ctx.currentTime + durationMs / 1000;
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.2;
  masterGain.connect(ctx.destination);

  // Layer 1: Warbling tone
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(600, ctx.currentTime);
  // Create wobble effect
  let t = ctx.currentTime;
  while (t < end) {
    osc1.frequency.setValueAtTime(600, t);
    osc1.frequency.linearRampToValueAtTime(900, t + 0.1);
    osc1.frequency.linearRampToValueAtTime(400, t + 0.2);
    osc1.frequency.linearRampToValueAtTime(700, t + 0.35);
    t += 0.4;
  }
  gain1.gain.value = 0.12;
  osc1.connect(gain1).connect(masterGain);
  osc1.start(ctx.currentTime);
  osc1.stop(end);

  // Layer 2: Rapid beeping
  let t2 = ctx.currentTime;
  while (t2 < end) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 1200;
    g.gain.setValueAtTime(0.15, t2);
    g.gain.exponentialRampToValueAtTime(0.01, t2 + 0.06);
    osc.connect(g).connect(masterGain);
    osc.start(t2);
    osc.stop(t2 + 0.08);
    t2 += 0.15;
  }

  // Layer 3: Low rumble
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'sine';
  osc3.frequency.value = 80;
  gain3.gain.value = 0.08;
  osc3.connect(gain3).connect(masterGain);
  osc3.start(ctx.currentTime);
  osc3.stop(end);

  // Fade out at end
  masterGain.gain.setValueAtTime(0.2, end - 0.5);
  masterGain.gain.linearRampToValueAtTime(0, end);

  setTimeout(() => ctx.close(), durationMs + 500);
};
