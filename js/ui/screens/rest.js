/* =========================================================================
   screens/rest.js — the Buka: eat to heal, or upskill (upgrade a card).
   ========================================================================= */
HH.Screens.rest = (function () {
  function enter(root) {
    const App = HH.App;
    const run = App.run;
    const heal = HH.Run.restHealAmount(run);
    const canHeal = HH.Run.canRestHeal(run);
    const canUp = run.deck.some(HH.Run.canUpgrade);
    const done = run.rest.done;

    root.innerHTML = `
      <div class="panel-screen buka">
        <div class="panel">
          <p class="eyebrow">Mama Cass Buka · Open 24 hours (when light dey)</p>
          <h2 class="panel-title">${done ? 'Belle full. Spirit strong.' : 'Sit down. Rest small.'}</h2>
          ${done ? `<p class="center">${run.rest.msg}</p>` : `
          <div class="rest-options">
            <button class="rest-opt" data-rest="heal" ${canHeal ? '' : 'disabled'}>
              <span class="rest-icon">🍲</span><strong>Chop Amala</strong>
              <span>${canHeal ? `Heal ${heal} HP` : 'Your Japa Visa won’t let you rest here'}</span>
              <small>${run.hp}/${run.maxHp} HP now</small>
            </button>
            <button class="rest-opt" data-rest="upgrade" ${canUp ? '' : 'disabled'}>
              <span class="rest-icon">📚</span><strong>Upskill</strong>
              <span>${canUp ? 'Upgrade a card' : 'Every card is already upgraded'}</span>
              <small>Watch one YouTube tutorial</small>
            </button>
          </div>`}
          <button class="btn btn-primary btn-big" data-leave ${done ? '' : 'hidden'}>Back to the map</button>
        </div>
      </div>`;

    root.onclick = async (e) => {
      const b = e.target.closest('[data-rest]');
      if (b && !b.disabled && !run.rest.done) {
        if (b.dataset.rest === 'heal') { HH.Run.doRest(run, 'heal'); HH.Audio.play('heal'); }
        else {
          const pickable = run.deck.filter(HH.Run.canUpgrade);
          const body = `<p class="muted">Upgraded values are shown in green.</p><div class="card-grid">${pickable.map((c) => HH.CardView.html({ id: c.id, up: true }, { tag: 'button', attrs: `data-pick="${c.uid}"`, flavor: false })).join('')}</div>`;
          const uid = await new Promise((resolve) => {
            const m = App.modal(body, { title: 'Upskill: choose a card', wide: true, onClose: () => resolve(null) });
            m.addEventListener('click', (ev) => { const p = ev.target.closest('[data-pick]'); if (p) { App.closeModal(); resolve(Number(p.dataset.pick)); } });
          });
          if (!uid) return;
          HH.Run.doRest(run, 'upgrade', uid);
          HH.Audio.play('upgrade');
        }
        App.refreshHud();
        enter(root);
        return;
      }
      if (e.target.closest('[data-leave]')) { HH.Run.leaveNode(run); App.sync(); }
    };
  }
  return { enter };
})();
