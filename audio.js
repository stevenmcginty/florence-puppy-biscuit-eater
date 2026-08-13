/* ============================================================================
 * PBEAudio — self-contained WebAudio sound module for
 * "Florence's Puppy Biscuit Eater"
 *
 * Everything is synthesized (oscillators + noise buffers). No assets, no
 * fetch, no samples. Defines exactly one global: window.PBEAudio.
 *
 * Usage:
 *   PBEAudio.init()  — call from a user gesture (tap) before playing sound.
 *   PBEAudio.music.start() / .stop() / .setMood('normal'|'rush'|'phase')
 *   PBEAudio.sfx.bark() ... etc.  (all safe to call before init)
 * ========================================================================= */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Core state / buses
   * ------------------------------------------------------------------ */
  var ctx = null;          // AudioContext (lazy)
  var master = null;       // master gain — everything flows through here
  var musicBus = null;     // music-only gain (below sfx level)
  var sfxBus = null;       // sfx gain
  var noiseBuf = null;     // shared 1s white-noise buffer
  var enabled = true;      // master mute flag
  var musicEnabled = true; // music-only mute flag

  var MASTER_LEVEL = 0.22; // polite overall level
  var MUSIC_LEVEL = 0.55;  // music sits under the sfx
  var SFX_LEVEL = 1.0;

  function init() {
    if (ctx) {
      // Already created — just make sure it's running (iOS resume-on-gesture).
      if (ctx.state === 'suspended' && ctx.resume) { try { ctx.resume(); } catch (e) {} }
      return;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return; // WebAudio unavailable — module stays a silent no-op
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

    // Shared white-noise buffer for percussion / crunches / licks.
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    if (ctx.state === 'suspended' && ctx.resume) { try { ctx.resume(); } catch (e2) {} }
  }

  function ready() { return !!(ctx && master); }
  function now() { return ctx.currentTime; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* ------------------------------------------------------------------ *
   * Synthesis helpers
   * ------------------------------------------------------------------ */

  // One oscillator note with an attack/decay gain envelope, optional filter
  // and optional pitch glide. All times are absolute context times.
  // o = { type, freq, freqEnd, glideT, t, dur, vol, attack, filter:{type,freq,freqEnd,q}, dest }
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

  // Filtered noise burst with gain envelope.
  // o = { t, dur, vol, attack, filter:{type,freq,freqEnd,q}, dest }
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

  // Wrap each sfx so it silently no-ops before init / without WebAudio.
  function guard(fn) {
    return function () { if (!ready()) return; try { fn(); } catch (e) {} };
  }

  /* ------------------------------------------------------------------ *
   * Sound effects
   * ------------------------------------------------------------------ */
  var sfx = {};

  // Happy cartoon "woof": noise transient + pitch-dropping sawtooth pushed
  // through a bandpass "formant". Randomized so repeated barks vary.
  sfx.bark = guard(function () {
    var t = now();
    var jitter = rand(0.85, 1.15);            // per-bark pitch personality
    var dur = 0.15 * rand(0.9, 1.1);
    // 1) breathy onset transient
    noise({ t: t, dur: 0.035, vol: 0.5, attack: 0.002,
            filter: { type: 'bandpass', freq: 1400 * jitter, q: 1.2 } });
    // 2) main voiced burst: saw sweeping ~700 -> ~250 Hz
    tone({ type: 'sawtooth', freq: 700 * jitter, freqEnd: 250 * jitter, glideT: dur,
           t: t + 0.012, dur: dur, vol: 0.85, attack: 0.008,
           filter: { type: 'bandpass', freq: 900 * jitter, freqEnd: 420 * jitter, q: 2.5 } });
    // 3) soft body/chest resonance underneath
    tone({ type: 'triangle', freq: 340 * jitter, freqEnd: 150 * jitter, glideT: dur,
           t: t + 0.012, dur: dur * 0.9, vol: 0.4, attack: 0.01,
           filter: { type: 'lowpass', freq: 800 } });
  });

  // Wet slurp: bandpass noise sweeping up then back down over ~180ms.
  sfx.lick = guard(function () {
    var t = now();
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    var f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(500, t);
    f.frequency.exponentialRampToValueAtTime(2600, t + 0.09);  // up...
    f.frequency.exponentialRampToValueAtTime(600, t + 0.18);   // ...and down
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    src.connect(f); f.connect(g); g.connect(sfxBus);
    src.start(t); src.stop(t + 0.25);
  });

  // Biscuit crunch: two punchy low-passed noise bites.
  sfx.munch = guard(function () {
    var t = now();
    noise({ t: t, dur: 0.06, vol: 0.8, attack: 0.002,
            filter: { type: 'lowpass', freq: 1100, freqEnd: 350, q: 1 } });
    noise({ t: t + 0.09, dur: 0.07, vol: 0.7, attack: 0.002,
            filter: { type: 'lowpass', freq: 900 * rand(0.9, 1.1), freqEnd: 300, q: 1 } });
  });

  // Sparkly 3-note ascending triangle arpeggio.
  sfx.gem = guard(function () {
    var t = now(), notes = [1046.5, 1318.5, 1568]; // C6 E6 G6
    for (var i = 0; i < notes.length; i++) {
      tone({ type: 'triangle', freq: notes[i], t: t + i * 0.07, dur: 0.16, vol: 0.5 });
    }
  });

  // Sad descending "wah": saw with a drooping lowpass wah.
  sfx.yuck = guard(function () {
    var t = now();
    tone({ type: 'sawtooth', freq: 320, freqEnd: 140, glideT: 0.45,
           t: t, dur: 0.5, vol: 0.5, attack: 0.02,
           filter: { type: 'lowpass', freq: 1400, freqEnd: 220, q: 6 } });
    tone({ type: 'triangle', freq: 160, freqEnd: 75, glideT: 0.45,
           t: t, dur: 0.5, vol: 0.35, attack: 0.02 });
  });

  // Rising zap arpeggio (speed boost).
  sfx.zoom = guard(function () {
    var t = now(), f = 330;
    for (var i = 0; i < 6; i++) {
      tone({ type: 'square', freq: f, freqEnd: f * 1.25, glideT: 0.05,
             t: t + i * 0.045, dur: 0.07, vol: 0.3,
             filter: { type: 'lowpass', freq: 3200 } });
      f *= 1.32;
    }
  });

  // 6-note euphoric ascending jingle (rainbow power).
  sfx.phase = guard(function () {
    var t = now(), notes = [72, 76, 79, 84, 88, 91]; // C5 E5 G5 C6 E6 G6
    for (var i = 0; i < notes.length; i++) {
      var nt = t + i * 0.08;
      tone({ type: 'triangle', freq: midiHz(notes[i]), t: nt, dur: 0.28, vol: 0.45 });
      tone({ type: 'sine', freq: midiHz(notes[i]) * 2, t: nt, dur: 0.2, vol: 0.18 }); // shimmer
    }
  });

  // Soft cartoon bonk: pillowy thud + short descending tone. Not scary.
  sfx.hit = guard(function () {
    var t = now();
    tone({ type: 'sine', freq: 150, freqEnd: 55, glideT: 0.12, t: t, dur: 0.16, vol: 0.9 });
    tone({ type: 'square', freq: 420, freqEnd: 190, glideT: 0.18, t: t + 0.01, dur: 0.2, vol: 0.25,
           filter: { type: 'lowpass', freq: 900 } });
    noise({ t: t, dur: 0.03, vol: 0.3, filter: { type: 'lowpass', freq: 600 } });
  });

  // Quick rising boing.
  sfx.jump = guard(function () {
    var t = now();
    tone({ type: 'square', freq: 220, freqEnd: 620, glideT: 0.13, t: t, dur: 0.16, vol: 0.35,
           filter: { type: 'lowpass', freq: 1600 } });
    tone({ type: 'sine', freq: 220, freqEnd: 620, glideT: 0.13, t: t, dur: 0.16, vol: 0.3 });
  });

  // Soft landing thump.
  sfx.land = guard(function () {
    var t = now();
    tone({ type: 'sine', freq: 130, freqEnd: 55, glideT: 0.09, t: t, dur: 0.11, vol: 0.6 });
    noise({ t: t, dur: 0.04, vol: 0.2, filter: { type: 'lowpass', freq: 500 } });
  });

  // Countdown tick: short and high.
  sfx.tick = guard(function () {
    var t = now();
    tone({ type: 'square', freq: 1650, t: t, dur: 0.045, vol: 0.3,
           filter: { type: 'bandpass', freq: 1800, q: 3 } });
  });

  // Referee whistle: two blasts, detuned pair gives the "pea" warble.
  sfx.whistle = guard(function () {
    var t = now();
    function blast(bt, dur) {
      tone({ type: 'square', freq: 2100, t: bt, dur: dur, vol: 0.22, attack: 0.01,
             filter: { type: 'bandpass', freq: 2200, q: 4 } });
      tone({ type: 'square', freq: 2145, t: bt, dur: dur, vol: 0.22, attack: 0.01, // beats ~45Hz = trill
             filter: { type: 'bandpass', freq: 2200, q: 4 } });
    }
    blast(t, 0.22);
    blast(t + 0.34, 0.4);
  });

  // Tiny UI blip.
  sfx.ui = guard(function () {
    var t = now();
    tone({ type: 'sine', freq: 880, freqEnd: 1320, glideT: 0.05, t: t, dur: 0.07, vol: 0.35 });
  });

  // Whee! rising slide sweep.
  sfx.slide = guard(function () {
    var t = now();
    tone({ type: 'triangle', freq: 350, freqEnd: 1250, glideT: 0.45, t: t, dur: 0.5, vol: 0.4, attack: 0.02 });
    noise({ t: t, dur: 0.5, vol: 0.12, attack: 0.05,
            filter: { type: 'bandpass', freq: 800, freqEnd: 2600, q: 2 } }); // whoosh under it
  });

  /* ------------------------------------------------------------------ *
   * Music — 8-bar chiptune loop with a lookahead scheduler
   * ------------------------------------------------------------------ */

  // Grid: 8 eighth-note steps per bar, 8 bars = 64 steps.
  // Melody (square): a simple stepwise nursery-ish tune in C major.
  // 0 = rest; numbers are MIDI notes.
  var MELODY = [
    // A phrase: rising question...
    72, 74, 76, 79, 76, 74, 72, 0,    // bar 1 (C):  C5 D5 E5 G5 E5 D5 C5 .
    74, 76, 77, 81, 77, 76, 74, 0,    // bar 2 (F):  D5 E5 F5 A5 F5 E5 D5 .
    76, 77, 79, 84, 79, 77, 76, 0,    // bar 3 (C):  E5 F5 G5 C6 G5 F5 E5 .
    74, 76, 77, 74, 71, 74, 72, 0,    // bar 4 (G):  D5 E5 F5 D5 B4 D5 C5 .
    // B phrase: bouncy answer.
    79, 76, 72, 76, 79, 79, 81, 79,   // bar 5 (C):  G5 E5 C5 E5 G5 G5 A5 G5
    77, 74, 71, 74, 77, 77, 79, 77,   // bar 6 (G):  F5 D5 B4 D5 F5 F5 G5 F5
    76, 72, 69, 72, 76, 76, 77, 76,   // bar 7 (Am): E5 C5 A4 C5 E5 E5 F5 E5
    74, 77, 76, 74, 72, 0, 0, 0       // bar 8 (G):  D5 F5 E5 D5 C5 . . .
  ];

  // One chord root per bar (MIDI, octave 2) for the oom-pah bass.
  var BASS_ROOTS = [36, 41, 36, 43, 36, 43, 45, 43]; // C F C G C G A G

  // Chord tones per bar for the 'phase' sparkle arpeggio (MIDI, high octave).
  var ARPS = [
    [84, 88, 91], [84, 89, 93], [84, 88, 91], [83, 86, 91],
    [84, 88, 91], [83, 86, 91], [81, 84, 88], [83, 86, 91]
  ];

  var STEPS = MELODY.length; // 64
  var LOOKAHEAD_MS = 25;     // scheduler wake interval
  var SCHEDULE_AHEAD = 0.1;  // schedule this far into the future (s)

  var music = {
    playing: false,
    mood: 'normal',
    step: 0,
    nextTime: 0,
    timer: null
  };

  function bpm() { return music.mood === 'rush' ? 145 : 120; }
  function stepDur() { return 60 / bpm() / 2; } // one eighth note

  function scheduleStep(step, t) {
    var bar = (step / 8) | 0;
    var beat = step % 8;
    var dur = stepDur();
    var bright = music.mood !== 'normal';

    // --- melody: gentle square (lowpassed so it isn't shrill) ---
    var m = MELODY[step];
    if (m) {
      tone({ type: 'square', freq: midiHz(m), t: t, dur: dur * 0.9, vol: 0.3, attack: 0.008,
             filter: { type: 'lowpass', freq: bright ? 2600 : 1700, q: 0.7 },
             dest: musicBus });
    }

    // --- bass: triangle oom-pah (root on 1 & 3, fifth on 2 & 4) ---
    if (beat % 2 === 0) {
      var root = BASS_ROOTS[bar];
      var b = (beat === 0 || beat === 4) ? root : root + 7;
      tone({ type: 'triangle', freq: midiHz(b), t: t, dur: dur * 0.85, vol: 0.5, attack: 0.008,
             dest: musicBus });
    }

    // --- percussion from noise: kick on 1 & 3, hats on the off-beats ---
    if (beat === 0 || beat === 4) {
      tone({ type: 'sine', freq: 120, freqEnd: 45, glideT: 0.08, t: t, dur: 0.09, vol: 0.7,
             dest: musicBus }); // kick body
    }
    if (beat % 2 === 1 || music.mood === 'rush') {
      noise({ t: t, dur: 0.03, vol: 0.12, attack: 0.001,
              filter: { type: 'highpass', freq: 7000 }, dest: musicBus }); // hat
    }

    // --- 'phase' mood: sparkly high 16th-note arpeggio layer ---
    if (music.mood === 'phase') {
      var arp = ARPS[bar];
      for (var s = 0; s < 2; s++) { // two 16ths per 8th step
        var note = arp[(step * 2 + s) % arp.length];
        tone({ type: 'sine', freq: midiHz(note + 12), t: t + s * dur / 2, dur: dur * 0.45,
               vol: 0.14, attack: 0.004, dest: musicBus });
      }
    }
  }

  function schedulerTick() {
    if (!music.playing || !ready()) return;
    while (music.nextTime < now() + SCHEDULE_AHEAD) {
      scheduleStep(music.step, music.nextTime);
      music.nextTime += stepDur(); // tempo (mood) is re-read every step
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
    if (m === 'normal' || m === 'rush' || m === 'phase') music.mood = m;
    // No restart needed: the scheduler picks up tempo/layers at the next step.
  };

  /* ------------------------------------------------------------------ *
   * Mute controls + public API
   * ------------------------------------------------------------------ */
  function setEnabled(on) {
    enabled = !!on;
    if (master) master.gain.setTargetAtTime(enabled ? MASTER_LEVEL : 0, now(), 0.01);
  }

  function setMusicEnabled(on) {
    musicEnabled = !!on;
    if (musicBus) musicBus.gain.setTargetAtTime(musicEnabled ? MUSIC_LEVEL : 0, now(), 0.01);
  }

  window.PBEAudio = {
    init: init,
    setEnabled: setEnabled,
    setMusicEnabled: setMusicEnabled,
    music: {
      start: function () { try { music.start(); } catch (e) {} },
      stop: function () { try { music.stop(); } catch (e) {} },
      setMood: function (m) { music.setMood(m); }
    },
    sfx: sfx
  };
})();
