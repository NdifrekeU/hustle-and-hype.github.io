/* =========================================================================
   ui/hud.js — the run bar at the top: HP, ₦, act/floor, gadgets, sachets,
   deck and menu. Shown on every in-run screen.
   ========================================================================= */
window.HH = window.HH || {};

HH.HUD = (function () {
  const D = HH.Data;
  let bound = false;

  function render() {
    const App = HH.App;
    const run = App.run;
    if (!run) return;
    const el = document.getElementById('hud');
    const ch = D.CHARACTERS[run.char];
    const combat = App.combat && !App.combat.result ? App.combat : null;
    const hp = combat ? combat.player.hp : run.hp;
    const act = D.ACTS[run.act];
    const floorLabel = run.floor < 0 ? 'Start' : run.map && run.pos === 'boss' ? 'Boss' : `Floor ${run.floor + 1}`;

    el.innerHTML = `
      <div class="hud-inner">
        <div class="hud-who">
          <span class="hud-portrait">${HH.Art.character(ch.art)}</span>
          <div class="hud-stats">
            <span class="hud-name">${ch.name}${run.daily ? ` <em class="daily-pill">${run.daily.ranked ? 'DAILY' : 'PRACTICE'}</em>` : ''}${run.wahala ? ` <em class="wahala-pill">W${run.wahala}</em>` : ''}</span>
            <span class="hud-line">
              <span class="hud-hp" data-tip="Health. At 0, you don cast."><b>❤</b> ${hp}/${run.maxHp}</span>
              <span class="hud-gold" data-tip="Naira. Spend it at Computer Village."><b>₦</b>${run.gold}</span>
            </span>
          </div>
        </div>
        <div class="hud-where"><span class="hud-act">Act ${run.act + 1} · ${act.name}</span><span class="hud-floor">${floorLabel}</span></div>
        <div class="hud-relics" aria-label="Gadgets">
          ${run.relics.map((r) => `<span class="relic-chip" data-tip-relic="${r.id}" tabindex="0">${D.RELICS[r.id].icon}${r.id === 'whistle' ? `<i>${r.counter || 0}</i>` : ''}</span>`).join('')}
        </div>
        <div class="hud-actions">
          <div class="sachets" aria-label="Sachets">
            ${run.sachets.map((s, i) => s
              ? `<button class="sachet-slot ${canUse(s, combat) ? 'usable' : ''}" data-sachet="${i}" data-tip-sachet="${s}" aria-label="${D.SACHETS[s].name}">${D.SACHETS[s].icon}</button>`
              : `<span class="sachet-slot empty" data-tip="Empty sachet slot. Sachets drop after fights."></span>`).join('')}
          </div>
          <button class="hud-btn" data-hud="sound" aria-label="${App.settings.sfx || App.settings.music ? 'Mute sound' : 'Turn sound on'}" data-tip="Sound on/off">${App.settings.sfx || App.settings.music ? '🔊' : '🔇'}</button>
          <button class="hud-btn" data-hud="deck" aria-label="View deck">🂠 <span>${run.deck.length}</span></button>
          <button class="hud-btn" data-hud="menu" aria-label="Menu">☰</button>
        </div>
      </div>`;

    if (!bound) {
      bound = true;
      el.addEventListener('click', onClick);
    }
  }

  function canUse(id, combat) {
    const def = D.SACHETS[id];
    if (combat) return combat.phase === 'player';
    return !!def.anywhere;
  }

  async function onClick(e) {
    const App = HH.App;
    const run = App.run;
    const sBtn = e.target.closest('[data-sachet]');
    if (sBtn) {
      const i = Number(sBtn.dataset.sachet);
      const id = run.sachets[i];
      const def = HH.Data.SACHETS[id];
      const combat = App.combat && !App.combat.result ? App.combat : null;
      const ok = await App.confirmSachet(def, combat);
      if (!ok) return;
      if (combat) {
        if (!combat.useSachet(i)) App.toast('You can only use that on your turn.');
      } else if (!HH.Run.useSachetOutside(run, i)) {
        App.toast('Save that one for a fight.');
      } else App.toast(`Used ${def.name}.`);
      render();
      return;
    }
    const btn = e.target.closest('[data-hud]');
    if (!btn) return;
    if (btn.dataset.hud === 'deck') App.showDeck(run.deck, 'Your deck');
    if (btn.dataset.hud === 'sound') { App.toggleSound(); render(); }
    if (btn.dataset.hud === 'menu') openMenu();
  }

  function openMenu() {
    const App = HH.App;
    const run = App.run;
    const W = HH.Data.WAHALA[run.wahala];
    const root = App.modal(`
      <div class="menu-list">
        <p class="muted">Seed <b class="mono">${run.seed}</b> · Wahala ${run.wahala} (${W.name})</p>
        <label class="toggle"><input type="checkbox" id="fast-toggle" ${App.settings.fast ? 'checked' : ''}> Fast enemy turns</label>
        <label class="toggle"><input type="checkbox" id="sfx-toggle" ${App.settings.sfx ? 'checked' : ''}> Sound effects</label>
        <label class="toggle"><input type="checkbox" id="music-toggle" ${App.settings.music ? 'checked' : ''}> Music</label>
        <button class="btn btn-ghost" data-menu="glossary">Keyword glossary</button>
        <button class="btn btn-ghost" data-menu="title">Save &amp; quit to title</button>
        <button class="btn btn-danger" data-menu="abandon">Abandon run</button>
      </div>`, { title: 'Menu' });
    root.querySelector('#fast-toggle').addEventListener('change', (e) => { App.settings.fast = e.target.checked; App.saveSettings(); });
    root.querySelector('#sfx-toggle').addEventListener('change', (e) => { App.settings.sfx = e.target.checked; App.saveSettings(); render(); });
    root.querySelector('#music-toggle').addEventListener('change', (e) => { App.settings.music = e.target.checked; App.saveSettings(); render(); });
    root.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-menu]');
      if (!b) return;
      if (b.dataset.menu === 'glossary') {
        App.modal(`<dl class="glossary">${Object.entries(HH.Data.KEYWORDS).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`, { title: 'Glossary', wide: true });
      }
      if (b.dataset.menu === 'title') {
        App.closeModal();
        HH.Run.save(run);
        App.run = null; App.combat = null;
        App.go('title');
      }
      if (b.dataset.menu === 'abandon') {
        const yes = await App.confirm('This ends the run for good. Your progress will count as a loss.', 'Abandon');
        if (!yes) return;
        HH.Run.abandon(run);
        run.screen = 'end';
        App.combat = null;
        App.go('end');
      }
    });
  }

  return { render };
})();

/* Small confirm for sachets so they aren't wasted by a misclick */
HH.App && (HH.App.confirmSachet = function (def, combat) {
  return new Promise((resolve) => {
    const usable = combat ? combat.phase === 'player' : !!def.anywhere;
    const root = HH.App.modal(`<div class="sachet-big">${def.icon}</div><p class="center">${def.desc}</p>
      <div class="btn-row"><button class="btn btn-ghost" data-no>Keep it</button>${usable ? '<button class="btn btn-primary" data-yes>Use</button>' : ''}</div>
      ${usable ? '' : '<p class="muted center">Use this one during your turn in a fight.</p>'}`, { title: def.name, onClose: () => resolve(false) });
    const y = root.querySelector('[data-yes]');
    if (y) y.onclick = () => { HH.App.closeModal(); resolve(true); };
    root.querySelector('[data-no]').onclick = () => { HH.App.closeModal(); resolve(false); };
  });
});
