/* =========================================================================
   ui/audio.js — all sound is synthesized with Web Audio (no files).

   SFX:   HH.Audio.play('hit') etc. Each name maps to a tiny synth recipe.
   Music: a procedural Afrobeats-style groove (log-drum bass, highlife
          guitar picking, shaker, kick/clap) with three intensities:
          'calm' (menus, map), 'fight', 'boss'. Layers fade between moods.
   Audio only starts after the player's first tap or keypress.
   ========================================================================= */
window.HH = window.HH || {};

HH.Audio = (function () {
  let ctx = null;
  let master, sfxBus, musicBus, noiseBuf;
  let layers = {};
  let mode = 'calm';
  let timer = null;
  let step = 0;
  let nextTime = 0;
  let unlocked = false;
  const lastPlayed = {};

  const settings = () => (HH.App && HH.App.settings) || { sfx: true, music: true };

  /* ---------------- setup ---------------- */
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.6; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
      ['kick', 'clap', 'rim', 'shaker', 'bass', 'guitar', 'pad'].forEach((k) => {
        layers[k] = ctx.createGain();
        layers[k].gain.value = 0;
        layers[k].connect(musicBus);
      });
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended' && !(HH.Platform && HH.Platform.paused)) ctx.resume();
    return ctx;
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    if (!ensure()) return;
    applySettings();
  }
  ['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, unlock, { once: false, passive: true }));

  function applySettings() {
    if (!ctx) return;
    const s = settings();
    sfxBus.gain.setTargetAtTime(s.sfx ? 0.6 : 0, ctx.currentTime, 0.02);
    musicBus.gain.setTargetAtTime(s.music ? 0.32 : 0, ctx.currentTime, 0.3);
    if (s.music) startMusic(); else stopMusic();
  }

  /* ---------------- synth building blocks ---------------- */
  function tone(o) {
    const t = ctx.currentTime + (o.when || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + (o.glide || o.dur));
    const peak = o.gain || 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    let node = osc;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
    node.connect(g);
    g.connect(o.bus || sfxBus);
    osc.start(t);
    osc.stop(t + o.dur + 0.05);
  }

  function noise(o) {
    const t = ctx.currentTime + (o.when || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 2000, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.2, t + (o.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + o.dur + 0.05);
  }

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  /* ---------------- sound effects ---------------- */
  const SFX = {
    card: () => { noise({ filter: 'bandpass', freq: 1800, f1: 6000, dur: 0.12, gain: 0.22, q: 0.8 }); tone({ type: 'triangle', f0: 900, f1: 620, dur: 0.06, gain: 0.08 }); },
    power: () => { tone({ type: 'triangle', f0: 300, f1: 900, dur: 0.32, gain: 0.14 }); tone({ type: 'sine', f0: 600, f1: 1800, dur: 0.3, gain: 0.06, when: 0.05 }); },
    hit: () => { tone({ f0: 190, f1: 48, dur: 0.18, gain: 0.7 }); noise({ filter: 'lowpass', freq: 1400, dur: 0.08, gain: 0.32 }); },
    bigHit: () => { tone({ f0: 150, f1: 34, dur: 0.38, gain: 0.95 }); noise({ filter: 'lowpass', freq: 900, dur: 0.22, gain: 0.5 }); tone({ type: 'square', f0: 85, f1: 40, dur: 0.2, gain: 0.12, lp: 600 }); },
    hurt: () => { tone({ type: 'sawtooth', f0: 220, f1: 90, dur: 0.22, gain: 0.12, lp: 900 }); tone({ f0: 160, f1: 50, dur: 0.2, gain: 0.6 }); },
    block: () => { tone({ type: 'triangle', f0: 820, dur: 0.2, gain: 0.16 }); tone({ type: 'triangle', f0: 1235, dur: 0.15, gain: 0.1 }); noise({ freq: 3200, dur: 0.05, gain: 0.08 }); },
    blocked: () => { tone({ type: 'square', f0: 640, f1: 520, dur: 0.09, gain: 0.08, lp: 3000 }); noise({ filter: 'highpass', freq: 4000, dur: 0.07, gain: 0.14 }); },
    heal: () => [72, 76, 79, 84].forEach((n, i) => tone({ f0: midi(n), dur: 0.22, gain: 0.12, when: i * 0.06 })),
    hype: () => { tone({ type: 'sawtooth', f0: 320, f1: 1400, dur: 0.16, gain: 0.06, lp: 2800 }); tone({ f0: 1400, f1: 2100, dur: 0.1, gain: 0.05, when: 0.08 }); },
    hypeSpent: () => { tone({ type: 'sawtooth', f0: 200, f1: 1800, dur: 0.4, gain: 0.1, lp: 3500 }); noise({ filter: 'bandpass', freq: 800, f1: 7000, dur: 0.4, gain: 0.16 }); },
    coin: () => { tone({ type: 'square', f0: 1320, dur: 0.07, gain: 0.05, lp: 5000 }); tone({ type: 'square', f0: 1760, dur: 0.18, gain: 0.05, lp: 5000, when: 0.06 }); },
    steal: () => { tone({ type: 'square', f0: 1760, dur: 0.06, gain: 0.05, lp: 4000 }); tone({ type: 'square', f0: 1100, f1: 700, dur: 0.18, gain: 0.05, lp: 4000, when: 0.06 }); },
    debuff: () => { tone({ type: 'triangle', f0: 520, f1: 240, dur: 0.28, gain: 0.12 }); tone({ type: 'sine', f0: 530, f1: 250, dur: 0.28, gain: 0.06 }); },
    buff: () => { tone({ type: 'triangle', f0: 420, f1: 840, dur: 0.18, gain: 0.1 }); },
    draw: () => noise({ filter: 'highpass', freq: 5000, dur: 0.04, gain: 0.05 }),
    nope: () => { tone({ type: 'square', f0: 110, dur: 0.14, gain: 0.08, lp: 900 }); tone({ type: 'square', f0: 117, dur: 0.14, gain: 0.08, lp: 900 }); },
    // Gangan (talking drum): pitch bends up then down
    drum: () => { tone({ f0: 130, f1: 260, glide: 0.08, dur: 0.14, gain: 0.55 }); tone({ f0: 250, f1: 150, dur: 0.24, gain: 0.45, when: 0.13 }); noise({ filter: 'lowpass', freq: 700, dur: 0.04, gain: 0.2 }); },
    death: () => { tone({ type: 'sawtooth', f0: 420, f1: 60, dur: 0.55, gain: 0.1, lp: 1500 }); noise({ filter: 'lowpass', freq: 600, f1: 100, dur: 0.5, gain: 0.25 }); },
    turn: () => { tone({ f0: midi(79), dur: 0.16, gain: 0.08 }); tone({ f0: midi(84), dur: 0.3, gain: 0.08, when: 0.09 }); },
    victory: () => [72, 76, 79, 84, 79, 84].forEach((n, i) => { tone({ type: 'triangle', f0: midi(n), dur: 0.3, gain: 0.14, when: i * 0.11 }); tone({ f0: midi(n + 12), dur: 0.12, gain: 0.04, when: i * 0.11 }); }),
    defeat: () => [67, 66, 64, 60].forEach((n, i) => tone({ type: 'triangle', f0: midi(n), f1: midi(n) * 0.97, dur: 0.45, gain: 0.13, when: i * 0.32 })),
    follower: () => { tone({ f0: 560, f1: 1180, dur: 0.1, gain: 0.16 }); tone({ type: 'triangle', f0: 1180, dur: 0.12, gain: 0.06, when: 0.06 }); },
    passive: () => tone({ type: 'triangle', f0: 990, dur: 0.05, gain: 0.04 }),
    evoke: () => { noise({ filter: 'bandpass', freq: 400, f1: 5000, dur: 0.3, gain: 0.2 }); tone({ type: 'sawtooth', f0: 200, f1: 900, dur: 0.25, gain: 0.08, lp: 2500 }); },
    unfollow: () => { tone({ f0: 760, f1: 300, dur: 0.3, gain: 0.12 }); tone({ type: 'triangle', f0: 380, f1: 150, dur: 0.3, gain: 0.06, when: 0.04 }); },
    upgrade: () => [76, 79, 83, 88].forEach((n, i) => tone({ type: 'triangle', f0: midi(n), dur: 0.2, gain: 0.1, when: i * 0.05 })),
    ui: () => tone({ f0: 1250, dur: 0.035, gain: 0.04 }),
    swish: () => noise({ filter: 'bandpass', freq: 600, f1: 4000, dur: 0.2, gain: 0.12 })
  };

  function play(name) {
    if (!unlocked || !ctx || !settings().sfx || (HH.Platform && HH.Platform.paused)) return;
    const fn = SFX[name];
    if (!fn) return;
    const now = performance.now();
    if (lastPlayed[name] && now - lastPlayed[name] < 40) return; // avoid stacking
    lastPlayed[name] = now;
    try { fn(); } catch (e) { /* never let audio break the game */ }
  }

  /* ---------------- music ---------------- */
  // 4 bars in A minor: Am7 – Dm7 – G – Cmaj7 (midi notes)
  const CHORDS = [[57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 67], [60, 64, 67, 71]];
  const BASS = [45, 50, 43, 48];
  const GUITAR_STEPS = [0, 2, 3, 5, 6, 8, 10, 11, 13, 14];
  const GUITAR_NOTE = [0, 2, 1, 3, 2, 0, 2, 1, 3, 2];
  const MOODS = {
    calm: { bpm: 100, kick: 0, clap: 0, rim: 0.5, shaker: 0.6, bass: 0.7, guitar: 0.75, pad: 0.5 },
    fight: { bpm: 108, kick: 0.9, clap: 0.6, rim: 0.6, shaker: 0.7, bass: 0.9, guitar: 0.6, pad: 0.3 },
    boss: { bpm: 116, kick: 1, clap: 0.8, rim: 0.8, shaker: 0.85, bass: 1, guitar: 0.55, pad: 0.45 }
  };
  const KICK = { calm: [], fight: [0, 6, 8], boss: [0, 6, 8, 11, 14] };
  const BASS_STEPS = [0, 3, 6, 10, 12];

  function stepDur() { return 60 / MOODS[mode].bpm / 4; }

  function schedule(s, t) {
    const bar = Math.floor(s / 16) % 4;
    const i = s % 16;
    const m = MOODS[mode];
    const at = t - ctx.currentTime;
    if (KICK[mode].includes(i)) tone({ f0: 120, f1: 42, dur: 0.22, gain: 0.8, when: at, bus: layers.kick });
    if (i === 4 || i === 12) noise({ filter: 'bandpass', freq: 1600, q: 0.7, dur: 0.14, gain: 0.35, when: at, bus: layers.clap });
    if ([3, 7, 10, 14].includes(i)) tone({ type: 'square', f0: 1700, dur: 0.025, gain: 0.08, lp: 4000, when: at, bus: layers.rim });
    noise({ filter: 'highpass', freq: 7000, dur: i % 2 ? 0.05 : 0.03, gain: i % 2 ? 0.12 : 0.06, when: at, bus: layers.shaker });
    if (BASS_STEPS.includes(i)) {
      const n = BASS[bar] + (i === 10 ? 7 : 0);
      tone({ f0: midi(n + 12), f1: midi(n), glide: 0.06, dur: i === 0 ? 0.42 : 0.26, gain: 0.5, lp: 600, when: at, bus: layers.bass });
    }
    const gi = GUITAR_STEPS.indexOf(i);
    if (gi !== -1) {
      const n = CHORDS[bar][GUITAR_NOTE[gi]] + 12;
      tone({ type: 'triangle', f0: midi(n), dur: 0.16, gain: 0.12, lp: 3200, when: at, bus: layers.guitar });
    }
    if (i === 0) CHORDS[bar].forEach((n) => tone({ type: 'sine', f0: midi(n), dur: stepDur() * 15, attack: 0.3, gain: 0.035, when: at, bus: layers.pad }));
    void m;
  }

  function tick() {
    if (!ctx) return;
    while (nextTime < ctx.currentTime + 0.15) {
      schedule(step, nextTime);
      nextTime += stepDur();
      step++;
    }
  }

  function startMusic() {
    if (!ctx || timer) { setMode(mode); return; }
    nextTime = ctx.currentTime + 0.1;
    step = 0;
    timer = setInterval(tick, 30);
    setMode(mode);
  }

  function stopMusic() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function setMode(m) {
    mode = MOODS[m] ? m : 'calm';
    if (!ctx) return;
    const mood = MOODS[mode];
    Object.keys(layers).forEach((k) => layers[k].gain.setTargetAtTime(mood[k] || 0, ctx.currentTime, 0.6));
  }

  function suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); }
  function resume() { if (ctx && unlocked && ctx.state === 'suspended') ctx.resume(); }

  return { play, setMode, applySettings, unlock, suspend, resume };
})();
