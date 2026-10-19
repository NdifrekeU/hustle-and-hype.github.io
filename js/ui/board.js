/* =========================================================================
   ui/board.js — the leaderboard, with two backends.

   kind 'daily' (claude.ai artifact): the Daily Hustle board.
     scores/<playerId> → { date, score, char, won, act, floors, kills,
                           twist, at, best } in the artifact's shared db.
     Each player writes only their own document (access rules enforce
     it); one ranked score per player per day. Names are never stored.

   kind 'world' (inside Lagos Life): the world's own leaderboard through
     the Vatar SDK. Every finished run posts its score; the world keeps
     each player's best. Entries carry display names from the world.

   With neither available, state is 'off' and the game plays normally.
   Entries are normalised to { id, rank, name?, score, char?, won? }.
   ========================================================================= */
window.HH = window.HH || {};

HH.Board = (function () {
  let kind = null;          // 'daily' | 'world' | null
  let state = 'loading';    // loading | live | off
  let entries = [];
  let me = null;            // world: { rank, label, score }
  const listeners = new Set();

  // claude.ai backend
  let db = null, user = null, uid = null, names = {}, unsub = null, subDate = null;

  function emit() { listeners.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } }); }

  async function init() {
    await HH.Platform.ready;
    if (HH.Platform.name === 'lagoslife') {
      kind = 'world';
      uid = 'me';
      refresh();
      return;
    }
    const c = window.claude;
    if (!c || typeof c.use !== 'function') { state = 'off'; emit(); return; }
    try { [db, user] = await Promise.all([c.use('db'), c.use('user')]); } catch (e) { db = null; }
    if (!db) { state = 'off'; emit(); return; }
    kind = 'daily';
    try { uid = user ? await user.id() : null; } catch (e) { uid = null; }
    subscribe();
  }

  /* ---------------- world (Vatar) ---------------- */
  async function refresh() {
    if (kind !== 'world') { if (kind === 'daily') subscribe(); return; }
    try {
      const lb = await window.Vatar.leaderboard();
      entries = ((lb && lb.top) || []).map((e, i) => ({ id: 'w' + i, rank: e.rank, name: e.name, score: e.score }));
      me = lb && lb.me ? lb.me : null;
      // Mark your own row (the world lists display names only)
      if (me && me.rank) entries.forEach((e) => { if (e.rank === me.rank && e.score === me.score) e.id = 'me'; });
      state = 'live';
    } catch (e) {
      state = entries.length ? 'live' : 'off';
    }
    emit();
  }

  /* ---------------- daily (claude.ai) ---------------- */
  function subscribe() {
    const date = HH.Daily.today();
    if (unsub && subDate === date) return;
    if (unsub) unsub();
    subDate = date;
    try {
      unsub = db.collection('scores').where('date', '==', date).orderBy('score', 'desc').limit(50).onSnapshot(
        (snap) => {
          entries = snap.docs.map((d, i) => Object.assign({ id: d.id, rank: i + 1 }, d.data()));
          state = 'live';
          resolveNames();
          emit();
        },
        () => { state = 'off'; emit(); }
      );
    } catch (e) { state = 'off'; emit(); }
  }

  async function resolveNames() {
    if (!user || !entries.length) return;
    try {
      const ps = await user.profiles(entries.map((e) => e.id));
      names = {};
      Object.keys(ps).forEach((id) => { names[id] = ps[id].name; });
      emit();
    } catch (e) { /* names stay generic */ }
  }

  /* ---------------- posting ---------------- */
  /* Should this finished run be posted? */
  function shouldPost(run) {
    if (kind === 'world') return true;
    return !!(run.daily && run.daily.ranked);
  }

  /* Resolves { ok, reason, score? } */
  async function submit(run) {
    if (kind === 'world') {
      try {
        await window.Vatar.submitScore(run.score);
        await refresh();
        return { ok: true };
      } catch (e) {
        const code = e && e.code;
        return { ok: false, reason: code === 'too_soon' || code === 'rate_limited' ? 'too_soon' : 'error' };
      }
    }
    if (!db || !uid) return { ok: false, reason: 'offline' };
    const date = run.daily.date;
    if (date !== HH.Daily.today()) return { ok: false, reason: 'expired' };
    const ref = db.doc('scores/' + uid);
    try {
      const snap = await ref.get();
      const prev = snap.exists ? snap.data() : null;
      if (prev && prev.date === date) return { ok: false, reason: 'already', score: prev.score };
      await ref.set({
        date, score: run.score, char: run.char, won: run.outcome === 'win', act: run.act + 1,
        floors: run.stats.floors, kills: run.stats.kills, twist: run.daily.twist, at: Date.now(),
        best: Math.max(run.score, (prev && prev.best) || 0)
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e && e.code === 'invalid_argument' ? 'readonly' : 'error' };
    }
  }

  /* ---------------- queries for the UI ---------------- */
  function myEntry() {
    if (kind === 'world') return me ? { id: 'me', rank: me.rank, label: me.label, score: me.score } : null;
    return uid ? entries.find((e) => e.id === uid) || null : null;
  }
  function myLabel() {
    const m = myEntry();
    if (!m) return null;
    if (m.label) return m.label;
    return m.rank ? '#' + m.rank : null;
  }
  function rankOf(id) {
    if (kind === 'world' && id === 'me') return me ? me.rank : null;
    const e = entries.find((x) => x.id === id);
    return e ? e.rank : null;
  }
  function nameOf(id) {
    if (id === uid || id === 'me') return 'You';
    const e = entries.find((x) => x.id === id);
    if (kind === 'world') return (e && e.name) || 'A hustler';
    return names[id] || 'A hustler';
  }

  return {
    init, submit, refresh, shouldPost, myEntry, myLabel, rankOf, nameOf,
    get kind() { return kind; },
    get state() { return state; },
    get entries() { return entries; },
    get uid() { return uid; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
})();
