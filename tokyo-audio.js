/* ============================================================================
 * TokyoPBEAudio — Self-contained WebAudio Sound Engine for
 * "Florence's Puppy Biscuit Eater — Level 2: Tokyo Subway Rush"
 *
 * Fully synthesized WebAudio (no external sound files required).
 * Features:
 *   - Authentic Tokyo Yamanote-style departure bell chime
 *   - High-energy Japanese arcade synthwave music with dynamic tempo layers
 *   - Wild Boar snorts & cartoon tumble squeals
 *   - Dog Walker Ambush horn & comical "Push Over" thud
 *   - Anti-Gravity Inversion / Ceiling Flip whoosh & clamp
 *   - Hyper Magnet electric hum & lightning vacuum
 *   - Neon Blackout power-down & surge restoration
 *   - Laser Shield, Mystery Bento, Taiyaki, and Ramen treat fanfares
 * ========================================================================= */
(function () {
  'use strict';

  var ctx = null;
  var master = null;
  var musicBus = null;
  var sfxBus = null;
  var noiseBuf = null;
  var enabled = true;
  var musicEnabled = true;

  var MASTER_LEVEL = 0.24;
  var MUSIC_LEVEL = 0.52;
  var SFX_LEVEL = 1.0;

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended' && ctx.resume) { try { ctx.resume(); } catch (e) {} }
      return;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
    } catch (e) { ctx = null; return; }

    master = ctx.createGain();
    master.gain.value = enabled ? MASTER_LEVEL : 0;
    master.connect(ctx.destination);

    musicBus = ctx.createGain();
    musicBus.gain.value = musicEnabled ? MUSIC_LEVEL : 0;
    musicBus.connect(master);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_LEVEL;
    sfxBus.connect(master);

    // 1s white noise buffer
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    if (ctx.state === 'suspended' && ctx.resume) { try { ctx.resume(); } catch (e2) {} }
  }

  function ready() { return !!(ctx && master); }
  function now() { return ctx.currentTime; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function tone(o) {
    var osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq, o.t);
    if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.freqEnd), o.t + (o.glideT || o.dur));

    var g = ctx.createGain();
    var atk = o.attack || 0.005;
    g.gain.setValueAtTime(0.0001, o.t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.5, o.t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.dur);

    var node = osc;
    if (o.filter) {
      var f = ctx.createBiquadFilter();
      f.type = o.filter.type || 'lowpass';
      f.frequency.setValueAtTime(o.filter.freq, o.t);
      if (o.filter.freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(10, o.filter.freqEnd), o.t + o.dur);
      f.Q.value = o.filter.q || 1;
      osc.connect(f); node = f;
    }
    node.connect(g);
    g.connect(o.dest || sfxBus);
    osc.start(o.t);
    osc.stop(o.t + o.dur + 0.05);
    return osc;
  }

  function noise(o) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;

    var g = ctx.createGain();
    var atk = o.attack || 0.003;
    g.gain.setValueAtTime(0.0001, o.t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.5, o.t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.dur);

    var node = src;
    if (o.filter) {
      var f = ctx.createBiquadFilter();
      f.type = o.filter.type || 'bandpass';
      f.frequency.setValueAtTime(o.filter.freq, o.t);
      if (o.filter.freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(10, o.filter.freqEnd), o.t + o.dur);
      f.Q.value = o.filter.q || 1;
      src.connect(f); node = f;
    }
    node.connect(g);
    g.connect(o.dest || sfxBus);
    src.start(o.t);
    src.stop(o.t + o.dur + 0.05);
    return src;
  }

  function guard(fn) {
    return function () { if (!ready()) return; try { fn(); } catch (e) {} };
  }

  /* ------------------------------------------------------------------ *
   * Sound FX
   * ------------------------------------------------------------------ */
  var sfx = {};

  // Tokyo station departure bell chime (Yamanote bell theme)
  sfx.stationChime = guard(function () {
    var t = now();
    var notes = [76, 79, 83, 84, 88]; // E5, G5, B5, C6, E6
    for (var i = 0; i < notes.length; i++) {
      var nt = t + i * 0.09;
      tone({ type: 'sine', freq: midiHz(notes[i]), t: nt, dur: 0.35, vol: 0.45 });
      tone({ type: 'triangle', freq: midiHz(notes[i]) * 2, t: nt, dur: 0.25, vol: 0.15 });
    }
  });

  // Cheerful cartoon bark
  sfx.bark = guard(function () {
    var t = now();
    var jitter = rand(0.9, 1.2);
    var dur = 0.14 * rand(0.9, 1.1);
    noise({ t: t, dur: 0.03, vol: 0.45, attack: 0.002, filter: { type: 'bandpass', freq: 1500 * jitter, q: 1.2 } });
    tone({ type: 'sawtooth', freq: 720 * jitter, freqEnd: 260 * jitter, glideT: dur,
           t: t + 0.01, dur: dur, vol: 0.8, attack: 0.007,
           filter: { type: 'bandpass', freq: 950 * jitter, freqEnd: 430 * jitter, q: 2.2 } });
    tone({ type: 'triangle', freq: 350 * jitter, freqEnd: 160 * jitter, glideT: dur,
           t: t + 0.01, dur: dur * 0.9, vol: 0.4, attack: 0.01 });
  });

  // Biscuit crunch
  sfx.munch = guard(function () {
    var t = now();
    noise({ t: t, dur: 0.05, vol: 0.75, attack: 0.002, filter: { type: 'lowpass', freq: 1200, freqEnd: 380, q: 1 } });
    noise({ t: t + 0.07, dur: 0.06, vol: 0.65, attack: 0.002, filter: { type: 'lowpass', freq: 950 * rand(0.9, 1.1), freqEnd: 320, q: 1 } });
  });

  // Taiyaki & Ramen special treat chew
  sfx.taiyaki = guard(function () {
    var t = now();
    tone({ type: 'triangle', freq: 880, freqEnd: 1100, glideT: 0.08, t: t, dur: 0.14, vol: 0.5 });
    tone({ type: 'sine', freq: 1320, t: t + 0.06, dur: 0.2, vol: 0.4 });
    noise({ t: t, dur: 0.04, vol: 0.5, filter: { type: 'bandpass', freq: 2000, q: 2 } });
  });

  // Sparkly gem / star pickup
  sfx.gem = guard(function () {
    var t = now(), notes = [1046.5, 1318.5, 1568, 2093]; // C6 E6 G6 C7
    for (var i = 0; i < notes.length; i++) {
      tone({ type: 'triangle', freq: notes[i], t: t + i * 0.06, dur: 0.18, vol: 0.48 });
      tone({ type: 'sine', freq: notes[i] * 1.5, t: t + i * 0.06, dur: 0.12, vol: 0.15 });
    }
  });

  // Wild boar grunt / snort
  sfx.boar = guard(function () {
    var t = now();
    tone({ type: 'sawtooth', freq: 180, freqEnd: 90, glideT: 0.18, t: t, dur: 0.22, vol: 0.6,
           filter: { type: 'lowpass', freq: 450, q: 3 } });
    noise({ t: t + 0.02, dur: 0.12, vol: 0.4, filter: { type: 'bandpass', freq: 350, q: 2 } });
  });

  // Wild boar bonked / launched
  sfx.boarBonk = guard(function () {
    var t = now();
    // cartoon ascending squeal + spring
    tone({ type: 'sawtooth', freq: 160, freqEnd: 650, glideT: 0.22, t: t, dur: 0.26, vol: 0.6,
           filter: { type: 'bandpass', freq: 800, q: 2 } });
    tone({ type: 'triangle', freq: 300, freqEnd: 900, glideT: 0.22, t: t, dur: 0.28, vol: 0.5 });
    noise({ t: t, dur: 0.08, vol: 0.5, filter: { type: 'lowpass', freq: 700 } });
  });

  // Dog Walker Ambush horn alert
  sfx.ambush = guard(function () {
    var t = now();
    tone({ type: 'sawtooth', freq: 580, t: t, dur: 0.1, vol: 0.4, filter: { type: 'bandpass', freq: 1200, q: 2 } });
    tone({ type: 'sawtooth', freq: 740, t: t + 0.11, dur: 0.15, vol: 0.45, filter: { type: 'bandpass', freq: 1500, q: 2 } });
  });

  // Push Over! (Tackling rival dog walker)
  sfx.push = guard(function () {
    var t = now();
    // punchy cartoon impact
    tone({ type: 'sine', freq: 220, freqEnd: 60, glideT: 0.14, t: t, dur: 0.18, vol: 0.85 });
    tone({ type: 'square', freq: 380, freqEnd: 120, glideT: 0.16, t: t, dur: 0.2, vol: 0.4,
           filter: { type: 'lowpass', freq: 850 } });
    noise({ t: t, dur: 0.09, vol: 0.6, filter: { type: 'lowpass', freq: 900 } });
    // tumbling slide whistle effect
    tone({ type: 'triangle', freq: 750, freqEnd: 240, glideT: 0.35, t: t + 0.05, dur: 0.38, vol: 0.4 });
  });

  // Anti-Gravity Inversion / Ceiling Flip
  sfx.gravityFlip = guard(function () {
    var t = now();
    // cosmic rising energy whoosh + magnetic lock
    tone({ type: 'sawtooth', freq: 120, freqEnd: 880, glideT: 0.35, t: t, dur: 0.4, vol: 0.55,
           filter: { type: 'bandpass', freq: 1100, freqEnd: 3200, q: 3 } });
    tone({ type: 'sine', freq: 220, freqEnd: 980, glideT: 0.35, t: t, dur: 0.42, vol: 0.45 });
    noise({ t: t, dur: 0.35, vol: 0.3, filter: { type: 'bandpass', freq: 1400, freqEnd: 3600, q: 2 } });
    // lock clang
    tone({ type: 'square', freq: 440, freqEnd: 110, glideT: 0.1, t: t + 0.34, dur: 0.15, vol: 0.5,
           filter: { type: 'lowpass', freq: 1600 } });
  });

  // Landing back on track from ceiling
  sfx.gravityLand = guard(function () {
    var t = now();
    tone({ type: 'sawtooth', freq: 650, freqEnd: 140, glideT: 0.25, t: t, dur: 0.3, vol: 0.5,
           filter: { type: 'lowpass', freq: 1400 } });
    tone({ type: 'sine', freq: 180, freqEnd: 50, glideT: 0.12, t: t + 0.22, dur: 0.16, vol: 0.7 });
    noise({ t: t + 0.22, dur: 0.08, vol: 0.4, filter: { type: 'lowpass', freq: 600 } });
  });

  // Hyper Magnet hum & vacuum zap
  sfx.magnet = guard(function () {
    var t = now();
    tone({ type: 'sawtooth', freq: 280, freqEnd: 560, glideT: 0.25, t: t, dur: 0.3, vol: 0.4,
           filter: { type: 'bandpass', freq: 1600, q: 4 } });
    tone({ type: 'sine', freq: 560, freqEnd: 880, glideT: 0.25, t: t, dur: 0.32, vol: 0.35 });
    noise({ t: t, dur: 0.2, vol: 0.25, filter: { type: 'bandpass', freq: 3000, q: 3 } });
  });

  // Rainbow Overdrive / Phase
  sfx.phase = guard(function () {
    var t = now(), notes = [72, 76, 79, 84, 88, 91, 96]; // C5 E5 G5 C6 E6 G6 C7
    for (var i = 0; i < notes.length; i++) {
      var nt = t + i * 0.07;
      tone({ type: 'triangle', freq: midiHz(notes[i]), t: nt, dur: 0.3, vol: 0.45 });
      tone({ type: 'sine', freq: midiHz(notes[i]) * 2, t: nt, dur: 0.22, vol: 0.2 });
    }
  });

  // Mystery Bento Box Fanfare
  sfx.bento = guard(function () {
    var t = now(), notes = [67, 72, 76, 79, 84, 88]; // G4, C5, E5, G5, C6, E6
    for (var i = 0; i < notes.length; i++) {
      tone({ type: 'triangle', freq: midiHz(notes[i]), t: t + i * 0.06, dur: 0.24, vol: 0.45 });
    }
  });

  // Laser Shield activate
  sfx.shield = guard(function () {
    var t = now();
    tone({ type: 'sine', freq: 320, freqEnd: 980, glideT: 0.2, t: t, dur: 0.25, vol: 0.5 });
    tone({ type: 'triangle', freq: 640, freqEnd: 1280, glideT: 0.2, t: t, dur: 0.25, vol: 0.3 });
  });

  // Tunnel Blackout
  sfx.blackout = guard(function () {
    var t = now();
    tone({ type: 'sawtooth', freq: 340, freqEnd: 45, glideT: 0.6, t: t, dur: 0.65, vol: 0.4,
           filter: { type: 'lowpass', freq: 600, freqEnd: 100, q: 4 } });
  });

  // Power Restored surge
  sfx.powerRestored = guard(function () {
    var t = now();
    tone({ type: 'sine', freq: 110, freqEnd: 660, glideT: 0.35, t: t, dur: 0.4, vol: 0.5 });
    tone({ type: 'triangle', freq: 220, freqEnd: 880, glideT: 0.35, t: t, dur: 0.4, vol: 0.35 });
    noise({ t: t, dur: 0.2, vol: 0.35, filter: { type: 'bandpass', freq: 2400, q: 3 } });
  });

  // Standard jump / boing
  sfx.jump = guard(function () {
    var t = now();
    tone({ type: 'square', freq: 240, freqEnd: 680, glideT: 0.12, t: t, dur: 0.16, vol: 0.35,
           filter: { type: 'lowpass', freq: 1800 } });
    tone({ type: 'sine', freq: 240, freqEnd: 680, glideT: 0.12, t: t, dur: 0.16, vol: 0.3 });
  });

  // Landing
  sfx.land = guard(function () {
    var t = now();
    tone({ type: 'sine', freq: 140, freqEnd: 60, glideT: 0.08, t: t, dur: 0.11, vol: 0.6 });
    noise({ t: t, dur: 0.04, vol: 0.22, filter: { type: 'lowpass', freq: 550 } });
  });

  // Speed zoom
  sfx.zoom = guard(function () {
    var t = now(), f = 360;
    for (var i = 0; i < 6; i++) {
      tone({ type: 'square', freq: f, freqEnd: f * 1.25, glideT: 0.04, t: t + i * 0.04, dur: 0.06, vol: 0.3,
             filter: { type: 'lowpass', freq: 3600 } });
      f *= 1.3;
    }
  });

  // Bonk / collision
  sfx.hit = guard(function () {
    var t = now();
    tone({ type: 'sine', freq: 160, freqEnd: 55, glideT: 0.12, t: t, dur: 0.16, vol: 0.85 });
    tone({ type: 'square', freq: 440, freqEnd: 180, glideT: 0.16, t: t + 0.01, dur: 0.18, vol: 0.25,
           filter: { type: 'lowpass', freq: 950 } });
    noise({ t: t, dur: 0.04, vol: 0.35, filter: { type: 'lowpass', freq: 650 } });
  });

  // Countdown tick
  sfx.tick = guard(function () {
    var t = now();
    tone({ type: 'square', freq: 1760, t: t, dur: 0.04, vol: 0.3, filter: { type: 'bandpass', freq: 1900, q: 3 } });
  });

  // UI click
  sfx.ui = guard(function () {
    var t = now();
    tone({ type: 'sine', freq: 920, freqEnd: 1400, glideT: 0.04, t: t, dur: 0.06, vol: 0.35 });
  });

  // Whistle / game over
  sfx.whistle = guard(function () {
    var t = now();
    function blast(bt, dur) {
      tone({ type: 'square', freq: 2200, t: bt, dur: dur, vol: 0.22, attack: 0.01, filter: { type: 'bandpass', freq: 2300, q: 4 } });
      tone({ type: 'square', freq: 2248, t: bt, dur: dur, vol: 0.22, attack: 0.01, filter: { type: 'bandpass', freq: 2300, q: 4 } });
    }
    blast(t, 0.2);
    blast(t + 0.3, 0.4);
  });

  /* ------------------------------------------------------------------ *
   * Tokyo Arcade Synthwave Music Loop
   * ------------------------------------------------------------------ */
  // 8-bar Tokyo pentatonic-infused arcade melody in D / G
  var TOKYO_MELODY = [
    // Phrase 1: Tokyo train station vibe
    74, 78, 81, 83, 81, 78, 74, 76,   // D5 F#5 A5 B5 A5 F#5 D5 E5
    78, 81, 83, 86, 83, 81, 78, 0,    // F#5 A5 B5 D6 B5 A5 F#5 .
    81, 83, 86, 88, 86, 83, 81, 83,   // A5 B5 D6 E6 D6 B5 A5 B5
    86, 83, 81, 78, 76, 74, 76, 0,    // D6 B5 A5 F#5 E5 D5 E5 .
    // Phrase 2: High energy neon sprint
    86, 86, 83, 81, 83, 86, 88, 86,   // D6 D6 B5 A5 B5 D6 E6 D6
    83, 83, 81, 78, 81, 83, 86, 83,   // B5 B5 A5 F#5 A5 B5 D6 B5
    81, 81, 78, 76, 78, 81, 83, 81,   // A5 A5 F#5 E5 F#5 A5 B5 A5
    78, 81, 78, 76, 74, 0, 0, 0       // F#5 A5 F#5 E5 D5 . . .
  ];

  var TOKYO_BASS = [38, 43, 45, 43, 38, 43, 40, 45]; // D G A G D G E A
  var TOKYO_ARPS = [
    [86, 89, 93], [86, 91, 95], [88, 93, 97], [86, 91, 95],
    [86, 89, 93], [86, 91, 95], [88, 91, 95], [88, 93, 97]
  ];

  var STEPS = TOKYO_MELODY.length;
  var LOOKAHEAD_MS = 25;
  var SCHEDULE_AHEAD = 0.1;

  var music = {
    playing: false,
    mood: 'normal', // 'normal' | 'rush' | 'phase' | 'ceiling' | 'blackout'
    step: 0,
    nextTime: 0,
    timer: null
  };

  function bpm() {
    if (music.mood === 'phase') return 165;
    if (music.mood === 'ceiling') return 155;
    if (music.mood === 'rush') return 152;
    if (music.mood === 'blackout') return 138;
    return 128;
  }
  function stepDur() { return 60 / bpm() / 2; }

  function scheduleStep(step, t) {
    var bar = (step / 8) | 0;
    var beat = step % 8;
    var dur = stepDur();
    var isBright = music.mood !== 'normal' && music.mood !== 'blackout';

    // Melody: crisp saw / square synth
    var m = TOKYO_MELODY[step];
    if (m && music.mood !== 'blackout') {
      tone({
        type: music.mood === 'ceiling' ? 'triangle' : 'square',
        freq: midiHz(m + (music.mood === 'ceiling' ? 12 : 0)),
        t: t, dur: dur * 0.88, vol: 0.28, attack: 0.006,
        filter: { type: 'lowpass', freq: isBright ? 3200 : 2000, q: 0.8 },
        dest: musicBus
      });
    }

    // Bass: pumping electro bass
    var root = TOKYO_BASS[bar];
    var bNote = (beat === 0 || beat === 4) ? root : root + 7;
    tone({
      type: 'sawtooth',
      freq: midiHz(bNote),
      t: t, dur: dur * 0.8, vol: music.mood === 'blackout' ? 0.6 : 0.42, attack: 0.008,
      filter: { type: 'lowpass', freq: music.mood === 'blackout' ? 800 : 1400, q: 1.5 },
      dest: musicBus
    });

    // Drums
    if (beat === 0 || beat === 4) {
      tone({ type: 'sine', freq: 140, freqEnd: 42, glideT: 0.07, t: t, dur: 0.08, vol: 0.75, dest: musicBus });
    }
    if (beat === 2 || beat === 6) {
      noise({ t: t, dur: 0.06, vol: 0.35, attack: 0.002, filter: { type: 'bandpass', freq: 1800, q: 1.5 }, dest: musicBus });
    }
    if (beat % 2 === 1 || isBright) {
      noise({ t: t, dur: 0.025, vol: 0.14, attack: 0.001, filter: { type: 'highpass', freq: 7500 }, dest: musicBus });
    }

    // Sparkly high arpeggio layer during Phase / Ceiling
    if (music.mood === 'phase' || music.mood === 'ceiling') {
      var arp = TOKYO_ARPS[bar];
      for (var s = 0; s < 2; s++) {
        var note = arp[(step * 2 + s) % arp.length];
        tone({
          type: 'sine',
          freq: midiHz(note + 12),
          t: t + s * dur / 2,
          dur: dur * 0.45,
          vol: 0.16,
          attack: 0.003,
          dest: musicBus
        });
      }
    }
  }

  function schedulerTick() {
    if (!music.playing || !ready()) return;
    while (music.nextTime < now() + SCHEDULE_AHEAD) {
      scheduleStep(music.step, music.nextTime);
      music.nextTime += stepDur();
      music.step = (music.step + 1) % STEPS;
    }
  }

  music.start = function () {
    if (music.playing || !ready()) return;
    music.playing = true;
    music.step = 0;
    music.nextTime = now() + 0.05;
    music.timer = setInterval(schedulerTick, LOOKAHEAD_MS);
  };

  music.stop = function () {
    music.playing = false;
    if (music.timer) { clearInterval(music.timer); music.timer = null; }
  };

  music.setMood = function (m) {
    music.mood = m;
  };

  function setEnabled(on) {
    enabled = !!on;
    if (master) master.gain.setTargetAtTime(enabled ? MASTER_LEVEL : 0, now(), 0.01);
  }

  function setMusicEnabled(on) {
    musicEnabled = !!on;
    if (musicBus) musicBus.gain.setTargetAtTime(musicEnabled ? MUSIC_LEVEL : 0, now(), 0.01);
  }

  window.TokyoPBEAudio = {
    init: init,
    setEnabled: setEnabled,
    setMusicEnabled: setMusicEnabled,
    music: music,
    sfx: sfx
  };
})();
