/*
 * Florence's Puppy Biscuit Eater — procedural scenery + character art module.
 * Plain-script Canvas2D. No external assets. Defines exactly one global: window.PBEScenery.
 *
 * Art direction: glossy mobile-game cartoon. Thick rounded shapes, ink outlines,
 * white glossy highlight blobs on shiny things, cheerful park palette.
 */
(function () {
  'use strict';

  var TWO_PI = Math.PI * 2;

  // ---- palette -------------------------------------------------------------
  var INK = '#3A2A1E';
  var SKY = '#8FD9F8';
  var DEEP_SKY = '#5FB8E8';
  var GRASS = '#79C94F';
  var GRASS_DARK = '#5BA83A';
  var PATH = '#E3C58A';
  var PATH_EDGE = '#C9A45F';
  var WOOD = '#8B5A2B';
  var WOOD_DARK = '#6E4520';
  var GOLD = '#F5A93B';
  var RED = '#E23A3A';
  var BLUE = '#35A9F5';
  var PURPLE = '#9B5DE5';
  var CREAM = '#FFF6DC';
  var PINK = '#FF7BAC';
  var YELLOW = '#FFE066';

  var RAINBOW = [RED, GOLD, YELLOW, GRASS, BLUE, PURPLE];

  // ---- tiny helpers (all cheap, no shadowBlur anywhere) ----------------------
  function hash01(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWO_PI);
  }

  function ell(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, TWO_PI);
  }

  function fillEll(ctx, x, y, rx, ry, color, rot) {
    ell(ctx, x, y, rx, ry, rot);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function inkEll(ctx, x, y, rx, ry, color, lw, rot) {
    ell(ctx, x, y, rx, ry, rot);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }

  function gloss(ctx, x, y, rx, ry, alpha, rot) {
    ell(ctx, x, y, rx, ry, rot === undefined ? -0.5 : rot);
    ctx.fillStyle = 'rgba(255,255,255,' + (alpha || 0.35) + ')';
    ctx.fill();
  }

  // rounded rect path
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
    ctx.lineWidth = lw;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }

  function star(ctx, x, y, r, color) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rad = (i % 2 === 0) ? r : r * 0.45;
      var px = x + Math.cos(a) * rad;
      var py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // "blob union with single outer outline" trick:
  // stroke the combined path first (fat ink), then fill on top — the fill hides
  // interior stroke segments, leaving one clean cartoon outline around the union.
  function outlinedUnion(ctx, buildPath, color, lw) {
    buildPath(ctx);
    ctx.lineWidth = lw * 2;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // ==========================================================================
  // SKY
  // ==========================================================================
  function drawCloud(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWO_PI);
    ctx.arc(x - r * 1.05, y + r * 0.30, r * 0.72, 0, TWO_PI);
    ctx.arc(x + r * 1.05, y + r * 0.30, r * 0.78, 0, TWO_PI);
    ctx.arc(x + r * 0.15, y + r * 0.42, r * 0.85, 0, TWO_PI);
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.fill();
    // soft cream underside
    ell(ctx, x + r * 0.1, y + r * 0.75, r * 1.35, r * 0.35);
    ctx.fillStyle = 'rgba(255,246,220,0.5)';
    ctx.fill();
  }

  function drawSky(ctx, W, H, horizonY, t, mood) {
    mood = mood || 'normal';
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, horizonY);
    ctx.clip();

    // gradient
    var top = DEEP_SKY, bottom = SKY;
    if (mood === 'rush') { top = '#6FA6D8'; bottom = '#FFD9A0'; }
    var g = ctx.createLinearGradient(0, 0, 0, horizonY);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, horizonY);

    // phase: subtle shimmer bands
    if (mood === 'phase') {
      ctx.globalAlpha = 0.055 + 0.02 * Math.sin(t * 2.2);
      for (var b = 0; b < 6; b++) {
        ctx.fillStyle = RAINBOW[b];
        var yb = (b / 6) * horizonY + Math.sin(t * 0.6 + b * 1.7) * 8;
        ctx.fillRect(0, yb, W, horizonY / 6 + 10);
      }
      ctx.globalAlpha = 1;
    }

    // sun (top-right) with glow
    var sx = W * 0.82;
    var sy = horizonY * 0.24;
    var sr = Math.max(14, Math.min(W, horizonY * 2) * 0.055);
    var glow = ctx.createRadialGradient(sx, sy, sr * 0.4, sx, sy, sr * 3.4);
    glow.addColorStop(0, mood === 'rush' ? 'rgba(255,214,140,0.9)' : 'rgba(255,244,180,0.85)');
    glow.addColorStop(1, 'rgba(255,244,180,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx - sr * 3.4, sy - sr * 3.4, sr * 6.8, sr * 6.8);
    // rays (slow spin)
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(t * 0.15);
    ctx.strokeStyle = 'rgba(255,240,150,0.65)';
    ctx.lineWidth = sr * 0.16;
    ctx.lineCap = 'round';
    for (var rya = 0; rya < 8; rya++) {
      var a = rya * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * sr * 1.35, Math.sin(a) * sr * 1.35);
      ctx.lineTo(Math.cos(a) * sr * 1.75, Math.sin(a) * sr * 1.75);
      ctx.stroke();
    }
    ctx.restore();
    circle(ctx, sx, sy, sr);
    ctx.fillStyle = mood === 'rush' ? '#FFC94D' : YELLOW;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, sr * 0.12);
    ctx.stroke();
    gloss(ctx, sx - sr * 0.3, sy - sr * 0.35, sr * 0.34, sr * 0.2, 0.55);

    // rainbow arc rising from behind horizon, centered on the path (screen centre)
    var rcx = W / 2;
    var rad = Math.min(W * 0.36, horizonY * 1.35);
    var rcy = horizonY + rad * 0.22;
    var band = Math.max(5, rad * 0.055);
    ctx.globalAlpha = mood === 'phase' ? 0.85 : 0.68;
    ctx.lineCap = 'butt';
    for (var ri = 0; ri < 6; ri++) {
      ctx.beginPath();
      ctx.arc(rcx, rcy, rad - ri * band, Math.PI * 1.06, Math.PI * 1.94);
      ctx.strokeStyle = RAINBOW[ri];
      ctx.lineWidth = band + 0.6;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // drifting puffy clouds (loop around)
    var span = W + 320;
    for (var ci = 0; ci < 4; ci++) {
      var cs = 0.65 + hash01(ci * 7.3 + 1) * 0.8;
      var cy = horizonY * (0.14 + hash01(ci * 13.1 + 2) * 0.42);
      var spd = 10 + hash01(ci * 3.7) * 16;
      var cx = ((hash01(ci * 29.7) * span + t * spd) % span) - 160;
      drawCloud(ctx, cx, cy, (18 + Math.min(W, 900) * 0.022) * cs);
    }

    // distant hills band
    var hillTint = mood === 'rush' ? '#C2D488' : '#AADE8E';
    ctx.fillStyle = hillTint;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    var hh = Math.max(12, horizonY * 0.12);
    var hw = W / 3;
    for (var hi = 0; hi < 4; hi++) {
      ctx.quadraticCurveTo(hw * hi + hw * 0.5 - hw * 0.35, horizonY - hh * (0.9 + hash01(hi * 5.1) * 0.6), hw * (hi + 0.66), horizonY - hh * 0.35);
    }
    ctx.lineTo(W, horizonY);
    ctx.closePath();
    ctx.fill();

    // treeline silhouette (round bumps) sitting on the horizon
    ctx.fillStyle = mood === 'rush' ? '#94BE64' : '#7CC763';
    ctx.beginPath();
    var tx = -10;
    var ti = 0;
    while (tx < W + 30) {
      var trr = Math.max(8, horizonY * (0.045 + hash01(ti * 11.3) * 0.05));
      ctx.moveTo(tx + trr, horizonY + 2);
      ctx.arc(tx, horizonY + 2, trr, 0, Math.PI, true);
      tx += trr * 1.35;
      ti++;
    }
    ctx.fill();

    ctx.restore();
  }

  // ==========================================================================
  // SIDE PROPS  (each drawn in local space; ground contact at (0,0), up = -y)
  // ==========================================================================
  var PROPS = {

    tree: function (ctx, t, seed) {
      inkRR(ctx, -7, -56, 14, 58, 6, WOOD, 3);
      var sway = Math.sin(t * 1.1 + seed) * 2;
      outlinedUnion(ctx, function (c) {
        c.beginPath();
        c.arc(-23 + sway, -80, 24, 0, TWO_PI);
        c.arc(23 + sway, -80, 24, 0, TWO_PI);
        c.arc(sway, -100, 28, 0, TWO_PI);
        c.arc(sway, -72, 27, 0, TWO_PI);
      }, GRASS, 3);
      // underside shade + gloss
      fillEll(ctx, sway, -68, 30, 12, 'rgba(91,168,58,0.55)');
      gloss(ctx, sway - 13, -104, 12, 6, 0.4);
      // little biscuits hiding in the leaves
      fillEll(ctx, sway + 14, -88, 4, 3, GOLD);
      fillEll(ctx, sway - 8, -78, 3.5, 2.6, GOLD);
    },

    pine: function (ctx, t, seed) {
      inkRR(ctx, -6, -32, 12, 34, 4, WOOD_DARK, 3);
      function tier(c, y0, w, h) {
        c.beginPath();
        c.moveTo(-w, y0);
        c.quadraticCurveTo(0, y0 + 7, w, y0);
        c.lineTo(0, y0 - h);
        c.closePath();
      }
      var cols = ['#4E9C3F', GRASS_DARK, '#4E9C3F'];
      var ys = [-30, -60, -86];
      var ws = [34, 27, 20];
      var hs = [42, 38, 34];
      for (var i = 0; i < 3; i++) {
        tier(ctx, ys[i], ws[i], hs[i]);
        ctx.fillStyle = cols[i];
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
      gloss(ctx, -7, -98, 6, 10, 0.3, 0.5);
    },

    bush: function (ctx, t, seed) {
      outlinedUnion(ctx, function (c) {
        c.beginPath();
        c.arc(-17, -14, 15, 0, TWO_PI);
        c.arc(17, -14, 15, 0, TWO_PI);
        c.arc(0, -24, 18, 0, TWO_PI);
      }, GRASS, 3);
      fillEll(ctx, 0, -10, 26, 8, 'rgba(91,168,58,0.5)');
      // berries
      fillEll(ctx, -12, -22, 3.2, 3.2, RED);
      fillEll(ctx, 9, -30, 3.2, 3.2, RED);
      fillEll(ctx, 16, -16, 3, 3, RED);
      gloss(ctx, -8, -32, 8, 4, 0.4);
    },

    flowerbed: function (ctx, t, seed) {
      inkEll(ctx, 0, -6, 32, 10, WOOD_DARK, 3);
      fillEll(ctx, 0, -9, 27, 7, GRASS_DARK);
      var cols = [PINK, RED, PURPLE, BLUE, YELLOW];
      var fx = [-18, -6, 6, 18, 0];
      var fy = [-20, -26, -24, -19, -32];
      for (var i = 0; i < 5; i++) {
        var wob = Math.sin(t * 2 + i * 1.7) * 1.5;
        ctx.strokeStyle = GRASS_DARK;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(fx[i], -10);
        ctx.lineTo(fx[i] + wob, fy[i]);
        ctx.stroke();
        // petal ring: 5 petals in one path
        ctx.beginPath();
        for (var p = 0; p < 5; p++) {
          var a = p * TWO_PI / 5 + i;
          ctx.moveTo(fx[i] + wob + Math.cos(a) * 4.4, fy[i] + Math.sin(a) * 4.4);
          ctx.arc(fx[i] + wob + Math.cos(a) * 4.4, fy[i] + Math.sin(a) * 4.4, 3.4, 0, TWO_PI);
        }
        ctx.fillStyle = cols[i % cols.length];
        ctx.fill();
        fillEll(ctx, fx[i] + wob, fy[i], 2.6, 2.6, GOLD);
      }
    },

    fence: function (ctx, t, seed) {
      // three pickets + two rails, white picket section
      var px = [-24, 0, 24];
      for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(px[i] - 7, 0);
        ctx.lineTo(px[i] - 7, -40);
        ctx.lineTo(px[i], -52);
        ctx.lineTo(px[i] + 7, -40);
        ctx.lineTo(px[i] + 7, 0);
        ctx.closePath();
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
      inkRR(ctx, -34, -34, 68, 8, 3, CREAM, 3);
      inkRR(ctx, -34, -16, 68, 8, 3, CREAM, 3);
      gloss(ctx, -20, -48, 5, 2.5, 0.5);
    },

    lamppost: function (ctx, t, seed) {
      inkRR(ctx, -9, -8, 18, 8, 3, WOOD_DARK, 3);
      inkRR(ctx, -3.5, -104, 7, 98, 3, '#3F6B4F', 3);
      // lamp glow (cheap alpha circle, no shadowBlur)
      circle(ctx, 0, -114, 17);
      ctx.fillStyle = 'rgba(255,224,102,0.30)';
      ctx.fill();
      inkEll(ctx, 0, -114, 10, 12, CREAM, 3);
      fillEll(ctx, 0, -114, 5.5, 7, YELLOW);
      // cap + ball
      ctx.beginPath();
      ctx.moveTo(-12, -124);
      ctx.lineTo(12, -124);
      ctx.lineTo(0, -136);
      ctx.closePath();
      ctx.fillStyle = '#3F6B4F';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
      inkEll(ctx, 0, -138, 3.5, 3.5, GOLD, 2.5);
      gloss(ctx, -3.5, -119, 3, 5, 0.5, 0.3);
    },

    balloon: function (ctx, t, seed) {
      var cols = [RED, BLUE, PURPLE, GOLD, PINK];
      var col = cols[Math.floor(hash01(seed * 0.173 + 3.7) * cols.length) % cols.length];
      var sway = Math.sin(t * 1.4 + seed * 0.11) * 6;
      var bobb = Math.sin(t * 2.1 + seed * 0.07) * 4;
      var bx = sway, by = -86 + bobb;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(sway * 0.4, -34, bx, by + 24);
      ctx.stroke();
      // knot
      ctx.beginPath();
      ctx.moveTo(bx - 4, by + 26);
      ctx.lineTo(bx + 4, by + 26);
      ctx.lineTo(bx, by + 19);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.stroke();
      inkEll(ctx, bx, by, 16, 20, col, 3);
      gloss(ctx, bx - 5.5, by - 7, 5, 8, 0.5, -0.35);
    },

    swingset: function (ctx, t, seed) {
      ctx.lineCap = 'round';
      // A-frame legs (two per side)
      ctx.strokeStyle = WOOD;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-46, 0); ctx.lineTo(-30, -74);
      ctx.moveTo(-14, 0); ctx.lineTo(-30, -74);
      ctx.moveTo(46, 0); ctx.lineTo(30, -74);
      ctx.moveTo(14, 0); ctx.lineTo(30, -74);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      // top beam
      inkRR(ctx, -38, -80, 76, 10, 5, WOOD_DARK, 3);
      // swing (animated)
      var a = Math.sin(t * 1.7 + seed * 0.05) * 0.32;
      ctx.save();
      ctx.translate(0, -72);
      ctx.rotate(a);
      ctx.strokeStyle = '#B8A88C';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-9, 0); ctx.lineTo(-9, 46);
      ctx.moveTo(9, 0); ctx.lineTo(9, 46);
      ctx.stroke();
      inkRR(ctx, -13, 44, 26, 7, 3, RED, 3);
      ctx.restore();
    },

    slide: function (ctx, t, seed) {
      // ladder (right side)
      ctx.strokeStyle = WOOD;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(24, 0); ctx.lineTo(24, -66);
      ctx.moveTo(38, 0); ctx.lineTo(38, -66);
      ctx.stroke();
      ctx.strokeStyle = WOOD_DARK;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(24, -14); ctx.lineTo(38, -14);
      ctx.moveTo(24, -30); ctx.lineTo(38, -30);
      ctx.moveTo(24, -46); ctx.lineTo(38, -46);
      ctx.stroke();
      // rainbow slide bed: same curve stroked in shrinking widths (ink rim first)
      ctx.lineCap = 'round';
      var widths = [26, 22, 16, 10, 4.5];
      var cols = [INK, RED, GOLD, BLUE, CREAM];
      for (var i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(26, -62);
        ctx.quadraticCurveTo(-8, -52, -36, -4);
        ctx.strokeStyle = cols[i];
        ctx.lineWidth = widths[i];
        ctx.stroke();
      }
      // platform
      inkRR(ctx, 18, -70, 26, 9, 4, WOOD, 3);
    },

    seesaw: function (ctx, t, seed) {
      // pivot base
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, -22);
      ctx.closePath();
      ctx.fillStyle = WOOD;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
      var a = Math.sin(t * 1.3 + seed * 0.04) * 0.17;
      ctx.save();
      ctx.translate(0, -22);
      ctx.rotate(a);
      inkRR(ctx, -48, -4.5, 96, 9, 4.5, GOLD, 3);
      // seats + handles
      inkRR(ctx, -46, -9, 14, 5, 2.5, RED, 2.5);
      inkRR(ctx, 32, -9, 14, 5, 2.5, BLUE, 2.5);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-32, -8); ctx.lineTo(-32, -16);
      ctx.moveTo(32, -8); ctx.lineTo(32, -16);
      ctx.stroke();
      ctx.restore();
      inkEll(ctx, 0, -22, 4, 4, WOOD_DARK, 2.5);
    },

    kennel: function (ctx, t, seed) {
      // walls
      inkRR(ctx, -30, -52, 60, 52, 4, CREAM, 3);
      // roof
      ctx.beginPath();
      ctx.moveTo(-38, -48);
      ctx.lineTo(38, -48);
      ctx.lineTo(0, -88);
      ctx.closePath();
      ctx.fillStyle = RED;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
      gloss(ctx, -10, -70, 9, 4, 0.35, -0.55);
      // doorway arch
      ctx.beginPath();
      ctx.moveTo(-13, 0);
      ctx.lineTo(-13, -18);
      ctx.arc(0, -18, 13, Math.PI, 0);
      ctx.lineTo(13, 0);
      ctx.closePath();
      ctx.fillStyle = WOOD_DARK;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
      // bone plaque above door
      fillEll(ctx, -7, -38, 3.2, 3.2, '#FFFFFF');
      fillEll(ctx, 7, -38, 3.2, 3.2, '#FFFFFF');
      inkRR(ctx, -7, -40.5, 14, 5, 2.5, '#FFFFFF', 2);
    },

    hydrant: function (ctx, t, seed) {
      inkRR(ctx, -14, -8, 28, 8, 3, RED, 3);
      // body with dome top
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.lineTo(-10, -40);
      ctx.arc(0, -40, 10, Math.PI, 0);
      ctx.lineTo(10, -8);
      ctx.closePath();
      ctx.fillStyle = RED;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
      // side nozzles + cap
      inkEll(ctx, -14, -28, 4.5, 4.5, GOLD, 2.5);
      inkEll(ctx, 14, -28, 4.5, 4.5, GOLD, 2.5);
      inkRR(ctx, -6, -56, 12, 8, 3, RED, 3);
      inkEll(ctx, 0, -58, 3.5, 3.5, GOLD, 2.5);
      gloss(ctx, -4.5, -38, 3, 9, 0.45, 0.1);
    }
  };

  function drawSideProp(ctx, type, x, y, s, t) {
    var fn = PROPS[type];
    if (!fn) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    fn(ctx, t || 0, x);
    ctx.restore();
  }

  // ==========================================================================
  // THE PUP  (seen from behind, slight 3/4 top-down)
  // ==========================================================================
  function drawPupRunner(ctx, breed, x, y, s, t, state) {
    breed = breed || {};
    state = state || {};
    var id = breed.id || '';
    var bodyC = breed.body || '#E8B04B';
    var earC = breed.ear || '#C98E2E';
    var bellyC = breed.belly || '#F6D89A';
    var collarC = breed.collar || RED;
    var pointy = (id === 'frenchie' || id === 'husky');
    var poodle = (id === 'poodle');

    var run = (state.run === undefined) ? 1 : state.run;
    var jump = (typeof state.jumpArc === 'number') ? Math.min(1, Math.max(0, state.jumpArc)) : null;
    var lean = state.lean || 0;
    var sick = !!state.sick;
    var speed = !!state.speed;
    var phase = !!state.phase;
    var stun = !!state.stun;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // ---- cycle timing ------------------------------------------------------
    var ph = t * 13;                                   // stride phase
    var bob = run ? -Math.abs(Math.sin(ph)) * 4.5 : Math.sin(t * 2) * 1.2;
    var roll = (run ? Math.sin(ph) * 0.05 : 0) + lean * 0.22;
    var tuck = 0;
    if (jump !== null) {
      tuck = Math.sin(jump * Math.PI);                 // 0 takeoff, 1 apex, 0 landing
      bob = -tuck * 5;
      roll = lean * 0.22;
    }
    var legAmp = (run && jump === null) ? 5.5 : 0;
    var legL = Math.sin(ph) * legAmp;
    var legR = -legL;

    // ---- effects behind pup ------------------------------------------------
    if (speed) {
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 3.2;
      for (var m = 0; m < 3; m++) {
        var mo = ((ph * 4 + m * 9) % 26);
        var mxx = (m - 1) * 20;
        ctx.globalAlpha = 0.75 - mo / 40;
        ctx.beginPath();
        ctx.moveTo(mxx, -22 - m * 14 + mo * 0.3);
        ctx.lineTo(mxx * 1.25, 4 + mo);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (phase) {
      var pulse = 1 + Math.sin(t * 6) * 0.05;
      var auraCols = [GOLD, BLUE, PURPLE];
      for (var q = 0; q < 3; q++) {
        ell(ctx, 0, -46 + bob * 0.5, (42 + q * 6) * pulse, (52 + q * 6) * pulse);
        ctx.strokeStyle = auraCols[q];
        ctx.globalAlpha = 0.33 - q * 0.08;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // trailing sparkle stars (toward camera = down-screen)
      for (var sp = 0; sp < 4; sp++) {
        var spt = (t * 2 + sp * 0.83) % 1;
        star(ctx, (sp - 1.5) * 18 + Math.sin(t * 7 + sp * 2) * 4, 8 + spt * 26, 4.5 * (1 - spt) + 1.5, RAINBOW[(sp * 2 + Math.floor(t * 3)) % 6]);
      }
    }

    // ---- body transform ----------------------------------------------------
    ctx.translate(0, bob);
    ctx.rotate(roll);
    if (jump !== null) ctx.scale(1, 1 + tuck * 0.07);  // stretch at apex

    // ---- front paws (far side, kicking out beside the shoulders) -------------
    var fpl = tuck ? -46 : -42 - Math.max(-4, Math.min(4, -legL));
    var fpr = tuck ? -46 : -42 - Math.max(-4, Math.min(4, -legR));
    var fpx = tuck ? 19.5 : 22;
    inkEll(ctx, -fpx, fpl, 4.8, 4, bodyC, 2.6, -0.3);
    inkEll(ctx, fpx, fpr, 4.8, 4, bodyC, 2.6, 0.3);

    // ---- head (drawn first: farthest from camera) ---------------------------
    var headY = -72;
    inkEll(ctx, 0, headY, 19.5, 18.5, bodyC, 3);
    if (poodle) {
      // fluffy topknot
      outlinedUnion(ctx, function (c) {
        c.beginPath();
        c.arc(-11, headY - 12, 8, 0, TWO_PI);
        c.arc(0, headY - 16, 9.5, 0, TWO_PI);
        c.arc(11, headY - 12, 8, 0, TWO_PI);
      }, bodyC, 2.6);
    }
    if (breed.spots) {
      fillEll(ctx, -7, headY - 6, 4, 3.4, '#2B2B2B');
      fillEll(ctx, 9, headY + 2, 3.2, 2.8, '#2B2B2B');
    }
    gloss(ctx, -6, headY - 9, 5, 2.6, 0.22);

    // ---- ears ---------------------------------------------------------------
    var flop = run ? Math.sin(ph + 1.4) * 0.14 : Math.sin(t * 2 + 1) * 0.05;
    if (jump !== null) flop = -tuck * 0.5;             // ears float up mid-jump
    var floppyAngle = sick ? 0.15 : (speed ? 0.4 : 0.72);   // hang limp / pinned back / jaunty
    var floppyLen = speed ? 10.5 : 14;
    var pointyAngle = 0.16 + (sick ? 1.2 : 0) + (speed ? 0.72 : 0);
    for (var side = -1; side <= 1; side += 2) {
      ctx.save();
      if (pointy) {
        ctx.translate(side * 9, headY - 12);
        ctx.rotate(side * pointyAngle + flop * side);
        ctx.beginPath();
        ctx.moveTo(-6.5, 2);
        ctx.lineTo(6.5, 2);
        ctx.lineTo(0.5, -17);
        ctx.closePath();
        ctx.fillStyle = earC;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(3, 0);
        ctx.lineTo(0.3, -10);
        ctx.closePath();
        ctx.fillStyle = bellyC;
        ctx.fill();
      } else {
        ctx.translate(side * 14.5, headY - 5);
        ctx.rotate(-side * floppyAngle + flop * side);
        ell(ctx, 0, 12, 7, poodle ? floppyLen + 1.5 : floppyLen, 0);
        ctx.fillStyle = earC;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK;
        ctx.stroke();
        gloss(ctx, -2, 5, 2.6, 4.5, 0.25);
      }
      ctx.restore();
    }

    // ---- body / rump ---------------------------------------------------------
    inkEll(ctx, 0, -32, 24, 27, bodyC, 3);
    // markings
    if (breed.patch) {
      fillEll(ctx, 3, -44, 13, 9, earC, -0.12);
      fillEll(ctx, -8, -37, 7, 6, earC);
    }
    if (breed.spots) {
      fillEll(ctx, -10, -40, 4.6, 4, '#2B2B2B');
      fillEll(ctx, 8, -30, 5, 4.4, '#2B2B2B');
      fillEll(ctx, 2, -47, 3.4, 3, '#2B2B2B');
      fillEll(ctx, 14, -41, 3, 2.7, '#2B2B2B');
      fillEll(ctx, -15, -26, 3.2, 2.8, '#2B2B2B');
    }
    if (poodle) {
      // fluffy rump bumps along the sides
      ctx.strokeStyle = 'rgba(58,42,30,0.25)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(-16, -40, 7, 2.2, 4.6);
      ctx.arc(16, -40, 7, -1.5, 1.0);
      ctx.stroke();
    }
    gloss(ctx, -9, -46, 9, 4.5, 0.28);
    // belly fluff peeking under the rump
    fillEll(ctx, 0, -8.5, 12, 4.5, bellyC);

    // ---- collar (at neck seam) + gold tag + D-ring for the leash --------------
    ell(ctx, 0, -56.5, 13.5, 4.6, 0);
    ctx.fillStyle = collarC;
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    inkEll(ctx, 6.5, -53.5, 3, 3, GOLD, 2.2);
    gloss(ctx, 5.6, -54.4, 1.1, 1.1, 0.85, 0);
    // silver D-ring on the back of the collar (leash clips here)
    inkEll(ctx, 0, -52.2, 2.6, 2.6, '#D5DBE0', 2);

    // ---- back legs (nearest camera): chunky haunches + paws --------------------
    var bl = tuck ? -13 - tuck * 3 : -6 + Math.max(-5, Math.min(5, legL));
    var br = tuck ? -13 - tuck * 3 : -6 + Math.max(-5, Math.min(5, legR));
    var bpx = tuck ? 10 : 13.5;
    inkEll(ctx, -17, -19 + (bl + 6) * 0.35, 10, 12, bodyC, 3, 0.12);
    inkEll(ctx, 17, -19 + (br + 6) * 0.35, 10, 12, bodyC, 3, -0.12);
    if (breed.spots) {
      fillEll(ctx, -18, -20, 3.4, 3, '#2B2B2B');
      fillEll(ctx, 18, -16, 2.8, 2.5, '#2B2B2B');
    }
    inkEll(ctx, -bpx, bl, 8, 6.4, bodyC, 3);
    inkEll(ctx, bpx, br, 8, 6.4, bodyC, 3);
    // paw pads (belly colour toe line)
    fillEll(ctx, -bpx, bl + 2.4, 4.6, 2, bellyC);
    fillEll(ctx, bpx, br + 2.4, 4.6, 2, bellyC);

    // ---- tail (closest to camera, wags over the back) --------------------------
    var wagSpeed = sick ? 3.5 : (run || jump !== null ? 15 : 8);
    var wag = Math.sin(t * wagSpeed) * (sick ? 0.3 : 0.85);
    ctx.save();
    ctx.translate(0, -24);
    ctx.rotate(wag);
    if (poodle) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-2, -7, 0.5, -13);
      ctx.stroke();
      ctx.strokeStyle = bodyC;
      ctx.lineWidth = 5;
      ctx.stroke();
      outlinedUnion(ctx, function (c) {
        c.beginPath();
        c.arc(0.8, -19, 7, 0, TWO_PI);
        c.arc(-4, -15.5, 4.5, 0, TWO_PI);
        c.arc(5.6, -15.5, 4.5, 0, TWO_PI);
      }, bodyC, 2.4);
      gloss(ctx, -1.2, -21.5, 3, 1.8, 0.4);
    } else {
      // rounded wagging tail: curved stroke + soft tip knob
      ctx.strokeStyle = INK;
      ctx.lineWidth = 10.5;
      ctx.beginPath();
      ctx.moveTo(0, 1);
      ctx.quadraticCurveTo(-3.5, -11, 1.5, -19);
      ctx.stroke();
      ctx.strokeStyle = bodyC;
      ctx.lineWidth = 6.5;
      ctx.stroke();
      // tip (beagle white flag / husky cream tip / matching knob otherwise)
      var tipC = (breed.patch || id === 'husky') ? bellyC : bodyC;
      inkEll(ctx, 1.8, -20, 4.4, 4.4, tipC, 2.6);
    }
    ctx.restore();

    // ---- state overlays ----------------------------------------------------
    if (sick) {
      ell(ctx, 0, -44, 30, 48, 0);
      ctx.fillStyle = 'rgba(120,200,110,0.13)';
      ctx.fill();
      // little green queasy bubbles
      fillEll(ctx, 24, -66 + Math.sin(t * 3) * 2, 3, 3, 'rgba(140,210,120,0.8)');
      fillEll(ctx, 28, -74 + Math.sin(t * 3 + 1) * 2, 2, 2, 'rgba(140,210,120,0.8)');
    }
    if (stun) {
      for (var st2 = 0; st2 < 3; st2++) {
        var sa = t * 5 + st2 * (TWO_PI / 3);
        star(ctx, Math.cos(sa) * 23, headY - 20 + Math.sin(sa) * 6, 5, st2 % 2 ? GOLD : YELLOW);
      }
    }

    ctx.restore();
    var cp = rot2(0, -52.2 + bob, roll);
    return { collarX: x + cp.x * s, collarY: y + cp.y * s };
  }

  // ==========================================================================
  // FLORENCE — 8-year-old, blond pigtails, pink dress. Same behind-camera as pup.
  // ==========================================================================
  var FLO_SKIN = '#F8C9A0';
  var FLO_HAIR = '#F4D06A';
  var FLO_DRESS = '#FF7BAC';
  var FLO_BOW = '#9B5DE5';
  var FLO_SHOE = '#E23A3A';
  var FLO_SHOE_W = '#FFF6DC';
  var FLO_SOCK = '#FFFFFF';

  function rot2(x, y, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return { x: x * c - y * s, y: x * s + y * c };
  }

  function runnerMotion(t, state) {
    state = state || {};
    var run = (state.run === undefined) ? 1 : state.run;
    var jump = (typeof state.jumpArc === 'number') ? Math.min(1, Math.max(0, state.jumpArc)) : null;
    var lean = state.lean || 0;
    var ph = t * 13;
    var bob = run ? -Math.abs(Math.sin(ph)) * 4.5 : Math.sin(t * 2) * 1.2;
    var roll = (run ? Math.sin(ph) * 0.05 : 0) + lean * 0.22;
    var tuck = 0;
    if (jump !== null) {
      tuck = Math.sin(jump * Math.PI);
      bob = -tuck * 5;
      roll = lean * 0.22;
    }
    return { run: run, jump: jump, lean: lean, ph: ph, bob: bob, roll: roll, tuck: tuck };
  }

  function floHandLocal(m) {
    // same 3/4-behind slot as the pup's far-left paw — hand toward the puppy
    var swing = (m.run && m.jump === null) ? Math.sin(m.ph) * 2.5 : 0;
    var out = m.tuck ? 3 : 0;
    return { x: -22 - out, y: -46 + swing };
  }

  function leashEnds(px, py, ps, fx, fy, fs, t, state) {
    var m = runnerMotion(t, state);
    var side = state && state.side ? state.side : 1;
    var c = rot2(0, -52.2 + m.bob, m.roll);
    var h = floHandLocal(m);
    var f = rot2(h.x, h.y + m.bob, m.roll);
    return {
      x0: px + c.x * ps,
      y0: py + c.y * ps,
      x1: fx + side * f.x * fs,
      y1: fy + f.y * fs
    };
  }

  function drawLeash(ctx, x0, y0, x1, y1, t, opts) {
    opts = opts || {};
    var taut = opts.jump || 0;
    var sc = opts.scale || 1;
    var slack = 22 * (1 - taut * 0.7) * sc;
    var mx = (x0 + x1) / 2;
    var my = Math.max(y0, y1) + slack + Math.sin((t || 0) * 9) * 2.4 * (1 - taut) * sc;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(3.4, 5.2 * sc);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(mx, my, x1, y1);
    ctx.stroke();
    ctx.strokeStyle = '#E23A3A';
    ctx.lineWidth = Math.max(2, 3.2 * sc);
    ctx.stroke();
    // tiny highlight dash mid-leash
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = Math.max(1, 1.3 * sc);
    ctx.beginPath();
    ctx.moveTo((x0 + mx) * 0.5, (y0 + my) * 0.5);
    ctx.lineTo((mx + x1) * 0.5, (my + y1) * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function drawFlorenceRunner(ctx, x, y, s, t, state) {
    // Same camera as the pup: behind, slight 3/4 top-down. Stacked ellipses,
    // squat chibi, head far / hips near / shoes nearest.
    state = state || {};
    var m = runnerMotion(t, state);
    var side = state.side || 1;
    var sick = !!state.sick;
    var speed = !!state.speed;
    var phase = !!state.phase;
    var stun = !!state.stun;
    var run = m.run;
    var jump = m.jump;
    var ph = m.ph;
    var tuck = m.tuck;
    var bob = m.bob;
    var roll = m.roll;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * side, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (speed) {
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 3.2;
      for (var mln = 0; mln < 3; mln++) {
        var mo = ((ph * 4 + mln * 9) % 26);
        var mxx = (mln - 1) * 18;
        ctx.globalAlpha = 0.75 - mo / 40;
        ctx.beginPath();
        ctx.moveTo(mxx, -22 - mln * 14 + mo * 0.3);
        ctx.lineTo(mxx * 1.25, 4 + mo);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (phase) {
      var pulse = 1 + Math.sin(t * 6) * 0.05;
      var auraCols = [GOLD, PINK, PURPLE];
      for (var q = 0; q < 3; q++) {
        ell(ctx, 0, -46 + bob * 0.5, (40 + q * 6) * pulse, (52 + q * 6) * pulse);
        ctx.strokeStyle = auraCols[q];
        ctx.globalAlpha = 0.33 - q * 0.08;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    ctx.translate(0, bob);
    ctx.rotate(roll);
    if (jump !== null) ctx.scale(1, 1 + tuck * 0.07);

    var legAmp = (run && jump === null) ? 5.5 : 0;
    var legL = Math.sin(ph) * legAmp;
    var legR = -legL;

    var fpl = tuck ? -46 : -42 - Math.max(-4, Math.min(4, -legL));
    var fpr = tuck ? -46 : -42 - Math.max(-4, Math.min(4, -legR));
    var fpx = tuck ? 18 : 20.5;
    inkEll(ctx, -fpx, fpl, 4.6, 3.8, FLO_SKIN, 2.5, -0.3);
    inkEll(ctx, fpx, fpr, 4.6, 3.8, FLO_SKIN, 2.5, 0.3);

    var headY = -74;
    inkEll(ctx, 0, headY, 18, 17.2, FLO_HAIR, 3);
    inkEll(ctx, -13.5, headY + 3, 3.4, 4.2, FLO_SKIN, 2.2);
    inkEll(ctx, 13.5, headY + 3, 3.4, 4.2, FLO_SKIN, 2.2);
    fillEll(ctx, -6, headY - 7, 6, 5, FLO_HAIR, -0.2);
    fillEll(ctx, 6, headY - 7, 6, 5, FLO_HAIR, 0.2);
    fillEll(ctx, 0, headY - 10, 8, 5.5, FLO_HAIR);
    gloss(ctx, -6, headY - 8, 5, 2.6, 0.32);

    var flop = run ? Math.sin(ph + 1.4) * 0.14 : Math.sin(t * 2 + 1) * 0.05;
    if (jump !== null) flop = -tuck * 0.5;
    var floppyAngle = sick ? 0.15 : (speed ? 0.4 : 0.72);
    var floppyLen = speed ? 10 : 13;
    for (var psd = -1; psd <= 1; psd += 2) {
      ctx.save();
      ctx.translate(psd * 14.5, headY - 4);
      ctx.rotate(-psd * floppyAngle + flop * psd);
      ell(ctx, 0, 12, 6.4, floppyLen, 0);
      ctx.fillStyle = FLO_HAIR;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
      gloss(ctx, -2, 5, 2.4, 4, 0.28);
      inkEll(ctx, -3.6, 1.2, 3.6, 2.8, FLO_BOW, 2, -0.4);
      inkEll(ctx, 3.6, 1.2, 3.6, 2.8, FLO_BOW, 2, 0.4);
      inkEll(ctx, 0, 1.4, 2.1, 2.1, '#FFE9A0', 1.7);
      ctx.restore();
    }

    inkEll(ctx, 0, -32, 23, 26, FLO_DRESS, 3);
    gloss(ctx, -8, -46, 8, 4.2, 0.26);
    ell(ctx, 0, -56.5, 13.2, 4.5, 0);
    ctx.fillStyle = FLO_BOW;
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    inkEll(ctx, -6, -60, 6.2, 3.2, FLO_SHOE_W, 2.2, -0.12);
    inkEll(ctx, 6, -60, 6.2, 3.2, FLO_SHOE_W, 2.2, 0.12);
    ctx.save();
    ctx.translate(0, -55.5);
    ctx.fillStyle = '#FFE9A0';
    ctx.beginPath();
    ctx.arc(-1.5, -0.2, 1.6, 0, TWO_PI);
    ctx.arc(1.5, -0.2, 1.6, 0, TWO_PI);
    ctx.moveTo(-3, 0.3);
    ctx.lineTo(0, 3.2);
    ctx.lineTo(3, 0.3);
    ctx.fill();
    ctx.restore();

    var hand = floHandLocal(m);
    inkEll(ctx, hand.x, hand.y, 4.8, 4.2, FLO_SKIN, 2.4);

    var bl = tuck ? -13 - tuck * 3 : -6 + Math.max(-5, Math.min(5, legL));
    var br = tuck ? -13 - tuck * 3 : -6 + Math.max(-5, Math.min(5, legR));
    var bpx = tuck ? 10 : 13;
    inkEll(ctx, -16, -19 + (bl + 6) * 0.35, 9, 11.5, FLO_SKIN, 2.8, 0.12);
    inkEll(ctx, 16, -19 + (br + 6) * 0.35, 9, 11.5, FLO_SKIN, 2.8, -0.12);
    fillEll(ctx, -bpx, bl - 3.2, 4.2, 2.2, FLO_SOCK);
    fillEll(ctx, bpx, br - 3.2, 4.2, 2.2, FLO_SOCK);
    inkEll(ctx, -bpx, bl, 7.6, 5.6, FLO_SHOE, 2.8);
    inkEll(ctx, bpx, br, 7.6, 5.6, FLO_SHOE, 2.8);
    fillEll(ctx, -bpx, bl + 1.6, 4.2, 1.7, FLO_SHOE_W);
    fillEll(ctx, bpx, br + 1.6, 4.2, 1.7, FLO_SHOE_W);

    if (sick) {
      ell(ctx, 0, -44, 30, 48, 0);
      ctx.fillStyle = 'rgba(120,200,110,0.13)';
      ctx.fill();
      fillEll(ctx, 24, -66 + Math.sin(t * 3) * 2, 3, 3, 'rgba(140,210,120,0.8)');
    }
    if (stun) {
      for (var stf = 0; stf < 3; stf++) {
        var sa = t * 5 + stf * (TWO_PI / 3);
        star(ctx, Math.cos(sa) * 23, headY - 18 + Math.sin(sa) * 6, 5, stf % 2 ? GOLD : YELLOW);
      }
    }

    ctx.restore();
    var hp = rot2(hand.x, hand.y + bob, roll);
    return { handX: x + side * hp.x * s, handY: y + hp.y * s };
  }

  function drawFlorenceSide(ctx, x, y, s, t, opts) {
    // Same orientation as drawPupSide: horizontal runner, facing right.
    opts = opts || {};
    var moving = !!opts.moving;
    var walk = moving ? Math.sin(t * 14) * 1 : 0;
    var ph = t * 14;
    var wag = Math.sin(t * (moving ? 16 : 5)) * 0.5;
    ctx.save();
    ctx.translate(x, y + walk * s * 0.5);
    ctx.scale(s, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    var legSwing = moving ? Math.sin(ph) * 3 : 0;

    ctx.strokeStyle = INK;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.quadraticCurveTo(-18, -12 + wag * 5, -22, -16 + wag * 9);
    ctx.stroke();
    ctx.strokeStyle = FLO_HAIR;
    ctx.lineWidth = 4.2;
    ctx.stroke();
    inkEll(ctx, -22, -16 + wag * 9, 4.2, 4.2, FLO_HAIR, 2.2);
    inkEll(ctx, -12, -7, 3.2, 2.5, FLO_BOW, 1.8);

    var lw = 4.2;
    [[-8, legSwing], [-2, -legSwing], [5, -legSwing], [10, legSwing]].forEach(function (pair) {
      inkRR(ctx, pair[0] - lw / 2 + pair[1] * 0.3, 4, lw, 9, 2.4, FLO_SKIN, 2.2);
    });
    inkEll(ctx, -8 + legSwing * 0.3, 13.2, 4.4, 2.6, FLO_SHOE, 2);
    inkEll(ctx, 10 + legSwing * 0.3, 13.2, 4.4, 2.6, FLO_SHOE, 2);
    fillEll(ctx, 11.2 + legSwing * 0.3, 12.8, 1.8, 1, FLO_SHOE_W);

    inkEll(ctx, -1, -2, 14.5, 10.5, FLO_DRESS, 2.8);
    ell(ctx, 2, -6, 9, 2.4, -0.08);
    ctx.fillStyle = FLO_BOW;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = INK;
    ctx.stroke();

    inkEll(ctx, -6, 0, 2.4, 5.2, FLO_SKIN, 2, -0.5);

    inkEll(ctx, 13, -13, 10, 9.6, FLO_SKIN, 2.6);
    outlinedUnion(ctx, function (c) {
      c.beginPath();
      c.ellipse(10, -18.5, 8.4, 6.2, -0.35, 0, TWO_PI);
      c.ellipse(6.5, -14.5, 5.4, 6, 0.2, 0, TWO_PI);
    }, FLO_HAIR, 2.2);
    inkEll(ctx, 14.2, -20.6, 3.2, 2.8, FLO_HAIR, 1.9, 0.4);
    gloss(ctx, 8, -20, 3, 1.5, 0.4);

    fillEll(ctx, 17.6, -14.2, 1.7, 1.9, INK);
    fillEll(ctx, 18.1, -14.8, 0.55, 0.55, '#fff');
    fillEll(ctx, 16.2, -10.6, 2, 1.4, '#F09AA8');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.arc(18.2, -10.6, 2.1, 0.15, 1.1);
    ctx.stroke();

    inkEll(ctx, 14, -1 + (moving ? Math.sin(ph) * 0.6 : 0), 2.6, 5.4, FLO_SKIN, 2, 1.05);
    inkEll(ctx, 18, 3.2, 3.2, 2.8, FLO_SKIN, 2);

    ctx.restore();
    return {
      handX: x + 18 * s,
      handY: y + walk * s * 0.5 + 3.2 * s
    };
  }

  // ==========================================================================
  // CONFETTI BURST
  // ==========================================================================
  function drawConfettiBurst(ctx, x, y, t01, seed) {
    if (!(t01 > 0) || t01 >= 1) return;
    seed = seed || 1;
    ctx.save();
    ctx.translate(x, y);
    var cols = [RED, GOLD, BLUE, PURPLE, GRASS, PINK, CREAM];
    var ease = 1 - (1 - t01) * (1 - t01);
    var fade = t01 < 0.65 ? 1 : 1 - (t01 - 0.65) / 0.35;
    ctx.globalAlpha = Math.max(0, fade);
    for (var i = 0; i < 14; i++) {
      var h1 = hash01(seed * 13.7 + i * 1.31);
      var h2 = hash01(seed * 31.3 + i * 2.71);
      var h3 = hash01(seed * 7.9 + i * 5.13);
      var ang = h1 * TWO_PI;
      var dist = ease * (34 + h2 * 58);
      var px = Math.cos(ang) * dist;
      var py = Math.sin(ang) * dist * 0.85 + ease * ease * 22 * h3;
      var col = cols[i % cols.length];
      if (i % 4 === 3) {
        star(ctx, px, py, 4 + h2 * 4, col);
      } else {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ang + t01 * 10 * (h3 - 0.5));
        ctx.fillStyle = col;
        ctx.fillRect(-4, -2.5, 8, 5);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ==========================================================================
  window.PBEScenery = {
    drawSky: drawSky,
    drawSideProp: drawSideProp,
    drawPupRunner: drawPupRunner,
    drawFlorenceRunner: drawFlorenceRunner,
    drawFlorenceSide: drawFlorenceSide,
    drawLeash: drawLeash,
    leashEnds: leashEnds,
    drawConfettiBurst: drawConfettiBurst
  };
})();
