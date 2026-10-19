/* =========================================================================
   core/rng.js — seeded random numbers so every run can be replayed.
   The generator's state is a single number, saved with the run.
   ========================================================================= */
window.HH = window.HH || {};

HH.RNG = (function () {
  const WORDS = ['JOLLOF', 'DANFO', 'SUYA', 'OKADA', 'AGEGE', 'ZOBO', 'GELE', 'KUNU', 'NEPA', 'SAPA', 'OWAMBE', 'EKO', 'YABA', 'LEKKI', 'BUKA', 'GBESE'];

  /* String → 32-bit seed */
  function hash(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return (h >>> 0) || 1;
  }

  /* Mulberry32: tiny, fast, good enough for games */
  function create(state) {
    const rng = { state: state >>> 0 };
    rng.next = function () {
      let t = (rng.state = (rng.state + 0x6d2b79f5) >>> 0);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    rng.int = (min, max) => min + Math.floor(rng.next() * (max - min + 1));
    rng.pick = (arr) => arr[Math.floor(rng.next() * arr.length)];
    rng.shuffle = (list) => {
      const a = list.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    rng.weighted = (pairs) => {
      const total = pairs.reduce((s, p) => s + p[1], 0);
      let roll = rng.next() * total;
      for (const [v, w] of pairs) { if ((roll -= w) < 0) return v; }
      return pairs[pairs.length - 1][0];
    };
    return rng;
  }

  function randomSeedString() {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    return w + '-' + Math.floor(1000 + Math.random() * 9000);
  }

  return { hash, create, randomSeedString };
})();
