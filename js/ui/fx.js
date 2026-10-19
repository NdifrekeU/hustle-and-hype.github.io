/* =========================================================================
   ui/fx.js — floating numbers, hit shakes, flashes, impact bursts and
   flying cards. Purely visual; everything lives in a fixed layer so
   re-renders never cut an animation off. Respects reduced motion.
   ========================================================================= */
window.HH = window.HH || {};

HH.FX = (function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.2,.8,.2,1)';

  function layer() { return document.getElementById('fx-layer'); }
  const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

  function float(targetEl, text, kind) {
    if (!targetEl) return;
    const r = targetEl.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'fx-float fx-' + kind;
    el.textContent = text;
    el.style.left = r.left + r.width * (0.35 + Math.random() * 0.3) + 'px';
    el.style.top = r.top + r.height * 0.32 + 'px';
    layer().appendChild(el);
    setTimeout(() => el.remove(), reduce ? 700 : 1150);
  }

  function pulse(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms || 500);
  }

  function flash(kind) {
    if (reduce) return;
    const el = document.createElement('div');
    el.className = 'fx-flash fx-flash--' + kind;
    layer().appendChild(el);
    setTimeout(() => el.remove(), 380);
  }

  /* Radial impact at the middle of an element */
  function burst(targetEl, kind) {
    if (reduce || !targetEl) return;
    const art = targetEl.querySelector('.unit-art') || targetEl;
    const c = center(art.getBoundingClientRect());
    const el = document.createElement('div');
    el.className = 'fx-burst fx-burst--' + (kind || 'hit');
    el.style.left = c.x + 'px';
    el.style.top = c.y + 'px';
    el.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>';
    layer().appendChild(el);
    setTimeout(() => el.remove(), 520);
  }

  /* Freeze a copy of a card where it sits, so it can fly after the real
     one is removed by the re-render. */
  function ghost(cardEl) {
    if (reduce || !cardEl) return null;
    const r = cardEl.getBoundingClientRect();
    const g = cardEl.cloneNode(true);
    const cs = getComputedStyle(cardEl);
    g.classList.add('fx-card');
    g.removeAttribute('data-uid');
    g.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${cardEl.offsetWidth}px;height:${cardEl.offsetHeight}px;margin:0;z-index:76;pointer-events:none;transform:none;` +
      `font-size:${cs.fontSize};`;
    // keep the visual size the card had in the hand (it may have been scaled)
    const sx = r.width / cardEl.offsetWidth;
    g.dataset.sx = isFinite(sx) && sx > 0 ? sx : 1;
    g.style.left = r.left + (r.width - cardEl.offsetWidth) / 2 + 'px';
    g.style.top = r.top + (r.height - cardEl.offsetHeight) / 2 + 'px';
    layer().appendChild(g);
    return g;
  }

  /* kind: 'attack' | 'skill' | 'power' | 'discard' */
  function fly(g, targetEl, kind, delay) {
    if (!g) return;
    if (!targetEl) { g.remove(); return; }
    const from = center(g.getBoundingClientRect());
    const to = center(targetEl.getBoundingClientRect());
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const sx = Number(g.dataset.sx) || 1;
    let frames;
    let duration = 360;
    if (kind === 'attack') {
      frames = [
        { transform: `translate(0,0) scale(${sx})`, opacity: 1 },
        { transform: `translate(${dx * 0.15}px, ${dy * 0.15 - 40}px) scale(${sx * 1.08}) rotate(-6deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${dx}px, ${dy}px) scale(.35) rotate(12deg)`, opacity: 0.2 }
      ];
    } else if (kind === 'power') {
      duration = 520;
      frames = [
        { transform: `translate(0,0) scale(${sx})`, opacity: 1, filter: 'brightness(1)' },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(${sx * 1.15})`, opacity: 1, filter: 'brightness(1.8)', offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(.2)`, opacity: 0, filter: 'brightness(2.5)' }
      ];
    } else if (kind === 'discard') {
      duration = 380;
      frames = [
        { transform: `translate(0,0) scale(${sx})`, opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(.25) rotate(40deg)`, opacity: 0.1 }
      ];
    } else {
      frames = [
        { transform: `translate(0,0) scale(${sx})`, opacity: 1 },
        { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 30}px) scale(${sx})`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px, ${dy}px) scale(.3)`, opacity: 0 }
      ];
    }
    const anim = g.animate(frames, { duration, delay: delay || 0, easing: EASE, fill: 'both' });
    anim.onfinish = () => g.remove();
    setTimeout(() => g.remove(), duration + (delay || 0) + 200);
  }

  /* Deal a card in from the draw pile to its place in the fan */
  function dealIn(cardEl, fromEl, finalTransform, delay) {
    if (reduce || !cardEl || !fromEl) return;
    const hand = cardEl.parentElement.getBoundingClientRect();
    const f = center(fromEl.getBoundingClientRect());
    const baseLeft = hand.left;
    const baseTop = hand.bottom - parseFloat(getComputedStyle(cardEl).bottom || 0) - cardEl.offsetHeight;
    const sx = f.x - baseLeft - cardEl.offsetWidth / 2;
    const sy = f.y - baseTop - cardEl.offsetHeight / 2;
    cardEl.animate([
      { transform: `translate(${sx}px, ${sy}px) scale(.25) rotate(-30deg)`, opacity: 0 },
      { transform: finalTransform, opacity: 1 }
    ], { duration: 340, delay, easing: EASE, fill: 'backwards' });
  }

  return { float, pulse, flash, burst, ghost, fly, dealIn, reduce };
})();
