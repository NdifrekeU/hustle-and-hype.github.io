/* =========================================================================
   screens/shop.js — Computer Village: buy cards, gadgets, sachets, and
   pay to delete a card from your deck.
   ========================================================================= */
HH.Screens.shop = (function () {
  const D = HH.Data;

  function enter(root) {
    const App = HH.App;
    const run = App.run;
    const shop = run.shop;
    const afford = (p) => run.gold >= p;

    root.innerHTML = `
      <div class="shop-screen">
        <header class="shop-head">
          <div class="shopkeeper">${HH.Art.character({ body: 'shirt', top: '#16a085', bottom: '#2c3e50', skin: '#5e3720', hair: 'cap', capColor: '#16a085', face: 'none', prop: 'phone', expr: 'grin' })}</div>
          <div>
            <p class="eyebrow">Computer Village</p>
            <h2 class="panel-title">“Customer! Come and see original things!”</h2>
            <p class="muted">You have <b class="gold">₦${run.gold}</b>. Everything is “UK used”.</p>
          </div>
        </header>

        <section>
          <h3 class="section-label">Cards</h3>
          <div class="shop-cards">
            ${shop.cards.map((c, i) => c.sold
              ? '<div class="sold-slot">Sold</div>'
              : HH.CardView.html({ id: c.id, up: false }, { tag: 'button', price: c.price, sale: c.sale, cls: afford(c.price) ? '' : 'too-dear', attrs: `data-buy="cards" data-i="${i}"` })).join('')}
          </div>
        </section>

        <div class="shop-split">
          <section>
            <h3 class="section-label">Gadgets</h3>
            <div class="shop-relics">
              ${shop.relics.map((r, i) => {
                const def = D.RELICS[r.id];
                return r.sold ? '<div class="sold-slot small">Sold</div>' : `<button class="shop-item ${afford(r.price) ? '' : 'too-dear'}" data-buy="relics" data-i="${i}" data-tip-relic="${r.id}">
                  <span class="shop-icon">${def.icon}</span><span class="shop-name">${def.name}</span><span class="price-tag">₦${r.price}</span></button>`;
              }).join('')}
            </div>
          </section>
          <section>
            <h3 class="section-label">Sachets</h3>
            <div class="shop-relics">
              ${shop.sachets.map((s, i) => {
                const def = D.SACHETS[s.id];
                return s.sold ? '<div class="sold-slot small">Sold</div>' : `<button class="shop-item ${afford(s.price) ? '' : 'too-dear'}" data-buy="sachets" data-i="${i}" data-tip-sachet="${s.id}">
                  <span class="shop-icon">${def.icon}</span><span class="shop-name">${def.name}</span><span class="price-tag">₦${s.price}</span></button>`;
              }).join('')}
            </div>
          </section>
          <section>
            <h3 class="section-label">Services</h3>
            <button class="shop-item service ${shop.removed || !afford(run.removeCost) ? 'too-dear' : ''}" data-remove ${shop.removed ? 'disabled' : ''}>
              <span class="shop-icon">🗑️</span><span class="shop-name">Delete Account<small>Remove a card from your deck</small></span>
              <span class="price-tag">${shop.removed ? 'Done' : '₦' + run.removeCost}</span></button>
          </section>
        </div>

        <button class="btn btn-primary btn-big" data-leave>Leave Computer Village</button>
      </div>`;

    root.onclick = async (e) => {
      const b = e.target.closest('[data-buy]');
      if (b) {
        const kind = b.dataset.buy;
        const item = shop[kind][Number(b.dataset.i)];
        if (run.gold < item.price) { App.toast('Your money no reach. Hustle more.'); return; }
        if (!HH.Run.buy(run, kind, Number(b.dataset.i))) { App.toast('Your sachet pockets are full.'); return; }
        HH.Audio.play('coin');
        App.toast('Bought! No refund, no return.');
        App.refreshHud();
        enter(root);
        return;
      }
      if (e.target.closest('[data-remove]')) {
        if (shop.removed) return;
        if (run.gold < run.removeCost) { App.toast('Your money no reach.'); return; }
        const cards = run.deck;
        const body = `<div class="card-grid">${cards.map((c) => HH.CardView.html(c, { tag: 'button', attrs: `data-pick="${c.uid}"`, flavor: false })).join('')}</div>`;
        const m = App.modal(body, { title: `Delete which card? (₦${run.removeCost})`, wide: true });
        m.addEventListener('click', (ev) => {
          const p = ev.target.closest('[data-pick]');
          if (!p) return;
          const name = HH.Run.buyRemoval(run, Number(p.dataset.pick));
          App.closeModal();
          if (name) App.toast(`${name} deleted. Account closed.`);
          App.refreshHud();
          enter(root);
        });
        return;
      }
      if (e.target.closest('[data-leave]')) { HH.Run.leaveNode(run); App.sync(); }
    };
  }

  return { enter };
})();
