/* =========================================================================
   ui/cardView.js — renders a card (in hand, rewards, shop, deck viewer).
   Card text numbers are live in combat: Clout, Shaken, Exposed and Steeze
   change them, and changed numbers are coloured.
   ========================================================================= */
window.HH = window.HH || {};

HH.CardView = (function () {
  const D = HH.Data;
  const TYPE_LABEL = { attack: 'Attack', skill: 'Skill', power: 'Power', status: 'Status', curse: 'Curse' };
  const KW = Object.keys(D.KEYWORDS).sort((a, b) => b.length - a.length);
  const KW_RE = new RegExp('\\b(' + KW.map((k) => k.replace(/ /g, '\\s')).join('|') + ')\\b', 'g');

  function values(card) {
    const def = D.CARDS[card.id];
    return card.up && def.up && def.up.v ? Object.assign({}, def.v, def.up.v) : Object.assign({}, def.v);
  }

  function cost(card, combat) {
    if (combat) return combat.cost(card);
    const def = D.CARDS[card.id];
    if (def.cost === null) return null;
    if (card.up && def.up && def.up.cost !== undefined) return def.up.cost;
    return def.cost;
  }

  function keysOf(card) {
    const def = D.CARDS[card.id];
    if (card.up && def.up && def.up.keys) return def.up.keys;
    return def.keys || [];
  }

  /* Text with live numbers and highlighted keywords */
  function text(card, ctx) {
    const def = D.CARDS[card.id];
    const v = values(card);
    const base = def.v || {};
    const combat = ctx && ctx.combat;
    const target = ctx && ctx.target;
    let t = def.text.replace(/\{(\w+)\}/g, (m, key) => {
      let val = v[key];
      if (val === undefined) return m;
      let shown = val;
      if (combat && /^d\d?$/.test(key)) shown = combat.calcDamage(combat.player, target || null, val);
      if (combat && /^b\d?$/.test(key)) shown = combat.calcBlock(val);
      let cls = '';
      if (shown > val) cls = 'up';
      else if (shown < val) cls = 'down';
      else if (card.up && base[key] !== undefined && val !== base[key]) cls = 'upg';
      return `<b class="${cls}">${shown}</b>`;
    });
    // Innate added by an upgrade isn't in the written text
    const keys = keysOf(card);
    if (keys.includes('innate') && !/Innate/.test(t)) t += ' Innate.';
    if (keys.includes('retain') && !/Retain/.test(t)) t += ' Retain.';
    return t.replace(KW_RE, (m) => `<span class="kw">${m}</span>`);
  }

  function keywordsIn(card) {
    const def = D.CARDS[card.id];
    const found = new Set();
    const src = def.text + ' ' + keysOf(card).join(' ');
    KW.forEach((k) => { if (new RegExp('\\b' + k + '\\b', 'i').test(src)) found.add(k); });
    if (def.type === 'power') found.add('Power');
    return Array.from(found);
  }

  /* opts: { combat, target, tag ('button'|'div'), cls, attrs, price, sold, playable, flavor } */
  function html(card, opts) {
    opts = opts || {};
    const def = D.CARDS[card.id];
    const c = cost(card, opts.combat);
    const tag = opts.tag || 'div';
    const costHtml = c === null ? '' : `<span class="card-cost ${opts.combat && c !== 'X' && c < def.cost ? 'cheaper' : ''}">${c}</span>`;
    const kws = keywordsIn(card).join('|');
    const classes = ['card', 'card--' + def.type, 'rarity-' + def.rarity, card.up ? 'is-up' : '', opts.cls || ''].join(' ');
    const flavor = opts.flavor === false ? '' : `<span class="card-flavor">${def.flavor || ''}</span>`;
    const priceHtml = opts.price != null ? `<span class="price-tag ${opts.sale ? 'sale' : ''}">₦${opts.price}</span>` : '';
    return `<${tag} class="${classes}" ${opts.attrs || ''} data-kws="${kws}" ${tag === 'button' ? 'type="button"' : ''}
        aria-label="${def.name}${card.up ? ' upgraded' : ''}, ${c === null ? 'unplayable' : 'costs ' + c + ' Ginger'}. ${text(card, opts).replace(/<[^>]+>/g, '')}">
        ${costHtml}
        <span class="card-name">${def.name}${card.up ? '<i>+</i>' : ''}</span>
        <span class="card-art">${(HH.CardArt && HH.CardArt.svg(card.id)) || `<span>${def.art}</span>`}</span>
        <span class="card-type">${TYPE_LABEL[def.type]}<em class="gem"></em></span>
        <span class="card-text ${def.text.length > 58 ? 'txt-xlong' : def.text.length > 42 ? 'txt-long' : ''}">${text(card, opts)}</span>
        ${flavor}${priceHtml}
      </${tag}>`;
  }

  return { html, text, values, cost, keywordsIn };
})();
