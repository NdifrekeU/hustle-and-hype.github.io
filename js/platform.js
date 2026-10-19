/* =========================================================================
   platform.js — where is the game running?

   'lagoslife'  inside a Vatar world's game player (Lagos Life etc.), via
                the Vatar Games SDK: player identity, the world's
                leaderboard, and pause/resume from the app.
   'web'        anywhere else (claude.ai artifact, a plain website, a
                local file). Everything still works; the leaderboard falls
                back to claude.ai's shared store when that is available.

   The SDK is only present in the Lagos Life build (see tools/), loaded
   from Vatar's own address as their docs require.
   ========================================================================= */
window.HH = window.HH || {};

HH.Platform = (function () {
  const P = {
    name: 'web',
    mode: null,      // 'live' | 'test' inside a world
    player: null,    // { id, name, avatar } inside a world
    paused: false
  };
  const pauseFns = new Set();
  const resumeFns = new Set();

  P.onPause = (fn) => pauseFns.add(fn);
  P.onResume = (fn) => resumeFns.add(fn);

  function setPaused(v) {
    if (P.paused === v) return;
    P.paused = v;
    (v ? pauseFns : resumeFns).forEach((fn) => { try { fn(); } catch (e) { /* keep going */ } });
  }

  P.ready = (async function () {
    const V = window.Vatar;
    if (!V || typeof V.init !== 'function') return P;
    try {
      const res = await V.init();
      P.name = 'lagoslife';
      P.mode = res && res.mode;
      P.player = res && res.player;
      if (typeof V.onPause === 'function') V.onPause(() => setPaused(true));
      if (typeof V.onResume === 'function') V.onResume(() => setPaused(false));
    } catch (e) {
      // 'not_framed' (opened outside a world) or a timeout: plain web mode
      P.name = 'web';
    }
    return P;
  })();

  /* Resolves after `ms` of un-paused time (enemy turns wait on this) */
  P.sleep = function (ms) {
    return new Promise((resolve) => {
      const go = () => {
        if (!P.paused) { resolve(); return; }
        const r = () => { resumeFns.delete(r); resolve(); };
        resumeFns.add(r);
      };
      setTimeout(go, ms);
    });
  };

  return P;
})();
