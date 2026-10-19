/* =========================================================================
   data/enemies.js — the people (and things) of Lagos who want your money.

   Enemy shape:
     name, hp [min, max], tier ('normal' | 'elite' | 'boss'), art {...},
     start(g, me) — optional setup when spawned
     moves { key: Move }, ai(me, g, H) → move key
   Move fields (all optional, resolved in this order):
     block, blockAll, buff [[id,n]], buffAll [[id,n]],
     d (damage) + hits, debuff [[id,n]] (on player), addCards [[id,n,where]],
     steal (₦), heal, summon 'enemyId', special(g, me), bark, unknown (hide)
   H (AI helpers): cycle, weighted, last, turn
   ========================================================================= */
window.HH = window.HH || {};
HH.Data = HH.Data || {};

HH.Data.ENEMIES = {
  /* ===================================================================
     ACT 1 — YABA (Ojuelegba, Computer Village spillover, bus parks)
     =================================================================== */
  agbero: {
    name: 'Agbero', hp: [40, 44], tier: 'normal',
    art: { body: 'singlet', top: '#e8e2d0', bottom: '#4a3b2a', skin: '#5a3420', hair: 'cap', capColor: '#c0392b', face: 'beard', prop: 'tickets', expr: 'angry' },
    moves: {
      owoDa: { name: 'Owo Da!', d: 8, bark: 'Owo da! Where my money dey?' },
      holdDoor: { name: 'Hold Passenger Door', d: 6, debuff: [['shaken', 1]], bark: 'You no go enter until you settle me.' },
      areaBoys: { name: 'Call Area Boys', block: 8, buff: [['clout', 2]], bark: 'Boys! Una come see this one!' }
    },
    ai: (me, g, H) => H.cycle(me, ['owoDa', 'holdDoor', 'areaBoys'])
  },
  okada: {
    name: 'Okada Rider', hp: [30, 34], tier: 'normal',
    art: { body: 'jacket', top: '#3b4f2a', bottom: '#2a2420', skin: '#6b3e24', hair: 'helmet', helmetColor: '#e0a400', face: 'none', prop: 'none', expr: 'grin' },
    moves: {
      zoom: { name: 'Zoom Past', d: 4, hits: 2, bark: 'Comot for road!' },
      rev: { name: 'Rev Engine', buff: [['clout', 2]], bark: 'Vroom vroom vroooom.' },
      overtake: { name: 'Overtake', d: 10, bark: 'One chance!' }
    },
    ai: (me, g, H) => (me.turns === 0 ? 'zoom' : H.weighted(me, g, [['zoom', 4], ['rev', 2], ['overtake', 3]], { max: 1 }))
  },
  hawker: {
    name: 'Pure Water Hawker', hp: [15, 19], tier: 'normal', size: 0.85,
    art: { body: 'tee', top: '#4aa0d8', bottom: '#2c3e50', skin: '#7a4a2c', hair: 'braids', face: 'none', prop: 'sachets', expr: 'shout' },
    moves: {
      splash: { name: 'Sachet Splash', d: 5, bark: 'Pure water! Cold one!' },
      shout: { name: 'Shout “Pure Water!”', debuff: [['shaken', 1]], bark: 'PUUUURE WAAATER!' }
    },
    ai: (me, g, H) => H.weighted(me, g, [['splash', 3], ['shout', 1]], { max: 2 })
  },
  areaBoy: {
    name: 'Area Boy', hp: [22, 26], tier: 'normal', size: 0.9,
    art: { body: 'singlet', top: '#1e1e1e', bottom: '#5b4636', skin: '#4a2a18', hair: 'bald', face: 'none', prop: 'none', expr: 'angry' },
    moves: {
      pullUp: { name: 'Pull Up', d: 6, bark: 'Who send you?' },
      extort: { name: 'Settle Boys', d: 3, steal: 8, bark: 'Drop something for the boys.' }
    },
    ai: (me, g, H) => H.weighted(me, g, [['pullUp', 3], ['extort', 2]], { max: 2 })
  },
  yahooBoy: {
    name: 'Yahoo Boy', hp: [36, 40], tier: 'normal',
    art: { body: 'shirt', top: '#f1f1f1', bottom: '#1d3b6e', skin: '#5e3720', hair: 'dreads', face: 'shades', prop: 'phone', expr: 'smug' },
    moves: {
      phish: { name: 'Send Phishing Link', addCards: [['spam', 2, 'discard']], bark: 'Dear Customer, click here to verify…' },
      flex: { name: 'Flex Rolex', block: 8, buff: [['clout', 1]], bark: 'Na fake? Touch am.' },
      wire: { name: 'Wire Transfer', d: 11, bark: 'Your money don land… for my account.' }
    },
    ai: (me, g, H) => H.cycle(me, ['phish', 'wire', 'flex', 'wire'])
  },
  conductor: {
    name: 'Bus Conductor', hp: [28, 32], tier: 'normal',
    art: { body: 'tee', top: '#f2b705', bottom: '#2a2a2a', skin: '#6a3c22', hair: 'lowcut', face: 'none', prop: 'cash', expr: 'shout' },
    moves: {
      shout: { name: 'Shout “Ojuelegba!”', buffAll: [['clout', 1]], bark: 'OJUELEGBA! OBALENDE! ENTER WITH YOUR CHANGE!' },
      change: { name: 'Change Wahala', d: 7, bark: 'I no get change. Wait for bus stop.' },
      slap: { name: 'Bus Slap', d: 5, debuff: [['exposed', 1]], bark: 'Shift! Shift!' }
    },
    ai: (me, g, H) => H.weighted(me, g, [['shout', 1], ['change', 2], ['slap', 2]], { max: 1 })
  },

  // ---- Act 1 Elites ----
  lastma: {
    name: 'LASTMA Officer', hp: [74, 78], tier: 'elite', size: 1.1,
    art: { body: 'uniform', top: '#e9c46a', bottom: '#5b4b2a', skin: '#5a3420', hair: 'beret', beretColor: '#7a5c1e', face: 'mustache', prop: 'ticketpad', expr: 'angry' },
    moves: {
      ticket: { name: 'Issue Ticket', debuff: [['exposed', 2], ['shaken', 2]], bark: 'Particulars! License! Fire extinguisher!' },
      impound: { name: 'Impound', d: 14, bark: 'This vehicle is going to Alausa.' },
      siren: { name: 'Siren', block: 12, buff: [['clout', 2]], bark: 'WEE-OOO WEE-OOO' }
    },
    ai: (me, g, H) => H.cycle(me, ['ticket', 'impound', 'siren', 'impound'])
  },
  chairman: {
    name: 'Park Chairman', hp: [58, 62], tier: 'elite', size: 1.15,
    art: { body: 'agbada', top: '#7b2d8b', bottom: '#7b2d8b', skin: '#4f2c17', hair: 'fila', filaColor: '#7b2d8b', face: 'beard', prop: 'koboko', expr: 'smug' },
    start(g, me) { g.summon('areaBoy'); g.summon('areaBoy'); },
    moves: {
      levy: { name: 'Union Levy', d: 10, steal: 15, bark: 'Union dues. Non-negotiable.' },
      callBoys: { name: 'Call Boys', summon: 'areaBoy', block: 6, bark: 'Where my boys dey?' },
      koboko: { name: 'Koboko', d: 4, hits: 3, bark: 'Discipline!' }
    },
    ai: (me, g, H) => {
      if (g.allies(me).length < 2 && H.last(me) !== 'callBoys' && (me.data.calls || 0) < 3) { me.data.calls = (me.data.calls || 0) + 1; return 'callBoys'; }
      return H.weighted(me, g, [['levy', 2], ['koboko', 2]], { max: 1 });
    }
  },
  danfoDriver: {
    name: 'Danfo Driver', hp: [82, 86], tier: 'elite', size: 1.1,
    art: { body: 'singlet', top: '#f2b705', bottom: '#3a2e20', skin: '#5e3720', hair: 'cap', capColor: '#1b1b1b', face: 'beard', prop: 'wheel', expr: 'grin' },
    start(g, me) { g.addStatus(me, 'thickSkin', 2); },
    moves: {
      swerve: { name: 'Swerve', d: 8, addCards: [['nepa', 1, 'draw']], bark: 'Hold body o!' },
      throttle: { name: 'Full Throttle', buff: [['clout', 4]], bark: 'No brakes. Only vibes.' },
      crash: { name: 'Crash Into Gutter', d: 17, bark: 'BRACE!' }
    },
    ai: (me, g, H) => H.cycle(me, ['swerve', 'throttle', 'crash'])
  },

  // ---- Act 1 Bosses ----
  landlord: {
    name: 'The Landlord', hp: [145, 145], tier: 'boss', size: 1.3,
    art: { body: 'kaftan', top: '#f5f0e1', bottom: '#f5f0e1', skin: '#4a2a18', hair: 'fila', filaColor: '#2c3e50', face: 'beard', prop: 'keys', expr: 'smug', belly: true },
    moves: {
      quitNotice: { name: 'Serve Quit Notice', d: 6, addCards: [['quitNotice', 1, 'discard']], bark: 'Seven days. Starting yesterday.' },
      agentFee: { name: 'Agent Fee', d: 8, steal: 20, bark: 'Agent fee. Agreement fee. Fee fee.' },
      countMoney: { name: 'Count Money', block: 18, buff: [['clout', 2]], bark: 'Let me count the money first…' },
      twoYears: { name: 'Two Years Upfront', d: 24, bark: 'TWO YEARS. UPFRONT. CASH.' }
    },
    ai: (me, g, H) => H.cycle(me, ['quitNotice', 'agentFee', 'countMoney', 'twoYears'])
  },
  transformer: {
    name: 'NEPA Transformer', hp: [135, 135], tier: 'boss', size: 1.3,
    art: { special: 'transformer' },
    start(g, me) { g.addStatus(me, 'juju', 1); },
    moves: {
      hum: { name: 'Hummm', block: 12, special: (g, me) => g.addStatus(me, 'voltage', 1), bark: 'Bzzzzzzzzz…' },
      spark: { name: 'Spark', d: 4, hits: 3, special: (g, me) => g.addStatus(me, 'voltage', 1), bark: 'ZZT! ZZT! ZZT!' },
      takeLight: { name: 'Take Light', d: 6, addCards: [['nepa', 2, 'draw']], special: (g, me) => g.addStatus(me, 'voltage', 1), bark: 'Up NEPA!… oh.' },
      explode: { name: 'EXPLODE', d: 24, special: (g, me) => g.removeStatus(me, 'voltage'), bark: 'BOOOOOM!' }
    },
    ai: (me, g, H) => {
      if (g.status(me, 'voltage') >= 3) return 'explode';
      return H.weighted(me, g, [['hum', 2], ['spark', 3], ['takeLight', 2]], { max: 1 });
    }
  },

  /* ===================================================================
     ACT 2 — LEKKI (Phase 1, the toll gate, estates, brunch spots)
     =================================================================== */
  cryptoBro: {
    name: 'Crypto Bro', hp: [54, 58], tier: 'normal',
    art: { body: 'hoodie', top: '#f7931a', bottom: '#1d1d1d', skin: '#5e3720', hair: 'afro', face: 'shades', prop: 'phone', expr: 'grin' },
    moves: {
      pump: { name: 'Pump', buff: [['clout', 3]], bark: 'To the moon! 🚀' },
      hodl: { name: 'HODL', block: 12, bark: 'Diamond hands, bro.' },
      dump: { name: 'Dump', d: 15, bark: 'Rug pulled. GG.' }
    },
    ai: (me, g, H) => {
      if (H.last(me) === 'pump') return 'dump';
      return H.weighted(me, g, [['pump', 2], ['hodl', 1], ['dump', 2]], { max: 1 });
    }
  },
  influencer: {
    name: 'Influencer', hp: [46, 50], tier: 'normal',
    art: { body: 'dress', top: '#e84393', bottom: '#e84393', skin: '#8a5a3b', hair: 'wig', face: 'lashes', prop: 'ringlight', expr: 'smug' },
    moves: {
      goLive: { name: 'Go Live', summon: 'follower', bark: 'Hi guys! Welcome back to my channel!' },
      subtweet: { name: 'Subtweet', d: 9, debuff: [['shaken', 1]], bark: 'Some people sha… 🙄' },
      collab: { name: 'Collab', blockAll: 8, bark: 'Tag your besties!' }
    },
    ai: (me, g, H) => {
      if (g.allies(me).length < 2 && H.last(me) !== 'goLive' && (me.data.calls || 0) < 3) { me.data.calls = (me.data.calls || 0) + 1; return 'goLive'; }
      return H.weighted(me, g, [['subtweet', 3], ['collab', 1]], { max: 2 });
    }
  },
  follower: {
    name: 'Follower', hp: [11, 13], tier: 'normal', size: 0.75, minion: true,
    art: { body: 'tee', top: '#a29bfe', bottom: '#2d3436', skin: '#7a4a2c', hair: 'lowcut', face: 'none', prop: 'phone', expr: 'happy' },
    moves: {
      stan: { name: 'Stan Attack', d: 4, bark: 'Leave my fave alone!' },
      share: { name: 'Like & Share', special: (g, me) => { const boss = g.alive().find((e) => e.id === 'influencer'); if (boss) g.addStatus(boss, 'clout', 1); }, bark: 'Liked. Shared. Subscribed.' }
    },
    ai: (me, g, H) => H.weighted(me, g, [['stan', 2], ['share', 1]], { max: 1 })
  },
  estateGuard: {
    name: 'Estate Security', hp: [58, 62], tier: 'normal',
    art: { body: 'uniform', top: '#2d4a7a', bottom: '#1b2a44', skin: '#3e2414', hair: 'beret', beretColor: '#1b1b1b', face: 'mustache', prop: 'koboko', expr: 'angry' },
    start(g, me) { g.addStatus(me, 'juju', 2); },
    moves: {
      whoYouBe: { name: 'Who You Be?', block: 10, debuff: [['exposed', 2]], bark: 'Who you come see? Write your name.' },
      lash: { name: 'Koboko Lash', d: 7, hits: 2, bark: 'Oya! Comot!' }
    },
    ai: (me, g, H) => H.weighted(me, g, [['whoYouBe', 1], ['lash', 2]], { max: 2 })
  },
  boltDriver: {
    name: 'Ride-hail Driver', hp: [50, 54], tier: 'normal',
    art: { body: 'shirt', top: '#2ecc71', bottom: '#2c3e50', skin: '#5a3420', hair: 'lowcut', face: 'beard', prop: 'phone', expr: 'smug' },
    moves: {
      surge: { name: 'Surge Price', buff: [['clout', 2]], steal: 10, bark: 'Price don change. Traffic.' },
      cancel: { name: 'Cancel Ride', debuff: [['broke', 2]], d: 5, bark: 'Where you dey? I don cancel.' },
      detour: { name: 'Detour', d: 14, bark: 'Shortcut through Ajah. Trust me.' }
    },
    ai: (me, g, H) => H.weighted(me, g, [['surge', 1], ['cancel', 2], ['detour', 2]], { max: 1 })
  },
  tollCollector: {
    name: 'Toll Collector', hp: [52, 56], tier: 'normal',
    art: { body: 'uniform', top: '#d35400', bottom: '#2c3e50', skin: '#6b4026', hair: 'cap', capColor: '#d35400', face: 'none', prop: 'cash', expr: 'neutral' },
    moves: {
      payToll: { name: 'Pay Toll', d: 6, steal: 12, bark: 'Tag or cash?' },
      barrier: { name: 'Barrier', block: 14, bark: 'Barrier don jam.' },
      overcharge: { name: 'Overcharge', d: 12, bark: 'Na new rate be that.' }
    },
    ai: (me, g, H) => H.cycle(me, ['payToll', 'overcharge', 'barrier'])
  },
  tokunbo: {
    name: 'Tokunbo Dealer', hp: [44, 48], tier: 'normal',
    art: { body: 'shirt', top: '#c0392b', bottom: '#34495e', skin: '#4f2c17', hair: 'afro', face: 'mustache', prop: 'keys', expr: 'grin' },
    moves: {
      sellFake: { name: 'Sell “Belgium” Car', addCards: [['bug', 2, 'discard']], d: 4, bark: 'Clean! Belgium used! Lady driver!' },
      deal: { name: 'Wahala Deal', d: 6, hits: 2, bark: 'Last price. I swear.' }
    },
    ai: (me, g, H) => H.weighted(me, g, [['sellFake', 1], ['deal', 2]], { max: 1 })
  },

  // ---- Act 2 Elites ----
  houseAgent: {
    name: 'House Agent', hp: [110, 116], tier: 'elite', size: 1.1,
    art: { body: 'suit', top: '#34495e', bottom: '#2c3e50', skin: '#5e3720', hair: 'lowcut', face: 'none', prop: 'keys', expr: 'smug' },
    moves: {
      inspection: { name: 'Inspection Fee', d: 10, steal: 25, bark: 'Inspection is ₦20k. Non-refundable.' },
      agreement: { name: 'Agreement Fee', debuff: [['exposed', 2], ['broke', 2]], bark: 'Sign here. And here. And here.' },
      anotherHouse: { name: 'Show Another House', block: 15, buff: [['clout', 3]], bark: 'This one get better ‘vibes’.' }
    },
    ai: (me, g, H) => H.cycle(me, ['inspection', 'agreement', 'anotherHouse', 'inspection'])
  },
  bigAunty: {
    name: 'Big Aunty', hp: [120, 126], tier: 'elite', size: 1.2,
    art: { body: 'wrapper', top: '#8e44ad', bottom: '#f39c12', pattern: 'ankara', skin: '#5a3420', hair: 'gele', geleColor: '#e74c3c', face: 'lashes', prop: 'fan', expr: 'stern', belly: true },
    moves: {
      asoEbi: { name: 'Aso Ebi Demand', addCards: [['asoEbiBill', 2, 'draw']], bark: 'Have you paid for the aso ebi?' },
      spray: { name: 'Spray Money', d: 6, hits: 3, bark: 'Spray! Spray am!' },
      gele: { name: 'Gele Shield', block: 20, buff: [['juju', 2]], bark: 'My gele cost more than your rent.' }
    },
    ai: (me, g, H) => H.cycle(me, ['asoEbi', 'spray', 'gele', 'spray'])
  },
  areaFada: {
    name: 'Area Fada', hp: [96, 100], tier: 'elite', size: 1.15,
    art: { body: 'kaftan', top: '#1e3d2f', bottom: '#1e3d2f', skin: '#3e2414', hair: 'bald', face: 'beard', prop: 'staff', expr: 'stern' },
    start(g, me) { g.addStatus(me, 'enrage', 1); },
    moves: {
      decree: { name: 'Street Decree', d: 12, debuff: [['shaken', 1]], bark: 'This street is my street.' },
      tax: { name: 'Development Levy', d: 7, steal: 15, bark: 'For development of the area.' },
      fortify: { name: 'Fortify', block: 16, buff: [['clout', 2]], bark: 'Nobody touch me.' }
    },
    ai: (me, g, H) => H.weighted(me, g, [['decree', 2], ['tax', 2], ['fortify', 1]], { max: 1 })
  },

  // ---- Act 2 Bosses ----
  vc: {
    name: 'Venture Capitalist', hp: [230, 230], tier: 'boss', size: 1.3,
    art: { body: 'vest', top: '#7f8c8d', bottom: '#2c3e50', skin: '#c99872', hair: 'bald', face: 'glasses', prop: 'briefcase', expr: 'smug', foreign: true },
    moves: {
      termSheet: { name: 'Term Sheet', d: 8, addCards: [['dilution', 2, 'draw']], bark: 'Standard terms. 1x liquidation pref. And your soul.' },
      diligence: { name: 'Due Diligence', d: 6, hits: 4, bark: 'Walk me through your unit economics.' },
      boardSeat: { name: 'Board Seat', block: 22, buff: [['clout', 4]], bark: 'We’ll be very hands-off.' },
      downRound: { name: 'Down Round', d: 30, bark: 'The market is… challenging.' }
    },
    ai: (me, g, H) => H.cycle(me, ['termSheet', 'diligence', 'boardSeat', 'downRound'])
  },
  goSlow: {
    name: 'Third Mainland Go-Slow', hp: [220, 220], tier: 'boss', size: 1.35,
    art: { special: 'goSlow' },
    start(g, me) { g.addStatus(me, 'gridlock', 8); },
    moves: {
      honk: { name: 'Endless Honking', d: 4, hits: 4, bark: 'PAAAAAAAAAAAAAM!' },
      fumes: { name: 'Exhaust Fumes', debuff: [['shaken', 2], ['broke', 2]], block: 10, bark: '*cough* *cough*' },
      standstill: { name: 'Standstill', block: 25, buff: [['clout', 3]], bark: 'Nobody is moving. Ever.' },
      roadRage: { name: 'Road Rage', d: 26, bark: 'YOU DEY CRAZE?!' }
    },
    ai: (me, g, H) => H.cycle(me, ['honk', 'fumes', 'standstill', 'roadRage'])
  },

  /* ===================================================================
     ACT 3 — EKO ATLANTIC (the Island, big money, bigger problems)
     =================================================================== */
  aide: {
    name: 'Senator’s Aide', hp: [64, 68], tier: 'normal',
    art: { body: 'kaftan', top: '#ecf0f1', bottom: '#ecf0f1', skin: '#4a2a18', hair: 'fila', filaColor: '#16a085', face: 'none', prop: 'envelope', expr: 'smug' },
    moves: {
      envelope: { name: 'Brown Envelope', block: 15, steal: 15, bark: 'For your… logistics.' },
      press: { name: 'Press Release', debuff: [['shaken', 2], ['exposed', 2]], bark: 'We categorically deny.' },
      hit: { name: 'Clear the Road', d: 14, bark: 'Convoy is passing!' }
    },
    ai: (me, g, H) => H.cycle(me, ['press', 'hit', 'envelope', 'hit'])
  },
  bigBoy: {
    name: 'Fake Big Boy', hp: [70, 74], tier: 'normal',
    art: { body: 'shirt', top: '#111111', bottom: '#111111', skin: '#5e3720', hair: 'waves', face: 'shades', prop: 'bottle', expr: 'grin', chain: true },
    moves: {
      rentedBenz: { name: 'Flex Rented Benz', block: 18, bark: 'Na my second car.' },
      champagne: { name: 'Pop Champagne', d: 8, hits: 2, bark: 'Pop am! Pop am!' },
      borrow: { name: 'Borrow Money', steal: 20, heal: 10, bark: 'Abeg I go pay back Monday.' }
    },
    ai: (me, g, H) => H.weighted(me, g, [['rentedBenz', 1], ['champagne', 2], ['borrow', 1]], { max: 1 })
  },
  customs: {
    name: 'Customs Officer', hp: [72, 76], tier: 'normal',
    art: { body: 'uniform', top: '#556b2f', bottom: '#3d4c22', skin: '#4f2c17', hair: 'beret', beretColor: '#556b2f', face: 'mustache', prop: 'ticketpad', expr: 'angry' },
    moves: {
      seize: { name: 'Seize Goods', d: 6, special: (g) => g.exhaustRandomFromHand(), bark: 'This one is contraband.' },
      duty: { name: 'Import Duty', d: 14, steal: 15, bark: 'Pay duty or leave am.' },
      search: { name: 'Thorough Search', block: 14, debuff: [['broke', 2]], bark: 'Open the bag.' }
    },
    ai: (me, g, H) => H.cycle(me, ['search', 'seize', 'duty'])
  },
  fxTrader: {
    name: 'Mallam FX', hp: [60, 64], tier: 'normal',
    art: { body: 'kaftan', top: '#f1c40f', bottom: '#f1c40f', skin: '#7a4a2c', hair: 'fila', filaColor: '#ecf0f1', face: 'beard', prop: 'cash', expr: 'neutral' },
    moves: {
      rate: { name: 'Black Market Rate', debuff: [['drained', 1]], d: 7, bark: 'Rate don change since morning.' },
      exchange: { name: 'Bad Exchange', d: 10, steal: 10, bark: '₦1,600? No. ₦1,900.' },
      count: { name: 'Count Bundles', block: 12, buff: [['clout', 2]], bark: '…one hundred, two hundred…' }
    },
    ai: (me, g, H) => H.weighted(me, g, [['rate', 1], ['exchange', 2], ['count', 1]], { max: 1 })
  },
  bouncer: {
    name: 'Club Bouncer', hp: [88, 94], tier: 'normal', size: 1.1,
    art: { body: 'tee', top: '#111111', bottom: '#222222', skin: '#3e2414', hair: 'bald', face: 'none', prop: 'none', expr: 'stern', bulky: true },
    moves: {
      notOnList: { name: 'You’re Not On The List', block: 12, debuff: [['shaken', 2]], bark: 'Your name no dey.' },
      bounce: { name: 'Bounce', d: 18, bark: 'OUT.' }
    },
    ai: (me, g, H) => H.cycle(me, ['notOnList', 'bounce'])
  },
  taskForce: {
    name: 'Task Force', hp: [62, 66], tier: 'normal',
    art: { body: 'uniform', top: '#2c3e50', bottom: '#1b2631', skin: '#5a3420', hair: 'beret', beretColor: '#c0392b', face: 'none', prop: 'baton', expr: 'angry' },
    moves: {
      raid: { name: 'Raid', d: 9, addCards: [['nepa', 1, 'discard']], bark: 'Everybody lie down!' },
      clampdown: { name: 'Clampdown', d: 5, hits: 3, bark: 'Okada is banned. You too.' }
    },
    ai: (me, g, H) => H.weighted(me, g, [['raid', 1], ['clampdown', 1]], { max: 2 })
  },

  // ---- Act 3 Elites ----
  efcc: {
    name: 'EFCC Agent', hp: [150, 156], tier: 'elite', size: 1.15,
    art: { body: 'jacket', top: '#1b1b1b', bottom: '#2c3e50', skin: '#4a2a18', hair: 'lowcut', face: 'shades', prop: 'badge', expr: 'stern', letters: 'EFCC' },
    moves: {
      freeze: { name: 'Freeze Account', steal: 30, debuff: [['broke', 3]], bark: 'Your account has been frozen.' },
      interrogate: { name: 'Interrogate', d: 8, hits: 3, bark: 'Where did you get the money?' },
      wiretap: { name: 'Wiretap', addCards: [['spam', 3, 'draw']], block: 15, bark: 'We are monitoring the situation.' }
    },
    ai: (me, g, H) => H.cycle(me, ['freeze', 'interrogate', 'wiretap', 'interrogate'])
  },
  ogaAtTheTop: {
    name: 'Oga at the Top', hp: [170, 176], tier: 'elite', size: 1.25,
    art: { body: 'agbada', top: '#0e6251', bottom: '#0e6251', skin: '#3e2414', hair: 'fila', filaColor: '#0e6251', face: 'beard', prop: 'staff', expr: 'smug', belly: true },
    moves: {
      whoIsOga: { name: 'Who Is The Oga?', block: 25, buff: [['clout', 3]], bark: 'I cannot be talking to you directly.' },
      sackEveryone: { name: 'Sack Everyone', d: 30, bark: 'You are all fired. Effective yesterday.' },
      memo: { name: 'Internal Memo', d: 10, debuff: [['exposed', 2]], bark: 'Please see attached.' }
    },
    ai: (me, g, H) => H.cycle(me, ['whoIsOga', 'memo', 'sackEveryone'])
  },

  // ---- Final Boss ----
  sapa: {
    name: 'SAPA', hp: [320, 320], tier: 'boss', size: 1.45,
    art: { special: 'sapa' },
    start(g, me) { g.addStatus(me, 'monthEnd', 1); },
    moves: {
      emptyPocket: { name: 'Empty Pocket', d: 10, debuff: [['drained', 1]], bark: 'Check your account. I’ll wait.' },
      brokeHug: { name: 'Broke Hug', d: 9, hits: 2, debuff: [['broke', 2]], bark: 'Come here, my friend. Stay forever.' },
      monthEnd: { name: 'It’s Only The 9th', addCards: [['sapaCurse', 1, 'discard']], block: 20, bark: 'Salary is in 21 days.' },
      salaryDelay: { name: 'Salary Delay', block: 30, heal: 20, bark: 'Your salary has been delayed again.' },
      famish: { name: 'Famish', d: 34, bark: 'Garri and groundnut for dinner.' }
    },
    ai: (me, g, H) => {
      if (me.hp < me.maxHp * 0.4 && !me.data.healed) { me.data.healed = true; return 'salaryDelay'; }
      return H.cycle(me, ['emptyPocket', 'brokeHug', 'monthEnd', 'famish']);
    }
  }
};
Object.keys(HH.Data.ENEMIES).forEach((id) => (HH.Data.ENEMIES[id].id = id));

