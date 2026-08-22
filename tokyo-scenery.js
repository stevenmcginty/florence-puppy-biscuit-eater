/* ============================================================================
 * TokyoScenery — Procedural Visual Engine for
 * "Florence's Puppy Biscuit Eater — Level 2: Tokyo Subway Rush"
 *
 * Plain Canvas2D procedural rendering (no external image assets required).
 * ========================================================================= */
(function () {
  'use strict';

  var TWO_PI = Math.PI * 2;

  // Tokyo Subway Palette
  var INK = '#1C1526';
  var SUBWAY_TILES = '#2D283E';
  var SUBWAY_TILES_LIGHT = '#3F3956';
  var NEON_CYAN = '#00F0FF';
  var NEON_PINK = '#FF2A85';
  var NEON_YELLOW = '#FFE600';
  var NEON_GREEN = '#05FFA1';
  var NEON_PURPLE = '#B026FF';
  var TOKYO_GOLD = '#FFB800';
  var TRACK_STEEL = '#8892B0';
  var YAMANOTE_GREEN = '#00B04F';
  var SAKURA_PINK = '#FFB7D5';
  var SAKURA_DEEP = '#FF69B4';

  var RAINBOW = [NEON_PINK, TOKYO_GOLD, NEON_YELLOW, NEON_GREEN, NEON_CYAN, NEON_PURPLE];

  function ell(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, TWO_PI);
  }

  function inkEll(ctx, x, y, rx, ry, color, lw, rot) {
    ell(ctx, x, y, rx, ry, rot);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = lw || 2;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }

  function rr(ctx, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function inkRR(ctx, x, y, w, h, r, color, lw) {
    rr(ctx, x, y, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = lw || 2;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }

  function star(ctx, x, y, r, color, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rad = (i % 2 === 0) ? r : r * 0.45;
      var px = Math.cos(a) * rad, py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  /* ------------------------------------------------------------------ *
   * 1. Tokyo Subway Tunnel & Station Sky / Background
   * ------------------------------------------------------------------ */
  var TOKYO_SIGNS = [
    { kanji: '渋谷', romaji: 'SHIBUYA', color: NEON_CYAN },
    { kanji: '新宿', romaji: 'SHINJUKU', color: NEON_PINK },
    { kanji: '秋葉原', romaji: 'AKIHABARA', color: NEON_YELLOW },
    { kanji: '東京', romaji: 'TOKYO', color: NEON_GREEN },
    { kanji: '骨', romaji: 'BISCUIT', color: TOKYO_GOLD },
    { kanji: '散歩', romaji: 'WALKIES', color: SAKURA_DEEP }
  ];

  function drawTokyoSky(ctx, W, H, horizonY, t, state) {
    state = state || {};
    var mood = state.mood || 'normal';
    var blackout = !!state.blackout;
    var ceiling = !!state.ceiling;
    var flicker = Math.sin(t * 18) > 0.92 ? 0.3 : 1.0;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, horizonY + 2);
    ctx.clip();

    // Dark Tokyo Subway Tunnel gradient
    var g = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (blackout) {
      g.addColorStop(0, '#06030A');
      g.addColorStop(1, '#12081C');
    } else if (mood === 'phase' || mood === 'rush') {
      g.addColorStop(0, '#1E0B36');
      g.addColorStop(0.6, '#381363');
      g.addColorStop(1, '#561E8C');
    } else {
      g.addColorStop(0, '#100D1C');
      g.addColorStop(0.5, '#1B162C');
      g.addColorStop(1, '#2B2342');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, horizonY);

    // Subway Tunnel Concrete Arches
    ctx.strokeStyle = blackout ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3;
    for (var a = 0; a < 4; a++) {
      var archY = horizonY * (0.25 + a * 0.22);
      ctx.beginPath();
      ctx.arc(W / 2, horizonY + 40, W * (0.35 + a * 0.2), Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }

    // Overhead Subway Tube Lights / Neon Strips
    if (!blackout) {
      var lightAlpha = 0.85 * flicker;
      var tubeG = ctx.createLinearGradient(0, 0, 0, horizonY * 0.35);
      tubeG.addColorStop(0, 'rgba(255,255,255,' + lightAlpha + ')');
      tubeG.addColorStop(0.5, 'rgba(0,240,255,' + (lightAlpha * 0.6) + ')');
      tubeG.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = tubeG;
      ctx.beginPath();
      ctx.moveTo(W * 0.38, 0); ctx.lineTo(W * 0.62, 0);
      ctx.lineTo(W * 0.54, horizonY * 0.35); ctx.lineTo(W * 0.46, horizonY * 0.35);
      ctx.closePath();
      ctx.fill();

      // Tube fixtures
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(W * 0.47, 4, W * 0.06, 6);
      ctx.fillRect(W * 0.485, 16, W * 0.03, 4);
    } else {
      // Emergency red beacon in blackout
      var pulse = (Math.sin(t * 8) + 1) * 0.5;
      ctx.fillStyle = 'rgba(255,42,133,' + (0.2 + pulse * 0.5) + ')';
      ctx.beginPath(); ctx.arc(W / 2, 14, 22 * pulse, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = '#FF2A85';
      ctx.beginPath(); ctx.arc(W / 2, 14, 5, 0, TWO_PI); ctx.fill();
    }

    // Glowing Japanese Neon Signboards in Tunnel Distance
    var signCount = 4;
    for (var s = 0; s < signCount; s++) {
      var sIdx = (s + Math.floor(t * 0.1)) % TOKYO_SIGNS.length;
      var sData = TOKYO_SIGNS[sIdx];
      var sx = (s % 2 === 0) ? W * (0.08 + s * 0.05) : W * (0.92 - s * 0.05);
      var sy = horizonY * (0.32 + (s % 2) * 0.3);
      var sw = 54, sh = 26;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.globalAlpha = blackout ? 0.95 : (0.8 + Math.sin(t * 5 + s) * 0.2);

      // Sign box
      ctx.fillStyle = '#0F0A1A';
      ctx.strokeStyle = sData.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      rr(ctx, -sw / 2, -sh / 2, sw, sh, 4);
      ctx.fill(); ctx.stroke();

      // Neon Kanji text
      ctx.fillStyle = sData.color;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sData.kanji, 0, -3);

      ctx.font = '700 6.5px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(sData.romaji, 0, 7);

      ctx.restore();
    }

    // Passing Yamanote Green Express Train on Left Track in Distance
    var trainT = (t * 0.35) % 3.0;
    if (trainT < 1.4) {
      var trainX = W * 0.14 - (trainT * 120);
      var trainY = horizonY * 0.58;
      ctx.save();
      ctx.fillStyle = '#C4C8D8';
      ctx.fillRect(trainX, trainY, 88, 30);
      // Green Yamanote Line stripe
      ctx.fillStyle = YAMANOTE_GREEN;
      ctx.fillRect(trainX, trainY + 12, 88, 6);
      // Glowing passenger windows
      ctx.fillStyle = blackout ? 'rgba(0,240,255,0.7)' : 'rgba(255,230,120,0.85)';
      for (var w = 0; w < 5; w++) {
        ctx.fillRect(trainX + 8 + w * 16, trainY + 4, 10, 6);
      }
      ctx.restore();
    }

    // Cherry Blossom Sakura Petals drifting down tunnel
    ctx.fillStyle = SAKURA_PINK;
    for (var p = 0; p < 8; p++) {
      var px = (W * ((p * 0.13 + t * 0.04) % 1));
      var py = (horizonY * ((p * 0.22 + t * 0.08) % 1));
      var prot = t * 2 + p;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(prot);
      ctx.globalAlpha = 0.7;
      ell(ctx, 0, 0, 4.5, 2.2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  /* ------------------------------------------------------------------ *
   * 2. Tokyo Subway Track & Ground / Ceiling Renderer
   * ------------------------------------------------------------------ */
  function drawTokyoTrack(ctx, W, H, horizonY, projY, persp, laneW, ZMAX, dist, state) {
    state = state || {};
    var blackout = !!state.blackout;
    var ceiling = !!state.ceiling;
    var SLICES = 28;
    var roadHalf = laneW * 1.55;

    // Horizon filler
    ctx.fillStyle = blackout ? '#080512' : '#221D32';
    ctx.fillRect(0, horizonY - 1, W, projY(ZMAX) - horizonY + 3);

    // Foreground filler
    ctx.fillStyle = blackout ? '#080512' : '#221D32';
    ctx.fillRect(0, projY(0) - 1, W, H - projY(0) + 1);

    // Subway track bed & station platform edges
    for (var i = SLICES - 1; i >= 0; i--) {
      var z0 = i * (ZMAX / SLICES), z1 = (i + 1) * (ZMAX / SLICES);
      var y0 = projY(z1), y1 = projY(z0);
      var p0 = persp(z1), p1 = persp(z0);
      var stripe = Math.floor((dist + z0) / 3.5) % 2;

      // Platform Floor / Tunnel Walls
      if (blackout) {
        ctx.fillStyle = stripe ? '#0E091B' : '#080512';
      } else {
        ctx.fillStyle = stripe ? SUBWAY_TILES_LIGHT : SUBWAY_TILES;
      }
      ctx.fillRect(0, y0 - 1, W, y1 - y0 + 2);

      // Track Bed (Center Runways)
      ctx.fillStyle = blackout ? (stripe ? '#171126' : '#110D1D') : (stripe ? '#3A334E' : '#302A42');
      ctx.beginPath();
      ctx.moveTo(W / 2 - roadHalf * p0, y0 - 1);
      ctx.lineTo(W / 2 + roadHalf * p0, y0 - 1);
      ctx.lineTo(W / 2 + roadHalf * p1, y1 + 1);
      ctx.lineTo(W / 2 - roadHalf * p1, y1 + 1);
      ctx.closePath();
      ctx.fill();

      // Yellow Tactile Platform Safety Edge (点字ブロック)
      var yellowCol = blackout ? '#7A6E00' : (stripe ? '#FFD700' : '#E6BE00');
      ctx.fillStyle = yellowCol;
      // Left platform safety strip
      ctx.fillRect(W / 2 - (roadHalf + 16 * p0) * p0, y0 - 1, 14 * p0, y1 - y0 + 2);
      // Right platform safety strip
      ctx.fillRect(W / 2 + roadHalf * p0, y0 - 1, 14 * p0, y1 - y0 + 2);
    }

    // Steel Rails (Two parallel shiny rails + Glowing center cyber power strip)
    [-1, 1].forEach(function (side) {
      // Outer steel rail
      ctx.strokeStyle = blackout ? 'rgba(0,240,255,0.7)' : TRACK_STEEL;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(W / 2 + side * roadHalf * 0.88 * persp(0), projY(0) + 40);
      ctx.lineTo(W / 2 + side * roadHalf * 0.88 * persp(ZMAX), projY(ZMAX));
      ctx.stroke();

      // Inner rail
      ctx.strokeStyle = blackout ? 'rgba(255,42,133,0.6)' : '#657094';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(W / 2 + side * roadHalf * 0.42 * persp(0), projY(0) + 40);
      ctx.lineTo(W / 2 + side * roadHalf * 0.42 * persp(ZMAX), projY(ZMAX));
      ctx.stroke();
    });

    // Concrete Sleepers / Wooden Ties across tracks
    ctx.strokeStyle = blackout ? 'rgba(255,255,255,0.1)' : 'rgba(30,24,42,0.65)';
    ctx.lineWidth = 3;
    for (var z = 1; z < ZMAX; z += 1.8) {
      var zz = z - (dist % 1.8);
      if (zz < 0.3) continue;
      var p = persp(zz);
      var y = projY(zz);
      var rx0 = W / 2 - roadHalf * 0.95 * p;
      var rx1 = W / 2 + roadHalf * 0.95 * p;
      ctx.beginPath();
      ctx.moveTo(rx0, y);
      ctx.lineTo(rx1, y);
      ctx.stroke();
    }

    // Lane divider neon arrows / dots
    for (var z = 2; z < ZMAX; z += 3) {
      var zz = z - (dist % 3);
      if (zz < 0.4) continue;
      var p = persp(zz);
      var y = projY(zz);
      [-0.5, 0.5].forEach(function (ln) {
        var x = W / 2 + ln * laneW * p;
        ctx.fillStyle = blackout ? 'rgba(0,240,255,0.8)' : 'rgba(255,255,255,0.65)';
        ctx.beginPath();
        ell(ctx, x, y, 4 * p * 1.5, 2.2 * p * 1.5);
        ctx.fill();
      });
    }

    // Ceiling Monorail Tracks (if in ceiling mode)
    if (ceiling) {
      ctx.strokeStyle = NEON_CYAN;
      ctx.lineWidth = 4;
      ctx.strokeRect(W / 2 - roadHalf * 0.7, 10, roadHalf * 1.4, 20);
    }
  }

  /* ------------------------------------------------------------------ *
   * 3. Tokyo Wild Boar / Wild Pig (Inoshishi 🐗)
   * ------------------------------------------------------------------ */
  function drawWildBoar(ctx, x, y, s, t, state) {
    state = state || {};
    var hit = !!state.hit;
    var trot = Math.sin(t * 14);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    if (hit) {
      // Spinning cartoon launch
      ctx.rotate(t * 15);
      ctx.scale(1.2, 1.2);
    }

    // Shadow
    ctx.fillStyle = 'rgba(20,10,30,0.3)';
    ell(ctx, 0, 2, 26, 7);
    ctx.fill();

    // Body (Round chunky wild boar with bristly fur)
    inkEll(ctx, 0, -20 + trot * 1.5, 22, 18, '#704627', 3);

    // Boar back stripe / bristles
    ctx.fillStyle = '#4E2F16';
    ctx.beginPath();
    ctx.ellipse(0, -32 + trot * 1.5, 14, 7, 0, 0, TWO_PI);
    ctx.fill();

    // Cute trot hooves
    var hoofL = Math.sin(t * 14) * 6;
    var hoofR = -hoofL;
    inkEll(ctx, -12, -4 + hoofL, 5, 6, '#4E2F16', 2);
    inkEll(ctx, 12, -4 + hoofR, 5, 6, '#4E2F16', 2);

    // Cute curly tail
    ctx.strokeStyle = '#4E2F16';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-18, -26 + trot, 6, 0.5, Math.PI * 1.5);
    ctx.stroke();

    // Snout / Nose
    inkEll(ctx, 0, -14 + trot * 1.5, 11, 8.5, '#E5989B', 2.5);
    ctx.fillStyle = '#6B2D32';
    // Nostrils
    ell(ctx, -4, -14 + trot * 1.5, 2.2, 3); ctx.fill();
    ell(ctx, 4, -14 + trot * 1.5, 2.2, 3); ctx.fill();

    // White tusks poking out
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    [-1, 1].forEach(function (side) {
      ctx.beginPath();
      ctx.moveTo(side * 8, -14 + trot * 1.5);
      ctx.lineTo(side * 14, -20 + trot * 1.5);
      ctx.lineTo(side * 11, -12 + trot * 1.5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    });

    // Eyes (Determined arcade eyes)
    ctx.fillStyle = '#FFFFFF';
    inkEll(ctx, -9, -24 + trot * 1.5, 4.5, 4.5, '#FFFFFF', 1.8);
    inkEll(ctx, 9, -24 + trot * 1.5, 4.5, 4.5, '#FFFFFF', 1.8);
    ctx.fillStyle = '#1C1526';
    ell(ctx, -8, -24 + trot * 1.5, 2.4, 2.4); ctx.fill();
    ell(ctx, 8, -24 + trot * 1.5, 2.4, 2.4); ctx.fill();

    // Ears
    [-1, 1].forEach(function (side) {
      ctx.save();
      ctx.translate(side * 14, -30 + trot * 1.5);
      ctx.rotate(side * 0.4);
      inkEll(ctx, 0, 0, 5, 8, '#704627', 2);
      inkEll(ctx, 0, 1, 3, 5, '#E5989B', 1.2);
      ctx.restore();
    });

    // Steam puffs from nose
    if (!hit) {
      var steamA = (t * 4) % 1;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.8 - steamA) + ')';
      ell(ctx, -12 - steamA * 8, -16 - steamA * 10, 4 + steamA * 4, 3 + steamA * 3); ctx.fill();
      ell(ctx, 12 + steamA * 8, -16 - steamA * 10, 4 + steamA * 4, 3 + steamA * 3); ctx.fill();
    }

    ctx.restore();
  }

  /* ------------------------------------------------------------------ *
   * 4. Tokyo Rival Dog Walkers (Ambush & Push Over! 🚶‍♀️🐩 / 🚶‍♂️🐕)
   * ------------------------------------------------------------------ */
  function drawDogWalker(ctx, variant, x, y, s, t, state) {
    state = state || {};
    var hit = !!state.hit; // Pushed over!

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    if (hit) {
      // Comical tumbling push-over!
      var spin = (t * 8) % TWO_PI;
      ctx.rotate(spin);
      ctx.translate(0, -30);

      // Stars & sweat drops
      star(ctx, -24, -40, 8, TOKYO_GOLD, t * 5);
      star(ctx, 24, -30, 6, NEON_CYAN, -t * 4);
    }

    // Shadow
    ctx.fillStyle = 'rgba(20,10,30,0.3)';
    ell(ctx, 0, 2, 28, 8); ctx.fill();

    var walkBob = Math.sin(t * 10) * 3;

    // Dog Walker Body
    if (variant === 'fashion') {
      // Harajuku Fashionista with beret & sunglasses
      // Coat
      inkRR(ctx, -14, -65 + walkBob, 28, 38, 8, '#FF5E97', 2.5);
      // Legs & Boots
      inkRR(ctx, -10, -28 + walkBob, 7, 28, 3, '#2A1838', 2);
      inkRR(ctx, 3, -28 + walkBob, 7, 28, 3, '#2A1838', 2);
      // Head
      inkEll(ctx, 0, -78 + walkBob, 12, 12, '#FFDFC4', 2.5);
      // Sunglasses
      inkRR(ctx, -8, -80 + walkBob, 16, 5, 2, '#1C1526', 1.5);
      // Beret
      inkEll(ctx, -2, -88 + walkBob, 16, 7, '#8A2BE2', 2.5, -0.2);

      // Poodle pet beside walker
      drawMiniPet(ctx, 'poodle', 22, -8, t);
    } else if (variant === 'commuter') {
      // Akihabara Commuter with headphones & backpack
      inkRR(ctx, -13, -64 + walkBob, 26, 36, 6, '#3A86FF', 2.5);
      // Backpack
      inkRR(ctx, -19, -58 + walkBob, 8, 22, 4, '#FFBE0B', 2);
      // Legs
      inkRR(ctx, -9, -28 + walkBob, 6, 28, 3, '#1D2A44', 2);
      inkRR(ctx, 3, -28 + walkBob, 6, 28, 3, '#1D2A44', 2);
      // Head
      inkEll(ctx, 0, -76 + walkBob, 11, 11, '#FFE0BD', 2.5);
      // Headphones
      ctx.strokeStyle = '#FF006E'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(0, -77 + walkBob, 13, Math.PI, 0); ctx.stroke();
      ell(ctx, -13, -76 + walkBob, 4, 6); ctx.fillStyle = '#FF006E'; ctx.fill();
      ell(ctx, 13, -76 + walkBob, 4, 6); ctx.fill();

      // Shiba Inu pet beside walker
      drawMiniPet(ctx, 'shiba', -24, -8, t);
    } else {
      // Trendy Shibuya Walker with cap & coffee
      inkRR(ctx, -14, -62 + walkBob, 28, 35, 7, '#06D6A0', 2.5);
      // Legs
      inkRR(ctx, -10, -28 + walkBob, 6, 28, 3, '#264653', 2);
      inkRR(ctx, 4, -28 + walkBob, 6, 28, 3, '#264653', 2);
      // Head
      inkEll(ctx, 0, -74 + walkBob, 11, 11, '#FCD5B5', 2.5);
      // Cap
      inkEll(ctx, 0, -82 + walkBob, 14, 6, '#118AB2', 2);
      ctx.fillStyle = '#118AB2';
      ctx.fillRect(-14, -82 + walkBob, 12, 4);

      // Frenchie / Pug pet beside walker
      drawMiniPet(ctx, 'pug', 22, -8, t);
    }

    ctx.restore();
  }

  function drawMiniPet(ctx, type, px, py, t) {
    ctx.save();
    ctx.translate(px, py);
    var bob = Math.sin(t * 12) * 2;

    if (type === 'shiba') {
      // Golden Shiba Inu
      inkEll(ctx, 0, -10 + bob, 10, 8, '#E08E45', 2);
      inkEll(ctx, -2, -18 + bob, 8, 7, '#E08E45', 2);
      // Pointy ears
      ctx.fillStyle = '#E08E45';
      ctx.beginPath(); ctx.moveTo(-7, -24 + bob); ctx.lineTo(-4, -30 + bob); ctx.lineTo(-1, -24 + bob); ctx.fill();
      ctx.beginPath(); ctx.moveTo(1, -24 + bob); ctx.lineTo(4, -30 + bob); ctx.lineTo(7, -24 + bob); ctx.fill();
      // White muzzle
      inkEll(ctx, -2, -16 + bob, 4, 3, '#FFF4E6', 1);
    } else if (type === 'poodle') {
      // Pink Fluffy Poodle
      inkEll(ctx, 0, -10 + bob, 9, 8, '#FFFFFF', 2);
      inkEll(ctx, 0, -18 + bob, 8, 7, '#FFFFFF', 2);
      // Pink bows
      ctx.fillStyle = '#FF4081';
      ell(ctx, -7, -20 + bob, 3, 3); ctx.fill();
      ell(ctx, 7, -20 + bob, 3, 3); ctx.fill();
    } else {
      // Cute Frenchie
      inkEll(ctx, 0, -9 + bob, 10, 8, '#A0AAB2', 2);
      inkEll(ctx, 0, -17 + bob, 8, 7, '#A0AAB2', 2);
      // Bat ears
      ctx.fillStyle = '#A0AAB2';
      ctx.beginPath(); ctx.moveTo(-7, -22 + bob); ctx.lineTo(-5, -31 + bob); ctx.lineTo(-1, -22 + bob); ctx.fill();
      ctx.beginPath(); ctx.moveTo(1, -22 + bob); ctx.lineTo(5, -31 + bob); ctx.lineTo(7, -22 + bob); ctx.fill();
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------------ *
   * 5. Tokyo Pickups & Power-Ups
   * ------------------------------------------------------------------ */
  // Taiyaki Treat (Golden fish dog waffle)
  function drawTaiyaki(ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 3) * 0.15);
    var w = r * 1.5, h = r * 0.9;

    // Body
    ctx.fillStyle = '#F5A623';
    ctx.strokeStyle = '#B36B00';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, TWO_PI);
    ctx.fill(); ctx.stroke();

    // Tail fin
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2 - r * 0.45, -h * 0.4);
    ctx.lineTo(-w / 2 - r * 0.25, 0);
    ctx.lineTo(-w / 2 - r * 0.45, h * 0.4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Fish scales pattern
    ctx.strokeStyle = '#B36B00';
    ctx.lineWidth = 1.5;
    for (var s = -1; s <= 1; s++) {
      ctx.beginPath();
      ctx.arc(s * r * 0.25, 0, r * 0.22, 0.4, Math.PI - 0.4);
      ctx.stroke();
    }
    // Eye
    ctx.fillStyle = '#2B1700';
    ell(ctx, r * 0.4, -h * 0.15, 2.5, 2.5); ctx.fill();

    // Gloss
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ell(ctx, 0, -h * 0.25, w * 0.28, h * 0.12, -0.1); ctx.fill();
    ctx.restore();
  }

  // Ramen Bone Treat (Juicy broth bone with naruto spiral)
  function drawRamenBone(ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 2.5) * 0.18);

    // Golden bone
    drawBone(ctx, 0, 0, r, '#FFD166', '#E09F3E', { dots: true });

    // Naruto Fishcake spiral on top
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FF4D6D';
    ctx.lineWidth = 2;
    ell(ctx, r * 0.45, -r * 0.45, r * 0.35, r * 0.35);
    ctx.fill(); ctx.stroke();

    // Pink spiral inside
    ctx.beginPath();
    ctx.arc(r * 0.45, -r * 0.45, r * 0.16, 0, Math.PI * 1.5);
    ctx.stroke();

    ctx.restore();
  }

  // Mystery Tokyo Bento Box
  function drawBentoBox(ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 2) * 0.1);
    var bw = r * 1.6, bh = r * 1.2;

    // Lacquer box
    inkRR(ctx, -bw / 2, -bh / 2, bw, bh, 6, '#C1121F', 3);
    // Gold ribbon
    ctx.fillStyle = TOKYO_GOLD;
    ctx.fillRect(-bw / 2, -3, bw, 6);
    ctx.fillRect(-3, -bh / 2, 6, bh);

    // Sakura crest
    star(ctx, 0, 0, r * 0.35, '#FFE6A7');
    ctx.restore();
  }

  // Hyper Magnet (with electric arcs)
  function drawHyperMagnet(ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 3) * 0.2);

    // Horseshoe Magnet
    ctx.strokeStyle = '#8E0000'; ctx.lineWidth = r * 0.6;
    ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 0.5, Math.PI, 0, false); ctx.stroke();
    ctx.strokeStyle = '#FF1A1A'; ctx.lineWidth = r * 0.44;
    ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 0.5, Math.PI, 0, false); ctx.stroke();

    // Silver poles
    [-r * 0.5, r * 0.5].forEach(function (mx) {
      ctx.fillStyle = '#E8F0FE';
      ctx.fillRect(mx - r * 0.18, r * 0.15, r * 0.36, r * 0.28);
    });

    // Electric arcs
    ctx.strokeStyle = NEON_CYAN;
    ctx.lineWidth = 2.5;
    for (var a = 0; a < 3; a++) {
      var aAng = t * 6 + a * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(aAng) * r * 0.8, Math.sin(aAng) * r * 0.8);
      ctx.lineTo(Math.cos(aAng + 0.5) * r * 1.2, Math.sin(aAng + 0.5) * r * 1.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Laser Shield Orb
  function drawLaserShield(ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 2);

    // Glowing Hexagon
    ctx.strokeStyle = NEON_CYAN;
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(0,240,255,0.25)';
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var ang = i * Math.PI / 3;
      var hx = Math.cos(ang) * r, hy = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Shield Emblem
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }

  // Standard Bone Helper
  function drawBone(ctx, x, y, r, color, outline, opts) {
    opts = opts || {};
    ctx.save();
    ctx.translate(x, y);
    if (opts.rot) ctx.rotate(opts.rot);
    ctx.fillStyle = color;
    ctx.strokeStyle = outline;
    ctx.lineWidth = r * 0.2;
    var w = r * 1.2, h = r * 0.46, k = r * 0.44;
    var lobe = [[-w / 2, -k * 0.5], [-w / 2, k * 0.5], [w / 2, -k * 0.5], [w / 2, k * 0.5]];
    ctx.beginPath();
    rr(ctx, -w / 2, -h / 2, w, h, h / 2);
    lobe.forEach(function (pt) { ctx.moveTo(pt[0] + k * 0.62, pt[1]); ctx.arc(pt[0], pt[1], k * 0.62, 0, TWO_PI); });
    ctx.fill(); ctx.stroke();

    // Gloss
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ell(ctx, -r * 0.22, -r * 0.22, r * 0.45, r * 0.14, -0.25); ctx.fill();
    ctx.restore();
  }

  /* ------------------------------------------------------------------ *
   * 6. Tokyo Subway Obstacles (Turnstiles, Luggage, Anti-Gravity Pad)
   * ------------------------------------------------------------------ */
  // Tokyo IC Card Turnstiles (Jump over!)
  function drawTurnstile(ctx, x, y, w, h, p) {
    ctx.save();
    ctx.translate(x, y);
    // Metallic Barrier posts
    inkRR(ctx, -w / 2, -h, w * 0.3, h, 6, '#C0C7D8', 2.5);
    inkRR(ctx, w * 0.2, -h, w * 0.3, h, 6, '#C0C7D8', 2.5);

    // Glowing Green IC Touch Screen
    ctx.fillStyle = NEON_GREEN;
    ctx.fillRect(-w * 0.45, -h * 0.85, w * 0.2, h * 0.25);
    ctx.fillRect(w * 0.25, -h * 0.85, w * 0.2, h * 0.25);

    // Retractable barrier flap (closed)
    ctx.fillStyle = '#FF3366';
    ctx.fillRect(-w * 0.2, -h * 0.65, w * 0.4, h * 0.35);

    // Green Arrow IC Icon
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold ' + Math.max(8, 12 * p) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('IC ↑', 0, -h * 0.4);
    ctx.restore();
  }

  // Anti-Gravity Inversion / Ceiling Flip Launch Pad (🌀 / ⚡)
  function drawGravityPad(ctx, x, y, w, p, t) {
    ctx.save();
    ctx.translate(x, y);

    // Glowing Neon Vortex Pad
    for (var r = 3; r >= 1; r--) {
      ctx.fillStyle = RAINBOW[(r + Math.floor(t * 6)) % 6];
      ctx.beginPath();
      ctx.ellipse(0, 0, (w * 0.6) * (r / 3), (w * 0.25) * (r / 3), 0, 0, TWO_PI);
      ctx.fill();
    }

    // Rotating Anti-Gravity Invert Arrows (↑↓ / 🌀)
    ctx.save();
    ctx.rotate(t * 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold ' + Math.max(10, 18 * p) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡ 🔀 ⚡', 0, 0);
    ctx.restore();

    ctx.restore();
  }

  /* ------------------------------------------------------------------ *
   * 7. Grand Tokyo Central Station Golden Sakura Trophy
   * ------------------------------------------------------------------ */
  function drawTokyoTrophyBody(ctx, name) {
    var cx = 130;
    // Glowing neon cherry blossom background
    for (var s = 0; s < 12; s++) {
      var a = s * Math.PI / 6;
      star(ctx, cx + Math.cos(a) * 85, 95 + Math.sin(a) * 75, 7, s % 2 ? SAKURA_PINK : TOKYO_GOLD, a);
    }

    // Giant Golden Tokyo Cup
    var cupG = ctx.createLinearGradient(cx - 55, 0, cx + 55, 0);
    cupG.addColorStop(0, '#FFAA00');
    cupG.addColorStop(0.5, '#FFF275');
    cupG.addColorStop(1, '#FF8800');

    ctx.fillStyle = cupG;
    ctx.strokeStyle = '#8F4E00';
    ctx.lineWidth = 4;

    // Cup handles
    ctx.beginPath(); ctx.arc(cx - 62, 78, 25, Math.PI * 0.6, Math.PI * 1.7); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 62, 78, 25, Math.PI * 1.3, Math.PI * 2.4); ctx.stroke();

    // Cup bowl
    ctx.beginPath();
    ctx.moveTo(cx - 56, 40);
    ctx.bezierCurveTo(cx - 56, 115, cx - 26, 132, cx, 134);
    ctx.bezierCurveTo(cx + 26, 132, cx + 56, 115, cx + 56, 40);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Rim
    ctx.fillStyle = '#FFF275';
    ctx.beginPath();
    rr(ctx, cx - 62, 32, 124, 16, 8);
    ctx.fill(); ctx.stroke();

    // Sakura Flower Emblem on Cup Center
    star(ctx, cx, 82, 18, SAKURA_DEEP);
    star(ctx, cx, 82, 9, '#FFFFFF');

    // Stem & Plinth
    ctx.fillStyle = cupG;
    ctx.fillRect(cx - 10, 132, 20, 22);
    ctx.strokeRect(cx - 10, 132, 20, 22);

    // Heavy Black Lacquer Plinth with Tokyo Gold Inscription
    inkRR(ctx, cx - 52, 158, 104, 38, 8, '#1A1424', 3.5);
    ctx.fillStyle = TOKYO_GOLD;
    ctx.font = '900 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOKYO 2026', cx, 174);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 13px sans-serif';
    ctx.fillText(name || 'PUPPY', cx, 190);
  }

  function drawTokyoTrophyWorld(ctx, cxw, baseY, s, name) {
    ctx.save();
    ctx.translate(cxw, baseY);
    ctx.scale(s, s);
    ctx.translate(-130, -196);
    drawTokyoTrophyBody(ctx, name);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ *
   * Public API
   * ------------------------------------------------------------------ */
  window.TokyoScenery = {
    drawTokyoSky: drawTokyoSky,
    drawTokyoTrack: drawTokyoTrack,
    drawWildBoar: drawWildBoar,
    drawDogWalker: drawDogWalker,
    drawTaiyaki: drawTaiyaki,
    drawRamenBone: drawRamenBone,
    drawBentoBox: drawBentoBox,
    drawHyperMagnet: drawHyperMagnet,
    drawLaserShield: drawLaserShield,
    drawTurnstile: drawTurnstile,
    drawGravityPad: drawGravityPad,
    drawTokyoTrophyBody: drawTokyoTrophyBody,
    drawTokyoTrophyWorld: drawTokyoTrophyWorld
  };
})();
