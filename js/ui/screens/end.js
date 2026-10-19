/* =========================================================================
   screens/end.js — victory over Sapa, or "You Don Cast".
   ========================================================================= */
HH.Screens.end = (function () {
  const D = HH.Data;

  function enter(root) {
    const App = HH.App;
    const run = App.run;
    const won = run.outcome === 'win';
    const ch = D.CHARACTERS[run.char];
    const m = run.metaAfter || HH.Run.meta();
    const unlockedNow = won && (m.unlocked[run.char] || 0) > run.wahala;
    const s = run.stats;
    const mins = Math.max(1, Math.round((Date.now() - run.startedAt) / 60000));
    if (!run.endSoundPlayed) { run.endSoundPlayed = true; HH.Audio.play(won ? 'victory' : 'defeat'); }

    root.innerHTML = `
      <div class="end-bg">${HH.Art.stage(won ? 'eko' : D.ACTS[run.act].stage)}</div>
      <div class="panel-screen">
        <div class="panel end-panel ${won ? 'won' : 'lost'}">
          <div class="end-art">${won ? HH.Art.character(Object.assign({}, ch.art, { expr: 'happy' })) : HH.Art.character(D.ENEMIES[(run.combatInfo && run.combatInfo.enemies[0]) || 'sapa'].art, { flip: true })}</div>
          <p class="eyebrow">${won ? 'Run complete' : `Fell in Act ${run.act + 1} · ${D.ACTS[run.act].name}`}</p>
          <h2 class="end-title">${won ? 'You Scaled! 🚀' : 'You Don Cast! 💀'}</h2>
          <p class="center">${won ? `Sapa is defeated. ${ch.name} is officially doing well. Somebody’s uncle is already asking for money.` : 'Lagos no be for small pikin. Dust yourself off and run it back.'}</p>
          <div class="score-box"><span class="score-label">Score</span><span class="score-num">${run.score != null ? run.score : HH.Daily.score(run)}</span></div>
          ${run.daily || HH.Board.kind === 'world' ? '<div class="daily-result" id="daily-result" role="status"></div>' : ''}
          ${unlockedNow ? `<p class="unlock">🔓 Wahala ${run.wahala + 1} unlocked: ${D.WAHALA[run.wahala + 1].name}</p>` : ''}
          <dl class="end-stats">
            <div><dt>Floors climbed</dt><dd>${s.floors}</dd></div>
            <div><dt>Enemies defeated</dt><dd>${s.kills}</dd></div>
            <div><dt>Gbese dealt</dt><dd>${s.dealt}</dd></div>
            <div><dt>Biggest hit</dt><dd>${s.biggestHit}</dd></div>
            <div><dt>Cards played</dt><dd>${s.cardsPlayed}</dd></div>
            <div><dt>Naira earned</dt><dd>₦${s.goldEarned}</dd></div>
            <div><dt>Deck size</dt><dd>${run.deck.length}</dd></div>
            <div><dt>Time</dt><dd>${mins} min</dd></div>
          </dl>
          <p class="muted center small">Seed <b class="mono">${run.seed}</b> · Wahala ${run.wahala} · ${ch.name}</p>
          <div class="btn-row">
            <button class="btn btn-ghost" data-act="deck">View final deck</button>
            ${run.daily ? '' : '<button class="btn btn-ghost" data-act="seed">Replay this seed</button>'}
            <button class="btn btn-primary" data-act="title">New run</button>
          </div>
        </div>
      </div>`;

    if (run.daily || HH.Board.kind === 'world') postDaily(root, run);

    root.onclick = (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'deck') App.showDeck(run.deck, 'Final deck');
      if (b.dataset.act === 'seed') App.startRun(run.char, run.wahala, run.seed);
      if (b.dataset.act === 'title') { App.run = null; App.go('title'); }
    };
  }

  /* Post the ranked daily score once, then show the rank as it lands */
  async function postDaily(root, run) {
    const box = root.querySelector('#daily-result');
    const say = (html) => { if (box) box.innerHTML = html; };
    const world = HH.Board.kind === 'world';
    const post = run.posting = run.posting || {};
    if (!HH.Board.shouldPost(run)) { say('Practice run · not posted to the board.'); return; }
    if (post.done) { say(post.msg || 'Posted to the board.'); return; }
    if (HH.Board.state !== 'live') {
      say('Posting to today’s board…');
      // The board may still be connecting; wait briefly
      for (let i = 0; i < 20 && HH.Board.state === 'loading'; i++) await new Promise((r) => setTimeout(r, 250));
    }
    const res = await HH.Board.submit(run);
    let msg;
    if (res.ok) msg = world ? '✅ Posted to the Lagos Life leaderboard!' : '✅ Posted to today’s Daily Hustle board!';
    else if (res.reason === 'too_soon') msg = 'Scores can only be posted every 20 seconds. This one wasn’t counted.';
    else if (res.reason === 'already') msg = `You already posted today (score ${res.score}). This run didn’t replace it.`;
    else if (res.reason === 'expired') msg = 'This daily run is from a previous day, so it wasn’t posted.';
    else if (res.reason === 'readonly') msg = 'You can view the board but not post to it. Ask the owner for Contributor access.';
    else msg = 'The leaderboard isn’t available here, so this score stays on your device.';
    post.done = true;
    post.msg = msg;
    say(msg);
    if (res.ok && world) {
      const label = HH.Board.myLabel();
      if (label) { post.msg = `✅ Posted! Your best is ${HH.Board.myEntry().score} (${label} in Lagos Life).`; say(post.msg); }
    } else if (res.ok) {
      const stop = HH.Board.onChange(() => {
        const r = HH.Board.rankOf(HH.Board.uid);
        if (r) { say(`✅ Posted! You’re <b>#${r}</b> on today’s board.`); post.msg = `Posted! You were #${r} on the day’s board.`; stop(); }
      });
    }
  }

  return { enter };
})();
