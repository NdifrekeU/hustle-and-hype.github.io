/* =========================================================================
   screens/title.js — logo, character select, Wahala level, seed, continue.
   ========================================================================= */
HH.Screens.title = (function () {
  const D = HH.Data;
  let state = { char: 'tech', wahala: 0 };
  let stopBoard = null;
  const CHAR_ICON = { tech: '💻', mama: '🥄', creator: '🤳🏾' };

  /* ---- Daily Hustle panel ---- */
  function dailyStatus() {
    const info = HH.Daily.info();
    const mine = HH.Board.myEntry();
    if (HH.Board.kind === 'world') {
      return { info, label: 'Play today’s run', note: mine ? `Your best: <b>${mine.score}</b> (${HH.Board.myLabel()}). Every run you finish posts its score.` : 'Every run you finish posts its score to the Lagos Life leaderboard.' };
    }
    if (mine) return { info, label: 'Practice run', note: `Your ranked score today: <b>${mine.score}</b> (#${HH.Board.rankOf(mine.id)}). Come back tomorrow for a new seed.` };
    if (HH.Daily.hasStarted(info.date)) return { info, label: 'Practice run', note: 'You already used today’s ranked attempt on this device.' };
    return { info, label: 'Play today’s run', note: 'Your first run today is the one that counts.' };
  }

  function boardHtml() {
    const B = HH.Board;
    if (B.state === 'loading') return '<p class="muted small board-msg">Loading today’s board…</p>';
    if (B.state === 'off') return '<p class="muted small board-msg">The shared leaderboard isn’t available here. You can still play the daily run.</p>';
    const list = B.entries;
    if (!list.length) return `<p class="muted small board-msg">${B.kind === 'world' ? 'No scores yet. Finish a run to put your name on the board.' : 'Nobody has posted today yet. Be the first name on the board.'}</p>`;
    const top = list.slice(0, 10);
    const mine = B.myEntry();
    const row = (e, i) => `<li class="${e.id === B.uid ? 'me' : ''}"><span class="rk">${e.label || e.rank || i + 1}</span><span class="nm"></span><span class="ch" title="${D.CHARACTERS[e.char] ? D.CHARACTERS[e.char].name : ''}">${CHAR_ICON[e.char] || ''}</span><span class="sc">${e.won ? '🏆 ' : ''}${e.score}</span></li>`;
    let html = `<ol class="board-list">${top.map(row).join('')}</ol>`;
    if (mine && !top.some((e) => e.id === mine.id)) html += `<ol class="board-list mine">${row(mine, 0)}</ol>`;
    return html;
  }

  function paintBoard(root) {
    const el = root.querySelector('#daily-board');
    if (!el) return;
    el.innerHTML = `<p class="section-label">${HH.Board.kind === 'world' ? 'Lagos Life top hustlers' : 'Today’s top hustlers'}</p>${boardHtml()}`;
    // Names are user-set text: always via textContent
    const top = HH.Board.entries.slice(0, 10);
    const mine = HH.Board.myEntry();
    const shown = top.concat(mine && !top.some((e) => e.id === mine.id) ? [mine] : []);
    el.querySelectorAll('.board-list li .nm').forEach((n, i) => { const e = shown[i]; if (e) n.textContent = HH.Board.nameOf(e.id); });
    const st = dailyStatus();
    const btn = root.querySelector('[data-act="daily"]');
    if (btn) btn.textContent = st.label;
    const note = root.querySelector('#daily-note');
    if (note) note.innerHTML = st.note;
    const hello = root.querySelector('#hello');
    const p = HH.Platform.player;
    if (hello && p && p.name) { hello.textContent = `Welcome back, ${p.name}.`; hello.hidden = false; }
  }

  function enter(root) {
    const App = HH.App;
    const meta = HH.Run.meta();
    const saved = HH.Run.load();
    const unlocked = meta.unlocked[state.char] || 0;
    if (state.wahala > unlocked) state.wahala = unlocked;

    root.innerHTML = `
      <div class="title-bg">${HH.Art.stage('lekki')}</div>
      <div class="title-wrap">
        <header class="logo">
          <h1><span class="logo-a">Hustle</span><span class="logo-amp">&amp;</span><span class="logo-b">Hype</span></h1>
          <p class="logo-sub">A Lagos deckbuilder. Survive the city. Beat Sapa.</p>
          <p class="logo-hello" id="hello" hidden></p>
        </header>

        ${saved ? `<div class="continue-card">
            <span>${HH.Art.character(D.CHARACTERS[saved.char].art)}</span>
            <div><strong>Run in progress</strong><p class="muted">${D.CHARACTERS[saved.char].name} · Act ${saved.act + 1} · ${saved.hp}/${saved.maxHp} HP · ₦${saved.gold}</p></div>
            <button class="btn btn-primary" data-act="continue">Continue</button>
          </div>` : ''}

        ${(() => {
          const st = dailyStatus();
          const ch = D.CHARACTERS[st.info.char];
          const pretty = new Date(st.info.date + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
          return `<section class="daily" aria-label="Daily Hustle">
            <div class="daily-main">
              <p class="eyebrow">Daily Hustle · ${pretty}</p>
              <h2 class="daily-title">Same seed for everybody</h2>
              <div class="daily-info">
                <span class="daily-portrait">${HH.Art.character(ch.art)}</span>
                <div class="daily-text">
                  <b>${ch.name}</b>
                  <span><b class="twist">${st.info.twist.name}:</b> ${st.info.twist.desc}</span>
                  <span class="muted small">Same map, fights and rewards for every player.</span>
                </div>
              </div>
              <button class="btn btn-primary" data-act="daily">${st.label}</button>
              <p class="daily-note small muted" id="daily-note">${st.note}</p>
            </div>
            <div class="daily-board" id="daily-board"></div>
          </section>`;
        })()}

        <section class="pick" aria-label="Choose your hustler">
          <h2 class="section-label">Choose your hustler</h2>
          <div class="char-row">
            ${Object.values(D.CHARACTERS).map((c) => `
              <button class="char-card ${state.char === c.id ? 'selected' : ''}" data-char="${c.id}" aria-pressed="${state.char === c.id}">
                <span class="char-art">${HH.Art.character(c.art)}</span>
                <span class="char-info">
                  <span class="char-name">${c.name}</span>
                  <span class="char-tag">${c.tagline}</span>
                  <span class="char-style">${c.style}</span>
                  <span class="char-blurb">${c.blurb}</span>
                  <span class="char-meta">❤ ${c.maxHp} · ${D.RELICS[c.relic].icon} ${D.RELICS[c.relic].name}</span>
                  ${meta.best[c.id] ? `<span class="char-best">Best: Act ${meta.best[c.id].act}${meta.best[c.id].won ? ' · Beat Sapa' : ''}</span>` : ''}
                </span>
              </button>`).join('')}
          </div>
        </section>

        <section class="setup">
          <div class="wahala">
            <h2 class="section-label">Wahala level</h2>
            <div class="wahala-row" role="radiogroup" aria-label="Wahala level">
              ${D.WAHALA.map((w) => {
                const locked = w.level > unlocked;
                return `<button class="wahala-btn ${state.wahala === w.level ? 'on' : ''}" role="radio" aria-checked="${state.wahala === w.level}" data-wahala="${w.level}" ${locked ? 'disabled' : ''} data-tip="${locked ? 'Win at the level below to unlock.' : w.desc}">${locked ? '🔒' : w.level}</button>`;
              }).join('')}
            </div>
            <p class="wahala-desc"><b>${D.WAHALA[state.wahala].name}</b> · ${state.wahala ? 'Includes every level below. ' + D.WAHALA[state.wahala].desc : D.WAHALA[0].desc}</p>
          </div>
          <div class="seed">
            <label class="section-label" for="seed-input">Seed (optional)</label>
            <input id="seed-input" class="input" placeholder="e.g. JOLLOF-1234" maxlength="24" autocomplete="off">
          </div>
          <button class="btn btn-primary btn-big" data-act="start">${saved ? 'Start new run' : 'Start hustling'}</button>
          ${saved ? '<p class="muted small center">Starting a new run replaces your saved one.</p>' : ''}
        </section>

        <footer class="title-foot">
          <span>Runs ${meta.runs} · Wins ${meta.wins}</span>
          <span class="foot-actions"><button class="link-btn" data-act="sound">${App.settings.sfx || App.settings.music ? '🔊 Sound on' : '🔇 Sound off'}</button><button class="link-btn" data-act="howto">How to play</button></span>
        </footer>
      </div>`;

    paintBoard(root);
    if (stopBoard) stopBoard();
    stopBoard = HH.Board.onChange(() => paintBoard(root));

    root.onclick = async (e) => {
      const c = e.target.closest('[data-char]');
      if (c) { state.char = c.dataset.char; enter(root); return; }
      const w = e.target.closest('[data-wahala]');
      if (w && !w.disabled) { state.wahala = Number(w.dataset.wahala); enter(root); return; }
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'continue') App.continueRun();
      if (a.dataset.act === 'daily') {
        if (saved) {
          const yes = await App.confirm('You have a run in progress. Starting the daily run will abandon it.', 'Start daily');
          if (!yes) return;
          HH.Run.abandon(saved);
        }
        App.startDaily();
      }
      if (a.dataset.act === 'start') {
        if (saved) {
          const yes = await App.confirm('You have a run in progress. Starting a new one will abandon it.', 'Start new');
          if (!yes) return;
          HH.Run.abandon(saved);
        }
        App.startRun(state.char, state.wahala, root.querySelector('#seed-input').value);
      }
      if (a.dataset.act === 'howto') howTo();
      if (a.dataset.act === 'sound') { App.toggleSound(); enter(root); }
    };
  }

  function howTo() {
    HH.App.modal(`
      <ol class="howto">
        <li><b>Pick a path.</b> Each act is a map of Lagos. Choose fights, events, shops (Computer Village) and Bukas (rest stops), then beat the boss.</li>
        <li><b>Spend Ginger.</b> You get 3 Ginger a turn. Cards cost Ginger. Unused Ginger is lost.</li>
        <li><b>Read the intent.</b> The bubble over each enemy shows exactly what it will do next. Plan around it.</li>
        <li><b>Vibe Check</b> blocks Gbese (damage) and resets every turn.</li>
        <li><b>Build combos.</b> Tech Bro stacks Hype and cashes it in. Mama Put writes Interest that hurts every turn. The Creator gathers Followers who act at the end of each turn, but they unfollow when she takes a hit.</li>
        <li><b>Grow your deck.</b> Take card rewards, upgrade at Bukas, remove weak cards, collect Gadgets.</li>
        <li><b>Beat Sapa</b> at the end of Act 3 to win, then raise the Wahala level.</li>
      </ol>
      <p class="muted">Desktop: keys 1–9 pick a card, E ends the turn, Esc cancels. Mobile: tap a card to lift it, tap again (or tap an enemy) to play. Long-press a card for keyword help.</p>`, { title: 'How to play', wide: true });
  }

  function leave() { if (stopBoard) stopBoard(); stopBoard = null; }

  return { enter, leave };
})();
