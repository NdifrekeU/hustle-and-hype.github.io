/* =========================================================================
   ui/art.js — illustrated characters and stages, drawn as SVG.

   HH.Art.character(spec, opts) → <svg> string. A "paper doll": the spec
   picks a body, hair/hat, face extras, expression and a held prop.
   Characters face right; enemies are mirrored by the caller.
   HH.Art.stage(name) → backdrop <svg> for an act.
   ========================================================================= */
window.HH = window.HH || {};

HH.Art = (function () {
  const INK = '#1d140c';
  const SW = 3.5; // outline width
  let uid = 0;

  /* ---------------- colour helpers ---------------- */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = amt < 0 ? 0 : 255;
    const p = Math.abs(amt);
    r = Math.round((f - r) * p + r); g = Math.round((f - g) * p + g); b = Math.round((f - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  const o = (fill, extra) => `fill="${fill}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra || ''}`;

  /* ---------------- hair & hats (back layer) ---------------- */
  function hairBack(s) {
    const h = '#1a1210';
    switch (s.hair) {
      case 'afro': return `<circle cx="100" cy="62" r="56" ${o(h)}/>`;
      case 'dreads': return [70, 82, 118, 130].map((x, i) => `<rect x="${x - 6}" y="70" width="12" height="${62 + (i % 2) * 10}" rx="6" ${o(h)}/>`).join('');
      case 'wig': return `<path d="M54 64 Q52 140 68 150 L132 150 Q148 140 146 64 Z" ${o('#2a1b16')}/>`;
      case 'braids': return [76, 88, 112, 124].map((x) => `<path d="M${x} 96 Q${x - 4} 130 ${x + 2} 150" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M${x} 96 Q${x - 4} 130 ${x + 2} 150" fill="none" stroke="${h}" stroke-width="4" stroke-linecap="round"/>`).join('');
      case 'gele': {
        const c = s.geleColor || '#f2b705';
        return `<path d="M40 60 Q30 8 78 14 Q100 -14 124 12 Q172 6 160 60 Q130 40 100 44 Q70 40 40 60 Z" ${o(c)}/>
          <path d="M58 40 Q72 22 90 26 M110 26 Q128 20 142 40 M100 10 L100 30" fill="none" stroke="${shade(c, -0.35)}" stroke-width="3" stroke-linecap="round"/>`;
      }
      default: return '';
    }
  }

  /* ---------------- hair & hats (front layer) ---------------- */
  function hairFront(s) {
    const h = '#1a1210';
    switch (s.hair) {
      case 'lowcut':
      case 'waves': {
        const base = `<path d="M60 70 Q58 30 100 28 Q142 30 140 70 Q132 52 100 50 Q68 52 60 70 Z" fill="${h}"/>`;
        const waves = s.hair === 'waves' ? `<path d="M74 40 q6 -4 12 0 q6 4 12 0 q6 -4 12 0 q6 4 12 0" fill="none" stroke="#3a2a22" stroke-width="2"/>` : '';
        return base + waves;
      }
      case 'afro': return `<path d="M62 64 Q70 40 100 40 Q130 40 138 64" fill="none" stroke="#2a1d18" stroke-width="3"/>`;
      case 'dreads': return `<path d="M60 70 Q58 28 100 26 Q142 28 140 70 Q130 46 100 46 Q70 46 60 70 Z" fill="${h}"/>`;
      case 'braids': return `<path d="M60 70 Q58 28 100 26 Q142 28 140 70 Q130 46 100 46 Q70 46 60 70 Z" fill="${h}"/><path d="M80 30 L76 60 M100 26 L100 50 M120 30 L124 60" stroke="#3a2a22" stroke-width="2.5"/>`;
      case 'wig': return `<path d="M58 72 Q56 26 100 24 Q144 26 142 72 Q120 50 96 56 Q72 52 58 72 Z" ${o('#2a1b16')}/>`;
      case 'bald': return `<path d="M76 40 Q86 33 98 34" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>`;
      case 'cap': {
        const c = s.capColor || '#c0392b';
        return `<path d="M58 66 Q58 22 100 22 Q142 22 142 66 Z" ${o(c)}/><path d="M138 58 Q166 56 172 66 Q150 72 136 68 Z" ${o(shade(c, -0.2))}/><circle cx="100" cy="24" r="4" fill="${shade(c, -0.3)}"/>`;
      }
      case 'helmet': {
        const c = s.helmetColor || '#e0a400';
        return `<path d="M52 82 Q48 16 100 16 Q152 16 148 82 Q130 70 100 70 Q70 70 52 82 Z" ${o(c)}/><path d="M118 56 Q146 56 150 80 L122 76 Z" ${o('#2c3e50', 'fill-opacity=".85"')}/><path d="M70 30 Q90 20 112 24" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>`;
      }
      case 'beret': {
        const c = s.beretColor || '#7a5c1e';
        return `<ellipse cx="96" cy="40" rx="48" ry="18" transform="rotate(-10 96 40)" ${o(c)}/><circle cx="96" cy="24" r="4" fill="${INK}"/><circle cx="78" cy="44" r="6" fill="#f1c40f" stroke="${INK}" stroke-width="2"/>`;
      }
      case 'fila': {
        const c = s.filaColor || '#7b2d8b';
        return `<path d="M60 60 Q60 20 104 18 Q150 20 152 46 Q148 58 140 60 Z" ${o(c)}/><path d="M64 58 L140 58" stroke="${shade(c, -0.35)}" stroke-width="4"/>`;
      }
      case 'gele': {
        const c = s.geleColor || '#f2b705';
        return `<path d="M58 66 Q56 34 100 32 Q144 34 142 66 Q120 52 100 52 Q80 52 58 66 Z" ${o(c)}/><path d="M70 48 Q100 40 130 48" fill="none" stroke="${shade(c, -0.35)}" stroke-width="3"/>`;
      }
      default: return '';
    }
  }

  /* ---------------- face ---------------- */
  function face(s) {
    const e = s.expr || 'neutral';
    const eyeY = 76;
    let eyes, brows, mouth;
    const pupil = (x) => `<circle cx="${x + 2}" cy="${eyeY + 1}" r="4" fill="${INK}"/>`;
    const white = (x) => `<ellipse cx="${x}" cy="${eyeY}" rx="7" ry="8" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`;
    eyes = white(84) + white(116) + pupil(84) + pupil(116);
    if (e === 'smug') eyes += `<path d="M76 72 L92 72 M108 72 L124 72" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    if (e === 'happy') eyes = `<path d="M77 78 Q84 70 91 78 M109 78 Q116 70 123 78" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;

    switch (e) {
      case 'angry': brows = `<path d="M74 60 L92 68 M126 60 L108 68" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`; break;
      case 'stern': brows = `<path d="M74 63 L93 65 M107 65 L126 63" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`; break;
      case 'smug': brows = `<path d="M74 62 Q84 56 93 62 M107 58 Q118 52 126 60" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`; break;
      case 'shout': brows = `<path d="M74 58 Q84 52 93 58 M107 58 Q116 52 126 58" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`; break;
      default: brows = `<path d="M75 61 Q84 57 93 61 M107 61 Q116 57 125 61" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
    }
    switch (e) {
      case 'angry': mouth = `<path d="M88 102 Q100 94 112 102" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`; break;
      case 'grin': mouth = `<path d="M84 94 Q100 112 118 94 Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M88 98 L114 98" stroke="${INK}" stroke-width="1.5"/>`; break;
      case 'shout': mouth = `<ellipse cx="102" cy="100" rx="9" ry="11" fill="#5a1a14" stroke="${INK}" stroke-width="3.5"/><ellipse cx="102" cy="106" rx="5" ry="3" fill="#e05a5a"/>`; break;
      case 'smug': mouth = `<path d="M90 100 Q104 104 116 94" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`; break;
      case 'happy': mouth = `<path d="M86 96 Q100 110 116 96" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`; break;
      case 'stern': mouth = `<path d="M90 100 L112 100" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`; break;
      default: mouth = `<path d="M90 99 Q100 103 110 99" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
    }
    const nose = `<path d="M100 82 Q106 90 99 92" fill="none" stroke="${shade(s.skin, -0.35)}" stroke-width="3" stroke-linecap="round"/>`;
    const cheeks = `<ellipse cx="78" cy="90" rx="6" ry="3.5" fill="#e0705a" opacity=".25"/><ellipse cx="122" cy="90" rx="6" ry="3.5" fill="#e0705a" opacity=".25"/>`;
    return brows + eyes + nose + cheeks + mouth;
  }

  function faceExtras(s) {
    let out = '';
    switch (s.face) {
      case 'glasses': out += `<circle cx="84" cy="76" r="11" fill="#bfe3ff" fill-opacity=".25" stroke="${INK}" stroke-width="3.5"/><circle cx="116" cy="76" r="11" fill="#bfe3ff" fill-opacity=".25" stroke="${INK}" stroke-width="3.5"/><path d="M95 76 L105 76 M73 74 L62 70 M127 74 L138 70" stroke="${INK}" stroke-width="3"/>`; break;
      case 'shades': out += `<path d="M70 68 L96 68 Q96 86 84 86 Q72 86 70 68 Z M104 68 L130 68 Q128 86 116 86 Q104 86 104 68 Z" fill="#111" stroke="${INK}" stroke-width="3"/><path d="M96 70 L104 70 M70 68 L60 66 M130 68 L140 66" stroke="${INK}" stroke-width="3"/><path d="M76 72 L82 72" stroke="#fff" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round"/>`; break;
      case 'beard': out += `<path d="M62 84 Q66 118 100 122 Q134 118 138 84 Q134 104 122 108 Q112 98 100 100 Q88 98 78 108 Q66 104 62 84 Z" fill="#1a1210"/>`; break;
      case 'mustache': out += `<path d="M86 94 Q94 88 100 93 Q106 88 114 94 Q106 96 100 95 Q94 96 86 94 Z" fill="#1a1210" stroke="${INK}" stroke-width="1.5"/>`; break;
      case 'lashes': out += `<path d="M76 70 L73 66 M80 68 L78 63 M120 68 L122 63 M124 70 L127 66" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/><path d="M90 99 Q100 104 110 99 Q100 108 90 99 Z" fill="#c0392b"/>`; break;
    }
    if (s.extra === 'airpods') out += `<rect x="134" y="80" width="7" height="14" rx="3.5" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
    return out;
  }

  /* ---------------- bodies ---------------- */
  function torso(s, pat) {
    const top = s.top || '#888';
    const bottom = s.bottom || '#333';
    const skin = s.skin;
    const topFill = s.pattern === 'ankara' ? `url(#${pat})` : top;
    const belly = s.belly ? `<path d="M76 150 Q100 182 124 150" fill="none" stroke="${shade(top, -0.3)}" stroke-width="3"/>` : '';
    const chain = s.chain ? `<path d="M84 118 Q100 146 116 118" fill="none" stroke="#f1c40f" stroke-width="4"/><circle cx="100" cy="140" r="5" fill="#f1c40f" stroke="${INK}" stroke-width="2"/>` : '';
    const legs = (y1, y2) => `<rect x="78" y="${y1}" width="19" height="${y2 - y1}" rx="7" ${o(bottom)}/><rect x="103" y="${y1}" width="19" height="${y2 - y1}" rx="7" ${o(bottom)}/>`;
    const shoes = `<path d="M74 222 Q74 214 88 214 L98 214 L98 226 L74 226 Z" ${o('#2b2b2b')}/><path d="M102 214 L114 214 Q130 214 130 222 L130 226 L102 226 Z" ${o('#2b2b2b')}/>`;
    const slippers = `<path d="M74 224 L98 224 M102 224 L128 224" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M74 224 L98 224 M102 224 L128 224" stroke="#e67e22" stroke-width="2" stroke-linecap="round"/>`;
    const neck = `<rect x="90" y="106" width="20" height="16" ${o(skin)}/>`;

    switch (s.body) {
      case 'hoodie': return legs(176, 220) + shoes + neck +
        `<path d="M62 124 Q64 112 100 110 Q136 112 138 124 L142 184 Q100 192 58 184 Z" ${o(topFill)}/>
         <path d="M76 116 Q100 132 124 116" fill="none" stroke="${shade(top, -0.3)}" stroke-width="4"/>
         <path d="M92 124 L90 146 M108 124 L110 146" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round"/>
         <path d="M78 160 L122 160 L126 180 L74 180 Z" fill="${shade(top, -0.15)}" stroke="${INK}" stroke-width="2.5"/>` + belly;
      case 'tee': return legs(172, 220) + shoes + neck +
        `<path d="M64 122 Q66 112 100 110 Q134 112 136 122 L138 178 Q100 184 62 178 Z" ${o(topFill)}/>
         <path d="M86 112 Q100 124 114 112" fill="${skin}" stroke="${INK}" stroke-width="2.5"/>` + chain + belly;
      case 'singlet': return legs(172, 220) + slippers + neck +
        `<path d="M74 118 Q86 114 88 112 Q100 128 112 112 Q114 114 126 118 L132 178 Q100 186 68 178 Z" ${o(topFill)}/>` + chain + belly;
      case 'shirt': return legs(174, 220) + shoes + neck +
        `<path d="M62 122 Q64 112 100 110 Q136 112 138 122 L140 180 Q100 188 60 180 Z" ${o(topFill)}/>
         <path d="M88 112 L100 128 L112 112 L106 110 L100 118 L94 110 Z" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
         <path d="M100 128 L100 178" stroke="${shade(top, -0.3)}" stroke-width="2"/>
         <circle cx="100" cy="142" r="2" fill="${INK}"/><circle cx="100" cy="158" r="2" fill="${INK}"/>` + chain + belly;
      case 'jacket': return legs(176, 220) + shoes + neck +
        `<path d="M60 124 Q62 112 100 110 Q138 112 140 124 L144 184 Q100 192 56 184 Z" ${o(topFill)}/>
         <path d="M92 114 L96 186 M108 114 L104 186" stroke="${INK}" stroke-width="3"/>
         <path d="M96 116 L104 116 L104 186 L96 186 Z" fill="#2b2b2b"/>
         ${s.letters ? `<text ${s._flip ? 'transform="translate(200 0) scale(-1 1)"' : ''} x="100" y="168" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="13" fill="#f1c40f" stroke="${INK}" stroke-width=".8">${s.letters}</text>` : ''}`;
      case 'uniform': return legs(176, 220) + shoes + neck +
        `<path d="M62 122 Q64 112 100 110 Q136 112 138 122 L140 180 Q100 188 60 180 Z" ${o(topFill)}/>
         <path d="M88 112 L100 126 L112 112" fill="none" stroke="${INK}" stroke-width="3"/>
         <rect x="72" y="134" width="18" height="14" rx="2" fill="${shade(top, -0.15)}" stroke="${INK}" stroke-width="2.5"/>
         <rect x="110" y="134" width="18" height="14" rx="2" fill="${shade(top, -0.15)}" stroke="${INK}" stroke-width="2.5"/>
         <path d="M119 128 l3 6 6 1 -5 4 1 6 -5 -3 -5 3 1 -6 -5 -4 6 -1 Z" fill="#f1c40f" stroke="${INK}" stroke-width="1.5"/>
         <rect x="60" y="168" width="80" height="10" fill="#2b2b2b" stroke="${INK}" stroke-width="2.5"/><rect x="94" y="167" width="12" height="12" fill="#c9a227" stroke="${INK}" stroke-width="2"/>
         <rect x="60" y="116" width="18" height="7" rx="2" fill="${shade(top, -0.3)}"/><rect x="122" y="116" width="18" height="7" rx="2" fill="${shade(top, -0.3)}"/>` + belly;
      case 'suit': return legs(176, 220) + shoes + neck +
        `<path d="M60 124 Q62 112 100 110 Q138 112 140 124 L144 186 Q100 194 56 186 Z" ${o(topFill)}/>
         <path d="M86 112 L100 150 L114 112 Z" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
         <path d="M97 120 L103 120 L106 146 L100 154 L94 146 Z" fill="#c0392b" stroke="${INK}" stroke-width="2"/>
         <path d="M86 112 L100 150 L80 132 Z M114 112 L100 150 L120 132 Z" fill="${shade(top, -0.2)}" stroke="${INK}" stroke-width="2.5"/>`;
      case 'vest': return legs(176, 220) + shoes + neck +
        `<path d="M62 122 Q64 112 100 110 Q136 112 138 122 L140 182 Q100 190 60 182 Z" fill="#dfe6ee" stroke="${INK}" stroke-width="${SW}"/>
         <path d="M70 118 Q84 114 90 114 L96 184 Q80 184 66 180 Z M130 118 Q116 114 110 114 L104 184 Q120 184 134 180 Z" ${o(topFill)}/>
         <path d="M68 138 L94 138 M68 156 L95 156 M106 138 L132 138 M105 156 L132 156" stroke="${shade(top, -0.3)}" stroke-width="2"/>` + belly;
      case 'agbada': return legs(196, 220) + slippers + neck +
        `<path d="M70 116 Q100 108 130 116 L170 206 Q100 216 30 206 Z" ${o(topFill)}/>
         <path d="M84 116 Q100 150 116 116" fill="none" stroke="#f1c40f" stroke-width="4"/>
         <path d="M90 130 Q100 160 110 130" fill="none" stroke="#f1c40f" stroke-width="2.5"/>
         <path d="M44 196 Q60 160 72 130 M156 196 Q140 160 128 130" fill="none" stroke="${shade(top, -0.3)}" stroke-width="3"/>` + belly;
      case 'kaftan': return legs(200, 220) + slippers + neck +
        `<path d="M64 122 Q66 112 100 110 Q134 112 136 122 L142 206 Q100 214 58 206 Z" ${o(topFill)}/>
         <path d="M88 112 L100 140 L112 112" fill="none" stroke="#c9a227" stroke-width="3.5"/>
         <path d="M100 140 L100 200" stroke="#c9a227" stroke-width="2.5" stroke-dasharray="5 4"/>` + belly;
      case 'wrapper': return legs(204, 220) + slippers + neck +
        `<path d="M64 122 Q66 112 100 110 Q134 112 136 122 L136 158 Q100 164 64 158 Z" ${o(topFill)}/>
         <path d="M84 112 Q100 126 116 112" fill="${skin}" stroke="${INK}" stroke-width="2.5"/>
         <path d="M60 154 Q100 146 140 154 L146 210 Q100 218 54 210 Z" ${o(s.pattern === 'ankara' ? `url(#${pat}b)` : bottom)}/>
         <path d="M108 154 L120 176 L110 178" fill="none" stroke="${INK}" stroke-width="2.5"/>` + belly;
      case 'dress': return legs(196, 220) + shoes + neck +
        `<path d="M68 120 Q70 112 100 110 Q130 112 132 120 L144 200 Q100 208 56 200 Z" ${o(topFill)}/>
         <path d="M84 112 Q100 128 116 112" fill="${skin}" stroke="${INK}" stroke-width="2.5"/>
         <path d="M72 160 Q100 166 128 160" fill="none" stroke="${shade(top, -0.3)}" stroke-width="3"/>`;
      default: return legs(176, 220) + shoes + neck + `<path d="M64 122 Q66 112 100 110 Q134 112 136 122 L138 180 Q100 186 62 180 Z" ${o(topFill)}/>`;
    }
  }

  function arms(s) {
    const skin = s.skin;
    const long = ['hoodie', 'jacket', 'suit', 'shirt', 'uniform', 'kaftan', 'agbada', 'vest'].includes(s.body);
    const sleeve = s.body === 'vest' ? '#dfe6ee' : s.body === 'wrapper' && s.pattern === 'ankara' ? s.top : s.top;
    const armFill = long ? sleeve : skin;
    if (s.body === 'agbada') {
      return `<circle cx="58" cy="176" r="9" ${o(skin)}/><circle cx="144" cy="164" r="9" ${o(skin)}/>`;
    }
    const left = `<path d="M66 124 Q50 146 56 176" fill="none" stroke="${INK}" stroke-width="${16 + SW * 2}" stroke-linecap="round"/><path d="M66 124 Q50 146 56 176" fill="none" stroke="${armFill}" stroke-width="16" stroke-linecap="round"/>`;
    const right = `<path d="M134 124 Q152 140 146 162" fill="none" stroke="${INK}" stroke-width="${16 + SW * 2}" stroke-linecap="round"/><path d="M134 124 Q152 140 146 162" fill="none" stroke="${armFill}" stroke-width="16" stroke-linecap="round"/>`;
    const hands = `<circle cx="56" cy="180" r="9" ${o(skin)}/><circle cx="146" cy="166" r="9" ${o(skin)}/>`;
    return left + right + hands;
  }

  /* ---------------- props ---------------- */
  function propBack(s) {
    if (s.prop === 'ringlight' || s.back === 'ringlight') return `<line x1="162" y1="120" x2="162" y2="226" stroke="${INK}" stroke-width="4"/><circle cx="162" cy="96" r="26" fill="none" stroke="${INK}" stroke-width="12"/><circle cx="162" cy="96" r="26" fill="none" stroke="#fffbe6" stroke-width="7"/><circle cx="162" cy="96" r="34" fill="#fffbe6" opacity=".2"/>`;
    if (s.prop === 'staff') return `<line x1="152" y1="60" x2="152" y2="226" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><line x1="152" y1="60" x2="152" y2="226" stroke="#8b5a2b" stroke-width="5" stroke-linecap="round"/><circle cx="152" cy="58" r="8" ${o('#c9a227')}/>`;
    return '';
  }

  function propFront(s) {
    switch (s.prop) {
      case 'laptop': return `<g transform="rotate(-8 150 160)"><rect x="128" y="132" width="50" height="34" rx="4" ${o('#b8c2cc')}/><rect x="133" y="137" width="40" height="24" rx="2" fill="#3fd0ff" opacity=".9"/><circle cx="153" cy="149" r="5" fill="#f2b705"/><rect x="122" y="166" width="62" height="8" rx="3" ${o('#9aa5b0')}/></g>`;
      case 'phone': return `<rect x="140" y="146" width="16" height="28" rx="4" ${o('#222')}/><rect x="143" y="150" width="10" height="18" rx="2" fill="#5ec8ff"/>`;
      case 'tickets': return `<rect x="138" y="150" width="26" height="18" rx="2" ${o('#f5e6a8')}/><path d="M142 156 L160 156 M142 161 L156 161" stroke="${INK}" stroke-width="2"/>`;
      case 'cash': return `<g transform="rotate(-15 150 160)"><rect x="136" y="148" width="30" height="16" rx="2" ${o('#6ab04c')}/><rect x="140" y="144" width="30" height="16" rx="2" ${o('#e84393')}/><circle cx="155" cy="152" r="4" fill="none" stroke="${INK}" stroke-width="1.5"/></g>`;
      case 'ticketpad': return `<rect x="136" y="144" width="26" height="32" rx="2" ${o('#fff')}/><path d="M140 152 L158 152 M140 158 L158 158 M140 164 L152 164" stroke="#2c3e50" stroke-width="2"/><line x1="162" y1="140" x2="170" y2="170" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
      case 'koboko': return `<path d="M146 166 Q176 150 178 110 Q180 90 168 80" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M146 166 Q176 150 178 110 Q180 90 168 80" fill="none" stroke="#8b5a2b" stroke-width="3" stroke-linecap="round"/>`;
      case 'baton': return `<line x1="146" y1="170" x2="170" y2="118" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><line x1="146" y1="170" x2="170" y2="118" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/>`;
      case 'wheel': return `<circle cx="150" cy="160" r="24" fill="none" stroke="${INK}" stroke-width="10"/><circle cx="150" cy="160" r="24" fill="none" stroke="#3a3a3a" stroke-width="6"/><path d="M150 160 L150 136 M150 160 L130 172 M150 160 L170 172" stroke="#3a3a3a" stroke-width="5"/><circle cx="150" cy="160" r="6" ${o('#c0392b')}/>`;
      case 'keys': return `<circle cx="148" cy="174" r="7" fill="none" stroke="${INK}" stroke-width="3"/><path d="M150 180 L156 196 M144 180 L140 196 M152 178 L164 190" stroke="#c9a227" stroke-width="4" stroke-linecap="round"/>`;
      case 'ladle': return `<line x1="146" y1="170" x2="168" y2="96" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><line x1="146" y1="170" x2="168" y2="96" stroke="#c7ccd1" stroke-width="4" stroke-linecap="round"/><path d="M156 96 Q168 70 182 92 Q176 104 156 96 Z" ${o('#c7ccd1')}/>`;
      case 'briefcase': return `<rect x="132" y="162" width="36" height="26" rx="3" ${o('#6d4c2f')}/><path d="M142 162 L142 156 L158 156 L158 162" fill="none" stroke="${INK}" stroke-width="3"/><rect x="146" y="170" width="8" height="5" fill="#c9a227"/>`;
      case 'envelope': return `<rect x="134" y="150" width="32" height="22" rx="2" ${o('#c69c6d')}/><path d="M134 150 L150 164 L166 150" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
      case 'bottle': return `<path d="M146 176 L146 140 Q146 132 150 128 L150 116 L156 116 L156 128 Q160 132 160 140 L160 176 Z" ${o('#1e6b3a')}/><rect x="146" y="146" width="14" height="12" fill="#f1c40f"/><path d="M152 112 l-4 -8 M156 112 l5 -9 M150 110 l-8 -2" stroke="#f1c40f" stroke-width="2"/>`;
      case 'badge': return `<rect x="138" y="152" width="22" height="28" rx="3" ${o('#f5f5f5')}/><rect x="142" y="156" width="14" height="10" fill="#2c3e50"/><path d="M142 172 L156 172" stroke="${INK}" stroke-width="2"/>`;
      case 'fan': return `<path d="M146 166 L126 128 Q150 112 174 128 Z" ${o('#f39c12')}/><path d="M146 166 L136 126 M146 166 L150 120 M146 166 L164 126" stroke="${INK}" stroke-width="2"/>`;
      case 'sachets': return `<ellipse cx="100" cy="22" rx="46" ry="10" ${o('#c0392b')}/>
        <path d="M70 18 q6 -16 12 0 M88 16 q6 -18 12 0 M106 16 q6 -18 12 0 M122 18 q5 -14 10 0" fill="#d6efff" stroke="${INK}" stroke-width="2.5"/>`;
      default: return '';
    }
  }

  /* ---------------- special bosses ---------------- */
  function transformer() {
    return `<line x1="100" y1="230" x2="100" y2="40" stroke="${INK}" stroke-width="14"/><line x1="100" y1="230" x2="100" y2="40" stroke="#6b5440" stroke-width="9"/>
      <path d="M30 46 L170 46" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M20 50 Q60 70 100 52 M100 52 Q140 70 186 50" fill="none" stroke="${INK}" stroke-width="2.5"/>
      <rect x="48" y="78" width="104" height="110" rx="14" ${o('#8a9399')}/>
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="${40 - (i % 2) * 2}" y="${92 + i * 18}" width="12" height="10" rx="2" ${o('#6f777c')}/><rect x="${148 + (i % 2) * 2}" y="${92 + i * 18}" width="12" height="10" rx="2" ${o('#6f777c')}/>`).join('')}
      <rect x="62" y="70" width="12" height="14" ${o('#c9ccce')}/><rect x="94" y="66" width="12" height="18" ${o('#c9ccce')}/><rect x="126" y="70" width="12" height="14" ${o('#c9ccce')}/>
      <path d="M68 112 L90 120 M132 112 L110 120" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="82" cy="128" r="10" fill="#ffe14a" stroke="${INK}" stroke-width="3"/><circle cx="118" cy="128" r="10" fill="#ffe14a" stroke="${INK}" stroke-width="3"/>
      <circle cx="82" cy="128" r="18" fill="#ffe14a" opacity=".25"/><circle cx="118" cy="128" r="18" fill="#ffe14a" opacity=".25"/>
      <path d="M78 160 L86 152 L94 160 L102 152 L110 160 L118 152 L124 160" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="70" y="172" width="60" height="12" rx="2" fill="#f1c40f" stroke="${INK}" stroke-width="2"/><text x="100" y="182" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="9" fill="${INK}">DANGER</text>
      <path class="spark" d="M30 40 l8 10 -6 2 10 12" fill="none" stroke="#ffe14a" stroke-width="4" stroke-linecap="round"/>
      <path class="spark" d="M170 36 l-8 12 7 1 -9 12" fill="none" stroke="#ffe14a" stroke-width="4" stroke-linecap="round"/>`;
  }

  function sapa() {
    return `<defs><radialGradient id="sapaG" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#5b2a86"/><stop offset="1" stop-color="#1b0b2b"/></radialGradient></defs>
      <circle cx="100" cy="110" r="96" fill="#7d3cff" opacity=".12"/>
      <path d="M40 120 Q34 30 100 24 Q166 30 160 120 L164 214 Q150 200 140 220 Q126 198 114 222 Q100 198 86 222 Q74 198 60 220 Q50 200 36 214 Z" fill="url(#sapaG)" stroke="${INK}" stroke-width="4"/>
      <path d="M62 88 Q78 76 92 90 Q78 102 62 88 Z M108 90 Q122 76 138 88 Q122 102 108 90 Z" fill="#f5f0ff"/>
      <circle cx="80" cy="90" r="4" fill="#1b0b2b"/><circle cx="122" cy="90" r="4" fill="#1b0b2b"/>
      <path d="M76 132 Q100 118 124 132 Q118 160 100 162 Q82 160 76 132 Z" fill="#0d0516" stroke="#f5f0ff" stroke-width="2"/>
      <path d="M84 134 L88 142 L92 134 L96 142 L100 134 L104 142 L108 134 L112 142 L116 134" fill="none" stroke="#f5f0ff" stroke-width="2"/>
      <path d="M44 150 Q20 150 18 176 M156 150 Q180 150 184 176" fill="none" stroke="#3a1a5a" stroke-width="12" stroke-linecap="round"/>
      <path d="M60 176 L76 176 L72 196 L64 196 Z M124 176 L140 176 L136 196 L128 196 Z" fill="#f5f0ff" stroke="${INK}" stroke-width="2.5"/>
      <g class="float-a"><rect x="4" y="60" width="30" height="16" rx="2" fill="#6ab04c" stroke="${INK}" stroke-width="2" transform="rotate(-20 19 68)"/><path d="M8 62 L16 72" stroke="${INK}" stroke-width="2"/></g>
      <g class="float-b"><rect x="168" y="40" width="28" height="16" rx="2" fill="#e84393" stroke="${INK}" stroke-width="2" transform="rotate(16 182 48)"/></g>
      <g class="float-a"><path d="M170 120 L196 120 L194 140 L172 140 Z" fill="#8b5a2b" stroke="${INK}" stroke-width="2.5"/><path d="M174 120 L180 112 L188 112 L192 120" fill="none" stroke="${INK}" stroke-width="2"/></g>`;
  }

  function goSlow() {
    const car = (x, y, c, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="0" y="10" width="64" height="26" rx="8" ${o(c)}/><path d="M10 10 L18 -6 L46 -6 L54 10 Z" ${o(shade(c, 0.2))}/><circle cx="14" cy="38" r="7" ${o('#222')}/><circle cx="50" cy="38" r="7" ${o('#222')}/></g>`;
    return `${car(-6, 110, '#c0392b', 0.9)}${car(130, 104, '#2980b9', 0.9)}${car(20, 150, '#8e44ad', 1)}${car(118, 150, '#27ae60', 1)}
      <rect x="44" y="60" width="112" height="120" rx="16" ${o('#f2b705')}/>
      <rect x="44" y="96" width="112" height="8" fill="${INK}"/><rect x="44" y="112" width="112" height="8" fill="${INK}"/>
      <rect x="58" y="70" width="84" height="22" rx="4" fill="#bfe3ff" stroke="${INK}" stroke-width="3"/>
      <path d="M66 74 L82 80 M134 74 L118 80" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="68" cy="140" r="12" fill="#fff6b0" stroke="${INK}" stroke-width="3"/><circle cx="132" cy="140" r="12" fill="#fff6b0" stroke="${INK}" stroke-width="3"/>
      <circle cx="68" cy="140" r="5" fill="${INK}"/><circle cx="132" cy="140" r="5" fill="${INK}"/>
      <rect x="82" y="150" width="36" height="16" rx="3" fill="#333" stroke="${INK}" stroke-width="3"/><path d="M86 154 L114 154 M86 158 L114 158 M86 162 L114 162" stroke="#888" stroke-width="1.5"/>
      <text x="100" y="56" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="11" fill="#fff" stroke="${INK}" stroke-width=".8">OSHODI → CMS</text>
      <g class="spark"><path d="M20 70 L4 62 M22 80 L2 82 M180 68 L196 60 M180 80 L198 82" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`;
  }

  /* ---------------- assemble a character ---------------- */
  function character(spec, opts) {
    opts = opts || {};
    const s = Object.assign({ skin: '#7a4a2c', expr: 'neutral' }, spec);
    const id = 'p' + ++uid;
    const flip = opts.flip && !s.special ? `transform="translate(200 0) scale(-1 1)"` : '';
    s._flip = !!opts.flip;
    let inner;
    if (s.special === 'transformer') inner = transformer();
    else if (s.special === 'sapa') inner = sapa();
    else if (s.special === 'goSlow') inner = goSlow();
    else {
      const pattern = s.pattern === 'ankara'
        ? `<defs>
            <pattern id="${id}" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="${s.top}"/><circle cx="9" cy="9" r="5" fill="${shade(s.top, 0.35)}" stroke="${INK}" stroke-width="1"/><circle cx="0" cy="0" r="3" fill="#f2b705"/><circle cx="18" cy="18" r="3" fill="#f2b705"/></pattern>
            <pattern id="${id}b" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${s.bottom}"/><path d="M0 11 L11 0 L22 11 L11 22 Z" fill="${shade(s.bottom, 0.3)}" stroke="${INK}" stroke-width="1"/><circle cx="11" cy="11" r="3" fill="#f2b705"/></pattern>
           </defs>`
        : '';
      const bulky = s.bulky ? 'transform="translate(100 160) scale(1.18 1.04) translate(-100 -160)"' : '';
      inner = pattern + propBack(s) + hairBack(s) +
        `<g ${bulky}>${torso(s, id)}${arms(s)}</g>` +
        `<ellipse cx="60" cy="80" rx="7" ry="10" ${o(s.skin)}/><ellipse cx="140" cy="80" rx="7" ry="10" ${o(s.skin)}/>` +
        `<ellipse cx="100" cy="74" rx="41" ry="44" ${o(s.skin)}/>` +
        face(s) + faceExtras(s) + hairFront(s) + propFront(s);
    }
    return `<svg class="char-svg" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="100" cy="230" rx="62" ry="9" fill="#000" opacity=".35"/>
      <g ${flip}>${inner}</g></svg>`;
  }

  /* ---------------- stages ---------------- */
  function buildings(seed, count, yBase, hMin, hMax, color, windowColor, litChance) {
    let x = -20;
    let out = '';
    let r = seed;
    const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < count && x < 1240; i++) {
      const w = 50 + rand() * 70;
      const h = hMin + rand() * (hMax - hMin);
      out += `<rect x="${x.toFixed(0)}" y="${(yBase - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${color}"/>`;
      if (rand() < 0.4) out += `<rect x="${(x + w * 0.3).toFixed(0)}" y="${(yBase - h - 14).toFixed(0)}" width="18" height="14" fill="${color}"/>`;
      if (windowColor) {
        for (let wy = yBase - h + 12; wy < yBase - 16; wy += 18) {
          for (let wx = x + 8; wx < x + w - 12; wx += 16) {
            if (rand() < litChance) out += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="7" height="9" fill="${windowColor}"/>`;
          }
        }
      }
      x += w + 4 + rand() * 10;
    }
    return out;
  }

  function danfo(x, y, s) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <rect x="0" y="0" width="200" height="80" rx="14" fill="#f2b705" stroke="${INK}" stroke-width="4"/>
      <rect x="0" y="44" width="200" height="6" fill="${INK}"/><rect x="0" y="56" width="200" height="6" fill="${INK}"/>
      ${[14, 54, 94, 134].map((wx) => `<rect x="${wx}" y="10" width="32" height="24" rx="3" fill="#2c3e50" stroke="${INK}" stroke-width="3"/>`).join('')}
      <rect x="172" y="10" width="20" height="30" rx="3" fill="#2c3e50" stroke="${INK}" stroke-width="3"/>
      <circle cx="44" cy="84" r="16" fill="#222" stroke="${INK}" stroke-width="4"/><circle cx="160" cy="84" r="16" fill="#222" stroke="${INK}" stroke-width="4"/>
      <circle cx="44" cy="84" r="6" fill="#888"/><circle cx="160" cy="84" r="6" fill="#888"/></g>`;
  }

  function palm(x, y, s) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 Q6 -60 -4 -130" fill="none" stroke="#3b2a1f" stroke-width="10"/>
      <path d="M-4 -130 Q-50 -140 -70 -110 M-4 -130 Q40 -150 70 -116 M-4 -130 Q-30 -170 -60 -168 M-4 -130 Q20 -175 50 -170 M-4 -130 Q-4 -160 4 -180" fill="none" stroke="#1d4d3a" stroke-width="12" stroke-linecap="round"/></g>`;
  }

  function stage(name) {
    let sky, far, mid, near, ground;
    if (name === 'lekki') {
      sky = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1f4a"/><stop offset=".55" stop-color="#7a3e8f"/><stop offset="1" stop-color="#f08a5d"/></linearGradient>`;
      far = buildings(7, 30, 430, 120, 300, '#2a2550', '#ffd98a', 0.18);
      mid = `<g opacity=".95">
          <rect x="360" y="270" width="480" height="26" rx="6" fill="#d9d4cc" stroke="${INK}" stroke-width="4"/>
          ${[380, 470, 560, 650, 740].map((x) => `<rect x="${x}" y="296" width="18" height="140" fill="#bdb6aa" stroke="${INK}" stroke-width="3"/><rect x="${x + 22}" y="360" width="56" height="40" rx="4" fill="#3a6ea5" stroke="${INK}" stroke-width="3" opacity=".9"/>`).join('')}
          <text x="600" y="289" text-anchor="middle" font-family="Bungee, Arial Black, sans-serif" font-size="18" fill="${INK}">TOLL PLAZA</text></g>
          ${palm(120, 450, 1.1)}${palm(1080, 450, 1.25)}${palm(980, 450, 0.85)}`;
      near = [140, 420, 760, 1060].map((x) => `<line x1="${x}" y1="460" x2="${x}" y2="330" stroke="#444" stroke-width="6"/><path d="M${x} 330 q20 -6 34 4" fill="none" stroke="#444" stroke-width="6"/><circle cx="${x + 34}" cy="338" r="7" fill="#fff4c2"/><circle cx="${x + 34}" cy="338" r="22" fill="#fff4c2" opacity=".18"/>`).join('');
      ground = `<rect x="0" y="440" width="1200" height="160" fill="#2b2d38"/><rect x="0" y="440" width="1200" height="10" fill="#9a9aa6"/>
        ${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 110 + 20}" y="520" width="60" height="6" fill="#f5f5f5" opacity=".7"/>`).join('')}`;
    } else if (name === 'eko') {
      sky = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070f"/><stop offset=".6" stop-color="#101a3a"/><stop offset="1" stop-color="#1f3a5f"/></linearGradient>`;
      far = `<circle cx="930" cy="62" r="40" fill="#f4f1de"/><circle cx="916" cy="54" r="40" fill="#101a3a" opacity=".35"/>` +
        buildings(11, 26, 400, 180, 340, '#121a33', '#7fdcff', 0.22) +
        `<rect x="520" y="70" width="70" height="330" fill="#16213f"/><rect x="540" y="40" width="30" height="30" fill="#16213f"/><rect x="552" y="10" width="6" height="30" fill="#e74c3c"/>
         ${Array.from({ length: 14 }, (_, i) => `<rect x="528" y="${90 + i * 20}" width="54" height="4" fill="#ff5ec4" opacity=".55"/>`).join('')}`;
      mid = `<rect x="0" y="400" width="1200" height="48" fill="#0e2a4a"/>
        ${Array.from({ length: 24 }, (_, i) => `<rect x="${i * 52}" y="${410 + (i % 3) * 10}" width="${18 + (i % 4) * 8}" height="3" fill="#7fdcff" opacity=".35"/>`).join('')}`;
      near = `${palm(80, 470, 1.2)}${palm(1130, 470, 1.1)}`;
      ground = `<rect x="0" y="448" width="1200" height="152" fill="#cdb894"/><rect x="0" y="448" width="1200" height="12" fill="#a8946e"/>
        ${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 80}" y="490" width="78" height="2" fill="#a8946e"/>`).join('')}`;
    } else {
      // Yaba (default)
      sky = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2c5a"/><stop offset=".5" stop-color="#e36d4c"/><stop offset="1" stop-color="#f6c46b"/></linearGradient>`;
      far = `<circle cx="860" cy="250" r="70" fill="#ffe08a" opacity=".9"/>` + buildings(3, 30, 410, 80, 220, '#6b3a4a', '#ffd27a', 0.12);
      mid = `<line x1="200" y1="150" x2="200" y2="420" stroke="${INK}" stroke-width="6"/><line x1="340" y1="150" x2="340" y2="420" stroke="${INK}" stroke-width="6"/>
        <rect x="160" y="60" width="220" height="90" fill="#f2f2f2" stroke="${INK}" stroke-width="4"/><text x="270" y="100" text-anchor="middle" font-family="Bungee, Arial Black, sans-serif" font-size="26" fill="#c0392b">BUY DATA</text><text x="270" y="132" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="${INK}">2GB ₦500 · DIAL *ABEG#</text>
        ${[620, 700, 780].map((x, i) => `<path d="M${x - 40} 380 Q${x} 330 ${x + 40} 380 Z" fill="${['#e74c3c', '#2980b9', '#27ae60'][i]}" stroke="${INK}" stroke-width="3"/><line x1="${x}" y1="380" x2="${x}" y2="430" stroke="${INK}" stroke-width="4"/>`).join('')}
        ${danfo(880, 350, 0.75)}`;
      near = `${[60, 520, 1000].map((x) => `<line x1="${x}" y1="450" x2="${x}" y2="190" stroke="#3b2a1f" stroke-width="10"/><line x1="${x - 30}" y1="206" x2="${x + 30}" y2="206" stroke="#3b2a1f" stroke-width="8"/>`).join('')}
        <path d="M60 210 Q290 260 520 210 Q760 260 1000 210 Q1100 230 1220 214" fill="none" stroke="${INK}" stroke-width="3"/>
        <path d="M60 222 Q290 280 520 222 Q760 280 1000 222 Q1100 246 1220 228" fill="none" stroke="${INK}" stroke-width="2"/>`;
      ground = `<rect x="0" y="440" width="1200" height="160" fill="#3a3530"/><rect x="0" y="440" width="1200" height="8" fill="#6b5f52"/>
        ${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 110 + 30}" y="520" width="60" height="6" fill="#f2b705" opacity=".8"/>`).join('')}`;
    }
    return `<svg class="stage-svg" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>${sky}</defs><rect width="1200" height="600" fill="url(#sky)"/>
      <g class="stage-far">${far}</g><g class="stage-mid">${mid}</g><g class="stage-near">${near}</g>${ground}</svg>`;
  }

  return { character, stage, shade };
})();
