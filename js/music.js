(function () {
  "use strict";
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  var DM = root.DM || (root.DM = {});

  function buildGroove(spec) {
    var notes = [];
    var bar;
    var k;
    for (bar = 0; bar < spec.bars; bar++) {
      var degree = spec.chords[bar % spec.chords.length];
      var jump = bar >= 2 && ((bar - 2) % 2) === 0;
      for (k = 0; k < 8; k++) {
        var flag = jump && k === 0 ? 1 : 0;
        var semi = spec.riff[k];
        if (semi == null) notes.push([null, 0.5, flag]);
        else notes.push([spec.root + degree + semi, 0.5, flag]);
      }
    }
    notes.push([spec.root + 12, 1, 0]);
    notes.push([spec.root + 7, 1, 0]);
    notes.push([spec.root, 2, 0]);
    return notes;
  }

  var GROOVES = [
    { name: "Néon", by: "Électro", style: "electro", bpm: 160, bars: 27, root: 55, biome: 2, chords: [0, 7, 5, 10], riff: [0, 12, 7, 15, 12, 7, 3, 10] },
    { name: "Backbeat", by: "Rock", style: "rock", bpm: 168, bars: 31, root: 52, biome: 4, chords: [0, 5, 7, 10], riff: [0, 0, 7, 12, 15, 12, 7, 5] },
    { name: "Circuit", by: "Électro", style: "electro", bpm: 174, bars: 34, root: 57, biome: 1, chords: [0, 3, 10, 7], riff: [0, 7, 12, 15, 19, 15, 12, 7] },
    { name: "Asphalte", by: "Rock", style: "rock", bpm: 180, bars: 37, root: 50, biome: 5, chords: [0, 5, 10, 7], riff: [0, 5, 12, 7, 15, 12, 5, 7] },
    { name: "Surcharge", by: "Électro", style: "electro", bpm: 188, bars: 41, root: 60, biome: 0, chords: [0, 1, 8, 5], riff: [0, 12, 1, 13, 8, 15, 7, 12] },
    { name: "Relais", by: "Rock", style: "rock", bpm: 162, bars: 28, root: 48, biome: 3, chords: [0, 7, 3, 8], riff: [0, 3, 7, 10, 7, 3, 12, 7] },
    { name: "Foudre", by: "Électro", style: "electro", bpm: 170, bars: 32, root: 64, biome: 5, chords: [0, 5, 8, 3], riff: [12, 0, 7, 15, 10, 7, 3, 12] },
    { name: "Gravier", by: "Rock", style: "rock", bpm: 176, bars: 35, root: 45, biome: 2, chords: [0, 10, 5, 7], riff: [0, 7, 0, 12, 5, 12, 7, 3] },
    { name: "Voltage", by: "Électro", style: "electro", bpm: 184, bars: 38, root: 59, biome: 4, chords: [0, 4, 9, 5], riff: [0, 12, 4, 16, 9, 12, 7, 4] },
    { name: "Sirène", by: "Rock", style: "rock", bpm: 156, bars: 27, root: 53, biome: 1, chords: [0, 5, 9, 7], riff: [7, 0, 12, 7, 3, 10, 7, 0] },
    { name: "Moteur", by: "Électro", style: "electro", bpm: 164, bars: 30, root: 62, biome: 0, chords: [0, 7, 2, 9], riff: [0, 2, 7, 14, 12, 7, 2, 9] },
    { name: "Écho", by: "Rock", style: "rock", bpm: 172, bars: 33, root: 47, biome: 3, chords: [0, 8, 3, 10], riff: [0, 8, 12, 3, 15, 8, 5, 12] },
    { name: "Bitume", by: "Électro", style: "electro", bpm: 178, bars: 36, root: 56, biome: 5, chords: [0, 6, 10, 3], riff: [0, 6, 12, 18, 10, 6, 3, 12] },
    { name: "Laser", by: "Rock", style: "rock", bpm: 186, bars: 39, root: 51, biome: 2, chords: [0, 7, 11, 5], riff: [12, 7, 0, 11, 7, 14, 5, 0] },
    { name: "Riff", by: "Électro", style: "electro", bpm: 158, bars: 29, root: 67, biome: 4, chords: [0, 3, 7, 10], riff: [0, 15, 7, 3, 12, 19, 10, 7] },
    { name: "Turbo", by: "Rock", style: "rock", bpm: 166, bars: 32, root: 49, biome: 1, chords: [0, 5, 12, 7], riff: [0, 5, 12, 17, 7, 12, 5, 0] },
    { name: "Orage", by: "Électro", style: "electro", bpm: 174, bars: 36, root: 58, biome: 0, chords: [0, 1, 6, 8], riff: [0, 1, 13, 6, 8, 13, 1, 6] },
    { name: "Arcade", by: "Rock", style: "rock", bpm: 182, bars: 40, root: 54, biome: 3, chords: [0, 9, 4, 7], riff: [0, 9, 16, 4, 12, 7, 4, 9] },
    { name: "Chrome", by: "Électro", style: "electro", bpm: 190, bars: 39, root: 61, biome: 5, chords: [0, 2, 7, 11], riff: [0, 14, 2, 11, 7, 14, 11, 2] },
    { name: "Zénith", by: "Rock", style: "rock", bpm: 188, bars: 42, root: 46, biome: 2, chords: [0, 6, 1, 8], riff: [0, 6, 13, 1, 8, 13, 18, 6] }
  ];

  var PIECES = [];
  var grooveIndex;
  for (grooveIndex = 0; grooveIndex < GROOVES.length; grooveIndex++) {
    var spec = GROOVES[grooveIndex];
    PIECES.push({
      name: spec.name,
      by: spec.by,
      bpm: spec.bpm,
      wave: "sawtooth",
      instrument: spec.style,
      style: spec.style,
      cadence: spec.root,
      biome: spec.biome,
      notes: buildGroove(spec)
    });
  }

  function pieceLength(piece) {
    var n = 0;
    var i;
    for (i = 0; i < piece.notes.length; i++) n += piece.notes[i][1];
    return n;
  }

  DM.TRACKS = [];
  var pieceIndex;
  for (pieceIndex = 0; pieceIndex < PIECES.length; pieceIndex++) {
    var piece = PIECES[pieceIndex];
    DM.TRACKS.push({
      id: pieceIndex + 1,
      name: piece.name,
      by: piece.by,
      biome: piece.biome,
      bpm: piece.bpm,
      beats: Math.round(pieceLength(piece)),
      speed: Math.round(160 * piece.bpm / 60)
    });
  }

  var LEVEL_SONGS = [
    { bpm: 92, root: 196, instrument: "strings", lead: [0, 4, 7, 4, 0, 7, 4, 2], bass: [0, 0, 7, 0] },
    { bpm: 78, root: 220, instrument: "flute", lead: [7, 4, 2, 4, 0, 2, 4, 7], bass: [0, 7, 4, 0] },
    { bpm: 118, root: 174, instrument: "piano", lead: [0, 3, 7, 10, 7, 3, 0, 5], bass: [0, 0, 5, 10] },
    { bpm: 104, root: 246, instrument: "flute", lead: [0, 2, 4, 7, 4, 7, 9, 7], bass: [0, 4, 7, 4] },
    { bpm: 86, root: 164, instrument: "organ", lead: [0, 7, 12, 7, 4, 7, 0, 4], bass: [0, 0, 12, 7] },
    { bpm: 100, root: 392, instrument: "flute", lead: [0, 4, 7, 12, 9, 7, 4, 0], bass: [0, 5, 7, 0] }
  ];

  var INSTRUMENTS = {
    harpsichord: { harm: [0.85, 0.45, 0.55, 0.28, 0.32, 0.14, 0.08], attack: 0.004, decay: 0.16, sustain: 0.12, kind: "pluck" },
    piano: { harm: [1, 0.42, 0.22, 0.12, 0.07, 0.04], attack: 0.006, decay: 0.22, sustain: 0.18, kind: "pluck" },
    strings: { harm: [1, 0.55, 0.32, 0.22, 0.14, 0.08], attack: 0.09, decay: 0.12, sustain: 0.82, kind: "bow", detune: 7 },
    flute: { harm: [1, 0.16, 0.04], attack: 0.07, decay: 0.06, sustain: 0.9, kind: "wind" },
    brass: { harm: [0.55, 0.85, 0.62, 0.38, 0.2, 0.1], attack: 0.05, decay: 0.08, sustain: 0.78, kind: "brass" },
    organ: { harm: [1, 0.62, 0.28, 0.48, 0.16, 0.1], attack: 0.02, decay: 0.04, sustain: 0.94, kind: "hold" },
    electro: { harm: [0.15, 0.9, 1, 0.78, 0.55, 0.34, 0.2, 0.1], attack: 0.004, decay: 0.07, sustain: 0.28, kind: "brass", detune: 9 },
    rock: { harm: [0.12, 1, 0.92, 0.74, 0.5, 0.32, 0.2, 0.12], attack: 0.002, decay: 0.04, sustain: 0.14, kind: "brass", detune: 16 }
  };

  function midiHz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function freq(rootNote, semi) {
    return rootNote * Math.pow(2, semi / 12);
  }

  DM.music = {
    ctx: null,
    playing: false,
    song: null,
    modeSong: "",
    songIndex: 0,
    step: 0,
    nextTime: 0,
    nodes: [],
    ensure: function () {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      if (!this.ctx) this.ctx = new AC();
      if (!this.master) this.buildBus();
      if (this.ctx.state === "suspended") {
        try { this.ctx.resume(); } catch (err) {}
      }
      return this.ctx;
    },
    buildBus: function () {
      var ctx = this.ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 1.08;
      this.master.connect(ctx.destination);
      this.delay = ctx.createDelay(0.5);
      this.delay.delayTime.value = 0.16;
      this.feedback = ctx.createGain();
      this.feedback.gain.value = 0.2;
      this.wet = ctx.createGain();
      this.wet.gain.value = 0.16;
      this.delay.connect(this.feedback);
      this.feedback.connect(this.delay);
      this.delay.connect(this.wet);
      this.wet.connect(this.master);
      this.waves = {};
    },
    waveFor: function (name) {
      if (this.waves[name]) return this.waves[name];
      var spec = INSTRUMENTS[name] || INSTRUMENTS.piano;
      var real = new Float32Array(spec.harm.length + 1);
      var imag = new Float32Array(spec.harm.length + 1);
      var i;
      for (i = 0; i < spec.harm.length; i++) imag[i + 1] = spec.harm[i];
      try {
        this.waves[name] = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
      } catch (err) {
        this.waves[name] = this.ctx.createPeriodicWave(real, imag);
      }
      return this.waves[name];
    },
    keep: function (node) {
      this.nodes.push(node);
      if (this.nodes.length > 160) {
        try { this.nodes[0].stop(); } catch (err) {}
        this.nodes.shift();
      }
    },
    tone: function (time, hz, dur, name, volume, detune) {
      var ctx = this.ctx;
      var spec = INSTRUMENTS[name] || INSTRUMENTS.piano;
      var osc = ctx.createOscillator();
      var filter = ctx.createBiquadFilter();
      var gain = ctx.createGain();
      osc.setPeriodicWave(this.waveFor(name));
      osc.frequency.setValueAtTime(Math.max(40, hz), time);
      if (detune) osc.detune.setValueAtTime(detune, time);
      filter.type = "lowpass";
      var open = spec.kind === "brass" ? 2200 : spec.kind === "wind" ? 2600 : spec.kind === "pluck" ? 3400 : 1500;
      var closed = spec.kind === "brass" ? 420 : open;
      filter.frequency.setValueAtTime(closed, time);
      if (closed !== open) filter.frequency.exponentialRampToValueAtTime(open, time + spec.attack + 0.05);
      var attack = Math.max(0.004, spec.attack);
      var end = time + Math.max(dur, attack + 0.06);
      var body = time + Math.max(attack + 0.02, dur * (0.3 + spec.sustain * 0.45));
      if (body > end - 0.02) body = end - 0.02;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), time + attack);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * Math.max(0.12, spec.sustain)), body);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      if (spec.kind !== "pluck") gain.connect(this.delay);
      osc.start(time);
      osc.stop(end + 0.03);
      this.keep(osc);
    },
    breath: function (time, dur, volume) {
      var ctx = this.ctx;
      if (!this.noise) {
        var len = ctx.sampleRate;
        var buf = ctx.createBuffer(1, len, ctx.sampleRate);
        var data = buf.getChannelData(0);
        var i;
        for (i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        this.noise = buf;
      }
      var src = ctx.createBufferSource();
      var filter = ctx.createBiquadFilter();
      var gain = ctx.createGain();
      src.buffer = this.noise;
      src.loop = true;
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1700, time);
      filter.Q.setValueAtTime(0.6, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), time + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(time);
      src.stop(time + dur + 0.02);
      this.keep(src);
    },
    note: function (time, hz, dur, name, volume) {
      var spec = INSTRUMENTS[name] || INSTRUMENTS.piano;
      this.tone(time, hz, dur, name, volume, 0);
      if (spec.detune) {
        this.tone(time, hz, dur, name, volume * 0.55, spec.detune);
        this.tone(time, hz, dur, name, volume * 0.55, -spec.detune);
      }
      if (spec.kind === "wind") this.breath(time, dur, volume * 0.12);
    },
    kick: function (time) {
      var ctx = this.ctx;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(168, time);
      osc.frequency.exponentialRampToValueAtTime(46, time + 0.11);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(time);
      osc.stop(time + 0.18);
      this.keep(osc);
    },
    clap: function (time) {
      var ctx = this.ctx;
      if (!this.noise) this.breath(time, 0.02, 0.0001);
      var src = ctx.createBufferSource();
      var filter = ctx.createBiquadFilter();
      var gain = ctx.createGain();
      src.buffer = this.noise;
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1800, time);
      filter.Q.setValueAtTime(0.7, time);
      gain.gain.setValueAtTime(0.16, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(time);
      src.stop(time + 0.14);
      this.keep(src);
    },
    hat: function (time, volume) {
      var ctx = this.ctx;
      if (!this.noise) this.breath(time, 0.02, 0.0001);
      var src = ctx.createBufferSource();
      var filter = ctx.createBiquadFilter();
      var gain = ctx.createGain();
      src.buffer = this.noise;
      filter.type = "highpass";
      filter.frequency.setValueAtTime(7000, time);
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(time);
      src.stop(time + 0.05);
      this.keep(src);
    },
    pulse: function (time, beat, beatDur, midi) {
      var key = Math.round(beat * 2);
      if (this.lastDrum === key) return;
      this.lastDrum = key;
      var eighth = ((key % 8) + 8) % 8;
      var rock = this.song && this.song.style === "rock";
      var voice = rock ? "rock" : "electro";
      if (rock) {
        if (eighth === 0 || eighth === 4 || eighth === 7) this.kick(time);
        if (eighth === 2 || eighth === 6) this.clap(time);
        this.hat(time, eighth % 2 === 0 ? 0.055 : 0.028);
      } else {
        if (eighth === 0 || eighth === 2 || eighth === 4 || eighth === 6) this.kick(time);
        if (eighth === 2 || eighth === 6) this.clap(time);
        this.hat(time, eighth % 2 === 1 ? 0.06 : 0.03);
      }
      if (midi && (eighth === 0 || eighth === 2 || eighth === 4 || eighth === 6)) {
        this.tone(time, midiHz(midi - 12), Math.min(0.16, beatDur * 0.34), voice, rock ? 0.055 : 0.048, 0);
      }
    },
    jumpHit: function (time, midi, style) {
      var voice = style === "rock" ? "rock" : "electro";
      this.kick(time);
      this.clap(time);
      this.note(time, midiHz(midi), 0.16, voice, 0.07);
      this.note(time, midiHz(midi + 7), 0.16, voice, 0.05);
      this.note(time, midiHz(midi + 12), 0.12, voice, 0.04);
      this.note(time, midiHz(midi - 12), 0.2, voice, 0.055);
    },
    jumpSpeed: function (bpm) {
      return 2200 * (60 / bpm);
    },
    playStep: function (time, song, step, seconds) {
      if (!this.ctx || !song) return;
      var beat = seconds || (60 / song.bpm);
      var lead = song.lead[step % song.lead.length];
      var inst = song.instrument || "piano";
      this.note(time, freq(song.root, lead), beat * 0.95, inst, 0.06);
      this.note(time, freq(song.root, lead + 7), beat * 0.9, inst === "flute" ? "strings" : "organ", 0.024);
      if (step % 2 === 0) {
        var bass = song.bass[(step / 2) % song.bass.length];
        this.note(time, freq(song.root / 2, bass), beat * 1.6, "organ", 0.045);
      }
    },
    piece: function (id) {
      return PIECES[((id || 1) - 1) % PIECES.length];
    },
    levelSong: function (index) {
      return LEVEL_SONGS[(index - 1) % LEVEL_SONGS.length];
    },
    playCadence: function (time, song, seconds) {
      var hz = song.root || midiHz(song.cadence || 60);
      var inst = song.instrument || "piano";
      var dur = Math.max(0.45, seconds || 1.2);
      this.note(time, hz, dur, inst, 0.08);
      this.note(time, hz * Math.pow(2, 7 / 12), dur, inst, 0.04);
      this.note(time, hz / 2, dur, "organ", 0.05);
    },
    buildScore: function (song) {
      var length = pieceLength(song);
      var events = [];
      var i;
      var t;
      t = 0;
      for (i = 0; i < song.notes.length; i++) {
        var note = song.notes[i];
        if (note[0] != null) events.push({ beat: t, midi: note[0], dur: note[1], jump: note[2] || 0 });
        t += note[1];
      }
      this.score = events;
      this.pieceEnd = length;
      this.nextIndex = 0;
    },
    begin: function (song, mode, index) {
      var ctx = this.ensure();
      this.stopNodes();
      this.song = song;
      this.modeSong = mode;
      this.songIndex = index;
      this.step = 0;
      this.score = null;
      this.nextIndex = 0;
      this.heard = -1;
      this.cadencePlayed = false;
      this.pieceEnd = 0;
      this.lastDrum = -1;
      this.playing = true;
      this.origin = ctx ? ctx.currentTime + 0.06 : 0;
      this.nextTime = this.origin;
      if (song.notes) this.buildScore(song);
    },
    startLevel: function (index) {
      var song = LEVEL_SONGS[(index - 1) % LEVEL_SONGS.length];
      this.begin(song, "level", index - 1);
    },
    startTrack: function (id) {
      this.begin(this.piece(id), "track", id - 1);
    },
    startBiome: function (index) {
      var song = LEVEL_SONGS[index % LEVEL_SONGS.length];
      this.begin(song, "biome", index);
    },
    syncBiome: function (index) {
      if (this.modeSong === "biome" && this.songIndex === index && this.playing) return;
      this.startBiome(index);
    },
    resume: function () {
      if (this.modeSong === "track") this.startTrack(this.songIndex + 1);
      else if (this.modeSong === "level") this.startLevel(this.songIndex + 1);
      else if (this.modeSong === "silent") return;
      else this.startBiome(this.songIndex || 0);
    },
    tickCourse: function (world, player) {
      var ctx = this.ensure();
      if (!ctx) return;
      var span = world.finish - world.songStart;
      if (!(span > 1) || !(world.songBeats > 0)) return;
      var along = (player.x - world.songStart) / span;
      if (along < 0) along = 0;
      if (along > 1) along = 1;
      var beatsNow = along * world.songBeats;
      if (this.heard != null && beatsNow < this.heard - 0.25) {
        this.stopNodes();
        this.cadencePlayed = false;
        this.heard = beatsNow;
        this.step = Math.floor(Math.max(0, beatsNow));
        this.nextIndex = 0;
        if (this.score) {
          while (this.nextIndex < this.score.length && this.score[this.nextIndex].beat < beatsNow) this.nextIndex++;
        }
        return;
      }
      var beatSec = (span / world.songBeats) / Math.max(140, world.moveSpeed(player));
      var cadenceBeat = world.songBeats - 2;
      if (this.score && this.pieceEnd > 1 && this.pieceEnd < world.songBeats - 0.2) cadenceBeat = this.pieceEnd;
      if (!this.cadencePlayed && beatsNow >= cadenceBeat) {
        this.cadencePlayed = true;
        this.playCadence(ctx.currentTime + 0.01, this.song, Math.max(0.45, (world.songBeats - cadenceBeat) * beatSec));
      }
      if (this.score) {
        var guard = 0;
        while (this.nextIndex < this.score.length && this.score[this.nextIndex].beat <= beatsNow && this.score[this.nextIndex].beat < cadenceBeat && guard++ < 8) {
          var ev = this.score[this.nextIndex++];
          var inst = this.song.instrument || "piano";
          this.note(ctx.currentTime, midiHz(ev.midi), Math.max(0.08, ev.dur * beatSec * 0.92), inst, 0.07);
          if (Math.abs(ev.beat - Math.round(ev.beat)) < 0.02) {
            this.note(ctx.currentTime, midiHz(ev.midi - 12), Math.min(0.45, beatSec), inst === "flute" ? "strings" : "organ", 0.028);
          }
        }
      } else {
        var guard2 = 0;
        var target = Math.floor(beatsNow);
        while (this.step < target && this.step < cadenceBeat && guard2++ < 6) {
          this.playStep(ctx.currentTime, this.song, this.step, beatSec);
          this.step++;
        }
      }
      this.heard = beatsNow;
    },
    tick: function () {
      if (!this.playing || !this.song) return;
      var game = DM.game;
      var world = game && game.world;
      var player = game && game.player;
      if (game && game.mode === "adventure") return;
      var ctx = this.ensure();
      if (!ctx) return;
      if (this.score) {
        var beatDur = 60 / this.song.bpm;
        if (this.modeSong === "track" && this.nextIndex >= this.score.length && this.pieceEnd > 0) {
          this.origin += this.pieceEnd * beatDur;
          this.nextIndex = 0;
        }
        var horizon = (ctx.currentTime + 0.32 - this.origin) / beatDur;
        var guard = 0;
        while (this.nextIndex < this.score.length && this.score[this.nextIndex].beat <= horizon && guard++ < 16) {
          var ev = this.score[this.nextIndex++];
          var when = this.origin + ev.beat * beatDur;
          if (when < ctx.currentTime - 0.03) continue;
          var inst = this.song.instrument || "piano";
          if (ev.jump) this.jumpHit(when, ev.midi, this.song.style);
          else this.note(when, midiHz(ev.midi), Math.max(0.08, ev.dur * beatDur * 0.9), inst, inst === "rock" ? 0.05 : 0.052);
          if (this.modeSong === "track") this.pulse(when, ev.beat, beatDur, ev.midi);
          else if (Math.abs(ev.beat - Math.round(ev.beat)) < 0.02) {
            this.note(when, midiHz(ev.midi - 12), Math.min(0.6, beatDur), inst === "flute" ? "strings" : "organ", 0.03);
          }
        }
        return;
      }
      var beat = 60 / this.song.bpm;
      var horizon = ctx.currentTime + 0.28;
      var guard = 0;
      while (this.nextTime < horizon && guard++ < 8) {
        this.playStep(this.nextTime, this.song, this.step);
        this.step++;
        this.nextTime += beat;
      }
    },
    stopNodes: function () {
      var i;
      for (i = 0; i < this.nodes.length; i++) {
        try { this.nodes[i].stop(); } catch (err) {}
      }
      this.nodes = [];
    },
    stop: function () {
      this.playing = false;
      this.stopNodes();
    },
    sting: function () {
      var ctx = this.ensure();
      if (!ctx) return;
      var notes = [
        { from: 494, to: 330, dur: 0.16 },
        { from: 370, to: 247, dur: 0.22 },
        { from: 294, to: 156, dur: 0.46 }
      ];
      var at = ctx.currentTime + 0.02;
      var i;
      for (i = 0; i < notes.length; i++) {
        var n = notes[i];
        var osc = ctx.createOscillator();
        var filter = ctx.createBiquadFilter();
        var gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(n.from, at);
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, n.to), at + n.dur);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1600, at);
        filter.frequency.exponentialRampToValueAtTime(380, at + n.dur);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.07, at + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + n.dur);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(at);
        osc.stop(at + n.dur + 0.02);
        at += n.dur * 0.86;
      }
    },
    scream: function () {
      var ctx = this.ensure();
      if (!ctx) return;
      var at = ctx.currentTime + 0.02;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(520, at);
      osc.frequency.exponentialRampToValueAtTime(180, at + 0.55);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.08, at + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.58);
    }
  };
})();
