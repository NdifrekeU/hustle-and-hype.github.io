/* =========================================================================
   ui/app.js — the app shell: routes `run.screen` to a screen renderer,
   owns the HUD, modals, card pickers, tooltips, toasts and settings.
   ========================================================================= */
window.HH = window.HH || {};
HH.Screens = HH.Screens || {};

HH.App = (function () {
  const D = HH.Data;
  const App = {
    run: null,
    combat: null,
    settings: { fast: false, sfx: true, music: true },
    canHover: window.matchMedia('(hover: hover)').matches
  };
  let els = {};
  let current = null;

  /* ---------------- boot ---------------- */
  App.init = function () {
    els = {
      app: document.getElementById('app'),
      hud: document.getElementById('hud'),
      screen: document.getElementById('screen'),
      modal: document.getElementById('modal-root'),
      tooltip: document.getElementById('tooltip'),
      toast: document.getElementById('toast')
    };
    try { Object.assign(App.settings, JSON.parse(localStorage.getItem('hh-settings') || '{}')); } catch (e) { /* ignore */ }
    initTooltips();
    // Soft click for every button except cards (cards have their own sounds)
    document.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b && !b.disabled && !b.classList.contains('card')) HH.Audio.play('ui');
    }, true);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && els.modal.firstElementChild) {
        const closeBtn = els.modal.querySelector('[data-modal-close]');
        if (closeBtn) closeBtn.click();
      }
    });
    HH.Board.init();
    initPause();
    App.go('title');
  };

  /* Lagos Life can pause the game (app backgrounded, menu opened…):
     stop sound, freeze enemy turns, block input until it resumes. */
  function initPause() {
    const overlay = document.createElement('div');
    overlay.className = 'pause-overlay';
    overlay.hidden = true;
    overlay.setAttribute('role', 'status');
    overlay.innerHTML = '<div class="pause-box"><span>⏸</span><strong>Paused</strong><p>Your hustle is waiting.</p></div>';
    document.body.appendChild(overlay);
    HH.Platform.onPause(() => { overlay.hidden = false; HH.Audio.suspend(); });
    HH.Platform.onResume(() => { overlay.hidden = true; HH.Audio.resume(); });
  }

  /* ---------------- routing ---------------- */
  App.go = function (name) {
    if (current && HH.Screens[current] && HH.Screens[current].leave) HH.Screens[current].leave();
    current = name;
    hideTooltip();
    els.screen.className = 'screen screen--' + name;
    els.screen.innerHTML = '';
    const showHud = App.run && !['title', 'end'].includes(name);
    els.hud.hidden = !showHud;
    if (showHud) HH.HUD.render();
    HH.Screens[name].enter(els.screen);
    const boss = App.run && App.run.combatInfo && App.run.combatInfo.tier === 'boss';
    HH.Audio.setMode(name === 'combat' ? (boss ? 'boss' : 'fight') : 'calm');
    els.screen.classList.add('screen-enter');
    els.screen.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  /* Re-route according to the run's screen */
  App.sync = function () {
    if (!App.run) return App.go('title');
    App.go(App.run.screen);
  };

  App.refreshHud = function () { if (!els.hud.hidden) HH.HUD.render(); };

  App.startRun = function (charId, wahala, seed, opts) {
    App.run = HH.Run.newRun(charId, wahala, seed, opts);
    HH.Run.save(App.run);
    App.sync();
  };

  /* Today's shared run. The first daily you start each day is ranked. */
  App.startDaily = function () {
    const info = HH.Daily.info();
    const world = HH.Board.kind === 'world';
    const ranked = world || (!HH.Daily.hasStarted(info.date) && !HH.Board.myEntry());
    HH.Daily.markStarted(info.date);
    App.startRun(info.char, 0, info.seed, { daily: { date: info.date, twist: info.twist.id, ranked } });
    App.toast(world ? 'Daily run started. Good luck!' : ranked ? 'Ranked daily run started. Good luck!' : 'Practice run: this one won’t be posted.');
  };

  App.continueRun = function () {
    const run = HH.Run.load();
    if (!run) return;
    App.run = run;
    App.sync();
  };

  App.saveSettings = function () {
    try { localStorage.setItem('hh-settings', JSON.stringify(App.settings)); } catch (e) { /* ignore */ }
    HH.Audio.applySettings();
  };

  App.toggleSound = function () {
    const on = !(App.settings.sfx || App.settings.music);
    App.settings.sfx = on;
    App.settings.music = on;
    App.saveSettings();
    return on;
  };

  App.speed = (ms) => (App.settings.fast ? Math.round(ms * 0.45) : ms);

  /* ---------------- toast ---------------- */
  let toastTimer;
  App.toast = function (msg, kind) {
    els.toast.textContent = msg;
    els.toast.className = 'toast ' + (kind || '');
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (els.toast.hidden = true), 2600);
  };

  /* ---------------- modal ---------------- */
  App.modal = function (inner, opts) {
    opts = opts || {};
    els.modal.innerHTML = `<div class="modal-backdrop" data-modal-backdrop>
        <div class="modal ${opts.wide ? 'modal--wide' : ''}" role="dialog" aria-modal="true" aria-label="${opts.label || 'Dialog'}">
          ${opts.title ? `<header class="modal-head"><h2>${opts.title}</h2>${opts.noClose ? '' : '<button class="icon-btn" data-modal-close aria-label="Close">✕</button>'}</header>` : ''}
          <div class="modal-body">${inner}</div>
        </div></div>`;
    const root = els.modal.firstElementChild;
    root.addEventListener('click', (e) => {
      if ((e.target === root && !opts.noClose) || e.target.closest('[data-modal-close]')) {
        App.closeModal();
        if (opts.onClose) opts.onClose();
      }
    });
    const focusable = root.querySelector('button, [tabindex]');
    if (focusable) setTimeout(() => focusable.focus(), 30);
    return root;
  };

  App.closeModal = function () { els.modal.innerHTML = ''; hideTooltip(); };

  /* ---------------- deck viewer ---------------- */
  App.showDeck = function (cards, title, opts) {
    opts = opts || {};
    const list = cards.slice().sort((a, b) => {
      const da = D.CARDS[a.id], db = D.CARDS[b.id];
      const order = { attack: 0, skill: 1, power: 2, status: 3, curse: 4 };
      return order[da.type] - order[db.type] || da.name.localeCompare(db.name);
    });
    const body = list.length
      ? `<div class="card-grid">${list.map((c) => HH.CardView.html(c, { flavor: false })).join('')}</div>`
      : '<p class="muted center">Nothing dey here.</p>';
    App.modal(body, { title: `${title} <small>${cards.length}</small>`, wide: true });
  };

  /* ---------------- card pickers (Promise based) ---------------- */
  App.pickCard = function (mode) {
    const run = App.run;
    const titles = { upgrade: 'Upskill: choose a card to upgrade', remove: 'Choose a card to remove', transform: 'Choose a card to transform' };
    const cards = run.deck.filter((c) => (mode === 'upgrade' ? HH.Run.canUpgrade(c) : true));
    return new Promise((resolve) => {
      if (!cards.length) { App.toast('No cards available.'); resolve(null); return; }
      const body = `<p class="muted">${mode === 'upgrade' ? 'Upgraded values are shown in green.' : 'Tap a card to choose it.'}</p>
        <div class="card-grid">${cards.map((c) => HH.CardView.html(mode === 'upgrade' ? { id: c.id, up: true } : c, { tag: 'button', attrs: `data-pick="${c.uid}"`, flavor: false })).join('')}</div>`;
      const root = App.modal(body, { title: titles[mode], wide: true, onClose: () => resolve(null) });
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-pick]');
        if (!btn) return;
        const uid = Number(btn.dataset.pick);
        let name = null;
        if (mode === 'upgrade') name = HH.Run.upgradeCard(run, uid);
        if (mode === 'remove') name = HH.Run.removeCard(run, uid);
        if (mode === 'transform') name = HH.Run.transformCard(run, uid);
        App.closeModal();
        App.refreshHud();
        resolve(name);
      });
    });
  };

  /* Choose one of several card ids (or skip) → adds to deck */
  App.chooseCard = function (choices, title) {
    return new Promise((resolve) => {
      const body = `<div class="card-row">${choices.map((id) => HH.CardView.html({ id, up: false }, { tag: 'button', attrs: `data-choose="${id}"` })).join('')}</div>
        <div class="center"><button class="btn btn-ghost" data-modal-close>Skip</button></div>`;
      const root = App.modal(body, { title: title || 'Choose a card', wide: true, onClose: () => resolve(null) });
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-choose]');
        if (!btn) return;
        HH.Run.addCard(App.run, btn.dataset.choose);
        App.closeModal();
        App.refreshHud();
        resolve(D.CARDS[btn.dataset.choose].name);
      });
    });
  };

  App.confirm = function (message, yesLabel) {
    return new Promise((resolve) => {
      const root = App.modal(`<p>${message}</p><div class="btn-row"><button class="btn btn-ghost" data-no>Cancel</button><button class="btn btn-danger" data-yes>${yesLabel || 'Yes'}</button></div>`, { title: 'Are you sure?', onClose: () => resolve(false) });
      root.querySelector('[data-yes]').onclick = () => { App.closeModal(); resolve(true); };
      root.querySelector('[data-no]').onclick = () => { App.closeModal(); resolve(false); };
    });
  };

  /* ---------------- tooltips ---------------- */
  function tipContent(el) {
    if (el.dataset.tipRelic) {
      const r = D.RELICS[el.dataset.tipRelic];
      return `<strong>${r.icon} ${r.name}</strong><span class="tip-rarity">${r.rarity}</span><p>${r.desc}</p><p class="muted"><em>${r.flavor || ''}</em></p>`;
    }
    if (el.dataset.tipStatus) {
      const s = D.STATUSES[el.dataset.tipStatus];
      const n = el.dataset.n || 'X';
      return `<strong>${s.icon} ${s.name}</strong><p>${s.desc.replace(/\{n\}/g, n)}</p>`;
    }
    if (el.dataset.tipSachet) {
      const s = D.SACHETS[el.dataset.tipSachet];
      return `<strong>${s.icon} ${s.name}</strong><p>${s.desc}</p><p class="muted">${s.anywhere ? 'Usable anytime.' : 'Use during a fight.'}</p>`;
    }
    if (el.dataset.kws) {
      const kws = el.dataset.kws.split('|').filter(Boolean);
      if (!kws.length) return '';
      return kws.map((k) => `<p><strong>${k}</strong> · ${D.KEYWORDS[k]}</p>`).join('');
    }
    if (el.dataset.tip) return el.dataset.tip;
    return '';
  }

  let tipTarget = null;
  let pressTimer = null;
  function showTooltip(el) {
    const html = tipContent(el);
    if (!html) return hideTooltip();
    tipTarget = el;
    const tt = els.tooltip;
    tt.innerHTML = html;
    tt.hidden = false;
    const r = el.getBoundingClientRect();
    const tw = tt.offsetWidth;
    const th = tt.offsetHeight;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(8, Math.min(window.innerWidth - tw - 8, left));
    let top = r.top - th - 10;
    if (top < 8) top = r.bottom + 10;
    if (el.classList.contains('card') && r.top - th - 10 < 8) { top = Math.max(8, r.top - th - 10); }
    tt.style.left = left + 'px';
    tt.style.top = Math.max(8, top) + 'px';
  }
  function hideTooltip() { tipTarget = null; if (els.tooltip) els.tooltip.hidden = true; }
  App.hideTooltip = hideTooltip;

  const TIP_SEL = '[data-tip], [data-tip-relic], [data-tip-status], [data-tip-sachet], .card[data-kws]:not([data-kws=""])';
  function initTooltips() {
    document.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const el = e.target.closest(TIP_SEL);
      if (el && el !== tipTarget) showTooltip(el);
      else if (!el) hideTooltip();
    });
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      const el = e.target.closest(TIP_SEL);
      clearTimeout(pressTimer);
      if (!el) { hideTooltip(); return; }
      // Status, relic and sachet chips explain on tap; cards on long-press
      if (!el.classList.contains('card') && !el.matches('[data-tip-sachet]')) { showTooltip(el); return; }
      pressTimer = setTimeout(() => showTooltip(el), 420);
    });
    document.addEventListener('pointerup', () => clearTimeout(pressTimer));
    document.addEventListener('scroll', hideTooltip, true);
  }

  return App;
})();
