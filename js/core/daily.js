/* =========================================================================
   core/daily.js — the Daily Hustle: one shared seeded run per day.
   Everyone gets the same date-based seed, character and twist, so the
   map, fights and rewards match. The first daily run you START each day
   is the ranked one; later attempts that day are practice.
   No DOM and no platform calls here (see ui/board.js for the leaderboard).
   ========================================================================= */
window.HH = window.HH || {};

HH.Daily = (function () {
  const CHARS = ['tech', 'mama', 'creator'];
  const TWISTS = [
    { id: 'owambe', name: 'Owambe Day', desc: 'Start with ₦100 extra. Spray wisely.' },
    { id: 'rare', name: 'Plug Day', desc: 'Start with a random rare card.' },
    { id: 'gadget', name: 'Tokunbo Day', desc: 'Start with a random uncommon Gadget.' },
    { id: 'tough', name: 'Wahala Day', desc: 'All enemies have 10% more HP. Scores ×1.2.' },
    { id: 'lean', name: 'Japa Day', desc: 'Start with 10% less max HP. Scores ×1.15.' }
  ];

  /* Today's date in UTC, so every player shares the same day */
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function info(date) {
    date = date || today();
    const h = HH.RNG.hash('HH-DAILY-' + date);
    return {
      date,
      seed: 'DAILY-' + date,
      char: CHARS[h % CHARS.length],
      twist: TWISTS[(h >>> 4) % TWISTS.length]
    };
  }

  /* Apply the day's twist to a fresh run (called by Run.newRun) */
  function applyTwist(run, twistId) {
    const R = HH.Run;
    switch (twistId) {
      case 'owambe': run.gold += 100; break;
      case 'rare': {
        const pool = Object.values(HH.Data.CARDS).filter((c) => c.pool === run.char && c.rarity === 'rare');
        R.addCard(run, R.rng(run).pick(pool).id);
        break;
      }
      case 'gadget': R.addRelic(run, R.randomRelicId(run, 'uncommon')); break;
      case 'tough': run.wahala = Math.max(run.wahala, 1); break;
      case 'lean': run.maxHp = Math.round(run.maxHp * 0.9); run.hp = run.maxHp; break;
    }
  }

  /* Score for any finished run. Shown on every end screen; posted for
     the ranked daily run. */
  function score(run) {
    const s = run.stats;
    let pts = s.floors * 10 + s.kills * 3 + s.elites * 25 + s.bosses * 75 + Math.floor(s.goldEarned / 10);
    if (run.outcome === 'win') pts += 500 + run.hp * 3;
    const twist = run.daily && run.daily.twist;
    if (twist === 'tough') pts = Math.round(pts * 1.2);
    if (twist === 'lean') pts = Math.round(pts * 1.15);
    return pts;
  }

  /* Local memory of which day's ranked attempt was already used */
  function startedKey(date) { return 'hh-daily-started-' + date; }
  function hasStarted(date) {
    try { return !!localStorage.getItem(startedKey(date)); } catch (e) { return false; }
  }
  function markStarted(date) {
    try { localStorage.setItem(startedKey(date), '1'); } catch (e) { /* ignore */ }
  }

  return { today, info, applyTwist, score, hasStarted, markStarted, TWISTS };
})();
