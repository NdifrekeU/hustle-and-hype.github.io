/* =========================================================================
   screens/event.js — "?" nodes: a short Lagos story with choices.
   ========================================================================= */
HH.Screens.event = (function () {
  const D = HH.Data;
  let busy = false;

  function enter(root) {
    const App = HH.App;
    const run = App.run;
    const ev = D.EVENTS.find((x) => x.id === run.event.id);
    const result = run.event.result;
    busy = false;

    root.innerHTML = `
      <div class="panel-screen event-screen">
        <div class="panel event-panel">
          <div class="event-art"><div class="event-stage">${HH.Art.stage(D.ACTS[run.act].stage)}</div><span>${ev.art}</span></div>
          <div class="event-body">
            <p class="eyebrow">Something dey happen</p>
            <h2 class="panel-title">${ev.title}</h2>
            <p class="event-text">${ev.text}</p>
            ${result
              ? `<p class="event-result">${result}</p><button class="btn btn-primary btn-big" data-leave>Continue</button>`
              : `<div class="choices">${ev.choices.map((c, i) => {
                  const ok = !c.cond || c.cond(run);
                  return `<button class="choice" data-choice="${i}" ${ok ? '' : 'disabled'}><strong>${c.label}</strong><span>${c.detail}${ok ? '' : ' (not available)'}</span></button>`;
                }).join('')}</div>`}
          </div>
        </div>
      </div>`;

    root.onclick = async (e) => {
      const b = e.target.closest('[data-choice]');
      if (b && !b.disabled && !busy) {
        busy = true;
        const choice = ev.choices[Number(b.dataset.choice)];
        let fought = false;
        const api = HH.makeEventApi(run, {
          pickCard: (mode) => App.pickCard(mode),
          cardReward: (choices) => App.chooseCard(choices),
          fight: (ids) => { fought = true; HH.Run.startEventFight(run, ids); }
        });
        const text = await choice.run(run, api);
        if (fought) { HH.Run.save(run); App.toast(text); App.sync(); return; }
        run.event.result = text;
        HH.Run.save(run);
        App.refreshHud();
        enter(root);
        return;
      }
      if (e.target.closest('[data-leave]')) { HH.Run.leaveNode(run); App.sync(); }
    };
  }

  return { enter };
})();
