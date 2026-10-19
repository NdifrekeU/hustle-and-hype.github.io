/* =========================================================================
   screens/map.js — the act map. Climb from the bottom to the boss.
   ========================================================================= */
HH.Screens.map = (function () {
  const D = HH.Data;
  const ROW = 84;
  const TYPES = {
    fight: { icon: '⚔️', label: 'Fight' },
    elite: { icon: '💀', label: 'Wahala (elite fight)' },
    event: { icon: '❓', label: 'Something dey happen' },
    rest: { icon: '🍲', label: 'Buka (rest)' },
    shop: { icon: '🛒', label: 'Computer Village (shop)' },
    treasure: { icon: '🎁', label: 'Owambe gift bag' },
    boss: { icon: '👑', label: 'Boss' }
  };

  function enter(root) {
    const App = HH.App;
    const run = App.run;
    const map = run.map;
    const act = D.ACTS[run.act];
    const reach = HH.Run.reachable(run);
    const visited = run.path || [];
    const H = (map.floors + 1) * ROW + 40;
    const pos = (n) => ({ x: ((n.l + 0.5 + n.jx) / map.lanes) * 100, y: H - 30 - n.f * ROW - n.jy * 24 });
    const nodes = Object.values(map.nodes);
    const boss = D.ENEMIES[run.boss[0]];

    let lines = '';
    nodes.forEach((n) => n.next.forEach((id) => {
      const m = map.nodes[id];
      const a = pos(n), b = pos(m);
      const walked = visited.includes(n.id) && (visited.includes(m.id) || run.pos === n.id);
      lines += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${walked ? 'walked' : ''}" vector-effect="non-scaling-stroke"/>`;
    }));

    root.innerHTML = `
      <div class="map-bg">${HH.Art.stage(act.stage)}</div>
      <div class="map-wrap">
        <header class="map-head">
          <p class="eyebrow">Act ${run.act + 1} of ${D.ACTS.length}</p>
          <h2>${act.name}</h2>
          <p class="muted">${act.subtitle}</p>
        </header>
        <div class="map-scroll" id="map-scroll">
          <div class="map-board" style="height:${H}px">
            <div class="boss-preview" style="top:${H - 30 - map.floors * ROW - 100}px">
              <span class="boss-art">${HH.Art.character(boss.art, { flip: true })}</span>
              <span class="boss-name">${boss.name}</span>
            </div>
            <svg class="map-lines" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
            ${nodes.map((n) => {
              const p = pos(n);
              const t = TYPES[n.type];
              const can = reach.includes(n.id);
              const done = visited.includes(n.id);
              const here = run.pos === n.id;
              return `<button class="map-node node-${n.type} ${can ? 'reachable' : ''} ${done ? 'done' : ''} ${here ? 'here' : ''}"
                style="left:${p.x}%;top:${p.y}px" data-node="${n.id}" ${can ? '' : 'disabled'}
                aria-label="${t.label}${can ? ', available' : ''}${done ? ', visited' : ''}" data-tip="${t.label}">
                <span>${t.icon}</span></button>`;
            }).join('')}
          </div>
        </div>
        <ul class="map-legend">${Object.entries(TYPES).filter(([k]) => k !== 'boss').map(([, t]) => `<li><span>${t.icon}</span>${t.label.replace(/ \(.*\)/, '')}</li>`).join('')}</ul>
      </div>`;

    root.onclick = (e) => {
      const b = e.target.closest('[data-node]');
      if (!b || b.disabled) return;
      HH.Run.enterNode(run, b.dataset.node);
      App.sync();
    };

    // Scroll so the next choices are in view
    requestAnimationFrame(() => {
      const sc = root.querySelector('#map-scroll');
      const target = root.querySelector('.map-node.reachable');
      if (sc && target) sc.scrollTop = target.offsetTop - sc.clientHeight * 0.6;
    });
  }

  return { enter };
})();
