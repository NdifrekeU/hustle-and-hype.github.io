/* =========================================================================
   ui/cardArt.js — illustrated card art, drawn as SVG.

   Every card gets a small scene: a backdrop (office, market, feed, …),
   a main illustrated icon, an optional badge icon and an optional effect
   overlay (flames, sparkles, speed lines…). The look matches the
   characters: thick ink outlines, flat colour, one highlight.
   Mapping lives at the bottom (ART), keyed by card id.
   ========================================================================= */
window.HH = window.HH || {};

HH.CardArt = (function () {
  const INK = '#1d140c';
  const o = (fill, w) => `fill="${fill}" stroke="${INK}" stroke-width="${w || 4}" stroke-linejoin="round" stroke-linecap="round"`;
  const line = (d, w, c) => `<path d="${d}" fill="none" stroke="${c || INK}" stroke-width="${w || 4}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const hi = (d) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>`;

  /* ---------------- icons (100 × 100 box) ---------------- */
  const I = {
    phone: () => `<rect x="30" y="8" width="40" height="84" rx="9" ${o('#2b2b33')}/><rect x="35" y="17" width="30" height="62" rx="3" fill="#5ec8ff"/><rect x="40" y="24" width="20" height="5" rx="2" fill="#fff" opacity=".8"/><rect x="40" y="34" width="14" height="4" rx="2" fill="#fff" opacity=".6"/><circle cx="50" cy="85" r="3" fill="#888"/>`,
    laptop: () => `<path d="M18 22 h64 v42 h-64 z" ${o('#b8c2cc')}/><rect x="24" y="28" width="52" height="30" fill="#3fd0ff"/><circle cx="50" cy="43" r="6" fill="#f2b705"/><path d="M8 66 h84 l-6 12 h-72 z" ${o('#9aa5b0')}/>`,
    flame: () => `<path d="M50 6 C62 26 82 36 76 64 C72 84 56 92 50 92 C38 92 22 84 22 62 C22 46 34 40 36 26 C44 36 46 44 50 46 C52 32 48 18 50 6 Z" ${o('#ff7a1a')}/><path d="M50 50 C58 60 64 66 60 78 C56 86 44 86 40 78 C36 68 46 62 50 50 Z" fill="#ffd23f"/>`,
    pray: () => `<path d="M48 16 C40 30 30 44 30 62 L28 86 L48 86 L50 40 Z" ${o('#8a5a3b')}/><path d="M52 16 C60 30 70 44 70 62 L72 86 L52 86 L50 40 Z" ${o('#7a4a2c')}/>${line('M24 88 h52', 5)}`,
    board: () => `<path d="M30 92 L40 70 M70 92 L60 70 M50 70 v20" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><rect x="12" y="12" width="76" height="58" rx="3" ${o('#f5f5f0')}/><rect x="22" y="44" width="10" height="18" fill="#e2553a"/><rect x="38" y="34" width="10" height="28" fill="#f2b705"/><rect x="54" y="24" width="10" height="38" fill="#2e9e68"/>${line('M20 24 L70 18', 3, '#5fb2dc')}`,
    alarm: () => `<circle cx="50" cy="54" r="34" ${o('#e74c3c')}/><circle cx="50" cy="54" r="24" ${o('#fff', 3)}/>${line('M50 54 V38 M50 54 L62 60', 4)}<circle cx="24" cy="20" r="10" ${o('#f2b705')}/><circle cx="76" cy="20" r="10" ${o('#f2b705')}/>${line('M30 86 L24 94 M70 86 L76 94', 5)}`,
    target: () => `<circle cx="50" cy="50" r="40" ${o('#fff')}/><circle cx="50" cy="50" r="28" ${o('#e2553a')}/><circle cx="50" cy="50" r="16" ${o('#fff')}/><circle cx="50" cy="50" r="6" fill="#e2553a"/>${line('M50 50 L88 12', 5)}<path d="M80 10 L92 8 L90 20" ${o('#f2b705', 3)}/>`,
    bolt: () => `<path d="M58 4 L22 56 H46 L38 96 L78 40 H54 Z" ${o('#ffd23f')}/>${hi('M52 14 L34 46')}`,
    spool: () => `<rect x="26" y="12" width="48" height="10" rx="3" ${o('#c69c6d')}/><rect x="26" y="78" width="48" height="10" rx="3" ${o('#c69c6d')}/><rect x="32" y="22" width="36" height="56" ${o('#e84393')}/>${line('M34 34 H66 M34 46 H66 M34 58 H66 M34 70 H66', 2, '#ff9cc8')}${line('M68 60 Q90 70 80 92', 3, '#e84393')}`,
    retweet: () => `<path d="M20 44 V30 a8 8 0 0 1 8 -8 H66 V12 L84 30 L66 48 V38 H36 V44 Z" ${o('#2e9e68')}/><path d="M80 56 V70 a8 8 0 0 1 -8 8 H34 V88 L16 70 L34 52 V62 H64 V56 Z" ${o('#2e9e68')}/>`,
    bubble: () => `<path d="M14 20 a10 10 0 0 1 10 -10 H76 a10 10 0 0 1 10 10 V58 a10 10 0 0 1 -10 10 H44 L26 86 L30 68 H24 a10 10 0 0 1 -10 -10 Z" ${o('#fff')}/>${line('M28 30 H72 M28 44 H64 M28 56 H52', 4, '#888')}`,
    chartUp: () => `<rect x="10" y="10" width="80" height="80" rx="6" ${o('#f5f5f0')}/>${line('M20 74 L40 54 L54 62 L80 28', 6, '#2e9e68')}<path d="M68 26 L82 24 L80 38" ${o('#2e9e68', 3)}/>`,
    chartDown: () => `<rect x="10" y="10" width="80" height="80" rx="6" ${o('#f5f5f0')}/>${line('M20 26 L40 46 L54 38 L80 72', 6, '#e2553a')}<path d="M68 74 L82 76 L80 62" ${o('#e2553a', 3)}/>`,
    people: () => `<circle cx="30" cy="36" r="13" ${o('#7a4a2c')}/><circle cx="70" cy="36" r="13" ${o('#5e3720')}/><circle cx="50" cy="30" r="15" ${o('#8a5a3b')}/><path d="M10 88 Q12 56 30 54 Q44 56 46 72 Z" ${o('#5fb2dc')}/><path d="M90 88 Q88 56 70 54 Q56 56 54 72 Z" ${o('#2e9e68')}/><path d="M26 92 Q30 50 50 50 Q70 50 74 92 Z" ${o('#e2553a')}/>`,
    coffee: () => `<path d="M20 34 H72 L66 86 H26 Z" ${o('#f5f5f0')}/><path d="M72 44 Q92 46 86 62 Q82 72 68 70" fill="none" stroke="${INK}" stroke-width="5"/><rect x="24" y="44" width="44" height="16" fill="#8b5a2b"/>${line('M36 26 Q30 18 38 10 M52 26 Q46 18 54 10', 3, '#ccc')}`,
    camera: () => `<rect x="10" y="28" width="80" height="56" rx="8" ${o('#2b2b33')}/><rect x="34" y="18" width="30" height="14" rx="3" ${o('#2b2b33')}/><circle cx="50" cy="56" r="20" ${o('#3fd0ff')}/><circle cx="50" cy="56" r="9" fill="#14306b"/><circle cx="44" cy="50" r="4" fill="#fff"/><circle cx="78" cy="38" r="4" fill="#f2b705"/>`,
    envelope: () => `<rect x="10" y="24" width="80" height="56" rx="5" ${o('#f5f5f0')}/>${line('M12 28 L50 58 L88 28', 4)}<circle cx="80" cy="24" r="10" ${o('#e2553a', 3)}/>`,
    spamMail: () => `<rect x="10" y="24" width="80" height="56" rx="5" ${o('#e9e1c9')}/>${line('M12 28 L50 58 L88 28', 4)}<path d="M74 6 L90 34 H58 Z" ${o('#f2b705', 3)}/>${line('M74 16 V24', 4)}<circle cx="74" cy="29" r="2" fill="${INK}"/>`,
    cash: () => `<g transform="rotate(-12 50 50)"><rect x="12" y="34" width="72" height="38" rx="3" ${o('#6ab04c')}/><circle cx="48" cy="53" r="10" fill="none" stroke="${INK}" stroke-width="3"/></g><rect x="18" y="26" width="72" height="38" rx="3" ${o('#e84393')}/><circle cx="54" cy="45" r="10" fill="none" stroke="${INK}" stroke-width="3"/><text x="54" y="51" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="16" fill="${INK}">₦</text>`,
    bug: () => `<ellipse cx="50" cy="58" rx="24" ry="30" ${o('#2e9e68')}/><circle cx="50" cy="26" r="12" ${o('#1e6b45')}/>${line('M50 30 V88', 3)}${line('M26 48 L10 40 M26 62 L8 62 M28 76 L12 86 M74 48 L90 40 M74 62 L92 62 M72 76 L88 86 M44 16 L38 4 M56 16 L62 4', 4)}<circle cx="40" cy="50" r="4" fill="${INK}"/><circle cx="60" cy="68" r="4" fill="${INK}"/>`,
    cross: () => `<circle cx="50" cy="50" r="40" ${o('#e2553a')}/>${line('M32 32 L68 68 M68 32 L32 68', 10, '#fff')}`,
    palm: () => `${line('M50 92 Q56 60 48 32', 8, '#6b4a2c')}<path d="M48 32 Q20 22 8 40 Q26 30 48 32 Q36 8 14 10 Q38 16 48 32 Q66 6 88 14 Q64 16 48 32 Q78 26 92 44 Q70 30 48 32 Z" ${o('#2e9e68', 3)}/>`,
    sneaker: () => `<path d="M8 62 Q10 40 24 38 L40 44 L52 30 Q70 38 76 50 Q92 54 92 66 V74 H8 Z" ${o('#f5f5f0')}/><path d="M8 66 H92 V78 H8 Z" ${o('#e2553a')}/>${line('M42 46 L50 52 M48 40 L56 46', 3)}${line('M2 30 H20 M0 42 H14', 4, '#fff')}`,
    rocket: () => `<path d="M50 4 C70 20 72 46 66 66 H34 C28 46 30 20 50 4 Z" ${o('#f5f5f0')}/><circle cx="50" cy="34" r="9" ${o('#5fb2dc', 3)}/><path d="M34 52 L18 72 L36 68 Z M66 52 L82 72 L64 68 Z" ${o('#e2553a')}/><path d="M38 68 Q50 98 62 68 Z" ${o('#ffd23f', 3)}/>`,
    seedling: () => `<path d="M24 90 H76 L70 70 H30 Z" ${o('#c0703a')}/>${line('M50 70 V36', 5, '#2e9e68')}<path d="M50 44 Q24 46 18 22 Q42 18 50 44 Z" ${o('#6fdc8c')}/><path d="M50 38 Q72 36 82 12 Q56 10 50 38 Z" ${o('#6fdc8c')}/>`,
    megaphone: () => `<path d="M16 40 H32 L74 16 V84 L32 60 H16 Z" ${o('#f2b705')}/><rect x="28" y="60" width="12" height="24" rx="3" ${o('#c99a00')}/>${line('M82 34 Q92 50 82 66', 4)}${line('M86 22 Q102 50 86 78', 3)}`,
    robot: () => `<rect x="20" y="26" width="60" height="50" rx="10" ${o('#b8c2cc')}/>${line('M50 26 V12', 4)}<circle cx="50" cy="10" r="5" ${o('#e2553a', 3)}/><circle cx="36" cy="46" r="8" ${o('#3fd0ff', 3)}/><circle cx="64" cy="46" r="8" ${o('#3fd0ff', 3)}/><rect x="34" y="60" width="32" height="7" rx="3" fill="${INK}"/><rect x="10" y="40" width="10" height="20" rx="4" ${o('#9aa5b0', 3)}/><rect x="80" y="40" width="10" height="20" rx="4" ${o('#9aa5b0', 3)}/>`,
    hammer: () => `<g transform="rotate(-30 50 50)"><rect x="44" y="34" width="12" height="58" rx="4" ${o('#8b5a2b')}/><rect x="20" y="14" width="60" height="24" rx="5" ${o('#7f8c8d')}/></g>`,
    boat: () => `<path d="M10 60 H90 L76 82 H24 Z" ${o('#e2553a')}/><rect x="30" y="40" width="40" height="20" ${o('#f5f5f0')}/><rect x="40" y="24" width="12" height="16" ${o('#2c3e50')}/>${line('M4 90 Q16 84 28 90 Q40 96 52 90 Q64 84 76 90 Q88 96 96 90', 3, '#5fb2dc')}`,
    cap: () => `<path d="M16 62 Q16 22 52 22 Q84 24 84 62 Z" ${o('#2c3e50')}/><path d="M80 56 Q100 56 98 70 Q86 72 76 66 Z" ${o('#1d2b38')}/><circle cx="52" cy="24" r="4" fill="#f2b705"/><text x="50" y="52" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="16" fill="#f2b705">CEO</text>`,
    flask: () => `<path d="M38 8 H62 V36 L84 82 Q86 92 74 92 H26 Q14 92 16 82 L38 36 Z" ${o('#e9f7ff')}/><path d="M28 68 H72 L80 84 Q80 88 74 88 H26 Q20 88 20 84 Z" fill="#6fdc8c"/><circle cx="42" cy="76" r="4" fill="#fff"/><circle cx="58" cy="70" r="3" fill="#fff"/>`,
    wall: () => `<rect x="8" y="22" width="84" height="64" ${o('#c0703a')}/>${line('M8 44 H92 M8 64 H92 M30 22 V44 M60 22 V44 M18 44 V64 M46 44 V64 M76 44 V64 M32 64 V86 M62 64 V86', 3)}`,
    unicorn: () => `<path d="M30 92 Q20 60 36 40 Q46 26 62 28 Q78 30 84 46 Q88 56 78 60 L66 56 Q56 70 60 92 Z" ${o('#f5f0ff')}/><path d="M62 28 L76 2 L68 30 Z" ${o('#ffd23f', 3)}/><path d="M36 40 Q24 30 30 18 Q40 26 46 32 Q42 20 52 14 Q54 26 58 30" ${o('#e84393', 3)}/><circle cx="70" cy="42" r="4" fill="${INK}"/>`,
    bell: () => `<path d="M24 76 Q24 30 50 24 Q76 30 76 76 Z" ${o('#f2b705')}/><rect x="16" y="74" width="68" height="10" rx="4" ${o('#c99a00')}/><circle cx="50" cy="90" r="6" ${o('#c99a00', 3)}/><circle cx="50" cy="18" r="6" ${o('#c99a00', 3)}/>${hi('M36 64 Q34 42 46 34')}`,
    keyboard: () => `<rect x="6" y="30" width="88" height="44" rx="6" ${o('#2b2b33')}/>${[0, 1, 2].map((r) => [0, 1, 2, 3, 4, 5].map((c) => `<rect x="${13 + c * 13}" y="${36 + r * 11}" width="10" height="8" rx="2" fill="${(r + c) % 3 ? '#5c5c6b' : '#e84393'}"/>`).join('')).join('')}`,
    clapper: () => `<rect x="12" y="38" width="76" height="50" rx="4" ${o('#2b2b33')}/><path d="M12 22 L84 10 L88 28 L16 40 Z" ${o('#f5f5f0')}/>${line('M28 20 L36 36 M48 16 L56 32 M68 13 L76 29', 5)}<text x="50" y="72" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="14" fill="#f2b705">TAKE 1</text>`,
    plane: () => `<path d="M8 56 L92 26 Q98 30 92 36 L58 56 L66 86 L56 88 L42 62 L22 70 L18 80 L10 80 L12 62 Z" ${o('#f5f5f0')}/>${line('M40 48 L30 30 L38 28 L54 44', 3)}`,
    ladle: () => `${line('M30 20 L66 62', 10)}${line('M30 20 L66 62', 5, '#c7ccd1')}<path d="M60 58 Q92 54 90 80 Q84 96 62 88 Q48 78 60 58 Z" ${o('#c7ccd1')}/>`,
    lips: () => `<path d="M10 50 Q30 22 50 38 Q70 22 90 50 Q70 82 50 74 Q30 82 10 50 Z" ${o('#c0392b')}/>${line('M14 50 Q50 58 86 50', 3)}<path d="M66 20 q12 -10 22 0" fill="none" stroke="#fff" stroke-width="3"/>`,
    book: () => `<path d="M14 18 H76 a8 8 0 0 1 8 8 V86 H22 a8 8 0 0 1 -8 -8 Z" ${o('#c0392b')}/><rect x="22" y="76" width="62" height="10" fill="#f5f5f0" stroke="${INK}" stroke-width="3"/><rect x="34" y="30" width="38" height="16" rx="2" fill="#f5f5f0"/><text x="53" y="43" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="11" fill="${INK}">GBESE</text>`,
    books: () => `<rect x="12" y="66" width="76" height="18" rx="3" ${o('#2e9e68')}/><rect x="18" y="46" width="68" height="20" rx="3" ${o('#c0392b')}/><rect x="14" y="26" width="72" height="20" rx="3" ${o('#5fb2dc')}/><rect x="22" y="8" width="60" height="18" rx="3" ${o('#f2b705')}/>`,
    pepper: () => `<path d="M30 30 Q14 60 30 84 Q44 96 62 82 Q86 60 74 30 Q60 16 30 30 Z" ${o('#e2553a')}/><path d="M48 24 Q44 10 56 4" fill="none" stroke="${INK}" stroke-width="6"/><path d="M38 26 Q50 16 64 26 Q52 32 38 26 Z" ${o('#2e9e68', 3)}/>${hi('M34 50 Q30 62 36 74')}`,
    hand: () => `<path d="M24 92 L22 54 Q20 44 28 44 Q34 44 34 52 V26 Q34 18 41 18 Q48 18 48 26 V22 Q48 14 55 14 Q62 14 62 22 V28 Q62 20 69 20 Q76 20 76 28 V60 Q76 82 62 92 Z" ${o('#8a5a3b')}/>${line('M48 26 V50 M62 28 V50', 3)}`,
    clap: () => `<g transform="rotate(-20 40 55)"><path d="M26 90 V40 a7 7 0 0 1 14 0 V30 a7 7 0 0 1 14 0 V86 Z" ${o('#8a5a3b')}/></g><g transform="rotate(20 60 55)"><path d="M46 90 V36 a7 7 0 0 1 14 0 V28 a7 7 0 0 1 14 0 V86 Z" ${o('#7a4a2c')}/></g>${line('M50 6 V16 M34 10 L38 18 M66 10 L62 18', 4, '#ffd23f')}`,
    bowl: () => `<path d="M8 44 Q50 52 92 44 Q88 88 50 90 Q12 88 8 44 Z" ${o('#f5f5f0')}/><path d="M12 46 Q30 24 50 30 Q72 22 88 46 Q50 54 12 46 Z" ${o('#e67e22')}/><circle cx="34" cy="38" r="4" fill="#c0392b"/><circle cx="58" cy="34" r="4" fill="#2e9e68"/><circle cx="72" cy="40" r="3" fill="#c0392b"/>${line('M30 22 Q24 14 32 6 M54 20 Q48 12 56 4', 3, '#ccc')}`,
    pot: () => `<path d="M14 40 H86 V78 Q86 90 74 90 H26 Q14 90 14 78 Z" ${o('#7f8c8d')}/><rect x="8" y="34" width="84" height="10" rx="4" ${o('#95a5a6')}/>${line('M6 54 H14 M86 54 H94', 6)}<path d="M18 40 Q50 30 82 40" fill="#c0392b"/>${line('M34 26 Q28 16 36 6 M54 24 Q48 14 56 4 M70 26 Q64 18 70 10', 3, '#ccc')}`,
    skewer: () => `${line('M10 90 L90 10', 4)}<circle cx="30" cy="70" r="11" ${o('#c0703a')}/><circle cx="50" cy="50" r="11" ${o('#e67e22')}/><circle cx="70" cy="30" r="11" ${o('#c0703a')}/>`,
    drumstick: () => `<path d="M40 14 Q74 10 82 36 Q90 64 60 66 L44 52 Q24 40 40 14 Z" ${o('#c0703a')}/>${line('M48 58 L18 88', 10)}${line('M48 58 L18 88', 5, '#f5f0e1')}<circle cx="16" cy="90" r="7" ${o('#f5f0e1', 3)}/>${hi('M48 22 Q66 20 72 34')}`,
    receipt: () => `<path d="M24 8 H76 V90 L68 84 L60 90 L52 84 L44 90 L36 84 L28 90 L24 86 Z" ${o('#f5f5f0')}/>${line('M34 24 H66 M34 36 H60 M34 48 H66 M34 60 H54', 3, '#888')}<text x="50" y="78" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="12" fill="#c0392b">₦₦₦</text>`,
    tray: () => `<ellipse cx="50" cy="56" rx="42" ry="34" ${o('#c7ccd1')}/><ellipse cx="50" cy="56" rx="32" ry="24" ${o('#dfe4e8', 3)}/>${hi('M26 44 Q34 34 48 32')}`,
    bomb: () => `<circle cx="46" cy="58" r="32" ${o('#2b2b33')}/><rect x="56" y="18" width="14" height="14" rx="2" transform="rotate(30 63 25)" ${o('#5c5c6b', 3)}/>${line('M68 18 Q78 6 88 12', 4)}<path d="M88 4 l3 7 7 1 -6 4 2 7 -6 -4 -6 4 2 -7 -6 -4 7 -1 Z" fill="#ffd23f"/>${hi('M30 48 Q34 38 44 36')}`,
    handshake: () => `<path d="M6 46 L30 34 L50 44 L40 56 Q34 62 28 56 L6 66 Z" ${o('#8a5a3b')}/><path d="M94 46 L70 34 L46 52 Q52 64 62 60 L66 64 Q72 68 76 62 L94 66 Z" ${o('#5e3720')}/>${line('M52 56 L60 62 M58 52 L66 58', 3)}`,
    calculator: () => `<rect x="20" y="8" width="60" height="84" rx="8" ${o('#2c3e50')}/><rect x="28" y="16" width="44" height="18" rx="2" fill="#a8e6a1"/><text x="68" y="30" text-anchor="end" font-family="monospace" font-weight="bold" font-size="12" fill="${INK}">x2</text>${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${29 + c * 15}" y="${42 + r * 15}" width="11" height="11" rx="2" fill="${c === 2 ? '#f2b705' : '#95a5a6'}"/>`).join('')).join('')}`,
    moneybag: () => `<path d="M34 24 L28 10 H72 L66 24 Z" ${o('#c69c6d')}/><path d="M34 24 Q8 50 16 78 Q22 92 50 92 Q78 92 84 78 Q92 50 66 24 Z" ${o('#c69c6d')}/>${line('M34 24 H66', 5)}<text x="50" y="72" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="28" fill="${INK}">₦</text>`,
    gourd: () => `<circle cx="50" cy="64" r="28" ${o('#c69c6d')}/><path d="M42 40 Q40 22 46 14 H54 Q60 22 58 40" ${o('#c69c6d')}/><path d="M28 58 Q50 70 72 58" fill="none" stroke="#6b4a2c" stroke-width="3"/>${line('M46 10 Q40 2 48 0 M56 10 Q62 2 54 -2', 3, '#9fe3b3')}`,
    scarf: () => `<path d="M10 40 Q50 20 90 40 Q86 52 50 48 Q14 52 10 40 Z" ${o('#d94a2b')}/><path d="M40 46 L30 90 L46 86 L52 50 Z M56 48 L70 88 L84 82 L64 46 Z" ${o('#f2b705')}/><circle cx="50" cy="44" r="8" ${o('#1f8a57', 3)}/>`,
    basket: () => `<path d="M14 44 H86 L76 90 H24 Z" ${o('#c69c6d')}/>${line('M20 58 H80 M22 72 H78 M38 44 L36 90 M62 44 L64 90', 3, '#8b5a2b')}<path d="M24 44 Q50 0 76 44" fill="none" stroke="${INK}" stroke-width="5"/><circle cx="36" cy="40" r="8" ${o('#e2553a', 3)}/><circle cx="54" cy="38" r="9" ${o('#6ab04c', 3)}/><circle cx="68" cy="42" r="7" ${o('#f2b705', 3)}/>`,
    box: () => `<path d="M14 36 L50 22 L86 36 V76 L50 90 L14 76 Z" ${o('#c69c6d')}/>${line('M14 36 L50 50 L86 36 M50 50 V90', 4)}<path d="M30 30 L66 44 V56" fill="none" stroke="#f2b705" stroke-width="5"/>`,
    nails: () => `<rect x="34" y="36" width="32" height="54" rx="8" ${o('#e84393')}/><rect x="40" y="12" width="20" height="26" rx="3" ${o('#2b2b33')}/>${hi('M42 46 V78')}<path d="M72 18 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z" fill="#fff"/>`,
    crown: () => `<path d="M10 76 L16 28 L34 52 L50 18 L66 52 L84 28 L90 76 Z" ${o('#f2b705')}/><rect x="10" y="74" width="80" height="14" rx="3" ${o('#c99a00')}/><circle cx="50" cy="60" r="7" ${o('#e2553a', 3)}/><circle cx="28" cy="64" r="5" ${o('#5fb2dc', 3)}/><circle cx="72" cy="64" r="5" ${o('#2e9e68', 3)}/>`,
    eye: () => `<path d="M6 50 Q50 6 94 50 Q50 94 6 50 Z" ${o('#fff')}/><circle cx="50" cy="50" r="20" ${o('#8b5a2b')}/><circle cx="50" cy="50" r="9" fill="${INK}"/><circle cx="44" cy="44" r="4" fill="#fff"/>`,
    moto: () => `<circle cx="22" cy="72" r="16" ${o('#2b2b33')}/><circle cx="78" cy="72" r="16" ${o('#2b2b33')}/><path d="M22 72 L40 48 H66 L78 72" fill="none" stroke="${INK}" stroke-width="6"/><path d="M38 48 Q46 34 64 40 L70 48 Z" ${o('#e2553a')}/>${line('M66 40 L74 26 H84', 5)}`,
    whirl: () => `${line('M50 50 m-6 0 a6 6 0 1 1 12 0 a14 14 0 1 1 -26 0 a22 22 0 1 1 42 0 a30 30 0 1 1 -58 0', 7, '#8a5cf0')}`,
    briefcase: () => `<rect x="10" y="32" width="80" height="54" rx="6" ${o('#8b5a2b')}/><path d="M36 32 V20 H64 V32" fill="none" stroke="${INK}" stroke-width="6"/>${line('M10 54 H90', 4)}<rect x="44" y="48" width="12" height="12" rx="2" ${o('#f2b705', 3)}/>`,
    dancer: () => `<circle cx="52" cy="16" r="10" ${o('#7a4a2c')}/>${line('M52 26 L48 58 M48 58 L30 76 L36 92 M48 58 L66 72 L80 66 M50 34 L26 22 M50 34 L76 46 L86 34', 8)}${line('M52 26 L48 58 M48 58 L30 76 L36 92 M48 58 L66 72 L80 66 M50 34 L26 22 M50 34 L76 46 L86 34', 4, '#f2b705')}`,
    bicycle: () => `<circle cx="24" cy="66" r="18" fill="none" stroke="${INK}" stroke-width="6"/><circle cx="76" cy="66" r="18" fill="none" stroke="${INK}" stroke-width="6"/>${line('M24 66 L40 40 H70 L76 66 M40 40 L52 66 H24 M66 40 L62 28 H74', 5)}${line('M40 40 L34 30 H46', 5)}`,
    candle: () => `<rect x="38" y="40" width="24" height="50" rx="3" ${o('#f5f0e1')}/><path d="M50 10 Q64 26 50 38 Q36 26 50 10 Z" ${o('#ffd23f', 3)}/>${line('M50 38 V42', 3)}<circle cx="50" cy="28" r="22" fill="#ffd23f" opacity=".2"/>`,
    brain: () => `<path d="M50 16 Q30 10 22 26 Q8 32 14 50 Q8 68 26 74 Q34 90 50 82 Q66 90 74 74 Q92 68 86 50 Q92 32 78 26 Q70 10 50 16 Z" ${o('#ff9cc8')}/>${line('M50 18 V80 M30 36 Q40 40 36 50 M70 36 Q60 40 64 50 M28 60 Q38 58 40 68 M72 60 Q62 58 60 68', 3)}`,
    drop: () => `<path d="M50 8 Q80 48 78 66 Q76 90 50 90 Q24 90 22 66 Q20 48 50 8 Z" ${o('#5fb2dc')}/>${hi('M36 56 Q34 70 42 78')}`,
    dress: () => `<path d="M38 10 L30 22 L36 34 L18 90 H82 L64 34 L70 22 L62 10 L50 22 Z" ${o('#8e44ad')}/>${line('M28 70 Q50 78 72 70', 3, '#f2b705')}<circle cx="44" cy="54" r="3" fill="#f2b705"/><circle cx="58" cy="60" r="3" fill="#f2b705"/>`,
    hole: () => `<ellipse cx="50" cy="56" rx="42" ry="30" ${o('#1b0b2b')}/><ellipse cx="50" cy="56" rx="28" ry="18" fill="#000"/>${line('M24 50 Q50 34 76 50', 3, '#5b2a86')}${line('M30 64 Q50 76 70 64', 3, '#5b2a86')}`,
    scroll: () => `<rect x="18" y="16" width="64" height="70" ${o('#f5e6a8')}/><rect x="12" y="10" width="76" height="12" rx="6" ${o('#d9c27a')}/><rect x="12" y="80" width="76" height="12" rx="6" ${o('#d9c27a')}/>${line('M28 34 H72 M28 46 H66 M28 58 H70', 3, '#8b5a2b')}<circle cx="64" cy="70" r="7" ${o('#c0392b', 3)}/>`,
    siren: () => `<path d="M24 76 Q24 26 50 26 Q76 26 76 76 Z" ${o('#e2553a')}/><rect x="16" y="74" width="68" height="14" rx="3" ${o('#2b2b33')}/>${hi('M36 64 Q34 44 46 38')}${line('M50 6 V16 M20 18 L28 26 M80 18 L72 26', 5, '#ffd23f')}`,
    sweat: () => `<circle cx="50" cy="54" r="36" ${o('#f2b705')}/>${line('M34 50 Q38 46 42 50 M58 50 Q62 46 66 50', 4)}${line('M38 72 Q50 64 62 72', 4)}<path d="M80 14 Q92 30 86 38 Q80 42 76 36 Q74 28 80 14 Z" ${o('#5fb2dc', 3)}/>`,
    mirror: () => `<ellipse cx="50" cy="38" rx="28" ry="32" ${o('#c9a227')}/><ellipse cx="50" cy="38" rx="20" ry="24" fill="#bfe3ff"/>${hi('M40 26 Q44 18 52 18')}${line('M50 70 V94', 9)}${line('M50 70 V94', 5, '#c9a227')}`,
    broom: () => `${line('M76 8 L44 60', 7, '#8b5a2b')}<path d="M44 56 L28 50 L8 88 Q30 96 50 92 L58 66 Z" ${o('#f2b705')}/>${line('M20 74 L32 92 M30 66 L42 92', 3)}`,
    pin: () => `<path d="M34 10 H66 L60 40 Q78 48 76 58 H24 Q22 48 40 40 Z" ${o('#e2553a')}/>${line('M50 58 V94', 5)}`,
    live: () => `<rect x="8" y="26" width="84" height="48" rx="10" ${o('#e2553a')}/><circle cx="26" cy="50" r="8" fill="#fff"/><text x="60" y="58" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="20" fill="#fff">LIVE</text>`,
    gift: () => `<rect x="14" y="40" width="72" height="50" rx="4" ${o('#e84393')}/><rect x="10" y="28" width="80" height="16" rx="3" ${o('#ff6fb5')}/><rect x="44" y="28" width="12" height="62" fill="#f2b705"/><path d="M50 28 Q34 6 26 18 Q24 28 50 28 Q76 28 74 18 Q66 6 50 28 Z" ${o('#f2b705', 3)}/>`,
    news: () => `<rect x="10" y="14" width="80" height="72" rx="3" ${o('#f5f5f0')}/><rect x="18" y="22" width="64" height="12" fill="${INK}"/><text x="50" y="32" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="10" fill="#fff">FAN PAGE</text><rect x="18" y="40" width="28" height="22" fill="#5fb2dc"/>${line('M52 42 H82 M52 52 H82 M52 62 H74 M18 72 H82', 3, '#888')}`,
    tick: () => `<path d="M50 6 L60 16 L74 14 L76 28 L88 36 L82 50 L88 64 L76 72 L74 86 L60 84 L50 94 L40 84 L26 86 L24 72 L12 64 L18 50 L12 36 L24 28 L26 14 L40 16 Z" ${o('#1d9bf0')}/>${line('M34 50 L46 62 L68 38', 8, '#fff')}`,
    mic: () => `<rect x="34" y="8" width="32" height="50" rx="16" ${o('#2b2b33')}/>${line('M40 20 H60 M40 30 H60 M40 40 H60', 2, '#888')}<path d="M24 46 Q24 72 50 72 Q76 72 76 46" fill="none" stroke="${INK}" stroke-width="5"/>${line('M50 72 V90 M36 90 H64', 5)}`,
    heart: () => `<path d="M50 88 Q10 60 12 36 Q14 14 34 14 Q46 14 50 28 Q54 14 66 14 Q86 14 88 36 Q90 60 50 88 Z" ${o('#e2553a')}/>${hi('M24 34 Q24 24 34 22')}`,
    hash: () => `<rect x="10" y="10" width="80" height="80" rx="16" ${o('#1d9bf0')}/>${line('M40 24 L34 76 M64 24 L58 76 M24 40 H78 M22 60 H76', 7, '#fff')}`,
    butterfly: () => `<path d="M50 50 Q24 6 10 22 Q2 40 50 54 Q4 60 18 82 Q34 92 50 58 Q66 92 82 82 Q96 60 50 54 Q98 40 90 22 Q76 6 50 50 Z" ${o('#8a5cf0', 3)}/>${line('M50 30 V80', 5)}<circle cx="28" cy="32" r="5" fill="#ffd23f"/><circle cx="72" cy="32" r="5" fill="#ffd23f"/>`,
    shield: () => `<path d="M50 6 L86 20 Q86 66 50 94 Q14 66 14 20 Z" ${o('#5fb2dc')}/>${hi('M30 26 Q30 52 44 70')}`
  };

  /* ---------------- effects overlays (160 × 76) ---------------- */
  const FX = {
    flame: () => [16, 40, 120, 144].map((x, i) => `<path d="M${x} 76 Q${x - 8} 60 ${x} ${48 + (i % 2) * 8} Q${x + 10} 62 ${x} 76 Z" fill="#ff7a1a" opacity=".85"/>`).join(''),
    sparkle: () => [[22, 18, 1], [138, 22, 0.8], [130, 60, 0.6], [30, 58, 0.7]].map(([x, y, s]) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z" fill="#fff"/>`).join(''),
    burst: () => `<g opacity=".35">${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<path d="M80 38 L${80 + Math.cos(a) * 90} ${38 + Math.sin(a) * 90} L${80 + Math.cos(a + 0.18) * 90} ${38 + Math.sin(a + 0.18) * 90} Z" fill="#fff"/>`; }).join('')}</g>`,
    speed: () => [14, 26, 50, 62].map((y, i) => `<path d="M${6 + i * 3} ${y} H${36 + i * 4}" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>`).join(''),
    hearts: () => [[20, 22], [140, 18], [132, 58]].map(([x, y]) => `<path transform="translate(${x} ${y}) scale(.14)" d="M50 88 Q10 60 12 36 Q14 14 34 14 Q46 14 50 28 Q54 14 66 14 Q86 14 88 36 Q90 60 50 88 Z" fill="#ff5e8a"/>`).join(''),
    confetti: () => Array.from({ length: 14 }, (_, i) => `<rect x="${(i * 37) % 156}" y="${(i * 23) % 70}" width="5" height="9" rx="1" transform="rotate(${i * 40} ${(i * 37) % 156} ${(i * 23) % 70})" fill="${['#f2b705', '#e2553a', '#5fb2dc', '#6fdc8c', '#e84393'][i % 5]}"/>`).join(''),
    steam: () => [24, 136].map((x) => `<path d="M${x} 70 Q${x - 8} 56 ${x} 44 Q${x + 8} 32 ${x} 20" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>`).join(''),
    zzz: () => `<text x="128" y="30" font-family="Arial Black, sans-serif" font-size="16" fill="#fff" opacity=".8">z</text><text x="140" y="18" font-family="Arial Black, sans-serif" font-size="11" fill="#fff" opacity=".6">z</text>`,
    glow: () => `<circle cx="80" cy="38" r="40" fill="#fff6c2" opacity=".25"/>`,
    coins: () => [[20, 60], [140, 56], [130, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#ffcf4a" stroke="${INK}" stroke-width="2"/>`).join('')
  };

  /* ---------------- backdrops (160 × 76) ---------------- */
  const SCENES = {
    office: () => `<rect width="160" height="76" fill="#24304a"/><rect x="0" y="54" width="160" height="22" fill="#3a2e24"/>${[0, 1, 2, 3].map((i) => `<rect x="${8 + i * 40}" y="8" width="30" height="36" fill="#33456b"/><rect x="${10 + i * 40}" y="10" width="26" height="15" fill="#7fdcff" opacity=".25"/>`).join('')}`,
    market: () => `<rect width="160" height="76" fill="#f0a35a"/><rect x="0" y="56" width="160" height="20" fill="#8a5a36"/>${[[20, '#e74c3c'], [80, '#2980b9'], [140, '#27ae60']].map(([x, c]) => `<path d="M${x - 30} 40 Q${x} 6 ${x + 30} 40 Z" fill="${c}" opacity=".85"/><line x1="${x}" y1="40" x2="${x}" y2="60" stroke="${INK}" stroke-width="3"/>`).join('')}`,
    feed: () => `<defs><linearGradient id="fdg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7b5cff"/><stop offset="1" stop-color="#ff5fa2"/></linearGradient></defs><rect width="160" height="76" fill="url(#fdg)"/>${[0, 1, 2].map((i) => `<rect x="${6 + i * 54}" y="6" width="40" height="64" rx="6" fill="#fff" opacity=".12"/>`).join('')}`,
    city: () => `<defs><linearGradient id="ctg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2c5a"/><stop offset="1" stop-color="#e36d4c"/></linearGradient></defs><rect width="160" height="76" fill="url(#ctg)"/>${[[0, 30], [22, 18], [44, 36], [64, 12], [90, 26], [112, 20], [134, 34]].map(([x, h]) => `<rect x="${x}" y="${h + 20}" width="20" height="${56 - h}" fill="#4a2a3e"/>`).join('')}`,
    night: () => `<rect width="160" height="76" fill="#0d1328"/>${[[0, 24], [26, 10], [52, 30], [80, 16], [108, 26], [134, 12]].map(([x, h]) => `<rect x="${x}" y="${h + 16}" width="24" height="${60 - h}" fill="#16213f"/>`).join('')}<circle cx="132" cy="16" r="8" fill="#f4f1de"/>`,
    beach: () => `<rect width="160" height="76" fill="#7fd6ff"/><rect y="40" width="160" height="14" fill="#2e86c1"/><rect y="54" width="160" height="22" fill="#f5d48a"/><circle cx="130" cy="16" r="10" fill="#ffe14a"/>`,
    static: () => `<rect width="160" height="76" fill="#3c3f47"/>${Array.from({ length: 20 }, (_, i) => `<rect x="0" y="${i * 4}" width="160" height="1.5" fill="#fff" opacity="${0.03 + (i % 3) * 0.03}"/>`).join('')}`,
    void: () => `<defs><radialGradient id="vdg"><stop offset="0" stop-color="#5b2a86"/><stop offset="1" stop-color="#120618"/></radialGradient></defs><rect width="160" height="76" fill="url(#vdg)"/>`
  };
  const DEFAULT_SCENE = { tech: 'office', mama: 'market', creator: 'feed', neutral: 'city', status: 'static', curse: 'void' };

  /* ---------------- per-card mapping: [icon, badge?, fx?, scene?] ------ */
  const ART = {
    // Tech Bro
    hotTake: ['phone', 'flame', 'flame'], abegNoVex: ['pray', null, 'sparkle'], pitchDeck: ['board', null, 'glow'],
    aspire: ['alarm', null, 'zzz'], cloutChase: ['target', 'bolt'], thread: ['spool', 'phone', 'speed'],
    quoteTweet: ['retweet', 'bubble'], ratio: ['chartDown', null, 'burst'], standup: ['people', 'coffee'],
    hustlePost: ['camera', null, 'sparkle'], coldDm: ['envelope', null, 'speed'], burnRate: ['cash', null, 'flame'],
    debug: ['bug', 'cross'], hackathon: ['laptop', 'bolt'], remoteWork: ['laptop', 'palm', null, 'beach'],
    coffeeChat: ['coffee', 'bubble'], sprint: ['sneaker', null, 'speed'], goViral: ['rocket', null, 'burst'],
    pivot: ['retweet', 'laptop', 'speed'], seedRound: ['seedling', 'cash'], trendingCard: ['megaphone', null, 'hearts'],
    algorithmCard: ['robot', 'bolt'], doomscroll: ['phone', null, 'zzz', 'night'], disrupt: ['hammer', null, 'burst'],
    deployProd: ['boat', 'bug'], scaleFast: ['chartUp', 'bolt', 'glow'], foundersMode: ['cap', null, 'glow'],
    growthHackCard: ['flask', null, 'sparkle'], firewall: ['wall', null, 'flame'], unicornCard: ['unicorn', null, 'sparkle'],
    ipo: ['bell', null, 'confetti'], tenxCard: ['keyboard', null, 'speed'], blitzscale: ['bolt', null, 'burst'],
    mainCharacter: ['clapper', null, 'glow'], exitStrategy: ['plane', null, 'speed', 'city'],
    // Mama Put
    ladleKnock: ['ladle', null, 'burst'], mschew: ['lips', null, 'speed'], writeAmForBook: ['book', 'cash'],
    hotPepper: ['pepper', null, 'flame'], owoMiDa: ['hand', 'cash'], ataRodo: ['pepper', 'pepper', 'burst'],
    bigSpoon: ['bowl', 'ladle'], marketBanter: ['bubble', null, 'burst'], smallChops: ['skewer', null, 'steam'],
    longThroat: ['drumstick', null, 'sparkle'], creditSales: ['receipt', 'book'], trayShield: ['tray', null, 'glow'],
    iruBomb: ['bomb', null, 'steam'], haggle: ['handshake', 'cash'], ladleCombo: ['ladle', 'ladle', 'speed'],
    compoundInterest: ['calculator', 'book', 'sparkle'], collectDebt: ['moneybag', null, 'burst'],
    pepperGardenCard: ['seedling', 'pepper'], agboBrew: ['gourd', null, 'steam'], tieWrapper: ['scarf', null, 'sparkle'],
    gossipCard: ['people', 'bubble'], soupPot: ['pot', null, 'steam'], marketDay: ['basket', null, 'sparkle'],
    spreadGist: ['megaphone', 'bubble'], bulkBuyCard: ['box', 'box'], shakaraCard: ['nails', null, 'sparkle'],
    usuryCard: ['book', null, 'glow'], marketQueenCard: ['crown', null, 'sparkle'], settleDebt: ['cash', 'calculator', 'coins'],
    massCredit: ['books', null, 'confetti'], jollofWar: ['bowl', null, 'flame'],
    // Creator
    clapback: ['clap', null, 'burst'], filter: ['mirror', null, 'sparkle'], shoutout: ['megaphone', null, 'hearts'],
    bestieDuet: ['people', null, 'hearts'], haterComments: ['bubble', 'cross'], viralDance: ['dancer', null, 'confetti'],
    unboxing: ['box', null, 'sparkle'], blockUser: ['cross', null, 'glow'], dragThem: ['broom', null, 'speed'],
    storyPost: ['camera', null, 'glow'], pinComment: ['pin', 'bubble'], thirstTrap: ['camera', null, 'hearts'],
    mutuals: ['retweet', 'people'], goLive: ['live', null, 'glow'], cancelCulture: ['cross', null, 'flame'],
    giveaway: ['gift', null, 'confetti'], engagementPod: ['people', 'heart'], fanPageCard: ['news', 'heart'],
    verifiedCard: ['tick', null, 'glow'], stanArmy: ['people', 'megaphone', 'burst'], pileOn: ['bubble', 'bubble', 'burst'],
    ambassadorCard: ['phone', 'cash'], liveQA: ['mic', 'bubble'], blueTickCard: ['tick', null, 'sparkle'],
    bigFeed: ['phone', 'phone'], superfanCard: ['heart', null, 'sparkle'], trendingTopic: ['hash', null, 'flame'],
    comeback: ['butterfly', null, 'sparkle'],
    // Neutral
    shineYourEye: ['eye', null, 'glow'], lagosHustle: ['moto', null, 'speed'], agbadaSwing: ['whirl', null, 'speed'],
    soroSoke: ['megaphone', null, 'burst'], sideHustleCard: ['briefcase', 'cash'], shakuShaku: ['dancer', null, 'sparkle'],
    wahalaBicycle: ['bicycle', null, 'speed'],
    // Status & curses
    nepa: ['candle', null, null, 'night'], spam: ['spamMail'], brainRot: ['brain', null, 'zzz'], bug: ['bug'],
    dilution: ['drop'], asoEbiBill: ['dress', 'receipt'], sapaCurse: ['hole'], quitNotice: ['scroll'],
    efccWahala: ['siren', null, 'glow'], heatRash: ['sweat', null, 'flame']
  };

  const cache = {};

  /* Returns an <svg> for the card, or null if there is no art mapped */
  function svg(cardId) {
    if (cache[cardId] !== undefined) return cache[cardId];
    const spec = ART[cardId];
    const def = HH.Data.CARDS[cardId];
    if (!spec || !I[spec[0]]) { cache[cardId] = null; return null; }
    const [icon, badge, fx, sceneName] = spec;
    const scene = SCENES[sceneName || DEFAULT_SCENE[def.pool] || 'city']();
    const badgeSvg = badge && I[badge]
      ? `<g transform="translate(112 4)"><circle cx="18" cy="18" r="19" fill="#fff" stroke="${INK}" stroke-width="2.5"/><g transform="translate(4 4) scale(.28)">${I[badge]()}</g></g>`
      : '';
    const out = `<svg class="card-art-svg" viewBox="0 0 160 76" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${scene}${fx && FX[fx] && ['burst', 'glow'].includes(fx) ? FX[fx]() : ''}
      <ellipse cx="80" cy="70" rx="30" ry="5" fill="#000" opacity=".3"/>
      <g transform="translate(50 4) scale(.62)">${I[icon]()}</g>
      ${fx && FX[fx] && !['burst', 'glow'].includes(fx) ? FX[fx]() : ''}${badgeSvg}</svg>`;
    cache[cardId] = out;
    return out;
  }

  return { svg, ICONS: I, ART };
})();
