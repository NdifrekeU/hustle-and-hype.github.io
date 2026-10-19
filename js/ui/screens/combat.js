/* =========================================================================
   screens/combat.js — the fight screen. Builds the layout once, then
   updates units in place (so animations aren't cut off) and redraws the
   hand. Input: tap/click cards, tap enemies to target, keys 1–9/E/Esc.
   ========================================================================= */
HH.Screens.combat = (function () {
  const D = HH.Data;
  let g = null;
  let root = null;
  let units = {};
  let ui = { selected: null, hover: null };
  let onKey = null;
  let onResize = null;
  let ended = false;

  /* ---------------- lifecycle ---------------- */
  function enter(r) {
    const App = HH.App;
    const run = App.run;
    root = r;
    units = {};
    ui = { selected: null, hover: null };
    ended = false;

    g = new HH.Combat(run, run.combatInfo.enemies, run.combatInfo.tier);
    App.combat = g;
    g.wait = (ms) => HH.Platform.sleep(App.speed(ms)); // freezes while Lagos Life has us paused
    g.onChange = update;
    g.onEnd = onEnd;

    build(run);
    g.start();

    onKey = (e) => handleKey(e);
    onResize = () => layoutHand();
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
  }

  function leave() {
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  }

  function build(run) {
    const act = D.ACTS[run.act];
    const tier = run.combatInfo.tier;
    root.innerHTML = `
      <div class="stage">${HH.Art.stage(act.stage)}</div>
      ${tier !== 'normal' ? `<div class="tier-banner tier-${tier}">${tier === 'boss' ? 'BOSS FIGHT' : 'WAHALA · ELITE'}</div>` : ''}
      <div class="battlefield">
        <div class="side side--player" id="side-player"></div>
        <div class="side side--enemies" id="side-enemies"></div>
      </div>
      <div class="target-hint" id="target-hint" hidden>Choose a target <button class="link-btn" data-cancel>Cancel</button></div>
      <div class="ticker" id="ticker" role="status" aria-live="polite"></div>
      <div class="dock">
        <div class="dock-left">
          <div class="ginger-orb" id="ginger-orb" data-tip="Ginger: spend it to play cards. Refills each turn."><b id="ginger-n">3</b><small>/<span id="ginger-max">3</span></small><em>Ginger</em></div>
          <button class="pile-btn" data-pile="draw" data-tip="Draw pile"><span>🂠</span><b id="pile-draw">0</b></button>
        </div>
        <div class="hand" id="hand" aria-label="Your hand"></div>
        <div class="dock-right">
          <button class="btn btn-end" id="end-turn">End Turn</button>
          <div class="pile-row">
            <button class="pile-btn" data-pile="discard" data-tip="Discard pile"><span>🗑️</span><b id="pile-discard">0</b></button>
            <button class="pile-btn" data-pile="exhaust" data-tip="Exhausted cards"><span>🔥</span><b id="pile-exhaust">0</b></button>
            <button class="pile-btn" data-log data-tip="Fight log"><span>💬</span></button>
          </div>
        </div>
      </div>`;

    root.querySelector('#hand').addEventListener('click', onHandClick);
    root.querySelector('#side-enemies').addEventListener('click', onEnemyClick);
    root.querySelector('#side-enemies').addEventListener('pointerover', (e) => {
      const u = e.target.closest('.unit');
      const uid = u ? u.dataset.uid : null;
      if (uid !== ui.hover) { ui.hover = uid; if (ui.selected) renderHand(); }
    });
    root.querySelector('#end-turn').addEventListener('click', endTurn);
    root.querySelector('#target-hint').addEventListener('click', (e) => { if (e.target.closest('[data-cancel]')) select(null); });
    root.querySelector('.dock').addEventListener('click', (e) => {
      const p = e.target.closest('[data-pile]');
      if (p) {
        const names = { draw: 'Draw pile (order hidden)', discard: 'Discard pile', exhaust: 'Exhausted' };
        HH.App.showDeck(g.piles[p.dataset.pile], names[p.dataset.pile]);
      }
      if (e.target.closest('[data-log]')) showLog();
    });
    root.querySelector('.battlefield').addEventListener('click', (e) => {
      if (!e.target.closest('.unit--enemy') && ui.selected) select(null);
    });
  }

  /* ---------------- rendering ---------------- */
  function update() {
    if (!g) return;
    syncUnits();
    renderHand();
    const orb = root.querySelector('#ginger-orb');
    root.querySelector('#ginger-n').textContent = g.ginger;
    root.querySelector('#ginger-max').textContent = 3 + g.relicSum('gingerPerTurn');
    orb.classList.toggle('empty', g.ginger === 0);
    root.querySelector('#pile-draw').textContent = g.piles.draw.length;
    root.querySelector('#pile-discard').textContent = g.piles.discard.length;
    root.querySelector('#pile-exhaust').textContent = g.piles.exhaust.length;
    const endBtn = root.querySelector('#end-turn');
    endBtn.disabled = g.phase !== 'player';
    endBtn.textContent = g.phase === 'enemy' ? 'Enemy turn…' : 'End Turn';
    endBtn.classList.toggle('nudge', g.phase === 'player' && !g.piles.hand.some((c) => g.canPlay(c)));
    root.classList.toggle('enemy-phase', g.phase === 'enemy');
    const msg = g.messages[0];
    root.querySelector('#ticker').innerHTML = msg ? `<span class="log-${msg.kind}">${msg.text}</span>` : '';
    HH.App.refreshHud();
    playEvents();
  }

  function syncUnits() {
    const pSide = root.querySelector('#side-player');
    const eSide = root.querySelector('#side-enemies');
    if (!units.p) {
      units.p = makeUnit(g.player, D.CHARACTERS[HH.App.run.char].art, false);
      pSide.appendChild(units.p);
    }
    updateUnit(units.p, g.player);
    renderFollowers();
    g.enemies.forEach((e, i) => {
      if (!units[e.uid]) {
        const def = D.ENEMIES[e.id];
        units[e.uid] = makeUnit(e, def.art, true);
        units[e.uid].style.setProperty('--size', e.size);
        eSide.appendChild(units[e.uid]);
        if (e.summoned) HH.FX.pulse(units[e.uid], 'spawn-in', 600);
      }
      updateUnit(units[e.uid], e, i);
    });
    eSide.dataset.count = g.alive().length;
  }

  function renderFollowers() {
    const box = units.p.querySelector('.followers');
    const show = HH.App.run.char === 'creator' || g.followers.length > 0;
    box.hidden = !show;
    if (!show) return;
    const r = g.reach();
    let html = g.followers.map((f) => {
      const def = D.FOLLOWERS[f.type];
      return `<span class="follower" data-fuid="${f.uid}" style="--fc:${def.color}" tabindex="0"
        data-tip="<strong>${def.icon} ${def.name}</strong><p>${def.desc(r)}</p>"><span class="follower-face">${HH.Art.character(def.art)}</span><i>${def.icon}</i></span>`;
    }).join('');
    for (let i = g.followers.length; i < g.followerSlots(); i++) html += '<span class="follower empty" data-tip="Empty Follower slot."></span>';
    box.innerHTML = html;
  }

  function makeUnit(c, art, isEnemy) {
    const el = document.createElement('div');
    el.className = 'unit ' + (isEnemy ? 'unit--enemy unit-tier-' + c.tier : 'unit--player');
    el.dataset.uid = c.uid;
    el.innerHTML = `
      ${isEnemy ? '<div class="intent" data-tip=""></div>' : '<div class="followers" aria-label="Followers" hidden></div>'}
      <div class="unit-art">${HH.Art.character(art, { flip: isEnemy })}</div>
      <div class="unit-info">
        <div class="unit-name">${c.name}</div>
        <div class="hpbar"><div class="hpbar-fill"></div><div class="hpbar-ghost"></div><span class="hpbar-text"></span><span class="block-badge" hidden></span></div>
        <div class="statuses"></div>
      </div>
      ${isEnemy ? '<span class="target-key"></span>' : ''}`;
    if (isEnemy) {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '-1');
    }
    return el;
  }

  function updateUnit(el, c, index) {
    const pct = Math.max(0, (c.hp / c.maxHp) * 100);
    const fill = el.querySelector('.hpbar-fill');
    const ghost = el.querySelector('.hpbar-ghost');
    fill.style.width = pct + '%';
    setTimeout(() => (ghost.style.width = pct + '%'), 350);
    fill.classList.toggle('low', pct <= 30);
    el.querySelector('.hpbar-text').textContent = `${c.hp}/${c.maxHp}`;
    const block = el.querySelector('.block-badge');
    block.hidden = c.block <= 0;
    block.textContent = c.block;
    el.classList.toggle('has-block', c.block > 0);

    el.querySelector('.statuses').innerHTML = Object.keys(c.statuses).map((id) => {
      const def = D.STATUSES[id];
      const n = c.statuses[id];
      return `<span class="status-chip kind-${def.kind} ${id === 'hype' ? 'is-hype' : ''}" data-tip-status="${id}" data-n="${n}" tabindex="0">${def.icon}<b>${n}</b></span>`;
    }).join('');

    if (!c.isPlayer) {
      el.classList.toggle('dead', c.dead);
      el.setAttribute('aria-label', `${c.name}, ${c.hp} of ${c.maxHp} HP${c.block ? ', ' + c.block + ' Vibe Check' : ''}`);
      const intentEl = el.querySelector('.intent');
      const it = g.intentOf(c);
      if (!it || c.dead) { intentEl.hidden = true; }
      else {
        intentEl.hidden = false;
        intentEl.classList.toggle('acting', g.phase === 'enemy');
        intentEl.innerHTML = intentHtml(it);
        intentEl.dataset.tip = intentTip(it);
      }
      const targeting = ui.selected && !c.dead;
      el.classList.toggle('targetable', !!targeting);
      const alive = g.alive();
      el.querySelector('.target-key').textContent = targeting ? alive.indexOf(c) + 1 : '';
    }
  }

  function intentHtml(it) {
    if (it.hidden) return '<span class="intent-item">❓</span>';
    return `<span class="intent-name">${it.name}</span><span class="intent-items">${it.items.map((i) => {
      switch (i.type) {
        case 'attack': return `<span class="intent-item attack">⚔️ ${i.value}${i.hits > 1 ? '×' + i.hits : ''}</span>`;
        case 'block': return `<span class="intent-item block">🛡️ ${i.value}</span>`;
        case 'buff': return '<span class="intent-item buff">⬆️</span>';
        case 'debuff': return `<span class="intent-item debuff">${i.steal ? '💸' : '💢'}</span>`;
        case 'summon': return '<span class="intent-item summon">📣</span>';
        case 'heal': return `<span class="intent-item heal">➕${i.value}</span>`;
        default: return '<span class="intent-item">✨</span>';
      }
    }).join('')}</span>`;
  }

  function intentTip(it) {
    if (it.hidden) return 'Your Starlink Dish hides enemy intents.';
    const parts = it.items.map((i) => {
      switch (i.type) {
        case 'attack': return `Attacks for <b>${i.value}</b>${i.hits > 1 ? ` × ${i.hits} (${i.value * i.hits} total)` : ''}.`;
        case 'block': return `Gains <b>${i.value}</b> Vibe Check.`;
        case 'buff': return 'Powers itself up.';
        case 'debuff': return i.steal ? `Takes up to ₦${i.steal} and makes trouble.` : 'Debuffs you or clogs your deck.';
        case 'summon': return 'Calls for backup.';
        case 'heal': return `Heals <b>${i.value}</b> HP.`;
        default: return 'Something unusual.';
      }
    });
    return `<strong>${it.name}</strong><p>${parts.join(' ')}</p>`;
  }

  function renderHand() {
    const hand = root.querySelector('#hand');
    const alive = g.alive();
    const hoverEnemy = ui.hover && g.enemies.find((e) => e.uid === ui.hover && !e.dead);
    const target = hoverEnemy || (alive.length === 1 ? alive[0] : null);
    const prev = new Set(Array.from(hand.children).map((c) => Number(c.dataset.uid)));
    hand.innerHTML = g.piles.hand.map((card, i) => {
      const playable = g.canPlay(card);
      const cls = [playable ? 'playable' : 'unplayable', ui.selected === card.uid ? 'selected' : ''].join(' ');
      return HH.CardView.html(card, {
        combat: g, target, tag: 'button', cls, flavor: false,
        attrs: `data-uid="${card.uid}" data-key="${i + 1}" ${g.phase !== 'player' ? 'disabled' : ''}`
      });
    }).join('');
    layoutHand();
    // New cards deal in from the draw pile, one after another
    const drawBtn = root.querySelector('[data-pile="draw"]');
    let k = 0;
    Array.from(hand.children).forEach((c) => {
      if (prev.has(Number(c.dataset.uid))) return;
      const st = c.style;
      HH.FX.dealIn(c, drawBtn, `translate(${st.getPropertyValue('--x')}, ${st.getPropertyValue('--y')}) rotate(${st.getPropertyValue('--r')})`, k * 75);
      setTimeout(() => HH.Audio.play('draw'), k * 75);
      k++;
    });
    const hint = root.querySelector('#target-hint');
    hint.hidden = !ui.selected || !needsPick(ui.selected);
    root.classList.toggle('targeting', !!ui.selected && needsPick(ui.selected));
  }

  /* Fan the cards: overlap to fit, slight arc */
  function layoutHand() {
    const hand = root && root.querySelector('#hand');
    if (!hand) return;
    const cards = Array.from(hand.children);
    const n = cards.length;
    if (!n) return;
    const pad = 16;
    const W = hand.clientWidth - pad * 2;
    const cw = cards[0].offsetWidth;
    const step = n > 1 ? Math.min(cw * 0.94, (W - cw) / (n - 1)) : 0;
    const total = cw + step * (n - 1);
    const start = pad + Math.max(0, (W - total) / 2);
    const mid = (n - 1) / 2;
    const spread = n > 1 ? Math.min(5, 26 / n) : 0;
    cards.forEach((c, i) => {
      const off = i - mid;
      c.style.setProperty('--x', start + i * step + 'px');
      c.style.setProperty('--y', Math.abs(off) * Math.abs(off) * 1.8 + 'px');
      c.style.setProperty('--r', off * spread + 'deg');
      c.style.zIndex = ui.selected === Number(c.dataset.uid) ? 60 : i + 1;
    });
  }

  /* ---------------- input ---------------- */
  function needsPick(uid) {
    const card = g.piles.hand.find((c) => c.uid === uid);
    return card && g.needsTarget(card) && g.alive().length > 1;
  }

  function select(uid) {
    ui.selected = uid;
    HH.App.hideTooltip();
    renderHand();
    syncUnits();
  }

  function tryCard(uid, viaKey) {
    if (g.phase !== 'player') return;
    const card = g.piles.hand.find((c) => c.uid === uid);
    if (!card) return;
    if (!g.canPlay(card)) { g.playCard(uid); return; } // shows the reason
    const pick = needsPick(uid);
    if (ui.selected === uid) {
      if (pick) select(null);
      else play(uid);
      return;
    }
    if (pick || (!HH.App.canHover && !viaKey)) { select(uid); return; }
    play(uid);
  }

  function play(uid, targetUid) {
    const el = root.querySelector(`#hand .card[data-uid="${uid}"]`);
    const card = g.piles.hand.find((c) => c.uid === uid);
    const def = card && g.def(card);
    const gh = HH.FX.ghost(el);
    ui.selected = null;
    ui.hover = null;
    const ok = g.playCard(uid, targetUid);
    if (!ok || !def) { if (gh) gh.remove(); return; }
    let target;
    if (def.target === 'enemy') target = g.lastTarget && units[g.lastTarget.uid];
    else if (def.target === 'all' || def.target === 'random') target = root.querySelector('#side-enemies');
    else target = units.p;
    if (target && target.querySelector('.unit-art')) target = target.querySelector('.unit-art');
    HH.FX.fly(gh, target, def.type === 'power' ? 'power' : def.type === 'attack' ? 'attack' : 'skill');
    HH.Audio.play(def.type === 'power' ? 'power' : 'card');
  }

  function onHandClick(e) {
    const btn = e.target.closest('.card');
    if (!btn || btn.disabled) return;
    tryCard(Number(btn.dataset.uid));
  }

  function onEnemyClick(e) {
    const u = e.target.closest('.unit--enemy');
    if (!u || !ui.selected) return;
    const enemy = g.enemies.find((x) => x.uid === u.dataset.uid && !x.dead);
    if (!enemy) return;
    play(ui.selected, enemy.uid);
  }

  function handleKey(e) {
    if (!g || g.isOver() || document.querySelector('.modal-backdrop')) return;
    if (e.target.closest && e.target.closest('input, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === 'e') { endTurn(); return; }
    if (k === 'escape') { select(null); return; }
    const num = Number(k);
    if (num >= 1 && num <= 9) {
      if (ui.selected && needsPick(ui.selected)) {
        const t = g.alive()[num - 1];
        if (t) play(ui.selected, t.uid);
        return;
      }
      const card = g.piles.hand[num - 1];
      if (card) tryCard(card.uid, true);
    }
  }

  function endTurn() {
    if (!g || g.phase !== 'player') return;
    select(null);
    const discardBtn = root.querySelector('[data-pile="discard"]');
    let i = 0;
    root.querySelectorAll('#hand .card').forEach((el) => {
      const card = g.piles.hand.find((c) => c.uid === Number(el.dataset.uid));
      if (card && g.keys(card).includes('retain')) return;
      HH.FX.fly(HH.FX.ghost(el), discardBtn, 'discard', i++ * 40);
    });
    if (i) HH.Audio.play('swish');
    g.endTurn();
  }

  function showLog() {
    HH.App.modal(`<ol class="log-list">${g.messages.map((m) => `<li class="log-${m.kind}">${m.text}</li>`).join('')}</ol>`, { title: 'Fight log' });
  }

  /* ---------------- effects ---------------- */
  function playEvents() {
    const evs = g.events.splice(0);
    const F = HH.FX;
    evs.forEach((ev) => {
      const d = ev.data || {};
      const el = d.uid ? units[d.uid] : null;
      const A = HH.Audio;
      const fol = (uid) => root.querySelector(`[data-fuid="${uid}"]`);
      const folBox = units.p && units.p.querySelector('.followers');
      switch (ev.type) {
        case 'hit':
          if (d.hpLoss > 0) {
            F.float(el, '-' + d.hpLoss, d.big ? 'dmg big' : 'dmg'); F.pulse(el, 'hit', 450); F.burst(el, d.big ? 'big' : 'hit');
            A.play(d.uid === 'p' ? 'hurt' : d.big ? 'bigHit' : 'hit');
          } else if (d.blocked > 0) { F.float(el, 'Blocked', 'blocked'); F.pulse(el && el.querySelector('.block-badge'), 'pop'); A.play('blocked'); }
          if (d.uid === 'p' && d.hpLoss > 0) F.flash('hurt');
          if (d.big && d.hpLoss > 0) F.pulse(root, 'quake', 400);
          break;
        case 'hpLoss':
          F.float(el, '-' + d.n, d.reason === 'interest' ? 'interest' : 'dmg');
          F.pulse(el, 'hit', 400);
          A.play(d.reason === 'interest' ? 'debuff' : 'hit');
          break;
        case 'block': F.float(el, '+' + d.n, 'block'); F.pulse(el && el.querySelector('.block-badge'), 'pop'); A.play('block'); break;
        case 'heal': F.float(el, '+' + d.n, 'heal'); A.play('heal'); break;
        case 'status': {
          if (d.id === 'hype' || d.id === 'stolen' || d.n <= 0) break;
          const def = D.STATUSES[d.id];
          F.float(el, `${def.icon} ${def.name}`, def.kind === 'debuff' ? 'debuff' : 'buff');
          A.play(def.kind === 'debuff' ? 'debuff' : 'buff');
          break;
        }
        case 'hype': F.float(units.p, `+${ev.data}⚡`, 'hype'); A.play('hype'); break;
        case 'hypeSpent': F.float(units.p, `${ev.data} Hype spent!`, 'hype'); F.flash('hype'); A.play('hypeSpent'); break;
        case 'steal': F.float(units.p, `-₦${d.n}`, 'gold'); A.play('steal'); break;
        case 'gold': F.float(units.p, `+₦${ev.data}`, 'gold'); A.play('coin'); break;
        case 'enemyAct': F.pulse(el, 'lunge-left', 500); A.play('drum'); break;
        case 'cardPlayed': if (d.type === 'attack') F.pulse(units.p, 'lunge-right', 450); break;
        case 'death': if (el) el.classList.add('dying'); A.play('death'); break;
        case 'spawn': A.play('drum'); break;
        case 'follower': F.pulse(fol(d.uid), 'spawn-in', 500); A.play('follower'); break;
        case 'passive': F.pulse(fol(d.uid), 'pop', 400); A.play('passive'); break;
        case 'evoke': F.float(folBox, `${D.FOLLOWERS[d.type].icon} Cashed in!`, 'buff'); F.flash('hype'); A.play('evoke'); break;
        case 'unfollow': F.float(folBox, `💔 ${D.FOLLOWERS[d.type].name} unfollowed`, 'debuff'); A.play('unfollow'); break;
        case 'reshuffle': F.pulse(root.querySelector('[data-pile="draw"]'), 'pop'); A.play('swish'); HH.App.toast('Discard pile shuffled back into your draw pile.'); break;
        case 'nope': {
          F.pulse(root.querySelector(`.card[data-uid="${ev.data}"]`), 'nope', 400);
          const card = g.piles.hand.find((c) => c.uid === ev.data);
          if (card && g.cost(card) !== null) F.pulse(root.querySelector('#ginger-orb'), 'nope', 400);
          A.play('nope');
          break;
        }
        case 'ginger': F.pulse(root.querySelector('#ginger-orb'), 'pop'); A.play('buff'); break;
        case 'turnStart': A.play('turn'); break;
        case 'blockedDebuff': F.float(el, 'VPN!', 'block'); A.play('block'); break;
      }
    });
  }

  function onEnd(result) {
    if (ended) return;
    ended = true;
    const App = HH.App;
    HH.Audio.play(result === 'win' ? 'victory' : 'defeat');
    setTimeout(() => {
      HH.Run.finishCombat(App.run, g, result);
      App.combat = null;
      g = null;
      App.sync();
    }, App.speed(result === 'win' ? 900 : 1300));
  }

  return { enter, leave };
})();