/* =========================================================================
   Acts: themes, encounter pools, bosses
   ========================================================================= */
HH.Data.ACTS = [
  {
    name: 'Yaba',
    subtitle: 'Bus parks, Computer Village vibes, and too many “startups”',
    stage: 'yaba',
    easy: [['agbero'], ['okada'], ['hawker', 'hawker'], ['areaBoy', 'areaBoy']],
    normal: [['yahooBoy'], ['conductor', 'okada'], ['agbero', 'areaBoy'], ['hawker', 'hawker', 'hawker'], ['yahooBoy', 'hawker'], ['okada', 'okada'], ['conductor', 'agbero']],
    elites: [['lastma'], ['chairman'], ['danfoDriver']],
    bosses: [['landlord'], ['transformer']]
  },
  {
    name: 'Lekki',
    subtitle: 'Brunch, toll gates, and estates with very strict security',
    stage: 'lekki',
    easy: [['cryptoBro'], ['boltDriver'], ['tollCollector']],
    normal: [['influencer'], ['estateGuard', 'tokunbo'], ['cryptoBro', 'boltDriver'], ['tollCollector', 'estateGuard'], ['tokunbo', 'tokunbo'], ['influencer', 'cryptoBro']],
    elites: [['houseAgent'], ['bigAunty'], ['areaFada']],
    bosses: [['vc'], ['goSlow']]
  },
  {
    name: 'Eko Atlantic',
    subtitle: 'Where the money lives. And where it hides.',
    stage: 'eko',
    easy: [['aide'], ['bigBoy'], ['customs']],
    normal: [['fxTrader', 'taskForce'], ['bouncer'], ['aide', 'bigBoy'], ['customs', 'fxTrader'], ['taskForce', 'taskForce'], ['bouncer', 'aide']],
    elites: [['efcc'], ['ogaAtTheTop']],
    bosses: [['sapa']]
  }
];

/* =========================================================================
   Wahala Levels — the difficulty ladder (each includes the ones below)
   ========================================================================= */
HH.Data.WAHALA = [
  { level: 0, name: 'Soft Life', desc: 'The standard hustle.' },
  { level: 1, name: 'Small Wahala', desc: 'All enemies have 10% more HP.' },
  { level: 2, name: 'Wahala Dey', desc: 'Elites and bosses deal 20% more Gbese.' },
  { level: 3, name: 'Gbese Pro Max', desc: 'Start each run with a Sapa curse in your deck.' },
  { level: 4, name: 'Buka Inflation', desc: 'Resting at a Buka heals 20% instead of 30%.' },
  { level: 5, name: 'Full Lagos', desc: 'Start with 10% less max HP and only ₦50.' }
];
