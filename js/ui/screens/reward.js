/* =========================================================================
   screens/reward.js — loot after a fight, and the boss gadget choice.
   ========================================================================= */
HH.Screens.reward = (function () {
  const D = HH.Data;

  function enter(root) {
    const App = HH.App;
    const run = App.run;
    const rw = run.reward;
    const title = rw.tier === 'boss' ? 'Boss down!' : rw.tier === 'elite' ? 'Wahala cleared!' : 'You Scaled!';

    const itemHtml = (it, i) => {
      const taken = rw.claimed.includes(i);
      let icon, label;
      if (it.kind === 'gold') { icon = '₦'; label = `${it.amount} Naira`; }
      if (it.kind === 'card') { icon = '🂠'; label = 'Add a card to your deck'; }
      if (it.kind === 'sachet') { icon = D.SACHETS[it.id].icon; label = D.SACHETS[it.id].name; }
      if (it.kind === 'relic') { icon = D.RELICS[it.id].icon; label = D.RELICS[it.id].name; }
      const tip = it.kind === 'sachet' ? `data-tip-sachet="${it.id}"` : it.kind === 'relic' ? `data-tip-relic="${it.id}"` : '';
      return `<button class="loot loot--${it.kind} ${taken ? 'taken' : ''}" data-item="${i}" ${taken ? 'disabled' : ''} ${tip}>
        <span class="loot-icon">${icon}</span><span class="loot-label">${label}</span>${taken ? '<span class="loot-check">✓</span>' : ''}</button>`;
    };

    root.innerHTML = `
      <div class="panel-screen">
        <div class="panel">
          <p class="eyebrow">${rw.tier === 'normal' ? 'Fight won' : rw.tier}</p>
          <h2 class="panel-title">${title}</h2>
          <div class="loot-list">${rw.items.map(itemHtml).join('')}</div>
          <div class="card-pick" id="card-pick" hidden></div>
          <button class="btn btn-primary btn-big" data-proceed>${rw.tier === 'boss' ? 'Continue' : 'Back to the map'}</button>
        </div>
      </div>`;

    root.onclick = (e) => {
      const it = e.target.closest('[data-item]');
      if (it && !it.disabled) {
        const i = Number(it.dataset.item);
        const item = rw.items[i];
        if (item.kind === 'card') { showCardPick(root, i); return; }
        if (!HH.Run.claimReward(run, i)) { App.toast('Your sachet pockets are full. Use or skip one.'); return; }
        HH.Audio.play(item.kind === 'gold' ? 'coin' : 'upgrade');
        App.refreshHud();
        enter(root);
        return;
      }
      const choose = e.target.closest('[data-choose]');
      if (choose) {
        HH.Run.claimReward(run, Number(choose.dataset.index), choose.dataset.choose);
        HH.Audio.play('card');
        App.refreshHud();
        App.toast(`${D.CARDS[choose.dataset.choose].name} added to your deck.`);
        enter(root);
        return;
      }
      if (e.target.closest('[data-skip-card]')) { root.querySelector('#card-pick').hidden = true; return; }
      if (e.target.closest('[data-proceed]')) {
        HH.Run.leaveReward(run);
        App.sync();
      }
    };
  }

  function showCardPick(root, index) {
    const item = HH.App.run.reward.items[index];
    const pick = root.querySelector('#card-pick');
    pick.hidden = false;
    pick.innerHTML = `<p class="section-label">Choose one</p>
      <div class="card-row">${item.choices.map((id) => HH.CardView.html({ id, up: false }, { tag: 'button', attrs: `data-choose="${id}" data-index="${index}"` })).join('')}</div>
      <button class="btn btn-ghost" data-skip-card>Skip for now</button>`;
    pick.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return { enter };
})();

HH.Screens.bossRelic = (function () {
  const D = HH.Data;
  function enter(root) {
    const App = HH.App;
    const run = App.run;
    root.innerHTML = `
      <div class="panel-screen">
        <div class="panel">
          <p class="eyebrow">Act ${run.act + 1} complete</p>
          <h2 class="panel-title">Pick a Boss Gadget</h2>
          <p class="muted center">Powerful, but each one comes with wahala. You’ll heal most of your HP before the next act.</p>
          <div class="relic-pick">
            ${run.bossRelics.map((id) => {
              const r = D.RELICS[id];
              return `<button class="relic-card" data-relic="${id}"><span class="relic-icon">${r.icon}</span><strong>${r.name}</strong><span>${r.desc}</span><em>${r.flavor}</em></button>`;
            }).join('')}
          </div>
          <button class="btn btn-ghost" data-skip>Skip</button>
        </div>
      </div>`;
    root.onclick = (e) => {
      const b = e.target.closest('[data-relic]');
      if (b) { HH.Audio.play('upgrade'); HH.Run.chooseBossRelic(run, b.dataset.relic); App.sync(); }
      if (e.target.closest('[data-skip]')) { HH.Run.chooseBossRelic(run, null); App.sync(); }
    };
  }
  return { enter };
})();

HH.Screens.treasure = (function () {
  const D = HH.Data;
  function enter(root) {
    const App = HH.App;
    const run = App.run;
    const t = run.treasure;
    const r = t.relic ? D.RELICS[t.relic] : null;
    root.innerHTML = `
      <div class="panel-screen">
        <div class="panel">
          <p class="eyebrow">Owambe gift bag</p>
          <h2 class="panel-title">${t.opened ? 'Souvenir collected!' : 'Somebody left a party pack…'}</h2>
          <button class="gift ${t.opened ? 'opened' : ''}" data-open ${t.opened ? 'disabled' : ''} aria-label="Open the gift bag">🎁</button>
          ${t.opened ? `<div class="treasure-loot">${r ? `<div class="relic-card static" data-tip-relic="${t.relic}"><span class="relic-icon">${r.icon}</span><strong>${r.name}</strong><span>${r.desc}</span></div>` : ''}<p class="center">+ ₦${t.gold}</p></div>` : '<p class="muted center">Tap the bag to open it.</p>'}
          <button class="btn btn-primary btn-big" data-leave ${t.opened ? '' : 'hidden'}>Back to the map</button>
        </div>
      </div>`;
    root.onclick = (e) => {
      if (e.target.closest('[data-open]') && !t.opened) {
        t.opened = true;
        if (t.relic) HH.Run.addRelic(run, t.relic);
        run.gold += t.gold;
        HH.Audio.play('victory');
        HH.Run.save(run);
        App.refreshHud();
        enter(root);
      }
      if (e.target.closest('[data-leave]')) { HH.Run.leaveNode(run); App.sync(); }
    };
  }
  return { enter };
})();
