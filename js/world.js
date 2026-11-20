(function () {
  "use strict";
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  var DM = root.DM || (root.DM = {});

  DM.BIOMES = [
    { id: "desert", name: "Désert", edge: "fire", sky: ["#ffe7a3", "#ff8d3a"], ground: "#e2a15a", deep: "#c47b34", ink: "#6a3414", pit: "#3e2114", accent: "#ffe08a", dust: "#f6d7a4" },
    { id: "snow", name: "Montagne enneigée", edge: "ice", sky: ["#e7f3ff", "#8eb7d6"], ground: "#f4f7fb", deep: "#d5e0ea", ink: "#3e5164", pit: "#1d3344", accent: "#bfe9ff", dust: "#ffffff" },
    { id: "city", name: "Ville de nuit", edge: "neon", sky: ["#241238", "#120818"], ground: "#2a2140", deep: "#1a132c", ink: "#d6d0ff", pit: "#07040e", accent: "#39f3ff", dust: "#ff4ad8" },
    { id: "jungle", name: "Jungle", edge: "leaves", sky: ["#d6f28a", "#3f8f4e"], ground: "#6d4a2e", deep: "#4e3420", ink: "#1c3a18", pit: "#14210f", accent: "#9be36a", dust: "#c6f59a" },
    { id: "space", name: "Espace", edge: "stars", sky: ["#1a1440", "#070814"], ground: "#3a4666", deep: "#232a40", ink: "#d5def5", pit: "#05060e", accent: "#9eb6ff", dust: "#f2f6ff" },
    { id: "noel", name: "Noël", edge: "holly", sky: ["#d7ecff", "#6f93c4"], ground: "#f4f8fb", deep: "#d5e2ee", ink: "#24384c", pit: "#1a3044", accent: "#d23b4a", dust: "#ffffff" }
  ];

  DM.PAST_BIOME = {
    id: "past",
    name: "Monde du passé",
    edge: "bone",
    sky: ["#f6d7a8", "#e08a45"],
    ground: "#8ea24a",
    deep: "#5d6b2c",
    ink: "#3b2918",
    pit: "#241c12",
    accent: "#efd48a",
    dust: "#f3e7c2"
  };

  DM.PLAINS_BIOME = {
    id: "plains",
    name: "Plaines",
    edge: "bone",
    sky: ["#d7f0ff", "#8ec4ef"],
    ground: "#7fbf4a",
    deep: "#3f7a28",
    ink: "#2a4a16",
    pit: "#1c3312",
    accent: "#e7f5a4",
    dust: "#f4fbe4"
  };

  function hash(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function farCursor(camX, speed, span) {
    var scroll = camX * speed;
    var tile = Math.floor(scroll / span);
    var u = (tile - 1) * span;
    return { u: u, x: u + camX - scroll };
  }

  function biomeDeck(seed, cycle) {
    var n = DM.BIOMES.length;
    var order = [];
    var i;
    for (i = 0; i < n; i++) order.push(i);
    for (i = n - 1; i > 0; i--) {
      var j = Math.floor(hash((seed || 1) + cycle * 41 + i * 13) * (i + 1));
      var tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
    if (cycle > 0 && n > 1) {
      var prev = biomeDeck(seed, cycle - 1);
      if (order[0] === prev[n - 1]) {
        tmp = order[0];
        order[0] = order[1];
        order[1] = tmp;
      }
    }
    if (cycle === 0) {
      var blocked = {};
      var b;
      for (b = 0; b < n; b++) {
        if (DM.BIOMES[b].id === "space" || DM.BIOMES[b].id === "noel") blocked[b] = true;
      }
      if (blocked[order[0]]) {
        var k;
        for (k = 1; k < n; k++) {
          if (!blocked[order[k]]) {
            tmp = order[0];
            order[0] = order[k];
            order[k] = tmp;
            break;
          }
        }
      }
    }
    return order;
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleBox(cx, cy, r, b) {
    var nx = Math.max(b.x, Math.min(cx, b.x + b.w));
    var ny = Math.max(b.y, Math.min(cy, b.y + b.h));
    var dx = cx - nx;
    var dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
  }

  function World() {
    this.mode = "endless";
    this.levelIndex = 1;
    this.grounds = [];
    this.pits = [];
    this.entities = [];
    this.cursor = 0;
    this.finish = 0;
    this.length = 1;
    this.startX = 420;
    this.speedAnchor = 420;
    this.time = 0;
    this.seed = 1;
    this.lastGrow = -99999;
    this.lastOrb = 0;
    this.lastShip = 0;
    this.orbForm = "ship";
    this.lastBonus = 0;
    this.boostUntil = {};
    this.decor = [];
    this.decorCursor = 0;
    this.bonusFlip = "speed";
    this.issues = [];
    this.pendingShips = [];
    this.lastAir = 0;
    this.allowShip = false;
    this.tempoSpeed = 0;
    this.track = null;
    this.fireX = 0;
    this.introCamX = 0;
    this.fireFollowX = 100000;
    this.scrolling = false;
    this.ribbonX = 0;
    this.pitSerial = 0;
    this.nextHunter = 0;
    this.lastHeart = 0;
  }

  World.prototype.rng = function () {
    this.seed = (this.seed * 16807 + 13) % 2147483647;
    return (this.seed % 10000) / 10000;
  };

  function hexToRgb(hex) {
    var h = String(hex).replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function mixHex(a, b, t) {
    if (!t) return a;
    var A = hexToRgb(a);
    var B = hexToRgb(b);
    function ch(i) { return Math.max(0, Math.min(255, Math.round(A[i] + (B[i] - A[i]) * t))); }
    return "rgb(" + ch(0) + "," + ch(1) + "," + ch(2) + ")";
  }

  function mixBiome(a, b, t) {
    if (!b || t <= 0) return a;
    return {
      id: t < 0.5 ? a.id : b.id,
      name: t < 0.5 ? a.name : b.name,
      edge: t < 0.5 ? a.edge : b.edge,
      sky: [mixHex(a.sky[0], b.sky[0], t), mixHex(a.sky[1], b.sky[1], t)],
      ground: mixHex(a.ground, b.ground, t),
      deep: mixHex(a.deep, b.deep, t),
      ink: mixHex(a.ink, b.ink, t),
      pit: mixHex(a.pit, b.pit, t),
      accent: mixHex(a.accent, b.accent, t),
      dust: mixHex(a.dust, b.dust, t)
    };
  }

  World.prototype.biomeIndexAt = function (x) {
    if (this.mode === "tempo" && this.track) {
      if (this.track.biome != null) return this.track.biome % DM.BIOMES.length;
      return (this.track.id - 1) % DM.BIOMES.length;
    }
    if (this.mode === "adventure") {
      var course = DM.ADVENTURE && DM.ADVENTURE[this.levelIndex - 1];
      if (course && course.biome != null) return course.biome % DM.BIOMES.length;
      return (this.levelIndex - 1) % DM.BIOMES.length;
    }
    var dist = Math.max(0, x - (this.startX || DM.config.startX));
    return this.biomeAtSlot(Math.floor(dist / DM.config.biomeSpan));
  };

  World.prototype.biomeAtSlot = function (slot) {
    if (this.mode !== "endless") {
      return Math.max(0, slot) % DM.BIOMES.length;
    }
    if (slot < 0) slot = 0;
    var n = DM.BIOMES.length;
    var cycle = Math.floor(slot / n);
    if (!this.biomeDecks) this.biomeDecks = {};
    var key = String(cycle);
    if (!this.biomeDecks[key]) this.biomeDecks[key] = biomeDeck(this.biomeSeed || this.seed || 1, cycle);
    return this.biomeDecks[key][slot % n];
  };

  World.prototype.biomeBlend = function (player) {
    if (this.mode === "past" && this.plains) return { a: DM.PLAINS_BIOME, b: DM.PLAINS_BIOME, t: 0 };
    if (this.mode === "past") return { a: DM.PAST_BIOME, b: DM.PAST_BIOME, t: 0 };
    var x = player ? player.x : (this.startX || DM.config.startX);
    var index = this.biomeIndexAt(x);
    var current = DM.BIOMES[index];
    if (this.mode !== "endless") return { a: current, b: current, t: 0 };
    var dist = Math.max(0, x - (this.startX || DM.config.startX));
    var span = DM.config.biomeSpan;
    var fade = 860;
    var pos = dist % span;
    if (pos <= span - fade) return { a: current, b: current, t: 0 };
    var next = DM.BIOMES[this.biomeAtSlot(Math.floor(dist / span) + 1)];
    return { a: current, b: next, t: (pos - (span - fade)) / fade };
  };

  World.prototype.biome = function (player) {
    var blend = this.biomeBlend(player);
    return blend.t < 0.5 ? blend.a : blend.b;
  };

  World.prototype.paintedBiome = function (player) {
    var blend = this.biomeBlend(player);
    return mixBiome(blend.a, blend.b, blend.t);
  };

  World.prototype.lockBoost = function (kind) {
    this.boostUntil[kind] = this.time + 4;
  };

  World.prototype.boostBlocked = function (kind) {
    return (this.boostUntil[kind] || 0) > this.time;
  };

  World.prototype.suppressBoost = function (kind, px, speed) {
    this.lockBoost(kind);
    var reach = px + Math.max(200, speed) * 4;
    var i;
    for (i = 0; i < this.entities.length; i++) {
      var e = this.entities[i];
      if (e.dead || e.x < px - 30 || e.x > reach) continue;
      if (kind === "ship" && e.kind === "orb" && e.form === "ship") e.dead = true;
      if (kind === "slow" && e.kind === "slow") e.dead = true;
      if (kind === "grow" && e.kind === "grow") e.dead = true;
    }
  };

  World.prototype.groundAt = function (x) {
    var i;
    for (i = 0; i < this.pits.length; i++) {
      var p = this.pits[i];
      if (x >= p.x && x < p.x + p.w) return null;
    }
    for (i = 0; i < this.grounds.length; i++) {
      var g = this.grounds[i];
      if (x >= g.x && x < g.x + g.w) return DM.config.groundY;
    }
    return null;
  };

  World.prototype.addGround = function (w) {
    if (w <= 0) return;
    var prev = this.grounds[this.grounds.length - 1];
    if (prev && Math.abs(prev.x + prev.w - this.cursor) < 0.01) prev.w += w;
    else this.grounds.push({ x: this.cursor, w: w });
    this.cursor += w;
  };

  World.prototype.addGroundAt = function (x, w) {
    this.grounds.push({ x: x, w: w });
  };

  World.prototype.addPit = function (w, bridged, bare) {
    var spiked = !bare;
    if (!bare && !bridged && this.mode === "endless") {
      var dist = Math.max(0, this.cursor - (this.startX || 0));
      if (dist < 15000) spiked = true;
      else {
        this.pitSerial += 1;
        spiked = this.pitSerial % 3 !== 0;
      }
    }
    this.pits.push({ x: this.cursor, w: w, spiked: spiked, bridged: !!bridged });
    this.cursor += w;
  };

  World.prototype.lengthStretch = function (player) {
    if (this.mode !== "endless" && this.mode !== "past") return 1;
    var pace = this.scrollSpeed(player || { x: this.cursor, big: false });
    var stretch = pace / DM.config.endlessBase;
    if (stretch < 1) stretch = 1;
    if (stretch > 2.4) stretch = 2.4;
    return stretch;
  };

  World.prototype.pitAt = function (x) {
    var i;
    for (i = 0; i < this.pits.length; i++) {
      var p = this.pits[i];
      if (x >= p.x && x < p.x + p.w) return p;
    }
    return null;
  };

  World.prototype.portalPit = function (player) {
    if (this.mode !== "endless" || !player) return null;
    var box = player.bounds();
    var C = DM.config;
    var i;
    for (i = 0; i < this.pits.length; i++) {
      var p = this.pits[i];
      if (p.spiked !== false) continue;
      if (player.x >= p.x && player.x < p.x + p.w && player.y >= C.groundY + 6) return p;
      var lip = 18;
      var left = { x: p.x - lip, y: C.groundY - 4, w: lip + 10, h: C.pitDepth + 24 };
      var right = { x: p.x + p.w - 10, y: C.groundY - 4, w: lip + 10, h: C.pitDepth + 24 };
      if (overlap(box, left) || overlap(box, right)) return p;
    }
    return null;
  };

  World.prototype.holdSpikedWalls = function (player) {
    if (!player || player.hidden) return;
    var C = DM.config;
    if (player.y < C.groundY) return;
    var i;
    for (i = 0; i < this.pits.length; i++) {
      var p = this.pits[i];
      if (p.spiked === false) continue;
      if (player.x < p.x || player.x >= p.x + p.w) continue;
      var wall = 14;
      var left = p.x + wall;
      var right = p.x + p.w - wall;
      if (right - left < 24) {
        left = p.x + 4;
        right = p.x + p.w - 4;
      }
      var inset = 10;
      if (player.x < left + inset) player.x = left + inset;
      if (player.x > right - inset) player.x = right - inset;
      player.grounded = false;
      if (player.vy < 160) player.vy = 160;
    }
  };

  World.prototype.spawn = function (entity) {
    this.entities.push(entity);
  };

  function gy() {
    return DM.config.groundY;
  }

  World.prototype.normalSpeed = function () {
    var C = DM.config;
    if (this.mode === "tempo") return this.tempoSpeed || C.endlessBase;
    if (this.mode === "adventure") return C.adventureBases[this.levelIndex - 1] || C.adventureBases[0];
    return C.endlessBase;
  };

  World.prototype.moveSpeed = function (player) {
    return this.scrollSpeed(player) * 1.22;
  };

  World.prototype.hasFire = function () {
    return this.mode === "tempo";
  };

  World.prototype.armChase = function () {
    var viewW = 1280;
    var origin = this.startX || DM.config.startX;
    this.introCamX = origin - viewW * 0.28;
    this.fireFollowX = this.introCamX + viewW * 0.46;
    this.fireX = this.hasFire() ? this.introCamX + 64 : null;
    this.scrolling = false;
    this.ribbonX = 0;
  };

  World.prototype.syncFire = function (dt, camLeft, viewW, player) {
    if (!this.hasFire() || this.waiting || this.fireX == null) return;
    this.fireX += this.moveSpeed(player) * dt;
    var minX = camLeft + 28;
    var maxX = camLeft + viewW - 36;
    if (this.fireX < minX) this.fireX = minX;
    if (this.fireX > maxX) this.fireX = maxX;
  };

  World.prototype.igniteBehind = function () {
    var front = this.fireX;
    var i;
    if (!this.hasFire() || this.waiting || front == null) return;
    for (i = 0; i < this.entities.length; i++) {
      var e = this.entities[i];
      if (e.dead || e.burning || e.kind === "aircoin") continue;
      if (front >= e.x - (e.r || 0)) {
        e.burning = true;
        e.burnT = 0.32;
      }
    }
  };

  World.prototype.coin = function (x) {
    if (this.groundAt(x) == null) return;
    this.spawn({ kind: "coin", x: x, y: gy() - 72, r: 18 });
  };

  World.prototype.orb = function (x, form) {
    if (this.groundAt(x) == null) return false;
    if (form === "ship" && this.boostBlocked("ship")) return false;
    if (form === "ship" && !this.allowShip) {
      this.pendingShips.push(x);
      return true;
    }
    this.spawn({ kind: "orb", x: x, y: gy() - 78, r: 28, form: form });
    return true;
  };

  World.prototype.releaseShips = function (px) {
    var i;
    for (i = 0; i < this.pendingShips.length; i++) {
      var x = this.pendingShips[i];
      if (this.boostBlocked("ship")) continue;
      if (x > px + 180 && this.groundAt(x) != null && (!this.finish || x < this.finish)) {
        this.spawn({ kind: "orb", x: x, y: gy() - 78, r: 28, form: "ship" });
      }
    }
    this.pendingShips = [];
  };

  World.prototype.ribbonY = function (x) {
    var half = 500;
    var span = half * 2;
    var m = x % span;
    if (m < 0) m += span;
    var along = m <= half ? m / half : (span - m) / half;
    return 200 + 260 * along;
  };

  World.prototype.clearRibbon = function () {
    var i;
    for (i = 0; i < this.entities.length; i++) {
      if (this.entities[i].kind === "aircoin") this.entities[i].dead = true;
    }
    this.ribbonX = 0;
  };

  World.prototype.extendRibbon = function (player) {
    if (!player || player.form !== "ship") {
      if (this.ribbonX) this.clearRibbon();
      return;
    }
    var gap = 22;
    if (!this.ribbonX) this.ribbonX = player.x + 36;
    var limit = player.x + 1500;
    var guard = 0;
    while (this.ribbonX < limit && guard++ < 90) {
      if (!this.hasFire() || this.ribbonX > this.fireX + 70) {
        this.spawn({ kind: "aircoin", x: this.ribbonX, y: this.ribbonY(this.ribbonX), r: 12 });
      }
      this.ribbonX += gap;
    }
  };

  function clamp(n, a, b) {
    if (n < a) return a;
    if (n > b) return b;
    return n;
  }

  var RISE_OFFSETS = [0, 10, -8, 12, -6, 8];
  var WIDTH_EXTRA = [0, 34, -12, 46, 10, 22];

  function planStair(x, steps, rise, difficulty, salt, scale) {
    steps = Math.max(2, Math.min(6, steps | 0));
    scale = scale || 1;
    difficulty = clamp(difficulty || 0, 0, 1);
    var cap = Math.round(50 + difficulty * 34);
    var base = clamp(Math.round(rise), 34, cap);
    var shift = Math.floor(hash((salt == null ? x : salt) + steps * 13) * 6);
    var baseW = Math.round(206 - difficulty * 56);
    var rises = [];
    var prev = null;
    var i;
    for (i = 0; i < steps; i++) {
      var stepRise = clamp(base + RISE_OFFSETS[(i + shift) % 6], 34, cap);
      if (prev != null && Math.abs(stepRise - prev) < 6) {
        stepRise = stepRise + 6 <= cap ? stepRise + 6 : Math.max(34, stepRise - 6);
      }
      rises.push(stepRise);
      prev = stepRise;
    }
    var height = 0;
    var cursor = x;
    var planned = [];
    var minW = Math.round(140 * scale);
    var hopAt = steps >= 3 && (Math.floor(Math.abs(salt)) % 2) === 0 ? 1 + Math.floor(hash(salt + 41) * Math.max(1, steps - 2)) : -1;
    for (i = 0; i < steps; i++) {
      if (i === hopAt) cursor += Math.round((40 + hash(salt + 55) * 32) * scale);
      height += rises[i];
      var w = Math.round((baseW + WIDTH_EXTRA[(i + shift) % 6]) * scale);
      if (w < minW) w = minW;
      planned.push({ x: cursor, w: w, h: height });
      cursor += w;
    }
    if (steps >= 3 && (Math.floor(Math.abs(salt) / 3) % 3) !== 0) {
      var downs = 2 + Math.floor(hash(salt + 31) * 2);
      var dropI;
      for (dropI = 0; dropI < downs; dropI++) {
        var drop = 28 + Math.floor(hash(salt + 60 + dropI) * 24);
        height = Math.max(40, height - drop);
        var downW = Math.round(baseW * 0.86 * scale);
        if (downW < minW) downW = minW;
        if (dropI === 1 && hash(salt + 73) > 0.55) cursor += Math.round(36 * scale);
        planned.push({ x: cursor, w: downW, h: height });
        cursor += downW;
      }
    }
    var land = Math.round(156 * scale);
    planned.push({ x: cursor - 2, w: land, h: height });
    return { steps: planned, end: cursor - 2 + land };
  }

  function stairExtent(steps, rise, difficulty, salt, scale) {
    return planStair(0, steps, rise, difficulty, salt, scale).end;
  }

  function bodyHitsSolid(player, e, box, allowRise) {
    if (!overlap(box, e)) return false;
    if (player.y <= e.y + 14 && player.vy >= -1) return false;
    var centerInside = player.x > e.x + 6 && player.x < e.x + e.w - 6;
    if (!centerInside) return false;
    if (allowRise && player.vy < 0) return false;
    return true;
  }

  World.prototype.stepBlock = function (x, w, h) {
    this.spawn({ kind: "step", x: x, y: gy() - h, w: w, h: h });
  };

  World.prototype.flame = function (x, w, h) {
    h = h || 56;
    this.spawn({ kind: "flame", x: x, y: gy() - h, w: w || 40, h: h });
  };

  World.prototype.addStair = function (x, steps, rise, difficulty, salt, scale) {
    var plan = planStair(x, steps, rise, difficulty, salt == null ? x : salt, scale);
    var i;
    for (i = 0; i < plan.steps.length; i++) {
      var s = plan.steps[i];
      this.stepBlock(s.x, s.w, s.h);
    }
  };

  World.prototype.pad = function (x) {
    if (this.groundAt(x + 16) == null) return;
    this.spawn({ kind: "booster", x: x, y: gy() - 64, w: 64, h: 64, hot: false });
  };

  World.prototype.growAt = function (x) {
    if (this.boostBlocked("grow")) return;
    if (this.groundAt(x) == null) return;
    this.spawn({ kind: "grow", x: x, y: gy() - 52, r: 26 });
    this.lastGrow = x;
  };

  World.prototype.timed = function (x, kind) {
    if (this.boostBlocked(kind)) return;
    if (this.groundAt(x) == null) return;
    this.spawn({ kind: kind, x: x, y: gy() - 86, r: 24 });
  };

  World.prototype.block = function (x, w, h) {
    this.spawn({ kind: "block", x: x, y: gy() - h, w: w, h: h });
  };

  World.prototype.arch = function (x, w, above, h) {
    var bottom = gy() - above;
    this.spawn({ kind: "block", x: x, y: bottom - h, w: w, h: h, arch: true });
  };

  World.prototype.spike = function (x, w) {
    this.spawn({ kind: "spike", x: x, y: gy() - 36, w: w, h: 36 });
  };

  World.prototype.spikeOn = function (x, above, w) {
    var h = 26;
    if (w < 18) w = 18;
    this.spawn({ kind: "spike", x: x, y: gy() - above - h, w: w, h: h, atop: true });
  };

  World.prototype.platform = function (x, w, above, shelf) {
    var top = gy() - above;
    this.spawn({ kind: "platform", x: x, y: top, w: w, h: 14, shelf: !!shelf });
  };

  World.prototype.airSpan = function () {
    var C = DM.config;
    if (this.mode === "tempo" && this.track) {
      var jump = DM.music && DM.music.jumpSpeed ? DM.music.jumpSpeed(this.track.bpm) : 2200 * (60 / this.track.bpm);
      return (this.tempoSpeed || C.endlessBase) * 1.22 * (2 * jump / 2200);
    }
    if (this.mode === "adventure") {
      var base = C.adventureBases[this.levelIndex - 1] || C.adventureBases[0];
      return base * 1.22 * (1520 / 2200);
    }
    return this.jumpReach(this.cursor);
  };

  World.prototype.hopHeight = function () {
    if (this.mode === "tempo" && this.track) {
      var jump = DM.music && DM.music.jumpSpeed ? DM.music.jumpSpeed(this.track.bpm) : 2200 * (60 / this.track.bpm);
      return jump * jump / (2 * 2200);
    }
    return 760 * 760 / (2 * 2200);
  };

  World.prototype.addHopChain = function (hops, shape, salt, maxWidth, spikesUnder, traps) {
    var air = this.airSpan();
    var jumpH = this.hopHeight();
    if (!(air > 40)) air = 160;
    if (!(jumpH > 40)) jumpH = 120;
    hops = hops | 0;
    if (hops < 3) hops = 3;
    if (hops > 5) hops = 5;
    shape = ((shape | 0) % 4 + 4) % 4;
    salt = salt | 0;
    var padW = Math.round(Math.max(88, Math.min(124, air * 0.3)));
    var maxUp = Math.round(jumpH * 0.58);
    if (maxUp > 100) maxUp = 100;
    if (maxUp < 34) maxUp = 34;
    var height = Math.round(Math.max(54, Math.min(76, jumpH * 0.42)));
    var pads = [];
    var i;
    var jumpV = 760;
    var airTime = 1520 / 2200;
    if (this.mode === "tempo" && this.track) {
      jumpV = DM.music && DM.music.jumpSpeed ? DM.music.jumpSpeed(this.track.bpm) : 2200 * (60 / this.track.bpm);
      airTime = 2 * jumpV / 2200;
    }
    var hopSpeed = air / airTime;
    function musicGap(rise) {
      var disc = jumpV * jumpV - 4400 * rise;
      var dist = air;
      if (disc > 0) {
        var t = (jumpV + Math.sqrt(disc)) / 2200;
        if (t < 0.08) t = 0.08;
        dist = hopSpeed * t;
      }
      if (dist > air) dist = air;
      var gap = Math.round(dist - 28);
      if (gap > Math.round(air - 16)) gap = Math.round(air - 16);
      if (gap < 74) gap = 74;
      return gap;
    }
    for (i = 0; i < hops; i++) {
      var roll = (Math.abs(salt) + i * 3) % 4;
      var rise = 0;
      if (shape === 0) rise = 18 + ((Math.abs(salt) + i * 5) % 10);
      else if (shape === 1) rise = -(16 + ((Math.abs(salt) + i * 5) % 14));
      else if (shape === 2) rise = roll - 1;
      else rise = roll === 0 ? 22 : roll === 1 ? -18 : roll === 2 ? 8 : -6;
      if (rise > maxUp) rise = maxUp;
      var next = height + rise;
      if (next < 48) next = 48;
      var ceilH = Math.round(jumpH * 0.76);
      if (next > ceilH) next = ceilH;
      rise = next - height;
      var gap;
      if (this.mode === "tempo") gap = musicGap(i === 0 ? next : rise);
      else {
        var ratio = rise > 10 ? 0.42 : rise < -8 ? 0.58 : 0.5;
        gap = Math.round(air * ratio);
        var cap = Math.round(air * (rise > 10 ? 0.5 : 0.64));
        if (gap > cap) gap = cap;
        if (gap < 74) gap = 74;
      }
      var trap = traps !== false && i > 0;
      pads.push({ gap: gap, w: padW, h: next, trap: trap });
      height = next;
    }
    var tail = Math.round(air * 0.4);
    if (tail > air * 0.56) tail = Math.round(air * 0.56);
    if (tail < 72) tail = 72;
    function spanOf() {
      var n = tail;
      var k;
      for (k = 0; k < pads.length; k++) n += pads[k].gap + pads[k].w;
      return n;
    }
    if (this.mode === "tempo" && maxWidth) {
      var budget = maxWidth - 108;
      if (budget < 240) budget = maxWidth - 40;
      if (tail > Math.round(air * 0.22)) tail = Math.round(air * 0.22);
      if (tail < 48) tail = 48;
      while (pads.length > 2 && spanOf() > budget) pads.pop();
      if (spanOf() > budget) {
        tail -= spanOf() - budget;
        if (tail < 24) tail = 24;
      }
    } else if (maxWidth && spanOf() > maxWidth - 30 && pads.length > 3) pads.pop();
    if (this.mode !== "tempo" && maxWidth && spanOf() > maxWidth - 10) {
      var extra = spanOf() - (maxWidth - 24);
      var cut = Math.ceil(extra / (pads.length + 1));
      for (i = 0; i < pads.length; i++) {
        pads[i].gap -= cut;
        if (pads[i].gap < 68) pads[i].gap = 68;
      }
      tail -= cut;
      if (tail < 68) tail = 68;
    }
    var span = spanOf();
    this.addGround(28);
    var pitX = this.cursor;
    if (spikesUnder === false) this.addGround(span);
    else this.addPit(span, true);
    var x = pitX;
    var h = 0;
    var jumpV = 760;
    var airTime = 1520 / 2200;
    if (this.mode === "tempo" && this.track) {
      jumpV = DM.music && DM.music.jumpSpeed ? DM.music.jumpSpeed(this.track.bpm) : 2200 * (60 / this.track.bpm);
      airTime = 2 * jumpV / 2200;
    }
    for (i = 0; i < pads.length; i++) {
      var pad = pads[i];
      if (pad.trap) {
        var trapW = Math.round(Math.max(28, Math.min(40, pad.w * 0.4)));
        var trapH = Math.min(h, pad.h) - 32;
        if (trapH < 42) trapH = 42;
        var trapAt = Math.round(Math.max(12, pad.gap * 0.22));
        if (trapAt + trapW < pad.gap - 10) {
          var center = trapAt + trapW * 0.5;
          var f = center / air;
          if (f < 0) f = 0;
          if (f > 0.92) f = 0.92;
          var t = f * airTime;
          var arc = h + jumpV * t - 1100 * t * t;
          if (arc > trapH + 48) {
            this.platform(x + trapAt, trapW, trapH, false);
            var placed = this.entities[this.entities.length - 1];
            if (placed && placed.kind === "platform") placed.trap = true;
            this.spikeOn(x + trapAt + 4, trapH, trapW - 8);
          }
        }
      }
      x += pad.gap;
      this.platform(x, pad.w, pad.h, false);
      x += pad.w;
      h = pad.h;
    }
    this.addGround(80);
  };

  World.prototype.holdShelves = function (player) {
    if (!player) return;
    var box = player.bounds();
    var i;
    for (i = 0; i < this.entities.length; i++) {
      var e = this.entities[i];
      if (e.dead || e.kind !== "platform") continue;
      if (!overlap(box, e)) continue;
      if (player.vy >= -1 && player.y <= e.y + 8 && player.x > e.x + 2 && player.x < e.x + e.w - 2) continue;
      var sink = e.y + e.h - box.y + 1;
      if (sink > 0) player.y += sink;
      if (player.vy < 120) player.vy = 120;
      player.grounded = false;
    }
  };

  World.prototype.heart = function (x, above) {
    if (this.mode === "past") return;
    this.spawn({ kind: "heart", x: x, y: gy() - above - 22, r: 16 });
  };

  World.prototype.surfaceAt = function (player) {
    var best = null;
    function consider(top) {
      if (player.vy < 0 && player.y < top) return;
      if (player.prevY <= top + 1 && player.y >= top - 0.01) {
        if (best == null || top < best) best = top;
      }
    }
    var ground = this.groundAt(player.x);
    if (ground != null) consider(ground);
    var i;
    for (i = 0; i < this.entities.length; i++) {
      var e = this.entities[i];
      if (e.dead || (e.kind !== "platform" && e.kind !== "step" && e.kind !== "block")) continue;
      if (player.x >= e.x + 4 && player.x <= e.x + e.w - 4) consider(e.y);
    }
    if (best == null && player.grounded) {
      if (ground != null && Math.abs(player.y - ground) < 2) return ground;
    }
    return best;
  };

  World.prototype.sense = function (player) {
    var box = player.bounds();
    var i;
    for (i = 0; i < this.entities.length; i++) {
      var flame = this.entities[i];
      if (!this.waiting && !flame.dead && flame.kind === "flame" && overlap(box, flame)) return "flame";
    }
    if (player.invuln > 0) return null;
    if (this.hasFire() && !this.waiting && this.fireX != null && box.x < this.fireX - 8) return "flame";
    var gate = this.portalPit(player);
    if (gate) return "portal";
    var C = DM.config;
    var pitHere = this.pitAt(player.x);
    if (pitHere && pitHere.spiked !== false && player.y >= C.groundY + C.pitDepth - 30) return "pit";
    var overPit = this.groundAt(player.x) == null;
    if (overPit && (!pitHere || pitHere.spiked === false) && player.y >= C.groundY + C.pitTrigger) return "pit";
    if (player.form === "ship" && !overPit && player.y >= C.groundY) return "obstacle";
    var jaw = this.rexBox();
    if (jaw && overlap(box, jaw)) return "obstacle";
    for (i = 0; i < this.entities.length; i++) {
      var e = this.entities[i];
      if (e.dead) continue;
      if (e.kind === "hunter" && !e.eaten && overlap(box, e)) return "obstacle";
      if (e.kind === "step" && bodyHitsSolid(player, e, box, true)) return "obstacle";
      if (e.kind === "spike" && overlap(box, e)) return "spike";
      if (e.kind === "block" && bodyHitsSolid(player, e, box, false)) return "obstacle";
    }
    return null;
  };

  World.prototype.landingSurface = function (player) {
    var C = DM.config;
    if (player.vy <= 0) return null;
    var i;
    var platform = null;
    for (i = 0; i < this.entities.length; i++) {
      var e = this.entities[i];
      if (e.dead || (e.kind !== "platform" && e.kind !== "step" && e.kind !== "block")) continue;
      if (player.x >= e.x && player.x <= e.x + e.w && player.prevY <= e.y && player.y >= e.y) {
        if (!platform || e.y < platform.y) platform = e;
      }
    }
    if (platform) {
      player.y = platform.y;
      return { y: platform.y, hazard: this.landingHazard(player) };
    }
    if (player.y < C.groundY) return null;
    if (this.groundAt(player.x) == null) return { y: C.groundY + C.pitDepth, hazard: true, pit: true };
    player.y = C.groundY;
    return { y: C.groundY, hazard: this.landingHazard(player) };
  };

  World.prototype.landingHazard = function (player) {
    var box = player.bounds();
    var i;
    for (i = 0; i < this.entities.length; i++) {
      var e = this.entities[i];
      if (e.dead) continue;
      if (e.kind === "spike" && overlap(box, e)) return true;
      if (e.kind === "block" && overlap(box, e) && player.y > e.y + 10) return true;
      if (e.kind === "flame" && overlap(box, e)) return true;
    }
    return false;
  };

  World.prototype.collect = function (player, fn) {
    var box = player.bounds();
    var i;
    for (i = 0; i < this.entities.length; i++) {
      var e = this.entities[i];
      if (e.dead) continue;
      if (e.kind === "booster") {
        var hit = overlap(box, e);
        if (hit && !e.hot) fn(e);
        e.hot = hit;
        continue;
      }
      if (e.kind === "coin" || e.kind === "aircoin" || e.kind === "heart" || e.kind === "grow" || e.kind === "fast" || e.kind === "slow" || e.kind === "orb") {
        if (circleBox(e.x, e.y, e.r, box)) fn(e);
      }
    }
  };

  World.prototype.removeGrows = function () {
    var i;
    for (i = 0; i < this.entities.length; i++) {
      if (this.entities[i].kind === "grow") this.entities[i].dead = true;
    }
  };

  World.prototype.scrollSpeed = function (player) {
    var C = DM.config;
    var raw;
    var cap;
    if (this.mode === "tempo") {
      raw = this.tempoSpeed || C.endlessBase;
      cap = raw;
    } else if (this.mode === "endless" || this.mode === "past") {
      var d = Math.max(0, player.x - this.speedAnchor);
      raw = C.endlessBase * (1 + d * C.endlessCoef);
      cap = C.endlessMax;
      if (raw > cap) raw = cap;
    } else {
      var base = C.adventureBases[this.levelIndex - 1] || C.adventureBases[0];
      var denom = Math.max(300, this.finish - this.speedAnchor);
      var prog = (player.x - this.speedAnchor) / denom;
      if (prog < 0) prog = 0;
      if (prog > 1) prog = 1;
      raw = base * (1 + prog * C.adventureCoef);
      cap = base * (1 + C.adventureCoef);
    }
    var scale = DM.bonus && DM.bonus.scale ? DM.bonus.scale() : 1;
    if (scale > 1 && raw * scale > cap) return cap / scale;
    return raw;
  };

  World.prototype.follow = function (x, player) {
    if (this.mode !== "endless" && this.mode !== "past") return;
    this.generateUntil(x + 2400, player);
    this.cull(x - 2600);
  };

  World.prototype.cull = function (minX) {
    this.grounds = this.grounds.filter(function (g) { return g.x + g.w >= minX; });
    this.pits = this.pits.filter(function (p) { return p.x + p.w >= minX; });
    this.entities = this.entities.filter(function (e) {
      var ex = e.x + (e.w || 0);
      return ex >= minX && !e.dead;
    });
  };

  World.prototype.generateUntil = function (limit, player) {
    var guard = 0;
    while (this.cursor < limit && guard++ < 40) this.pushPattern(player);
  };

  World.prototype.jumpReach = function (x) {
    var d = Math.max(0, x - (this.speedAnchor || this.startX || 0));
    var raw = DM.config.endlessBase * (1 + d * DM.config.endlessCoef);
    if (raw > DM.config.endlessMax) raw = DM.config.endlessMax;
    return raw * 1.22 * (1520 / 2200);
  };

  World.prototype.addSpikeShelf = function () {
    var air = this.jumpReach(this.cursor);
    if (!(air > 80)) air = 160;
    var above = 94;
    var withSpikes = hash(this.cursor * 0.17 + this.patternSerial * 9) > 0.4;
    if (!withSpikes) {
      var plain = 124;
      this.addGround(plain + 180);
      this.platform(this.cursor - plain - 80, plain, above, true);
      this.addGround(80);
      return;
    }
    var span = Math.round(air * 2.25);
    var lead = Math.round(air * 0.45);
    var tail = Math.round(air * 0.55);
    var shelfW = span - lead - tail;
    if (shelfW < 96) shelfW = 96;
    this.addGround(span + 140);
    var spikeX = this.cursor - span - 60;
    this.platform(spikeX + lead, shelfW, above, true);
    this.spike(spikeX, span);
    this.addGround(80);
  };

  World.prototype.pushPastPattern = function () {
    var stretch = this.lengthStretch({ x: this.cursor, big: false });
    this.patternSerial = (this.patternSerial || 0) + 1;
    var kind = this.patternSerial % 4;
    var air = this.jumpReach(this.cursor);
    if (!(air > 80)) air = 160;
    var gap = Math.round(air * 0.58);
    var cap = Math.round(air * 0.62);
    if (gap > cap) gap = cap;
    if (gap < 88) gap = 88;
    if (kind === 0) {
      this.addSpikeShelf();
      return;
    }
    if (kind === 1) {
      this.addGround(Math.round(80 * stretch));
      this.spike(this.cursor - Math.round(64 * stretch), 40 + (this.patternSerial % 3) * 14);
      this.addGround(Math.round(64 * stretch));
      this.block(this.cursor - Math.round(56 * stretch), 36, 46 + (this.patternSerial % 3) * 8);
      this.addGround(56);
      this.addPit(gap);
      this.addGround(64);
      return;
    }
    if (kind === 2) {
      var steps = 4 + (this.patternSerial % 2);
      var rise = 56;
      var salt = Math.floor(this.cursor + this.patternSerial * 17);
      var extent = stairExtent(steps, rise, 1, salt, stretch);
      this.addGround(36);
      var stairX = this.cursor;
      this.addGround(extent + 12);
      this.addStair(stairX, steps, rise, 1, salt, stretch);
      this.addGround(48);
      this.addPit(gap);
      this.addGround(70);
      return;
    }
    var hops = this.patternSerial % 2 === 0 ? 5 : 4;
    this.addHopChain(hops, this.patternSerial % 4, Math.floor(this.cursor + this.patternSerial * 13), null);
  };

  World.prototype.roll = function (salt) {
    return hash((this.biomeSeed || this.seed || 1) + this.cursor * 0.013 + (salt || 0) * 17.3);
  };

  World.prototype.keepOnMap = function (player) {
    if (!player || player.freeFly || player.hidden) return;
    var C = DM.config;
    var pit = this.pitAt(player.x);
    var floor = pit || this.groundAt(player.x) == null ? C.groundY + C.pitDepth : C.groundY;
    if (player.form === "ship") {
      if (player.y > floor) {
        player.y = floor;
        if (player.vy > 0) player.vy = 0;
      }
      return;
    }
    if (player.y > floor) {
      player.y = floor;
      if (player.vy > 0) player.vy = 0;
      if (!pit && this.groundAt(player.x) != null) {
        player.grounded = true;
        player.coyote = C.coyote;
      }
    }
  };

  World.prototype.pushPattern = function (player) {
    if (this.mode === "past") {
      this.pushPastPattern();
      return;
    }
    var dist = Math.max(0, this.cursor - this.startX);
    var hard = Math.min(1, dist / 18000);
    var stretch = this.lengthStretch(player);
    if (dist < 620) {
      this.addGround(480);
      return;
    }
    this.patternSerial = (this.patternSerial || 0) + 1;
    var roll = this.roll(this.patternSerial);
    if (this.mode !== "past" && dist - this.lastHeart >= 8000) {
      var shelfW = Math.max(120, Math.round(150 * stretch));
      this.addGround(180);
      this.platform(this.cursor - Math.round(shelfW * 0.75), shelfW, 96, true);
      this.heart(this.cursor - Math.round(shelfW * 0.4), 96);
      this.lastHeart = dist;
      this.addGround(160);
    } else if (dist >= 15000 && roll < (dist >= 25000 ? 0.62 : 0.22)) {
      var hops = dist >= 25000 ? 5 : 3;
      var chainShape = Math.floor(this.roll(3) * 4);
      this.addHopChain(hops, chainShape, Math.floor(this.cursor + this.roll(8) * 400), null);
    } else if (roll < 0.3) {
      this.addGround(Math.round((140 + this.roll(4) * 140) * stretch));
      if (this.roll(5) < 0.5) this.spike(this.cursor - Math.round((70 + this.roll(6) * 40) * stretch), 36 + Math.floor(this.roll(7) * 36));
      else this.block(this.cursor - Math.round((80 + this.roll(6) * 40) * stretch), 36 + Math.floor(this.roll(9) * 20), 40 + Math.floor(this.roll(11) * 24));
      this.addGround(Math.round(90 + this.roll(12) * 80));
    } else {
      var steps = 2 + Math.floor(this.roll(2) * 3);
      if (hard > 0.35) steps += 1;
      if (hard > 0.7) steps += 1;
      if (dist < 1600) steps = 2;
      else if (dist < 4000) steps = Math.min(steps, 3);
      if (steps > 6) steps = 6;
      var rise = Math.round(34 + this.roll(13) * 28);
      if (rise > 62) rise = 62;
      var salt = Math.floor(this.cursor + this.roll(14) * 900);
      var extent = stairExtent(steps, rise, hard, salt, stretch);
      this.addGround(Math.round(48 + this.roll(15) * 40));
      var stairX = this.cursor;
      this.addGround(extent + 20);
      this.addStair(stairX, steps, rise, hard, salt, stretch);
      this.addGround(Math.round(90 + this.roll(16) * 70));
      var air = this.jumpReach(this.cursor);
      var gap = Math.round(air * (0.32 + hard * 0.18 + this.roll(17) * 0.12));
      var cap = Math.round(air * 0.64);
      if (gap > cap) gap = cap;
      if (gap < 84) gap = 84;
      if (dist < 2200 && gap > 108) gap = 108;
      this.addPit(gap);
      this.addGround(Math.round(110 + this.roll(18) * 70));
    }
    var run = 200;
    if (this.mode !== "past" && this.orbForm === "ship") {
      if (this.cursor - this.lastShip > 4600) {
        if (this.orb(this.cursor - run, "ship")) this.lastShip = this.cursor;
        this.orbForm = "runner";
      }
    } else if (this.mode !== "past" && this.cursor - this.lastOrb > 2200) {
      this.orb(this.cursor - run * 0.8, "runner");
      this.lastOrb = this.cursor;
      this.orbForm = "ship";
    }
    if (player && !player.big && this.cursor - this.lastGrow > 2200 && this.rng() > 0.45) {
      this.growAt(this.cursor - 80);
    }
    if (this.cursor - this.lastBonus > 1700 && this.rng() > 0.4) {
      this.timed(this.cursor - 120, "slow");
      this.lastBonus = this.cursor;
    }
  };

  function buildAdventure(index) {
    var course = LEVELS[index - 1];
    var segments = course.parts;
    var world = new World();
    world.mode = "adventure";
    world.levelIndex = index;
    world.cursor = 0;
    world.addGroundAt(-900, 900);
    world.cursor = 0;
    var s, i, f;
    var diff = (index - 1) / 19;
    var airCap = world.airSpan();
    for (i = 0; i < segments.length; i++) {
      s = segments[i];
      var bare = !s.pit && !s.blocks && !s.spikes && !s.platform && !s.arch && !s.stair;
      var len = s.len;
      if (bare) {
        var minLen = i === 0 ? 520 : 240;
        len = Math.round(s.len * 0.58);
        if (len < minLen) len = minLen;
        if (len > s.len) len = s.len;
      }
      var origin = world.cursor;
      if (s.pit) {
        var pitAt = Math.round(s.pit.at * 0.82);
        if (pitAt < 80) pitAt = 80;
        var pitW = s.pit.w + Math.round(18 + diff * 36);
        var pitMax = Math.round(airCap * (0.5 + diff * 0.1));
        if (pitW > pitMax) pitW = pitMax;
        if (pitW > 200) pitW = 200;
        if (pitAt + pitW > len - 70) pitW = len - 70 - pitAt;
        if (pitW < 64) pitW = 64;
        world.addGround(pitAt);
        world.addPit(pitW);
        world.addGround(len - pitAt - pitW);
      } else {
        world.addGround(len);
      }
      if (s.blocks) {
        for (f = 0; f < s.blocks.length; f++) {
          var b = s.blocks[f];
          var bh = b.h || 56;
          if (!b.arch && bh < 70) bh += Math.round(diff * 8);
          if (bh > 72) bh = 72;
          world.block(origin + Math.round((b.at || 0) * 0.86), b.w || 44, bh);
        }
      }
      if (s.spikes) {
        for (f = 0; f < s.spikes.length; f++) {
          var sp = s.spikes[f];
          world.spike(origin + Math.round(sp.at * 0.86), (sp.w || 72) + (index >= 8 ? 8 : 0));
        }
      }
      if (s.platform) world.platform(origin + Math.round(s.platform.at * 0.86), s.platform.w, s.platform.above, false);
      if (s.arch) world.arch(origin + Math.round(s.arch.at * 0.86), s.arch.w, s.arch.above, s.arch.h || 36);
      if (s.stair) {
        var rise = s.stair.rise + Math.round(8 + diff * 16);
        world.addStair(origin + Math.round(s.stair.at * 0.86), s.stair.steps, rise, Math.min(1, diff + 0.4));
      }
      if (i > 0 && i % 2 === 1 && i < segments.length - 1) {
        var midHops = index >= 12 ? 4 : 3;
        world.addGround(28);
        world.addHopChain(midHops, (index + i) % 4, index * 19 + i * 7, null);
      }
    }
    var chainHops = index >= 12 ? 5 : index >= 5 ? 4 : 3;
    world.addGround(28);
    world.addHopChain(chainHops, (index + 1) % 4, index * 23, null);
    world.entities = world.entities.filter(function (e) {
      return e.kind !== "grow" && e.kind !== "slow" && e.kind !== "fast" && e.kind !== "orb" && e.kind !== "booster" && e.kind !== "heart";
    });
    world.length = world.cursor;
    world.finish = world.length - 80;
    world.addGroundAt(world.length, 1600);
    world.startX = DM.config.startX;
    world.speedAnchor = world.startX;
    world.levelName = course.name || ("Niveau " + index);
    world.songStart = world.startX;
    world.songBeats = 0;
    world.validate();
    return world;
  }

  World.prototype.validate = function () {
    var issues = [];
    var i;
    for (i = 0; i < this.pits.length; i++) {
      if (this.pits[i].w > 210 && !this.pits[i].bridged) issues.push("pit large " + this.pits[i].w + " @ " + this.pits[i].x);
    }
    for (i = 0; i < this.entities.length; i++) {
      var e = this.entities[i];
      if ((e.kind === "coin" || e.kind === "orb" || e.kind === "grow" || e.kind === "fast" || e.kind === "slow") && this.groundAt(e.x) == null) {
        issues.push(e.kind + " dans le vide @ " + e.x);
      }
      if (e.kind === "block" && !e.arch && e.h > 72) issues.push("bloc haut @ " + e.x);
      if (e.kind === "block" && e.arch && (gy() - (e.y + e.h)) < 133) issues.push("arche basse @ " + e.x);
    }
    this.issues = issues;
  };

  World.prototype.loadEndless = function () {
    var fresh = new World();
    fresh.mode = "endless";
    fresh.seed = (Date.now() % 2147483646) + 1;
    fresh.biomeSeed = fresh.seed;
    fresh.startX = DM.config.startX;
    fresh.speedAnchor = fresh.startX;
    fresh.cursor = -900;
    fresh.addGround(900 + 780);
    fresh.lastOrb = fresh.cursor;
    fresh.generateUntil(fresh.startX + 2600, { big: false, x: fresh.startX });
    return fresh;
  };

  var LEVELS = [
    { name: "Dunes", biome: 0, parts: [
      { len: 900 },
      { len: 800, blocks: [{ at: 400, w: 48, h: 44 }] },
      { len: 820, spikes: [{ at: 460, w: 48 }] },
      { len: 1100, stair: { at: 200, steps: 2, rise: 36 } },
      { len: 860, pit: { at: 340, w: 96 } },
      { len: 700 }
    ] },
    { name: "Corniches", biome: 1, parts: [
      { len: 780 },
      { len: 800, pit: { at: 200, w: 88 }, platform: { at: 210, w: 130, above: 86 } },
      { len: 820, blocks: [{ at: 160, h: 42 }, { at: 440, h: 64 }] },
      { len: 1200, stair: { at: 120, steps: 2, rise: 36 } },
      { len: 760, spikes: [{ at: 180, w: 40 }, { at: 460, w: 68 }] },
      { len: 840, pit: { at: 220, w: 116 } },
      { len: 680 }
    ] },
    { name: "Ruelles", biome: 2, parts: [
      { len: 800 },
      { len: 920, arch: { at: 160, w: 200, above: 300, h: 30 } },
      { len: 780, blocks: [{ at: 140, h: 40 }, { at: 420, h: 64 }] },
      { len: 800, spikes: [{ at: 180, w: 40 }, { at: 500, w: 68 }] },
      { len: 1200, stair: { at: 100, steps: 3, rise: 40 } },
      { len: 820, pit: { at: 240, w: 100 }, arch: { at: 480, w: 140, above: 220, h: 34 } },
      { len: 680 }
    ] },
    { name: "Racines", biome: 3, parts: [
      { len: 760 },
      { len: 1400, stair: { at: 100, steps: 2, rise: 38 } },
      { len: 800, pit: { at: 180, w: 96 }, blocks: [{ at: 460, h: 46 }] },
      { len: 780, spikes: [{ at: 160, w: 40 }, { at: 420, w: 66 }] },
      { len: 1600, stair: { at: 70, steps: 4, rise: 50 } },
      { len: 760, platform: { at: 260, w: 100, above: 104 } },
      { len: 680 }
    ] },
    { name: "Cratères", biome: 4, parts: [
      { len: 780 },
      { len: 1600, stair: { at: 80, steps: 4, rise: 46 } },
      { len: 860, pit: { at: 240, w: 112 }, blocks: [{ at: 520, h: 56 }] },
      { len: 840, spikes: [{ at: 180, w: 60 }, { at: 480, w: 64 }] },
      { len: 900, arch: { at: 200, w: 150, above: 280, h: 32 } },
      { len: 720 }
    ] },
    { name: "Guirlandes", biome: 5, parts: [
      { len: 840 },
      { len: 760, platform: { at: 280, w: 120, above: 90 } },
      { len: 800, spikes: [{ at: 400, w: 48 }] },
      { len: 820, pit: { at: 300, w: 100 }, platform: { at: 310, w: 100, above: 100 } },
      { len: 1100, stair: { at: 160, steps: 2, rise: 38 } },
      { len: 680 }
    ] },
    { name: "Mirage", biome: 0, parts: [
      { len: 1200 },
      { len: 760, blocks: [{ at: 200, h: 40 }, { at: 360, h: 48 }, { at: 520, h: 56 }] },
      { len: 780, spikes: [{ at: 420, w: 70 }] },
      { len: 860, pit: { at: 320, w: 104 } },
      { len: 1100, stair: { at: 140, steps: 2, rise: 40 } },
      { len: 640 }
    ] },
    { name: "Seracs", biome: 1, parts: [
      { len: 800 },
      { len: 740, spikes: [{ at: 200, w: 50 }], blocks: [{ at: 420, h: 40 }] },
      { len: 760, blocks: [{ at: 160, h: 64 }], spikes: [{ at: 400, w: 56 }] },
      { len: 780, spikes: [{ at: 140, w: 48 }, { at: 360, w: 48 }], blocks: [{ at: 560, h: 52 }] },
      { len: 1400, stair: { at: 100, steps: 3, rise: 40 } },
      { len: 800, pit: { at: 260, w: 100 } },
      { len: 680 }
    ] },
    { name: "Toits", biome: 2, parts: [
      { len: 760 },
      { len: 940, arch: { at: 140, w: 220, above: 300, h: 28 }, spikes: [{ at: 520, w: 42 }] },
      { len: 1400, stair: { at: 80, steps: 3, rise: 42 } },
      { len: 860, pit: { at: 200, w: 104 }, blocks: [{ at: 480, h: 50 }] },
      { len: 880, arch: { at: 150, w: 140, above: 210, h: 36 }, spikes: [{ at: 480, w: 70 }] },
      { len: 700 }
    ] },
    { name: "Canopée", biome: 3, parts: [
      { len: 760 },
      { len: 1600, stair: { at: 60, steps: 4, rise: 44 } },
      { len: 840, pit: { at: 200, w: 116 } },
      { len: 1500, stair: { at: 80, steps: 3, rise: 50 } },
      { len: 800, spikes: [{ at: 240, w: 68 }], blocks: [{ at: 480, h: 58 }] },
      { len: 680 }
    ] },
    { name: "Anneaux", biome: 4, parts: [
      { len: 740 },
      { len: 980, arch: { at: 180, w: 190, above: 300, h: 34 }, pit: { at: 640, w: 110 } },
      { len: 860, blocks: [{ at: 160, h: 60 }, { at: 340, h: 48 }, { at: 520, h: 66 }] },
      { len: 1400, stair: { at: 100, steps: 3, rise: 52 } },
      { len: 800, spikes: [{ at: 200, w: 64 }, { at: 460, w: 64 }] },
      { len: 700 }
    ] },
    { name: "Cheminée", biome: 5, parts: [
      { len: 800 },
      { len: 1100, stair: { at: 140, steps: 2, rise: 40 } },
      { len: 760, platform: { at: 300, w: 100, above: 100 }, spikes: [{ at: 560, w: 52 }] },
      { len: 820, pit: { at: 240, w: 108 } },
      { len: 780, blocks: [{ at: 180, h: 46 }, { at: 400, h: 54 }] },
      { len: 700 }
    ] },
    { name: "Oasis", biome: 0, parts: [
      { len: 860 },
      { len: 840, pit: { at: 360, w: 84 }, blocks: [{ at: 140, h: 40 }] },
      { len: 1200, stair: { at: 100, steps: 2, rise: 36 } },
      { len: 880, pit: { at: 200, w: 112 }, platform: { at: 210, w: 100, above: 98 } },
      { len: 800, spikes: [{ at: 160, w: 36 }, { at: 460, w: 64 }] },
      { len: 780, blocks: [{ at: 180, h: 58 }, { at: 420, h: 44 }], pit: { at: 560, w: 100 } },
      { len: 660 }
    ] },
    { name: "Crête", biome: 1, parts: [
      { len: 700 },
      { len: 1800, stair: { at: 80, steps: 5, rise: 42 } },
      { len: 760, spikes: [{ at: 160, w: 56 }, { at: 400, w: 56 }] },
      { len: 820, pit: { at: 240, w: 114 } },
      { len: 740, blocks: [{ at: 200, h: 68 }] },
      { len: 680 }
    ] },
    { name: "Néons", biome: 2, parts: [
      { len: 700 },
      { len: 800, spikes: [{ at: 140, w: 36 }, { at: 480, w: 70 }] },
      { len: 780, blocks: [{ at: 150, h: 42 }, { at: 400, h: 66 }] },
      { len: 1400, stair: { at: 90, steps: 3, rise: 46 } },
      { len: 840, pit: { at: 200, w: 108 }, spikes: [{ at: 500, w: 48 }] },
      { len: 860, arch: { at: 160, w: 150, above: 250, h: 32 }, blocks: [{ at: 520, h: 54 }] },
      { len: 660 }
    ] },
    { name: "Lianes", biome: 3, parts: [
      { len: 720 },
      { len: 800, platform: { at: 200, w: 150, above: 84 }, spikes: [{ at: 520, w: 40 }] },
      { len: 780, blocks: [{ at: 160, h: 48 }, { at: 400, h: 68 }] },
      { len: 1600, stair: { at: 80, steps: 4, rise: 48 } },
      { len: 840, pit: { at: 180, w: 120 }, platform: { at: 190, w: 90, above: 110 } },
      { len: 700, spikes: [{ at: 240, w: 62 }] }
    ] },
    { name: "Satellite", biome: 4, parts: [
      { len: 700 },
      { len: 980, arch: { at: 150, w: 170, above: 280, h: 36 } },
      { len: 1600, stair: { at: 90, steps: 4, rise: 54 } },
      { len: 860, pit: { at: 200, w: 120 }, spikes: [{ at: 520, w: 60 }] },
      { len: 840, blocks: [{ at: 180, h: 62 }, { at: 400, h: 50 }] },
      { len: 720 }
    ] },
    { name: "Traîneau", biome: 5, parts: [
      { len: 860 },
      { len: 700, spikes: [{ at: 300, w: 40 }] },
      { len: 720, platform: { at: 260, w: 90, above: 86 } },
      { len: 740, spikes: [{ at: 280, w: 44 }] },
      { len: 760, platform: { at: 240, w: 100, above: 98 } },
      { len: 900, pit: { at: 320, w: 100 } },
      { len: 1100, stair: { at: 120, steps: 2, rise: 36 } },
      { len: 640 }
    ] },
    { name: "Tempête", biome: 0, parts: [
      { len: 680 },
      { len: 760, blocks: [{ at: 120, h: 50 }, { at: 280, h: 60 }, { at: 460, h: 44 }] },
      { len: 800, spikes: [{ at: 150, w: 56 }, { at: 340, w: 56 }, { at: 530, w: 50 }] },
      { len: 1500, stair: { at: 70, steps: 4, rise: 50 } },
      { len: 820, pit: { at: 180, w: 118 }, blocks: [{ at: 460, h: 64 }] },
      { len: 700, spikes: [{ at: 300, w: 70 }] },
      { len: 640 }
    ] },
    { name: "Apogée", biome: 4, parts: [
      { len: 640 },
      { len: 1800, stair: { at: 60, steps: 5, rise: 56 } },
      { len: 880, pit: { at: 160, w: 120 }, spikes: [{ at: 480, w: 64 }] },
      { len: 960, arch: { at: 140, w: 180, above: 300, h: 34 }, blocks: [{ at: 500, h: 60 }] },
      { len: 820, spikes: [{ at: 140, w: 68 }, { at: 360, w: 68 }, { at: 560, w: 56 }] },
      { len: 1600, stair: { at: 80, steps: 4, rise: 58 } },
      { len: 860, pit: { at: 200, w: 124 } },
      { len: 700, blocks: [{ at: 160, h: 70 }, { at: 340, h: 56 }, { at: 540, h: 64 }] }
    ] }
  ];
  DM.ADVENTURE = LEVELS;

  World.prototype.tick = function (dt, player) {
    this.time += dt;
    var i;
    for (i = 0; i < this.entities.length; i++) {
      if (this.entities[i].burnT > 0) this.entities[i].burnT -= dt;
    }
    this.ensureDecor(player ? player.x : this.cursor);
    this.extendRibbon(player);
    this.tickHunters(dt, player);
  };

  World.prototype.hunterSurface = function (x) {
    var ground = this.groundAt(x);
    var best = ground;
    var i;
    for (i = 0; i < this.entities.length; i++) {
      var e = this.entities[i];
      if (e.dead) continue;
      if (e.kind !== "step" && e.kind !== "block" && e.kind !== "platform" && e.kind !== "spike") continue;
      if (x < e.x + 2 || x > e.x + e.w - 2) continue;
      if (best == null || e.y < best) best = e.y;
    }
    return best;
  };

  World.prototype.tickHunters = function (dt, player) {
    if (this.mode !== "past" || !player || !player.onChicken) return;
    if (this.rexPhase === "show") return;
    var pace = Math.max(this.moveSpeed(player), DM.config.endlessBase);
    var i;
    for (i = 0; i < this.entities.length; i++) {
      var e = this.entities[i];
      if (e.dead || e.kind !== "hunter" || e.eaten) continue;
      var aim = player.x - e.w * 0.35;
      var gap = aim - e.x;
      var speed = pace * 0.88;
      if (gap > 0.5) e.x += speed * dt;
      else if (gap < -0.5) e.x -= speed * dt;
      e.dir = gap >= 0 ? 1 : -1;
      var surface = this.hunterSurface(e.x + e.w * 0.5);
      if (surface == null) {
        if (!e.hopping) {
          e.hopping = true;
          e.vy = -560;
        }
        e.vy += 1700 * dt;
        e.y += e.vy * dt;
        if (e.y > gy() - e.h) {
          e.y = gy() - e.h - 8;
          e.vy = -480;
        }
      } else {
        e.hopping = false;
        e.vy = 0;
        var target = surface - e.h;
        var climb = 640 * dt;
        if (e.y < target - climb) e.y += climb;
        else if (e.y > target + climb) e.y -= climb * 1.35;
        else e.y = target;
      }
      if (Math.abs(e.x - player.x) > 2100) e.dead = true;
    }
    this.hunterAcc = (this.hunterAcc || 0) + dt;
    if (this.hunterAcc >= 2) {
      this.hunterAcc -= 2;
      this.spawnHunter(player);
    }
    if (this.rexPhase === "chase") this.tickRex(dt, player);
  };

  World.prototype.spawnHunter = function (player) {
    this.hunterCount = (this.hunterCount || 0) + 1;
    var hx = player.x - 520 - (this.hunterCount % 4) * 42;
    var top = this.hunterSurface(hx + 18);
    this.spawn({
      kind: "hunter",
      x: hx,
      y: (top == null ? gy() : top) - 62,
      w: 36,
      h: 62,
      slot: this.hunterCount % 5,
      dir: 1,
      vy: 0,
      hopping: false,
      eaten: false,
      eatT: 0
    });
  };

  World.prototype.beginRex = function (player) {
    this.rexStarted = true;
    this.plains = true;
    this.rexPhase = "show";
    this.rexT = 0;
    this.rex = {
      kind: "rex",
      x: player.x - 1400,
      y: gy() - 340,
      w: 520,
      h: 340,
      dir: 1,
      vy: 0,
      bite: 0
    };
    this.decor = [];
    this.decorCursor = player.x - 500;
    this.ensureDecor(player.x);
  };

  World.prototype.tickRexShow = function (dt, player) {
    var rex = this.rex;
    if (!rex || !player) return;
    this.rexT += dt;
    var mouthX = rex.x + rex.w - 48;
    var target = null;
    var best = 1e9;
    var i;
    for (i = 0; i < this.entities.length; i++) {
      var e = this.entities[i];
      if (e.dead || e.kind !== "hunter" || e.eaten) continue;
      var dist = Math.abs((e.x + 18) - mouthX);
      if (dist < best) {
        best = dist;
        target = e;
      }
    }
    var dest = target ? target.x - rex.w + 70 : player.x - rex.w - 220;
    var limit = player.x - rex.w - 80;
    if (dest > limit) dest = limit;
    if (rex.x < dest) rex.x += 520 * dt;
    else if (rex.x > dest) rex.x -= 520 * dt;
    if (rex.bite > 0) rex.bite -= dt;
    if (target && Math.abs((rex.x + rex.w - 48) - (target.x + 18)) < 78 && rex.bite <= 0) {
      target.eaten = true;
      target.eatT = 0;
      rex.bite = 0.26;
    }
    for (i = 0; i < this.entities.length; i++) {
      var h = this.entities[i];
      if (h.dead || h.kind !== "hunter" || !h.eaten) continue;
      h.eatT += dt;
      h.x += (rex.x + rex.w - 70 - h.x) * Math.min(1, dt * 12);
      h.y += (rex.y + 86 - h.y) * Math.min(1, dt * 12);
      if (h.eatT > 0.3) h.dead = true;
    }
    if (this.rexT >= 7.4) {
      for (i = 0; i < this.entities.length; i++) {
        if (this.entities[i].kind === "hunter") this.entities[i].dead = true;
      }
      var park = player.x - rex.w - 210;
      rex.x += (park - rex.x) * Math.min(1, dt * 4);
    }
  };

  World.prototype.tickRex = function (dt, player) {
    var rex = this.rex;
    if (!rex || this.rexPhase !== "chase" || !player) return;
    var pace = Math.max(this.moveSpeed(player), DM.config.endlessBase);
    var mouth = rex.x + rex.w - 48;
    var gap = (player.x - 8) - mouth;
    var speed = pace * (Math.abs(gap) > 180 ? 1.28 : 1);
    if (gap > 0.5) rex.x += speed * dt;
    else if (gap < -0.5) rex.x -= speed * dt;
    rex.dir = gap >= 0 ? 1 : -1;
    var foot = rex.x + rex.w * 0.62;
    if (this.groundAt(foot) == null) {
      if (!rex.hopping) {
        rex.hopping = true;
        rex.vy = -620;
      }
      rex.vy += 1700 * dt;
      rex.y += rex.vy * dt;
      if (rex.y > gy() - rex.h) {
        rex.y = gy() - rex.h;
        rex.vy = -520;
      }
    } else {
      rex.hopping = false;
      rex.vy = 0;
      rex.y = gy() - rex.h;
    }
  };

  World.prototype.rexBox = function () {
    var rex = this.rex;
    if (!rex || this.rexPhase !== "chase") return null;
    return { x: rex.x + rex.w - 120, y: rex.y + 28, w: 130, h: 170 };
  };

  World.prototype.decorPool = function (x) {
    if (this.mode === "past" && this.plains) return ["herd", "herd", "herd", "grass", "herd", "grass"];
    if (this.mode === "past") return ["fern", "rock", "bone", "totem", "egg", "skull", "hut", "campfire", "spear"];
    var biome = DM.BIOMES[this.biomeIndexAt(x)];
    if (biome.id === "desert") return ["cactus", "scarab", "tent", "pot", "skull", "bush", "palm", "wagon", "vulture"];
    if (biome.id === "snow") return ["penguin", "igloo", "pine", "sled", "snowman", "fox", "cabin", "crystal"];
    if (biome.id === "city") return ["cat", "blimp", "lamp", "hydrant", "sign", "pigeon", "bench", "neon"];
    if (biome.id === "jungle") return ["parrot", "monkey", "flower", "frog", "totem", "bush", "mushroom", "vine", "toucan"];
    if (biome.id === "noel") return ["gift", "pine", "wreath", "cane", "bell", "snowman", "stocking", "lantern"];
    return ["martian", "satellite", "comet", "crater", "flag", "robot", "pod", "rover"];
  };

  World.prototype.makeDecor = function (x) {
    var pool = this.decorPool(x);
    var n = Math.floor(hash(x * 3.1) * pool.length);
    if (pool[n] === this.lastDecorKind) n = (n + 1 + Math.floor(hash(x + 2) * (pool.length - 1))) % pool.length;
    var kind = pool[n];
    this.lastDecorKind = kind;
    var biome = this.mode === "past" ? (this.plains ? DM.PLAINS_BIOME : DM.PAST_BIOME) : DM.BIOMES[this.biomeIndexAt(x)];
    return {
      kind: kind,
      x: x,
      phase: hash(x + 9),
      wave: hash(x + 4) > 0.42,
      biome: biome.id,
      scale: 0.66 + hash(x + 6) * 0.85,
      flip: hash(x + 8) > 0.5,
      vary: Math.floor(hash(x + 5) * 4),
      back: hash(x + 11) > 0.58
    };
  };

  World.prototype.ensureDecor = function (px) {
    var limit = px + 1900;
    if (!this.decorCursor) this.decorCursor = (this.startX || DM.config.startX) - 120;
    var guard = 0;
    while (this.decorCursor < limit && guard++ < 24) {
      this.decor.push(this.makeDecor(this.decorCursor + 36));
      if (hash(this.decorCursor + 1) > 0.58) {
        this.decor.push(this.makeDecor(this.decorCursor + 70 + Math.floor(hash(this.decorCursor + 4) * 40)));
      }
      this.decorCursor += 110 + Math.floor(hash(this.decorCursor + 3) * 150);
    }
    var minX = px - 1800;
    if (this.decor.length > 110) {
      this.decor = this.decor.filter(function (d) { return d.x > minX; });
    }
  };

  World.prototype.draw = function (ctx, cam, zoom, player) {
    var blend = this.biomeBlend(player);
    var biome = mixBiome(blend.a, blend.b, blend.t);
    var viewW = 1280 / zoom;
    var viewH = 720 / zoom;
    this.drawSky(ctx, biome, cam, viewW, viewH);
    if (blend.t > 0.02 && blend.a.id !== blend.b.id) {
      ctx.save();
      ctx.globalAlpha = 1 - blend.t;
      this.drawParallax(ctx, blend.a, cam, viewW, viewH);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = blend.t;
      this.drawParallax(ctx, blend.b, cam, viewW, viewH);
      ctx.restore();
    } else {
      this.drawParallax(ctx, blend.a, cam, viewW, viewH);
    }
    this.drawPits(ctx, biome, cam, viewW);
    this.drawGround(ctx, biome, cam, viewW);
    this.drawDecor(ctx, cam, viewW);
    this.drawEntities(ctx, biome, cam, viewW, viewH);
    if (this.rex) this.drawRex(ctx, this.rex);
    if (this.mode === "adventure" || this.mode === "tempo") this.drawFinish(ctx, biome);
    if (this.hasFire()) this.drawFireWall(ctx, cam, viewW, viewH);
  };

  World.prototype.drawFireWall = function (ctx, cam, viewW, viewH) {
    if (!this.hasFire() || this.waiting || this.fireX == null) return;
    var top = cam.y - 40;
    var height = viewH + 80;
    var left = cam.x - 60;
    var right = this.fireX;
    if (right <= left + 4) return;
    var wash = ctx.createLinearGradient(left, 0, right, 0);
    wash.addColorStop(0, "#4a0500");
    wash.addColorStop(0.35, "#9a1408");
    wash.addColorStop(0.72, "#e23a08");
    wash.addColorStop(1, "rgba(255, 150, 30, 0.2)");
    ctx.fillStyle = wash;
    ctx.fillRect(left, top, Math.max(0, right - left), height);
    var t = this.time * 11;
    var y;
    var x;
    for (x = left + 20; x < right - 24; x += 28) {
      var reach = 10 + Math.sin(t + x * 0.05) * 8;
      ctx.fillStyle = x > right - 80 ? "#ffb03a" : "#ff4a12";
      for (y = top; y < top + height; y += 22) {
        var n = Math.sin(t * 0.8 + y * 0.07 + x);
        ctx.beginPath();
        ctx.moveTo(x, y + 18);
        ctx.quadraticCurveTo(x + 8, y + 8, x + n * 4, y - reach);
        ctx.quadraticCurveTo(x + 16, y + 8, x + 18, y + 18);
        ctx.fill();
      }
    }
    for (y = top; y < top + height; y += 14) {
      var flick = 26 + Math.sin(t + y * 0.09) * 16;
      ctx.fillStyle = Math.sin(t * 0.7 + y) > 0 ? "#ffb03a" : "#ff3b12";
      ctx.beginPath();
      ctx.moveTo(right - 16, y);
      ctx.quadraticCurveTo(right + flick, y + 7, right - 8, y + 14);
      ctx.lineTo(right - 28, y + 14);
      ctx.fill();
      ctx.fillStyle = "#ffe38a";
      ctx.beginPath();
      ctx.moveTo(right - 18, y + 3);
      ctx.quadraticCurveTo(right + flick * 0.4, y + 7, right - 12, y + 12);
      ctx.fill();
    }
  };

  World.prototype.drawSky = function (ctx, biome, cam, viewW, viewH) {
    var g = ctx.createLinearGradient(0, cam.y, 0, cam.y + viewH);
    g.addColorStop(0, biome.sky[0]);
    g.addColorStop(1, biome.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(cam.x - 20, cam.y - 20, viewW + 40, viewH + 40);
  };

  World.prototype.drawParallax = function (ctx, biome, cam, viewW, viewH) {
    var base = gy() - 150;
    var x;
    ctx.save();
    if (biome.id === "desert") {
      ctx.fillStyle = "#ffd36a";
      ctx.beginPath();
      ctx.arc(cam.x + viewW * 0.78, cam.y + 90, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.arc(cam.x + viewW * 0.78 - 14, cam.y + 76, 28, 0, Math.PI * 2);
      ctx.fill();
      this.drawDunes(ctx, cam, viewW, base, 0.002, "#e39a52", 90);
      this.drawDunes(ctx, cam, viewW, base + 18, 0.004, "#f0b15a", 54);
    } else if (biome.id === "snow") {
      this.drawPeaks(ctx, cam, viewW, base + 10, 0.002, "#c5d7e8", 150);
      this.drawPeaks(ctx, cam, viewW, base + 36, 0.003, "#e7f1f8", 100);
      ctx.fillStyle = "#ffffff";
      var flake;
      for (flake = 0; flake < 36; flake++) {
        var fx = cam.x + ((flake * 97 + this.time * (0.22 + hash(flake) * 0.28)) % (viewW + 80)) - 20;
        var fy = cam.y + ((flake * 53 + this.time * 0.7) % viewH);
        ctx.globalAlpha = 0.3 + hash(flake) * 0.55;
        ctx.fillRect(fx, fy, hash(flake + 2) > 0.7 ? 3 : 2, hash(flake + 2) > 0.7 ? 3 : 2);
      }
      ctx.globalAlpha = 1;
    } else if (biome.id === "city") {
      this.drawSkyline(ctx, cam, viewW, base, 0.002, 0.55);
      this.drawSkyline(ctx, cam, viewW, base + 24, 0.003, 1);
    } else if (biome.id === "plains") {
      this.drawPlains(ctx, cam, viewW, viewH);
    } else if (biome.id === "past") {
      var slot = Math.floor(cam.x * 0.0015 / 280);
      ctx.fillStyle = hash(slot) > 0.55 ? "#e07a32" : "#f2c14e";
      ctx.beginPath();
      ctx.arc(cam.x + viewW * (0.62 + hash(slot + 3) * 0.2), cam.y + 86, 36 + hash(slot) * 16, 0, Math.PI * 2);
      ctx.fill();
      if (hash(slot + 8) > 0.4) {
        ctx.fillStyle = "#8d4b32";
        var volcano = farCursor(cam.x, 0.0015, 280);
        var vx = volcano.x;
        ctx.beginPath();
        ctx.moveTo(vx, base + 30);
        ctx.lineTo(vx + 70, base - 150);
        ctx.lineTo(vx + 150, base + 30);
        ctx.fill();
      }
      this.drawFernHills(ctx, cam, viewW, base, 0.0025, "#567832");
      this.drawFernHills(ctx, cam, viewW, base + 20, 0.004, "#6a8f3a");
    } else if (biome.id === "jungle") {
      this.drawCanopy(ctx, cam, viewW, base, 0.002, "#1e4d28", 1);
      this.drawCanopy(ctx, cam, viewW, base + 16, 0.003, "#2f6a32", 0);
    } else if (biome.id === "noel") {
      this.drawPeaks(ctx, cam, viewW, base + 16, 0.0015, "#c5d8ea", 130);
      this.drawPeaks(ctx, cam, viewW, base + 36, 0.0025, "#f7fbff", 80);
      this.drawGiftRow(ctx, cam, viewW, base + 6);
      this.drawSanta(ctx, cam, viewW);
      ctx.fillStyle = "#ffffff";
      var snow;
      for (snow = 0; snow < 54; snow++) {
        var sx = cam.x + ((snow * 83 + this.time * (0.2 + hash(snow) * 0.22)) % (viewW + 90)) - 24;
        var sy = cam.y + ((snow * 47 + this.time * 0.55) % viewH);
        ctx.globalAlpha = 0.35 + hash(snow + 1) * 0.55;
        ctx.beginPath();
        ctx.arc(sx, sy, hash(snow + 3) > 0.72 ? 2.4 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      var band = Math.floor(cam.x * 0.002 / 900);
      ctx.fillStyle = hash(band) > 0.5 ? "rgba(120,80,180,0.18)" : "rgba(40,80,160,0.16)";
      ctx.beginPath();
      ctx.ellipse(cam.x + viewW * 0.3, cam.y + 160, 220, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      var sx;
      ctx.fillStyle = "#ffffff";
      for (sx = 0; sx < 80; sx++) {
        var starU = band * 900 + hash(sx * 19 + band) * (viewW + 400) - 80;
        var starX = starU + cam.x - cam.x * 0.002;
        var starY = cam.y + hash(sx * 29) * viewH * 0.72;
        ctx.globalAlpha = 0.35 + hash(sx) * 0.65;
        ctx.fillRect(starX, starY, hash(sx + 4) > 0.82 ? 3 : 2, 2);
      }
      ctx.globalAlpha = 1;
      var moonX = cam.x + viewW * 0.78;
      var moonY = cam.y + 118;
      ctx.fillStyle = "#f4f0e4";
      ctx.beginPath();
      ctx.arc(moonX, moonY, 54, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d5cdb8";
      ctx.beginPath();
      ctx.arc(moonX - 18, moonY - 8, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(moonX + 16, moonY + 14, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(moonX + 8, moonY - 16, 3, 0, Math.PI * 2);
      ctx.fill();
      if (hash(band + 2) > 0.45) {
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(moonX + 30, moonY + 8, 78, 16, -0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  World.prototype.drawDunes = function (ctx, cam, viewW, base, speed, color, lift) {
    var span = 260;
    var cursor = farCursor(cam.x, speed, span);
    var x = cursor.x;
    var u = cursor.u;
    var end = cam.x + viewW + span * 2;
    ctx.fillStyle = color;
    while (x < end) {
      var w = 140 + hash(u) * 120;
      var h = lift + hash(u + 2) * 48;
      var style = Math.floor(hash(u + 5) * 3);
      ctx.beginPath();
      ctx.moveTo(x, base + 20);
      if (style === 0) ctx.quadraticCurveTo(x + w * 0.45, base - h, x + w, base + 20);
      else if (style === 1) {
        ctx.lineTo(x + w * 0.35, base - h * 0.45);
        ctx.quadraticCurveTo(x + w * 0.55, base - h, x + w, base + 20);
      } else {
        ctx.quadraticCurveTo(x + w * 0.2, base - h * 0.3, x + w * 0.5, base - h * 0.85);
        ctx.quadraticCurveTo(x + w * 0.75, base - h * 0.2, x + w, base + 20);
      }
      ctx.fill();
      var step = w * 0.72;
      x += step;
      u += step;
    }
  };

  World.prototype.drawPeaks = function (ctx, cam, viewW, base, speed, color, lift) {
    var span = 300;
    var cursor = farCursor(cam.x, speed, span);
    var x = cursor.x;
    var u = cursor.u;
    var end = cam.x + viewW + span * 2;
    ctx.fillStyle = color;
    while (x < end) {
      var w = 120 + hash(u) * 140;
      var h = lift * (0.55 + hash(u + 1) * 0.7);
      var style = Math.floor(hash(u + 4) * 3);
      ctx.beginPath();
      ctx.moveTo(x, base + 30);
      if (style === 2) {
        ctx.lineTo(x + w * 0.28, base - h * 0.55);
        ctx.lineTo(x + w * 0.48, base - h);
        ctx.lineTo(x + w * 0.7, base - h * 0.4);
      } else ctx.lineTo(x + w * (0.35 + hash(u + 6) * 0.2), base - h);
      ctx.lineTo(x + w, base + 30);
      ctx.fill();
      if (hash(u + 9) > 0.4) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(x + w * 0.38, base - h + 18);
        ctx.lineTo(x + w * 0.5, base - h);
        ctx.lineTo(x + w * 0.6, base - h + 16);
        ctx.fill();
        ctx.fillStyle = color;
      }
      var step = w * 0.78;
      x += step;
      u += step;
    }
  };

  World.prototype.drawSkyline = function (ctx, cam, viewW, base, speed, alpha) {
    var span = 420;
    var cursor = farCursor(cam.x, speed, span);
    var x = cursor.x;
    var u = cursor.u;
    var end = cam.x + viewW + span;
    ctx.globalAlpha = alpha;
    while (x < end) {
      var bw = 46 + hash(u) * 70;
      var bh = 70 + hash(u + 1) * 160;
      var style = Math.floor(hash(u + 3) * 4);
      ctx.fillStyle = hash(u + 1) > 0.5 ? "#24143f" : "#140c28";
      ctx.fillRect(x, base - bh, bw, bh + 50);
      if (style === 1) {
        ctx.fillRect(x + bw * 0.2, base - bh - 28, bw * 0.6, 28);
      } else if (style === 2) {
        ctx.fillRect(x + bw * 0.45, base - bh - 36, 4, 36);
        ctx.beginPath();
        ctx.arc(x + bw * 0.47, base - bh - 38, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === 3) {
        ctx.beginPath();
        ctx.moveTo(x, base - bh);
        ctx.lineTo(x + bw / 2, base - bh - 24);
        ctx.lineTo(x + bw, base - bh);
        ctx.fill();
      }
      ctx.fillStyle = hash(u + 2) > 0.5 ? "#ffd15c" : "#39f3ff";
      var wy;
      var gap = 14 + Math.floor(hash(u + 7) * 8);
      for (wy = base - bh + 10; wy < base - 16; wy += gap) {
        if (hash(u + wy) > 0.42) ctx.fillRect(x + 8, wy, 7, 7);
        if (hash(u * 2 + wy) > 0.5) ctx.fillRect(x + bw * 0.45, wy, 7, 7);
        if (bw > 70 && hash(u + wy + 4) > 0.55) ctx.fillRect(x + bw - 16, wy, 7, 7);
      }
      var step = bw + 8 + hash(u + 11) * 24;
      x += step;
      u += step;
    }
    ctx.globalAlpha = 1;
  };

  World.prototype.drawFernHills = function (ctx, cam, viewW, base, speed, color) {
    var span = 220;
    var cursor = farCursor(cam.x, speed, span);
    var x = cursor.x;
    var u = cursor.u;
    var end = cam.x + viewW + span * 2;
    ctx.fillStyle = color;
    while (x < end) {
      var w = 100 + hash(u) * 90;
      var h = 60 + hash(u + 2) * 70;
      ctx.beginPath();
      ctx.moveTo(x, base + 10);
      ctx.quadraticCurveTo(x + w * 0.25, base - h, x + w * 0.45, base - h * 0.2);
      ctx.quadraticCurveTo(x + w * 0.7, base - h * 0.85, x + w, base + 10);
      ctx.fill();
      var step = w * 0.7;
      x += step;
      u += step;
    }
  };

  World.prototype.drawCanopy = function (ctx, cam, viewW, base, speed, color, vines) {
    var span = 200;
    var cursor = farCursor(cam.x, speed, span);
    var x = cursor.x;
    var u = cursor.u;
    var end = cam.x + viewW + span * 2;
    while (x < end) {
      var kind = Math.floor(hash(u + 3) * 3);
      var h = 50 + hash(u) * 70;
      ctx.fillStyle = "#4a3018";
      ctx.fillRect(x + 18, base - 10, 8 + hash(u) * 6, 40);
      ctx.fillStyle = color;
      ctx.beginPath();
      if (kind === 0) ctx.arc(x + 24, base - h, 28 + hash(u + 1) * 22, 0, Math.PI * 2);
      else if (kind === 1) {
        ctx.moveTo(x, base - 20);
        ctx.quadraticCurveTo(x + 30, base - h - 20, x + 70, base - 20);
      } else {
        ctx.ellipse(x + 28, base - h * 0.7, 36, 22, 0, 0, Math.PI * 2);
      }
      ctx.fill();
      if (vines && hash(u + 6) > 0.45) {
        ctx.strokeStyle = "#214e28";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 20, base - h * 0.4);
        ctx.quadraticCurveTo(x + 10, base - 10, x + 24, base + 8);
        ctx.stroke();
      }
      var step = 90 + hash(u + 8) * 80;
      x += step;
      u += step;
    }
  };

  World.prototype.drawDecor = function (ctx, cam, viewW) {
    var pass;
    var t = this.time;
    for (pass = 0; pass < 2; pass++) {
      var i;
      for (i = 0; i < this.decor.length; i++) {
        var d = this.decor[i];
        if (pass === 0 && !d.back) continue;
        if (pass === 1 && d.back) continue;
        if (d.x < cam.x - 160 || d.x > cam.x + viewW + 200) continue;
        this.paintDecor(ctx, d, t, cam);
      }
    }
  };

  World.prototype.paintDecor = function (ctx, d, t, cam) {
    ctx.save();
      var lift = d.back ? 22 : 0;
      if (d.back) ctx.globalAlpha = 0.82;
      ctx.translate(d.x, gy() - lift);
      var flip = d.flip && d.kind !== "blimp" && d.kind !== "igloo" && d.kind !== "satellite" ? -1 : 1;
      var sc = (d.scale || 1) * (d.back ? 0.72 : 1);
      ctx.scale(flip * sc, sc);
      ctx.translate(-d.x, -gy());
      if (d.kind === "cactus") this.drawCactus(ctx, d);
      else if (d.kind === "scarab") this.drawScarab(ctx, d, t);
      else if (d.kind === "penguin") this.drawPenguin(ctx, d, t);
      else if (d.kind === "igloo") this.drawIgloo(ctx, d);
      else if (d.kind === "cat") this.drawCat(ctx, d, t);
      else if (d.kind === "blimp") this.drawBlimp(ctx, d, cam);
      else if (d.kind === "parrot") this.drawParrot(ctx, d, t);
      else if (d.kind === "monkey") this.drawMonkey(ctx, d, t);
      else if (d.kind === "fern") this.drawFern(ctx, d);
      else if (d.kind === "grass") this.drawGrass(ctx, d);
      else if (d.kind === "herd") this.drawHerdDecor(ctx, d, t);
      else if (d.kind === "rock") this.drawRock(ctx, d);
      else if (d.kind === "tent") this.drawTent(ctx, d);
      else if (d.kind === "pot") this.drawPot(ctx, d);
      else if (d.kind === "skull") this.drawSkull(ctx, d);
      else if (d.kind === "bush") this.drawBush(ctx, d);
      else if (d.kind === "pine") this.drawPine(ctx, d);
      else if (d.kind === "sled") this.drawSled(ctx, d);
      else if (d.kind === "snowman") this.drawSnowman(ctx, d);
      else if (d.kind === "fox") this.drawFox(ctx, d, t);
      else if (d.kind === "lamp") this.drawLamp(ctx, d);
      else if (d.kind === "hydrant") this.drawHydrant(ctx, d);
      else if (d.kind === "sign") this.drawSign(ctx, d);
      else if (d.kind === "pigeon") this.drawPigeon(ctx, d, t);
      else if (d.kind === "flower") this.drawFlower(ctx, d);
      else if (d.kind === "frog") this.drawFrog(ctx, d, t);
      else if (d.kind === "totem") this.drawTotem(ctx, d);
      else if (d.kind === "bone") this.drawBone(ctx, d);
      else if (d.kind === "egg") this.drawEgg(ctx, d);
      else if (d.kind === "satellite") this.drawSatellite(ctx, d, t);
      else if (d.kind === "comet") this.drawComet(ctx, d);
      else if (d.kind === "crater") this.drawCrater(ctx, d);
      else if (d.kind === "flag") this.drawFlag(ctx, d, t);
      else if (d.kind === "robot") this.drawRobotDecor(ctx, d, t);
      else if (d.kind === "palm") this.drawPalm(ctx, d, t);
      else if (d.kind === "wagon") this.drawWagon(ctx, d);
      else if (d.kind === "vulture") this.drawVulture(ctx, d, t);
      else if (d.kind === "cabin") this.drawCabin(ctx, d);
      else if (d.kind === "crystal") this.drawCrystal(ctx, d);
      else if (d.kind === "bench") this.drawBench(ctx, d);
      else if (d.kind === "neon") this.drawNeon(ctx, d, t);
      else if (d.kind === "mushroom") this.drawMushroom(ctx, d);
      else if (d.kind === "vine") this.drawVine(ctx, d);
      else if (d.kind === "toucan") this.drawToucan(ctx, d, t);
      else if (d.kind === "pod") this.drawPod(ctx, d);
      else if (d.kind === "rover") this.drawRover(ctx, d);
      else if (d.kind === "hut") this.drawHut(ctx, d);
      else if (d.kind === "campfire") this.drawCampfire(ctx, d, t);
      else if (d.kind === "spear") this.drawSpear(ctx, d);
      else if (d.kind === "gift") this.drawGift(ctx, d);
      else if (d.kind === "wreath") this.drawWreath(ctx, d);
      else if (d.kind === "cane") this.drawCane(ctx, d);
      else if (d.kind === "bell") this.drawBell(ctx, d, t);
      else if (d.kind === "stocking") this.drawStocking(ctx, d);
      else if (d.kind === "lantern") this.drawLantern(ctx, d, t);
      else this.drawMartian(ctx, d, t);
    ctx.restore();
  };

  World.prototype.drawPalm = function (ctx, d, t) {
    var sway = Math.sin(t * 1.4 + d.phase * 6) * 5;
    ctx.strokeStyle = "#8a5a32";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(d.x, gy());
    ctx.quadraticCurveTo(d.x + 10, gy() - 36, d.x + sway, gy() - 78);
    ctx.stroke();
    ctx.fillStyle = d.vary % 2 ? "#217a3a" : "#3aaa55";
    var i;
    for (i = 0; i < 5; i++) {
      var a = -2.4 + i * 0.95;
      ctx.beginPath();
      ctx.ellipse(d.x + sway + Math.cos(a) * 18, gy() - 78 + Math.sin(a) * 10, 16, 5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#e07a12";
    ctx.beginPath();
    ctx.arc(d.x + sway + 6, gy() - 70, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawWagon = function (ctx, d) {
    ctx.fillStyle = "#8d4a2a";
    ctx.fillRect(d.x - 18, gy() - 28, 36, 16);
    ctx.fillStyle = "#e7c07a";
    ctx.beginPath();
    ctx.moveTo(d.x - 16, gy() - 28);
    ctx.lineTo(d.x, gy() - 44);
    ctx.lineTo(d.x + 16, gy() - 28);
    ctx.fill();
    ctx.fillStyle = "#2a2118";
    ctx.beginPath();
    ctx.arc(d.x - 10, gy() - 6, 6, 0, Math.PI * 2);
    ctx.arc(d.x + 12, gy() - 6, 6, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawVulture = function (ctx, d, t) {
    var y = gy() - 70 - d.vary * 8 + Math.sin(t * 2 + d.phase) * 6;
    var wing = Math.sin(t * 4 + d.phase * 5) * 10;
    ctx.fillStyle = "#3a2a28";
    ctx.beginPath();
    ctx.moveTo(d.x, y);
    ctx.lineTo(d.x - 22, y - 6 + wing);
    ctx.lineTo(d.x - 8, y + 2);
    ctx.lineTo(d.x + 8, y + 2);
    ctx.lineTo(d.x + 22, y - 6 - wing);
    ctx.fill();
    ctx.fillStyle = "#e07a12";
    ctx.beginPath();
    ctx.moveTo(d.x + 6, y);
    ctx.lineTo(d.x + 16, y + 2);
    ctx.lineTo(d.x + 6, y + 4);
    ctx.fill();
  };

  World.prototype.drawCabin = function (ctx, d) {
    ctx.fillStyle = "#6d442c";
    ctx.fillRect(d.x - 20, gy() - 36, 40, 36);
    ctx.fillStyle = "#a33b32";
    ctx.beginPath();
    ctx.moveTo(d.x - 26, gy() - 34);
    ctx.lineTo(d.x, gy() - 58);
    ctx.lineTo(d.x + 26, gy() - 34);
    ctx.fill();
    ctx.fillStyle = "#f4e2b0";
    ctx.fillRect(d.x - 6, gy() - 22, 12, 22);
    ctx.fillStyle = "#9fd7ff";
    ctx.fillRect(d.x - 16, gy() - 30, 8, 8);
  };

  World.prototype.drawCrystal = function (ctx, d) {
    var h = 28 + d.vary * 10;
    ctx.fillStyle = d.biome === "space" ? "#9eb6ff" : "#bfe9ff";
    ctx.beginPath();
    ctx.moveTo(d.x, gy() - h);
    ctx.lineTo(d.x + 10, gy());
    ctx.lineTo(d.x - 10, gy());
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.moveTo(d.x - 2, gy() - h + 8);
    ctx.lineTo(d.x + 2, gy() - 8);
    ctx.lineTo(d.x - 4, gy() - 8);
    ctx.fill();
  };

  World.prototype.drawBench = function (ctx, d) {
    ctx.fillStyle = "#6b5344";
    ctx.fillRect(d.x - 16, gy() - 16, 32, 4);
    ctx.fillRect(d.x - 18, gy() - 28, 36, 4);
    ctx.fillRect(d.x - 14, gy() - 16, 3, 16);
    ctx.fillRect(d.x + 11, gy() - 16, 3, 16);
  };

  World.prototype.drawNeon = function (ctx, d, t) {
    var glow = 0.55 + Math.sin(t * 5 + d.phase * 8) * 0.35;
    ctx.globalAlpha = glow;
    ctx.fillStyle = d.vary % 2 ? "#ff4ad8" : "#39f3ff";
    ctx.fillRect(d.x - 14, gy() - 46, 28, 14);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#1a1030";
    ctx.fillRect(d.x - 2, gy() - 32, 4, 32);
  };

  World.prototype.drawMushroom = function (ctx, d) {
    ctx.fillStyle = "#f4f0e4";
    ctx.fillRect(d.x - 4, gy() - 18, 8, 18);
    ctx.fillStyle = d.vary % 2 ? "#e23b4a" : "#ff8a3a";
    ctx.beginPath();
    ctx.ellipse(d.x, gy() - 22, 16 + d.vary * 2, 10, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#fff6d8";
    ctx.beginPath();
    ctx.arc(d.x - 6, gy() - 26, 2, 0, Math.PI * 2);
    ctx.arc(d.x + 5, gy() - 24, 2.5, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawVine = function (ctx, d) {
    ctx.strokeStyle = "#2f8a45";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(d.x, gy() - 4);
    ctx.quadraticCurveTo(d.x + 8, gy() - 30, d.x - 4, gy() - 58);
    ctx.stroke();
    ctx.fillStyle = "#6dce62";
    ctx.beginPath();
    ctx.ellipse(d.x - 6, gy() - 40, 7, 3, -0.6, 0, Math.PI * 2);
    ctx.ellipse(d.x + 6, gy() - 24, 7, 3, 0.5, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawToucan = function (ctx, d, t) {
    var bob = Math.sin(t * 3 + d.phase) * 2;
    ctx.fillStyle = "#1c1a17";
    ctx.beginPath();
    ctx.ellipse(d.x, gy() - 22 + bob, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4c430";
    ctx.beginPath();
    ctx.moveTo(d.x + 6, gy() - 24 + bob);
    ctx.lineTo(d.x + 28, gy() - 20 + bob);
    ctx.lineTo(d.x + 6, gy() - 16 + bob);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(d.x + 2, gy() - 26 + bob, 3, 3);
  };

  World.prototype.drawPod = function (ctx, d) {
    ctx.fillStyle = "#d5def5";
    ctx.beginPath();
    ctx.ellipse(d.x, gy() - 16, 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#39f3ff";
    ctx.fillRect(d.x - 4, gy() - 18, 8, 6);
    ctx.fillStyle = "#9aa3ad";
    ctx.fillRect(d.x - 8, gy() - 4, 16, 4);
  };

  World.prototype.drawRover = function (ctx, d) {
    ctx.fillStyle = "#c2ccd6";
    ctx.fillRect(d.x - 16, gy() - 18, 32, 10);
    ctx.fillStyle = "#3ee0c2";
    ctx.fillRect(d.x - 4, gy() - 24, 10, 6);
    ctx.fillStyle = "#2a2118";
    ctx.beginPath();
    ctx.arc(d.x - 10, gy() - 5, 5, 0, Math.PI * 2);
    ctx.arc(d.x + 10, gy() - 5, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawHut = function (ctx, d) {
    ctx.fillStyle = "#c4a15a";
    ctx.beginPath();
    ctx.moveTo(d.x, gy() - 48);
    ctx.lineTo(d.x + 26, gy());
    ctx.lineTo(d.x - 26, gy());
    ctx.fill();
    ctx.fillStyle = "#6b4428";
    ctx.fillRect(d.x - 6, gy() - 16, 12, 16);
  };

  World.prototype.drawCampfire = function (ctx, d, t) {
    ctx.strokeStyle = "#6b4428";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(d.x - 8, gy() - 2);
    ctx.lineTo(d.x + 8, gy() - 14);
    ctx.moveTo(d.x + 8, gy() - 2);
    ctx.lineTo(d.x - 8, gy() - 14);
    ctx.stroke();
    var h = 16 + Math.sin(t * 8 + d.phase) * 6;
    ctx.fillStyle = "#ffb703";
    ctx.beginPath();
    ctx.moveTo(d.x - 6, gy() - 10);
    ctx.quadraticCurveTo(d.x, gy() - 10 - h, d.x + 6, gy() - 10);
    ctx.fill();
  };

  World.prototype.drawSpear = function (ctx, d) {
    ctx.strokeStyle = "#8a5a32";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(d.x, gy());
    ctx.lineTo(d.x + 4, gy() - 46);
    ctx.stroke();
    ctx.fillStyle = "#d9d3c7";
    ctx.beginPath();
    ctx.moveTo(d.x + 4, gy() - 46);
    ctx.lineTo(d.x + 12, gy() - 36);
    ctx.lineTo(d.x - 2, gy() - 36);
    ctx.fill();
  };

  World.prototype.drawCactus = function (ctx, d) {
    ctx.fillStyle = "#3f8f45";
    ctx.fillRect(d.x, gy() - 54, 10, 54);
    ctx.fillRect(d.x - 14, gy() - 40, 14, 8);
    ctx.fillRect(d.x - 14, gy() - 52, 8, 14);
    ctx.fillRect(d.x + 10, gy() - 34, 14, 8);
    ctx.fillRect(d.x + 16, gy() - 46, 8, 14);
  };

  World.prototype.drawScarab = function (ctx, d, t) {
    var x = d.x + Math.sin(t * 1.4 + d.phase * 6) * 18;
    ctx.fillStyle = "#1c1a17";
    ctx.beginPath();
    ctx.ellipse(x, gy() - 8, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b4a2a";
    ctx.fillRect(x - 12, gy() - 6, 4, 3);
    ctx.fillRect(x + 8, gy() - 6, 4, 3);
  };

  World.prototype.drawPenguin = function (ctx, d, t) {
    var bob = Math.abs(Math.sin(t * 3 + d.phase * 8)) * 4;
    var x = d.x + Math.sin(t * 1.2 + d.phase) * 10;
    ctx.fillStyle = "#1d2430";
    ctx.beginPath();
    ctx.ellipse(x, gy() - 16 - bob, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4f7fb";
    ctx.beginPath();
    ctx.ellipse(x, gy() - 12 - bob, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f2b134";
    ctx.beginPath();
    ctx.moveTo(x + 8, gy() - 20 - bob);
    ctx.lineTo(x + 16, gy() - 18 - bob);
    ctx.lineTo(x + 8, gy() - 16 - bob);
    ctx.fill();
  };

  World.prototype.drawIgloo = function (ctx, d) {
    ctx.fillStyle = "#f7fbff";
    ctx.beginPath();
    ctx.arc(d.x, gy(), 28, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#d5e4f2";
    ctx.fillRect(d.x - 8, gy() - 16, 16, 16);
  };

  World.prototype.drawCat = function (ctx, d, t) {
    var y = gy() - 92;
    var tail = Math.sin(t * 2 + d.phase * 5) * 6;
    ctx.fillStyle = "#f2a65a";
    ctx.fillRect(d.x, y, 22, 12);
    ctx.beginPath();
    ctx.arc(d.x + 18, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(d.x + 14, y - 8, 3, 6);
    ctx.fillRect(d.x + 20, y - 8, 3, 6);
    ctx.strokeStyle = "#f2a65a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(d.x, y + 4);
    ctx.quadraticCurveTo(d.x - 10, y + tail, d.x - 6, y - 8);
    ctx.stroke();
  };

  World.prototype.drawBlimp = function (ctx, d, cam) {
    var x = cam.x * 0.012 + d.x * 0.025;
    var y = 150 + d.phase * 40;
    ctx.fillStyle = "#c9b6ff";
    ctx.beginPath();
    ctx.ellipse(x, y, 36, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#39f3ff";
    ctx.fillRect(x - 6, y + 14, 12, 6);
  };

  World.prototype.drawParrot = function (ctx, d, t) {
    var x = d.x + Math.sin(t * 1.3 + d.phase) * 26;
    var y = 210 + Math.sin(t * 2.2 + d.phase * 4) * 28;
    ctx.fillStyle = "#ef4b4b";
    ctx.beginPath();
    ctx.ellipse(x, y, 12, 7, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f2c14e";
    ctx.beginPath();
    ctx.arc(x + 10, y - 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3ecf8e";
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x - 18, y - 8);
    ctx.lineTo(x - 6, y + 2);
    ctx.fill();
  };

  World.prototype.drawMonkey = function (ctx, d, t) {
    var swing = Math.sin(t * 1.6 + d.phase * 5);
    var x = d.x + swing * 22;
    var y = 250 + Math.cos(t * 1.6 + d.phase * 5) * 18;
    ctx.strokeStyle = "#6a4a2a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(d.x, 160);
    ctx.lineTo(x, y - 10);
    ctx.stroke();
    ctx.fillStyle = "#8a5a32";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0c9a0";
    ctx.beginPath();
    ctx.arc(x + 3, y - 1, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawGiftRow = function (ctx, cam, viewW, base) {
    var span = 340;
    var cursor = farCursor(cam.x, 0.002, span);
    var x = cursor.x;
    var u = cursor.u;
    var end = cam.x + viewW + span;
    while (x < end) {
      var w = 22 + hash(u) * 16;
      var h = 18 + hash(u + 2) * 14;
      var color = hash(u + 4) > 0.5 ? "#d23b4a" : (hash(u + 6) > 0.5 ? "#2f6fad" : "#3d8f4a");
      ctx.fillStyle = color;
      ctx.fillRect(x, base - h, w, h);
      ctx.fillStyle = "#f0c14a";
      ctx.fillRect(x, base - h * 0.55, w, 4);
      ctx.fillRect(x + w * 0.42, base - h, 4, h);
      ctx.beginPath();
      ctx.arc(x + w * 0.4, base - h - 3, 4, 0, Math.PI * 2);
      ctx.arc(x + w * 0.58, base - h - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      var step = 70 + hash(u + 8) * 50;
      x += step;
      u += step;
    }
  };

  World.prototype.drawSanta = function (ctx, cam, viewW) {
    var span = viewW * 0.85;
    var shift = (cam.x * 0.0012) % span;
    var x = cam.x - shift + viewW * 0.72;
    var y = cam.y + 188;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.8, 1.8);
    ctx.translate(-x, -y);
    ctx.fillStyle = "#8a5a32";
    ctx.fillRect(x - 78, y + 8, 22, 10);
    ctx.fillRect(x - 48, y + 8, 22, 10);
    ctx.strokeStyle = "#5a3a22";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 70, y + 2);
    ctx.lineTo(x - 78, y - 10);
    ctx.moveTo(x - 62, y + 2);
    ctx.lineTo(x - 56, y - 12);
    ctx.moveTo(x - 40, y + 2);
    ctx.lineTo(x - 48, y - 10);
    ctx.moveTo(x - 30, y + 2);
    ctx.lineTo(x - 22, y - 12);
    ctx.stroke();
    ctx.strokeStyle = "#c23b3b";
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 10);
    ctx.lineTo(x - 70, y + 6);
    ctx.stroke();
    ctx.fillStyle = "#d23b4a";
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 16);
    ctx.lineTo(x + 54, y + 16);
    ctx.quadraticCurveTo(x + 62, y + 4, x + 36, y - 2);
    ctx.lineTo(x - 8, y + 2);
    ctx.fill();
    ctx.fillStyle = "#f4c07a";
    ctx.fillRect(x + 8, y - 2, 28, 8);
    ctx.fillStyle = "#d23b4a";
    ctx.beginPath();
    ctx.arc(x + 28, y - 16, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 16, y - 10, 18, 5);
    ctx.beginPath();
    ctx.moveTo(x + 20, y - 24);
    ctx.lineTo(x + 36, y - 22);
    ctx.lineTo(x + 28, y - 12);
    ctx.fill();
    ctx.fillStyle = "#f7f7f7";
    ctx.beginPath();
    ctx.arc(x + 36, y - 22, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1b140c";
    ctx.fillRect(x + 24, y - 18, 2, 2);
    ctx.restore();
  };

  World.prototype.drawGift = function (ctx, d) {
    var w = 26 + (d.vary || 0) * 4;
    var h = 20 + (d.vary || 0) * 3;
    var color = d.vary % 3 === 0 ? "#d23b4a" : (d.vary % 3 === 1 ? "#2f6fad" : "#3d8f4a");
    ctx.fillStyle = color;
    ctx.fillRect(d.x - w / 2, gy() - h, w, h);
    ctx.fillStyle = "#f0c14a";
    ctx.fillRect(d.x - w / 2, gy() - h * 0.58, w, 4);
    ctx.fillRect(d.x - 2, gy() - h, 4, h);
    ctx.beginPath();
    ctx.arc(d.x - 5, gy() - h - 2, 4, 0, Math.PI * 2);
    ctx.arc(d.x + 5, gy() - h - 2, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawWreath = function (ctx, d) {
    ctx.strokeStyle = "#2f7a3a";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(d.x, gy() - 28, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#d23b4a";
    ctx.beginPath();
    ctx.arc(d.x, gy() - 14, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawCane = function (ctx, d) {
    ctx.strokeStyle = "#f7f7f7";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(d.x, gy() - 48, 10, Math.PI, 0);
    ctx.lineTo(d.x + 10, gy() - 4);
    ctx.stroke();
    ctx.strokeStyle = "#d23b4a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(d.x, gy() - 48, 10, Math.PI * 1.15, Math.PI * 1.7);
    ctx.stroke();
  };

  World.prototype.drawBell = function (ctx, d, t) {
    var swing = Math.sin(t * 2 + d.phase * 6) * 0.15;
    ctx.save();
    ctx.translate(d.x, gy() - 46);
    ctx.rotate(swing);
    ctx.fillStyle = "#f0c14a";
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.quadraticCurveTo(-12, 10, 0, 12);
    ctx.quadraticCurveTo(12, 10, 10, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8a6a12";
    ctx.beginPath();
    ctx.arc(0, 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  World.prototype.drawStocking = function (ctx, d) {
    ctx.fillStyle = "#d23b4a";
    ctx.fillRect(d.x - 8, gy() - 36, 14, 22);
    ctx.beginPath();
    ctx.arc(d.x + 4, gy() - 14, 8, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(d.x - 8, gy() - 40, 14, 6);
  };

  World.prototype.drawLantern = function (ctx, d, t) {
    ctx.strokeStyle = "#3a2a22";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(d.x, gy());
    ctx.lineTo(d.x, gy() - 52);
    ctx.stroke();
    ctx.fillStyle = "#f0c14a";
    ctx.fillRect(d.x + 4, gy() - 46, 14, 16);
    ctx.fillStyle = "rgba(255, 220, 120, " + (0.35 + Math.sin(t * 3 + d.phase) * 0.15) + ")";
    ctx.beginPath();
    ctx.arc(d.x + 11, gy() - 38, 16, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawMartian = function (ctx, d, t) {
    var u = (t * 0.42 + d.phase) % 1;
    var hop = Math.sin(u * Math.PI);
    var y = gy() - 18 - hop * 86;
    var x = d.x;
    ctx.fillStyle = "#dfe7ea";
    ctx.fillRect(x - 8, y - 4, 16, 18);
    ctx.fillStyle = "#b7c4c8";
    ctx.fillRect(x + 6, y, 5, 8);
    ctx.fillStyle = "#7CFF6B";
    ctx.beginPath();
    ctx.arc(x, y - 12, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(190, 255, 210, 0.45)";
    ctx.beginPath();
    ctx.arc(x, y - 12, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#16301c";
    ctx.fillRect(x - 3, y - 14, 2, 2);
    ctx.fillRect(x + 2, y - 14, 2, 2);
    ctx.strokeStyle = "#dfe7ea";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 2);
    if (d.wave) {
      var wave = Math.sin(t * 6 + d.phase * 4) * 8;
      ctx.lineTo(x - 16, y - 10 + wave);
    } else {
      ctx.lineTo(x - 14, y + 8);
    }
    ctx.moveTo(x + 8, y + 2);
    ctx.lineTo(x + 14, y + 8);
    var leg = 10 + hop * 4;
    ctx.moveTo(x - 3, y + 14);
    ctx.lineTo(x - 6, y + 14 + leg);
    ctx.moveTo(x + 3, y + 14);
    ctx.lineTo(x + 7, y + 14 + leg);
    ctx.stroke();
  };

  World.prototype.drawPits = function (ctx, biome, cam, viewW) {
    var depth = DM.config.pitDepth;
    var floor = gy() + depth;
    var i;
    for (i = 0; i < this.pits.length; i++) {
      var p = this.pits[i];
      if (p.x + p.w < cam.x - 40 || p.x > cam.x + viewW + 40) continue;
      ctx.fillStyle = biome.deep;
      ctx.fillRect(p.x, floor, p.w, 420);
      ctx.fillStyle = biome.pit;
      ctx.fillRect(p.x + 12, gy(), p.w - 24, depth - 8);
      ctx.fillStyle = biome.ground;
      ctx.fillRect(p.x, gy(), 14, depth);
      ctx.fillRect(p.x + p.w - 14, gy(), 14, depth);
      ctx.fillRect(p.x, floor - 12, p.w, 18);
      if (p.spiked === false) {
        ctx.fillStyle = "#1a140e";
        ctx.fillRect(p.x + 16, gy() + 8, p.w - 32, depth - 16);
      } else {
      ctx.fillStyle = biome.ink;
      var sx;
      for (sx = p.x + 16; sx < p.x + p.w - 18; sx += 16) {
        ctx.beginPath();
        ctx.moveTo(sx, floor - 8);
        ctx.lineTo(sx + 8, floor - 34);
        ctx.lineTo(sx + 16, floor - 8);
        ctx.fill();
      }
      }
    }
  };

  World.prototype.drawFern = function (ctx, d) {
    ctx.fillStyle = "#3f6b28";
    ctx.fillRect(d.x, gy() - 36, 4, 36);
    ctx.beginPath();
    ctx.ellipse(d.x - 8, gy() - 28, 12, 5, -0.6, 0, Math.PI * 2);
    ctx.ellipse(d.x + 10, gy() - 22, 12, 5, 0.5, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawRock = function (ctx, d) {
    ctx.fillStyle = d.vary === 1 ? "#6e6258" : "#8d8070";
    ctx.beginPath();
    ctx.ellipse(d.x, gy() - 8, 14 + d.vary * 4, 7 + d.vary, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawTent = function (ctx, d) {
    ctx.fillStyle = d.vary === 2 ? "#c4563a" : "#e07a3a";
    ctx.beginPath();
    ctx.moveTo(d.x - 22, gy());
    ctx.lineTo(d.x, gy() - 36 - d.vary * 6);
    ctx.lineTo(d.x + 22, gy());
    ctx.fill();
    ctx.fillStyle = "#6a3414";
    ctx.fillRect(d.x - 4, gy() - 16, 8, 16);
  };

  World.prototype.drawPot = function (ctx, d) {
    ctx.fillStyle = "#b5522a";
    ctx.beginPath();
    ctx.moveTo(d.x - 8, gy() - 18);
    ctx.lineTo(d.x - 12, gy());
    ctx.lineTo(d.x + 12, gy());
    ctx.lineTo(d.x + 8, gy() - 18);
    ctx.fill();
    ctx.fillStyle = "#3f8f45";
    ctx.beginPath();
    ctx.ellipse(d.x, gy() - 22, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawSkull = function (ctx, d) {
    ctx.fillStyle = "#f4efe4";
    ctx.beginPath();
    ctx.arc(d.x, gy() - 12, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a2118";
    ctx.fillRect(d.x - 4, gy() - 14, 2, 2);
    ctx.fillRect(d.x + 2, gy() - 14, 2, 2);
  };

  World.prototype.drawBush = function (ctx, d) {
    ctx.fillStyle = d.vary === 0 ? "#3f8f45" : "#6ea84a";
    ctx.beginPath();
    ctx.arc(d.x - 8, gy() - 10, 10, 0, Math.PI * 2);
    ctx.arc(d.x + 8, gy() - 8, 12, 0, Math.PI * 2);
    ctx.arc(d.x, gy() - 16, 9, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawPine = function (ctx, d) {
    var h = 48 + d.vary * 16;
    ctx.fillStyle = "#2f6a38";
    ctx.beginPath();
    ctx.moveTo(d.x, gy() - h);
    ctx.lineTo(d.x - 16, gy() - 16);
    ctx.lineTo(d.x + 16, gy() - 16);
    ctx.fill();
    ctx.fillStyle = "#6b4428";
    ctx.fillRect(d.x - 3, gy() - 16, 6, 16);
  };

  World.prototype.drawSled = function (ctx, d) {
    ctx.strokeStyle = "#8d3b2a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(d.x - 16, gy() - 4);
    ctx.quadraticCurveTo(d.x, gy() - 10, d.x + 18, gy() - 4);
    ctx.stroke();
    ctx.fillStyle = "#d4533a";
    ctx.fillRect(d.x - 10, gy() - 14, 20, 8);
  };

  World.prototype.drawSnowman = function (ctx, d) {
    ctx.fillStyle = "#f7fbff";
    ctx.beginPath();
    ctx.arc(d.x, gy() - 10, 10, 0, Math.PI * 2);
    ctx.arc(d.x, gy() - 24, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e07a12";
    ctx.fillRect(d.x + 4, gy() - 26, 8, 2);
  };

  World.prototype.drawFox = function (ctx, d, t) {
    var x = d.x + Math.sin(t * 1.5 + d.phase) * 8;
    ctx.fillStyle = "#e07a22";
    ctx.beginPath();
    ctx.ellipse(x, gy() - 10, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 8, gy() - 14);
    ctx.lineTo(x + 14, gy() - 22);
    ctx.lineTo(x + 16, gy() - 12);
    ctx.fill();
  };

  World.prototype.drawLamp = function (ctx, d) {
    ctx.fillStyle = "#2a2140";
    ctx.fillRect(d.x - 2, gy() - 48, 4, 48);
    ctx.fillStyle = d.vary === 1 ? "#ff4ad8" : "#ffe08a";
    ctx.beginPath();
    ctx.arc(d.x, gy() - 54, 7, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawHydrant = function (ctx, d) {
    ctx.fillStyle = "#d23b4a";
    ctx.fillRect(d.x - 5, gy() - 22, 10, 22);
    ctx.fillRect(d.x - 10, gy() - 16, 20, 5);
  };

  World.prototype.drawSign = function (ctx, d) {
    ctx.fillStyle = "#3e5164";
    ctx.fillRect(d.x - 2, gy() - 40, 4, 40);
    ctx.fillStyle = d.vary === 2 ? "#39f3ff" : "#ffbf1f";
    ctx.fillRect(d.x - 14, gy() - 48, 28, 14);
  };

  World.prototype.drawPigeon = function (ctx, d, t) {
    var y = gy() - 16 - Math.abs(Math.sin(t * 2 + d.phase * 5)) * 10;
    ctx.fillStyle = "#d9d3ea";
    ctx.beginPath();
    ctx.ellipse(d.x, y, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a7ca8";
    ctx.beginPath();
    ctx.ellipse(d.x - 6, y - 2, 6, 3, -0.4, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawFlower = function (ctx, d) {
    var colors = ["#ff5d73", "#ffd166", "#c56bff"];
    ctx.strokeStyle = "#3f8f45";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(d.x, gy());
    ctx.lineTo(d.x, gy() - 22);
    ctx.stroke();
    ctx.fillStyle = colors[d.vary] || colors[0];
    ctx.beginPath();
    ctx.arc(d.x, gy() - 26, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe08a";
    ctx.beginPath();
    ctx.arc(d.x, gy() - 26, 2, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawFrog = function (ctx, d, t) {
    var hop = Math.abs(Math.sin(t * 3 + d.phase * 4)) * 8;
    ctx.fillStyle = "#7CFF6B";
    ctx.beginPath();
    ctx.ellipse(d.x, gy() - 8 - hop, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#16301c";
    ctx.fillRect(d.x - 4, gy() - 12 - hop, 2, 2);
    ctx.fillRect(d.x + 2, gy() - 12 - hop, 2, 2);
  };

  World.prototype.drawTotem = function (ctx, d) {
    ctx.fillStyle = "#6b4428";
    ctx.fillRect(d.x - 8, gy() - 46, 16, 46);
    ctx.fillStyle = "#e6c36a";
    ctx.fillRect(d.x - 6, gy() - 40, 12, 10);
    ctx.fillRect(d.x - 6, gy() - 24, 12, 10);
  };

  World.prototype.drawBone = function (ctx, d) {
    ctx.strokeStyle = "#f4efe4";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(d.x - 12, gy() - 6);
    ctx.lineTo(d.x + 12, gy() - 12);
    ctx.stroke();
    ctx.fillStyle = "#f4efe4";
    ctx.beginPath();
    ctx.arc(d.x - 12, gy() - 6, 4, 0, Math.PI * 2);
    ctx.arc(d.x + 12, gy() - 12, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawEgg = function (ctx, d) {
    ctx.fillStyle = d.vary === 1 ? "#d7c4a3" : "#f6efe2";
    ctx.beginPath();
    ctx.ellipse(d.x, gy() - 10, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawSatellite = function (ctx, d, t) {
    var y = gy() - 150 - d.vary * 24 + Math.sin(t + d.phase) * 6;
    ctx.fillStyle = "#d5def5";
    ctx.fillRect(d.x - 6, y - 4, 12, 8);
    ctx.fillStyle = "#39f3ff";
    ctx.fillRect(d.x - 18, y - 2, 10, 4);
    ctx.fillRect(d.x + 8, y - 2, 10, 4);
  };

  World.prototype.drawComet = function (ctx, d) {
    var y = gy() - 180 - d.vary * 20;
    ctx.fillStyle = "#f4f0e4";
    ctx.beginPath();
    ctx.arc(d.x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(244, 240, 228, 0.45)";
    ctx.beginPath();
    ctx.moveTo(d.x, y);
    ctx.lineTo(d.x - 28, y + 6);
    ctx.lineTo(d.x - 24, y - 4);
    ctx.fill();
  };

  World.prototype.drawCrater = function (ctx, d) {
    ctx.strokeStyle = "#9eb6ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(d.x, gy() - 4, 14 + d.vary * 4, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  };

  World.prototype.drawFlag = function (ctx, d, t) {
    ctx.strokeStyle = "#d5def5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(d.x, gy());
    ctx.lineTo(d.x, gy() - 42);
    ctx.stroke();
    ctx.fillStyle = "#ff5d73";
    ctx.beginPath();
    ctx.moveTo(d.x, gy() - 42);
    ctx.lineTo(d.x + 16 + Math.sin(t * 3 + d.phase) * 3, gy() - 36);
    ctx.lineTo(d.x, gy() - 30);
    ctx.fill();
  };

  World.prototype.drawRobotDecor = function (ctx, d, t) {
    var bob = Math.sin(t * 2 + d.phase) * 2;
    ctx.fillStyle = "#9aa3ad";
    ctx.fillRect(d.x - 8, gy() - 28 + bob, 16, 18);
    ctx.fillStyle = "#3ee0c2";
    ctx.fillRect(d.x - 4, gy() - 22 + bob, 3, 3);
    ctx.fillRect(d.x + 2, gy() - 22 + bob, 3, 3);
    ctx.fillStyle = "#9aa3ad";
    ctx.fillRect(d.x - 6, gy() - 10, 4, 10);
    ctx.fillRect(d.x + 2, gy() - 10, 4, 10);
  };

  World.prototype.drawPlains = function (ctx, cam, viewW, viewH) {
    var base = gy() - 168;
    ctx.fillStyle = "#ffe7a0";
    ctx.beginPath();
    ctx.arc(cam.x + viewW * 0.82, cam.y + 74, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#b7d86a";
    ctx.fillRect(cam.x - 60, base + 36, viewW + 140, 90);
    this.drawPlainHerd(ctx, cam, viewW, base + 8, 0.0015, 0.62);
    this.drawPlainHerd(ctx, cam, viewW, base + 34, 0.0025, 1);
    var bird;
    ctx.fillStyle = "#3d4e62";
    for (bird = 0; bird < 7; bird++) {
      var bx = cam.x + ((bird * 190 + this.time * 1.2) % (viewW + 220)) - 40;
      var by = cam.y + 40 + hash(bird + 4) * 70 + Math.sin(this.time * 3 + bird) * 8;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 16, by - 4);
      ctx.lineTo(bx + 34, by + 2);
      ctx.lineTo(bx + 16, by + 3);
      ctx.fill();
    }
  };

  World.prototype.drawPlainHerd = function (ctx, cam, viewW, base, speed, scale) {
    var span = 168;
    var cursor = farCursor(cam.x, speed, span);
    var x = cursor.x;
    var u = cursor.u;
    var end = cam.x + viewW + span;
    while (x < end) {
      var kind = Math.floor(hash(Math.floor(u) + 5) * 4);
      var bob = Math.sin(this.time * 2 + u * 0.01) * 2;
      this.paintMiniDino(ctx, x, base + bob, kind, scale * (0.7 + hash(Math.floor(u) + 2) * 0.55), hash(Math.floor(u) + 8) > 0.5);
      var step = span * (0.72 + hash(Math.floor(u) + 1) * 0.55);
      x += step;
      u += step;
    }
  };

  World.prototype.paintMiniDino = function (ctx, x, y, kind, scale, flip) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((flip ? -1 : 1) * scale, scale);
    ctx.fillStyle = kind === 1 ? "#6e8f42" : "#5c7a38";
    if (kind === 0) {
      ctx.fillRect(-8, -18, 28, 12);
      ctx.fillRect(14, -40, 6, 24);
      ctx.beginPath();
      ctx.arc(18, -44, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-16, -8, 10, 4);
      ctx.fillRect(-2, -6, 4, 10);
      ctx.fillRect(10, -6, 4, 10);
    } else if (kind === 1) {
      ctx.beginPath();
      ctx.ellipse(0, -12, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, -16);
      ctx.lineTo(24, -8);
      ctx.lineTo(12, -8);
      ctx.fill();
      ctx.fillRect(-4, -6, 3, 10);
      ctx.fillRect(6, -6, 3, 10);
      ctx.fillStyle = "#d7c07a";
      ctx.fillRect(8, -18, 10, 3);
    } else if (kind === 2) {
      ctx.fillRect(-10, -16, 26, 10);
      ctx.fillStyle = "#6d5330";
      ctx.fillRect(-6, -24, 4, 8);
      ctx.fillRect(0, -26, 4, 10);
      ctx.fillRect(6, -24, 4, 8);
      ctx.fillStyle = "#5c7a38";
      ctx.fillRect(-2, -8, 4, 10);
      ctx.fillRect(8, -8, 4, 10);
      ctx.fillRect(16, -12, 12, 4);
    } else {
      ctx.fillRect(-4, -16, 16, 8);
      ctx.fillRect(8, -24, 8, 8);
      ctx.fillRect(-12, -10, 12, 3);
      ctx.fillRect(0, -8, 3, 10);
      ctx.fillRect(8, -8, 3, 10);
    }
    ctx.restore();
  };

  World.prototype.drawGrass = function (ctx, d) {
    ctx.strokeStyle = "#3f7a28";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(d.x, gy());
    ctx.quadraticCurveTo(d.x - 4, gy() - 12, d.x - 2, gy() - 22);
    ctx.moveTo(d.x, gy());
    ctx.quadraticCurveTo(d.x + 2, gy() - 14, d.x + 6, gy() - 26);
    ctx.moveTo(d.x, gy());
    ctx.quadraticCurveTo(d.x + 8, gy() - 10, d.x + 12, gy() - 18);
    ctx.stroke();
  };

  World.prototype.drawHerdDecor = function (ctx, d, t) {
    var kind = d.vary == null ? 0 : d.vary;
    var bob = Math.sin(t * 2 + d.phase * 6) * 1.5;
    this.paintMiniDino(ctx, d.x, gy() - 4 + bob, kind, 1.15, d.flip);
  };

  World.prototype.drawRex = function (ctx, rex) {
    var bob = Math.sin(this.time * 8) * 3;
    var jaw = rex.bite > 0 ? 0.55 : 0.18 + Math.sin(this.time * 6) * 0.05;
    ctx.save();
    ctx.translate(rex.x + rex.w * 0.45, rex.y + rex.h);
    if (rex.dir < 0) ctx.scale(-1, 1);
    ctx.translate(-(rex.x + rex.w * 0.45), -(rex.y + rex.h));
    ctx.fillStyle = "#4f6b2e";
    ctx.beginPath();
    ctx.moveTo(rex.x + 20, rex.y + rex.h - 20);
    ctx.quadraticCurveTo(rex.x - 30, rex.y + rex.h - 80, rex.x + 70, rex.y + 150 + bob);
    ctx.lineTo(rex.x + 150, rex.y + 130);
    ctx.fill();
    ctx.fillStyle = "#628336";
    ctx.beginPath();
    ctx.ellipse(rex.x + 230, rex.y + 150 + bob, 120, 78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d9c397";
    ctx.beginPath();
    ctx.ellipse(rex.x + 220, rex.y + 175 + bob, 70, 36, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = "#628336";
    ctx.fillRect(rex.x + 300, rex.y + 78 + bob, 150, 56);
    ctx.beginPath();
    ctx.ellipse(rex.x + 450, rex.y + 78 + bob, 52, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(rex.x + 430, rex.y + 118 + bob);
    ctx.rotate(jaw);
    ctx.fillStyle = "#5a7830";
    ctx.fillRect(0, 0, 92, 28);
    ctx.fillStyle = "#f4f0e4";
    var tooth;
    for (tooth = 0; tooth < 5; tooth++) ctx.fillRect(12 + tooth * 14, -6, 5, 8);
    ctx.restore();
    ctx.fillStyle = "#f4f0e4";
    for (tooth = 0; tooth < 4; tooth++) ctx.fillRect(rex.x + 430 + tooth * 16, rex.y + 108 + bob, 5, 8);
    ctx.fillStyle = "#f2e15a";
    ctx.beginPath();
    ctx.arc(rex.x + 470, rex.y + 62 + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c2410";
    ctx.beginPath();
    ctx.arc(rex.x + 472, rex.y + 62 + bob, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#567430";
    ctx.fillRect(rex.x + 250, rex.y + 118 + bob, 14, 36);
    ctx.fillRect(rex.x + 276, rex.y + 124 + bob, 12, 28);
    ctx.fillStyle = "#3f5a24";
    var step = Math.sin(this.time * 10);
    ctx.fillRect(rex.x + 160, rex.y + 200 + bob, 28, 110 + step * 8);
    ctx.fillRect(rex.x + 250, rex.y + 210 + bob, 32, 100 - step * 8);
    ctx.fillRect(rex.x + 150, rex.y + 300 + bob, 40, 16);
    ctx.fillRect(rex.x + 246, rex.y + 300 + bob, 44, 16);
    ctx.restore();
  };

  World.prototype.drawHunter = function (ctx, e) {
    var bob = Math.sin(this.time * 10 + e.x) * 2;
    ctx.save();
    if (e.eaten) ctx.globalAlpha = Math.max(0, 1 - (e.eatT || 0) * 3);
    ctx.translate(e.x + 17, e.y + 28);
    if (e.dir < 0) ctx.scale(-1, 1);
    ctx.translate(-(e.x + 17), -(e.y + 28));
    ctx.fillStyle = "#6b4428";
    ctx.fillRect(e.x + 6, e.y + 28 + bob, 8, 30);
    ctx.fillRect(e.x + 20, e.y + 28 + bob, 8, 30);
    ctx.fillStyle = "#c9864a";
    ctx.fillRect(e.x + 8, e.y + 16, 18, 18);
    ctx.beginPath();
    ctx.arc(e.x + 17, e.y + 10 + bob, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a2118";
    ctx.fillRect(e.x + 12, e.y + 8 + bob, 3, 3);
    ctx.fillRect(e.x + 20, e.y + 8 + bob, 3, 3);
    ctx.fillStyle = "#f4f0e6";
    ctx.save();
    ctx.translate(e.x + 30, e.y + 18);
    ctx.rotate(-0.8);
    ctx.fillRect(0, -3, 22, 6);
    ctx.beginPath();
    ctx.arc(22, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  };

  World.prototype.drawGround = function (ctx, biome, cam, viewW) {
    var i;
    for (i = 0; i < this.grounds.length; i++) {
      var g = this.grounds[i];
      if (g.x + g.w < cam.x - 40 || g.x > cam.x + viewW + 40) continue;
      ctx.fillStyle = biome.deep;
      ctx.fillRect(g.x, gy() + 18, g.w, 720);
      ctx.fillStyle = biome.ground;
      ctx.fillRect(g.x, gy(), g.w, 28);
      ctx.fillStyle = biome.accent;
      ctx.fillRect(g.x, gy(), g.w, 6);
      if (this.hasFire() && !this.waiting && this.fireX != null && this.fireX > g.x) this.drawBurntGround(ctx, g, cam, viewW);
      var x;
      var from = Math.max(g.x, cam.x - 20);
      var to = Math.min(g.x + g.w, cam.x + viewW + 20);
      ctx.fillStyle = biome.ink;
      ctx.globalAlpha = 0.25;
      for (x = Math.floor(from / 22) * 22; x < to; x += 22) {
        if (hash(x) > 0.72) ctx.fillRect(x, gy() + 12, 4, 4);
      }
      ctx.globalAlpha = 1;
    }
  };

  World.prototype.drawBurntGround = function (ctx, g, cam, viewW) {
    var x0 = Math.max(g.x, cam.x - 20);
    var x1 = Math.min(g.x + g.w, this.fireX, cam.x + viewW + 20);
    if (x1 <= x0) return;
    ctx.fillStyle = "#9a1c08";
    ctx.fillRect(x0, gy(), x1 - x0, 28);
    ctx.fillStyle = "#ffb03a";
    ctx.fillRect(x0, gy(), x1 - x0, 5);
    var t = this.time * 10;
    var x;
    for (x = x0; x < x1; x += 18) {
      var h = 16 + Math.sin(t + x * 0.2) * 8;
      ctx.fillStyle = "#ff4a12";
      ctx.beginPath();
      ctx.moveTo(x, gy());
      ctx.quadraticCurveTo(x + 6, gy() - h * 0.6, x + 8, gy() - h);
      ctx.quadraticCurveTo(x + 12, gy() - h * 0.4, x + 16, gy());
      ctx.fill();
    }
  };

  World.prototype.drawEntities = function (ctx, biome, cam, viewW, viewH) {
    var i;
    for (i = 0; i < this.entities.length; i++) {
      var e = this.entities[i];
      if (e.dead) continue;
      var ex = e.x;
      if (ex < cam.x - 80 || ex > cam.x + viewW + 120) continue;
      if (e.kind === "block" || e.kind === "step") this.drawBlock(ctx, biome, e);
      else if (e.kind === "spike") this.drawSpike(ctx, biome, e);
      else if (e.kind === "flame") this.drawFlame(ctx, e);
      else if (e.kind === "platform") this.drawPlatform(ctx, biome, e);
      else if (e.kind === "coin" || e.kind === "aircoin") this.drawCoin(ctx, e);
      else if (e.kind === "heart") this.drawHeart(ctx, e);
      else if (e.kind === "orb") this.drawOrb(ctx, e);
      else if (e.kind === "grow") this.drawGrow(ctx, e);
      else if (e.kind === "fast" || e.kind === "slow") this.drawTimed(ctx, e);
      else if (e.kind === "booster") this.drawBooster(ctx, e);
      else if (e.kind === "hunter") this.drawHunter(ctx, e);
      if (e.burning) this.drawBurn(ctx, e);
    }
  };

  World.prototype.drawBurn = function (ctx, e) {
    var w = e.w || 36;
    var h = e.h || 36;
    var x = e.w ? e.x : e.x - w / 2;
    var y = e.h ? e.y : e.y - h / 2;
    ctx.fillStyle = e.burnT > 0.08 ? "rgba(255, 214, 120, 0.9)" : "rgba(255, 70, 12, 0.82)";
    ctx.fillRect(x, y, w, h);
    var t = this.time * 12;
    var i;
    var cols = Math.max(1, Math.round(w / 16));
    for (i = 0; i < cols; i++) {
      var fx = x + (i + 0.5) * (w / cols);
      var fh = h * (0.45 + Math.sin(t + i) * 0.2);
      ctx.fillStyle = "#ffd15a";
      ctx.beginPath();
      ctx.moveTo(fx - 6, y + h);
      ctx.quadraticCurveTo(fx, y + h - fh, fx + 6, y + h);
      ctx.fill();
    }
  };

  World.prototype.drawBlock = function (ctx, biome, e) {
    ctx.fillStyle = biome.ink;
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = biome.accent;
    ctx.fillRect(e.x, e.y, e.w, 6);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.strokeRect(e.x + 0.5, e.y + 0.5, e.w - 1, e.h - 1);
  };

  World.prototype.drawFlame = function (ctx, e) {
    if (this.waiting) return;
    var t = this.time * 9;
    var x;
    for (x = e.x + 2; x < e.x + e.w - 8; x += 10) {
      var h = e.h * (0.55 + Math.sin(t + x * 0.4) * 0.35);
      ctx.fillStyle = "#ff4a1a";
      ctx.beginPath();
      ctx.moveTo(x, e.y + e.h);
      ctx.quadraticCurveTo(x + 2, e.y + e.h - h * 0.55, x + 5, e.y + e.h - h);
      ctx.quadraticCurveTo(x + 9, e.y + e.h - h * 0.4, x + 11, e.y + e.h);
      ctx.fill();
      ctx.fillStyle = "#ffd15a";
      ctx.beginPath();
      ctx.moveTo(x + 3, e.y + e.h);
      ctx.quadraticCurveTo(x + 5, e.y + e.h - h * 0.35, x + 6, e.y + e.h - h * 0.62);
      ctx.quadraticCurveTo(x + 8, e.y + e.h - h * 0.25, x + 9, e.y + e.h);
      ctx.fill();
    }
  };

  World.prototype.drawSpike = function (ctx, biome, e) {
    ctx.fillStyle = e.atop ? "#e23b3b" : biome.ink;
    var base = e.y + e.h;
    var tip = e.y;
    var x;
    for (x = e.x; x < e.x + e.w - 2; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.lineTo(x + 7, tip);
      ctx.lineTo(x + 14, base);
      ctx.fill();
    }
  };

  World.prototype.drawPlatform = function (ctx, biome, e) {
    ctx.fillStyle = e.trap ? "#6e2424" : biome.ground;
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = e.trap ? "#ff5a5a" : biome.accent;
    ctx.fillRect(e.x, e.y, e.w, 4);
    ctx.strokeStyle = biome.ink;
    ctx.strokeRect(e.x, e.y, e.w, e.h);
  };

  World.prototype.drawCoin = function (ctx, e) {
    var air = e.kind === "aircoin";
    var bob = Math.sin(this.time * 4 + e.x * 0.02) * (air ? 1.5 : 5);
    var squash = 0.65 + Math.abs(Math.sin(this.time * 3 + e.x)) * 0.35;
    ctx.save();
    ctx.translate(e.x, e.y + bob);
    ctx.scale((air ? 0.86 : 1) * squash, air ? 0.86 : 1);
    ctx.fillStyle = "#ffbf1f";
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#8a5a00";
    ctx.stroke();
    ctx.fillStyle = "#fff4c2";
    ctx.font = "bold 12px Trebuchet MS, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (!air) ctx.fillText("10", 0, 1);
    ctx.restore();
  };

  World.prototype.drawHeart = function (ctx, e) {
    var bob = Math.sin(this.time * 5 + e.x) * 4;
    heartPath(ctx, e.x, e.y + bob, 15);
    ctx.fillStyle = "#ff4d6d";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#7a1430";
    ctx.stroke();
  };

  World.prototype.drawOrb = function (ctx, e) {
    var pulse = 1 + Math.sin(this.time * 3 + e.x) * 0.06;
    ctx.save();
    ctx.translate(e.x, e.y + Math.sin(this.time * 2) * 4);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = e.form === "ship" ? "rgba(176, 107, 255, 0.28)" : "rgba(58, 160, 255, 0.28)";
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = e.form === "ship" ? "#b06bff" : "#3aa0ff";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#1b2430";
    ctx.stroke();
    ctx.fillStyle = "#fff";
    if (e.form === "ship") {
      ctx.beginPath();
      ctx.moveTo(-8, 2);
      ctx.lineTo(2, -6);
      ctx.lineTo(10, 2);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-5, -8, 10, 12);
      ctx.fillRect(-7, 4, 5, 3);
      ctx.fillRect(2, 4, 5, 3);
    }
    ctx.restore();
  };

  World.prototype.drawGrow = function (ctx, e) {
    var y = e.y + Math.sin(this.time * 4) * 3;
    ctx.fillStyle = "#f4e1c1";
    ctx.fillRect(e.x - 5, y + 2, 10, 14);
    ctx.fillStyle = "#e23b3b";
    ctx.beginPath();
    ctx.arc(e.x, y - 2, 16, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(e.x - 6, y - 6, 3, 0, Math.PI * 2);
    ctx.arc(e.x + 5, y - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  };

  World.prototype.drawTimed = function (ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y + Math.sin(this.time * 4) * 4);
    ctx.fillStyle = e.kind === "fast" ? "#ffd84a" : "#7ec8ff";
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#1c2430";
    ctx.stroke();
    ctx.fillStyle = "#1c2430";
    if (e.kind === "fast") {
      ctx.beginPath();
      ctx.moveTo(-4, -10);
      ctx.lineTo(6, -1);
      ctx.lineTo(0, -1);
      ctx.lineTo(4, 10);
      ctx.lineTo(-6, 1);
      ctx.lineTo(0, 1);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -5);
      ctx.lineTo(4, 1);
      ctx.stroke();
    }
    ctx.restore();
  };

  World.prototype.drawBooster = function (ctx, e) {
    ctx.fillStyle = "#ffbf1f";
    ctx.fillRect(e.x, e.y + 40, e.w, 24);
    ctx.strokeStyle = "#6a4a00";
    ctx.strokeRect(e.x, e.y + 40, e.w, 24);
    ctx.fillStyle = "#fff7d6";
    ctx.beginPath();
    ctx.moveTo(e.x + 18, e.y + 52);
    ctx.lineTo(e.x + 32, e.y + 44);
    ctx.lineTo(e.x + 32, e.y + 60);
    ctx.closePath();
    ctx.moveTo(e.x + 32, e.y + 52);
    ctx.lineTo(e.x + 46, e.y + 44);
    ctx.lineTo(e.x + 46, e.y + 60);
    ctx.fill();
  };

  World.prototype.drawFinish = function (ctx, biome) {
    var x = this.finish;
    ctx.fillStyle = biome.ink;
    ctx.fillRect(x, gy() - 150, 8, 150);
    ctx.fillStyle = biome.accent;
    ctx.fillRect(x + 8, gy() - 140, 70, 28);
    ctx.fillStyle = biome.ink;
    ctx.font = "bold 14px Trebuchet MS, Segoe UI, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("FIN", x + 22, gy() - 126);
  };

  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s, y - s * 0.35, x - s * 0.2, y - s, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.2, y - s, x + s, y - s * 0.35, x, y + s * 0.35);
  }

  DM.heartPath = heartPath;

  DM.createAdventure = function (index) {
    return buildAdventure(index);
  };

  DM.createEndless = function () {
    var world = new World();
    return world.loadEndless();
  };

  DM.createPast = function () {
    var world = new World();
    world.mode = "past";
    world.seed = (Date.now() % 2147483646) + 1;
    world.startX = DM.config.startX;
    world.speedAnchor = world.startX;
    world.cursor = -900;
    world.allowShip = false;
    world.addGround(900 + 1280);
    world.generateUntil(world.startX + 2800, { big: false, x: world.startX });
    world.scrolling = true;
    world.introCamX = world.startX - 1280 * 0.38;
    world.nextHunter = world.startX + 700;
    return world;
  };

  var MUSIC_BUILD = [
    null,
    { steps: 2, stepHi: 4, riseLo: 42, riseHi: 78, pit: 132, spike: 46, clear: 96, maxTotal: 250 },
    { steps: 4, stepHi: 5, riseLo: 40, riseHi: 74, pit: 96, spike: 38, clear: 100, maxTotal: 320 },
    { steps: 2, stepHi: 4, riseLo: 50, riseHi: 92, pit: 150, spike: 48, clear: 100, maxTotal: 340 },
    { steps: 3, stepHi: 5, riseLo: 56, riseHi: 96, pit: 140, spike: 52, clear: 100, maxTotal: 420 },
    { steps: 4, stepHi: 6, riseLo: 72, riseHi: 136, pit: 200, spike: 42, clear: 150, maxTotal: 450 }
  ];

  function musicEvents(notes, loops) {
    var ev = [];
    var loop;
    var i;
    for (loop = 0; loop < loops; loop++) {
      var beat = 0;
      for (i = 0; i < notes.length; i++) {
        ev.push({ midi: notes[i][0], dur: notes[i][1], jump: notes[i][2] || 0, local: beat, loop: loop, index: i });
        beat += notes[i][1];
      }
    }
    return ev;
  }

  function musicProfile(track) {
    var base = MUSIC_BUILD[track.id] || MUSIC_BUILD[1];
    var P = {};
    var key;
    for (key in base) P[key] = base[key];
    var jump = DM.music && DM.music.jumpSpeed ? DM.music.jumpSpeed(track.bpm) : 2200 * (60 / track.bpm);
    P.air = track.speed * 1.22 * (2 * jump / 2200);
    P.jumpH = jump * jump / (2 * 2200);
    var hard = (track.id - 1) / 19;
    P.clear = Math.max(46, Math.round(P.jumpH * (0.58 + hard * 0.22)));
    P.riseLo = 36;
    P.maxTotal = Math.min(260, Math.round(P.jumpH * 1.7));
    P.introBars = 2;
    P.trackId = track.id;
    P.pitRatio = 0.24 + hard * 0.34;
    P.speed = track.speed * 1.22;
    P.cell = track.speed * 1.22 * (60 / track.bpm);
    var tight = 0.86 - hard * 0.16;
    P.minTread = Math.max(96, P.air * tight);
    return P;
  }

  function pitchRange(notes) {
    var lo = 999;
    var hi = 0;
    var i;
    for (i = 0; i < notes.length; i++) {
      if (notes[i][0] == null) continue;
      if (notes[i][0] < lo) lo = notes[i][0];
      if (notes[i][0] > hi) hi = notes[i][0];
    }
    if (hi <= lo) hi = lo + 1;
    return { lo: lo, hi: hi };
  }

  function onDownbeat(local, meter) {
    var m = local % meter;
    if (m < 0) m += meter;
    return m < 0.04;
  }

  function groundSlot(world, w) {
    var x = world.cursor;
    world.addGround(w);
    return x;
  }

  function gatherSpan(ev, i, cell, need, stop) {
    var w = 0;
    var j = i;
    while (j < ev.length && w < need) {
      if (j > i && stop && stop(ev[j], ev[j - 1])) break;
      w += ev[j].dur * cell;
      j++;
    }
    return { end: j, width: w };
  }

  function fitSteps(width, want, minTread) {
    var n = want;
    if (n > 6) n = 6;
    if (n < 2) n = 2;
    while (n > 2 && width < n * minTread) n--;
    if (width < n * minTread) return 0;
    return n;
  }

  function stairWidths(total, steps, minTread, salt) {
    total = Math.round(total);
    minTread = Math.round(minTread);
    if (steps < 2 || total < steps * minTread) return null;
    var widths = [];
    var spare = total - steps * minTread;
    var i;
    var lastExtra = Math.min(spare, Math.round(minTread * 0.42));
    spare -= lastExtra;
    for (i = 0; i < steps; i++) widths.push(minTread);
    widths[steps - 1] += lastExtra;
    for (i = 0; i < steps - 1; i++) {
      var rooms = steps - i;
      var share = Math.round(spare / rooms);
      var wave = ((Math.abs(Math.round(salt) + i * 4) % 5) - 2) * 8;
      var add = share + wave;
      if (add > spare) add = spare;
      if (add < 0) add = 0;
      widths[i] += add;
      spare -= add;
    }
    widths[steps - 1] += spare;
    if (widths[steps - 1] < minTread) return null;
    return widths;
  }

  function stairRises(steps, lo, hi, clear, maxTotal, salt) {
    var rises = [];
    var height = 0;
    var i;
    if (lo < 34) lo = 34;
    if (hi > clear) hi = clear;
    if (hi < lo) hi = lo;
    for (i = 0; i < steps; i++) {
      var t = steps === 1 ? 1 : i / (steps - 1);
      var rise = Math.round(lo + (hi - lo) * (0.32 + 0.68 * t));
      rise += (Math.abs(Math.round(salt) + i * 3) % 5) - 2;
      if (rise < 34) rise = 34;
      if (rise > clear) rise = clear;
      if (height + rise > maxTotal) rise = maxTotal - height;
      if (rise < 30) break;
      rises.push(rise);
      height += rise;
    }
    return rises;
  }

  function placeStair(world, x, widths, rises) {
    var cursor = x;
    var height = 0;
    var i;
    var n = widths.length;
    if (rises.length < n) n = rises.length;
    for (i = 0; i < n; i++) {
      height += rises[i];
      world.stepBlock(cursor, widths[i], height);
      cursor += widths[i];
    }
    return height;
  }

  function apronFor(height, speed) {
    var t = Math.sqrt((2 * Math.max(40, height)) / 2200);
    return speed * t + 64;
  }

  function placeSpikeRun(world, x, span, spikeW, air) {
    var row = Math.min(span * 0.32, air * 0.36);
    if (row < 34) return;
    var sw = Math.max(30, Math.min(spikeW, row));
    if (row > sw + 46) {
      world.spike(x + 8, sw);
      world.spike(x + 18 + sw, Math.min(sw + 8, row - sw - 10));
    } else {
      world.spike(x + 8, row);
    }
  }

  function placePitSpan(world, span, pitWant, air) {
    var pit = Math.min(pitWant, air * 0.5, span * 0.42);
    var run = Math.max(24, Math.min(42, span * 0.14));
    if (pit < 52 || span < run + pit + air * 0.48) {
      world.addGround(span);
      return false;
    }
    var land = span - run - pit;
    world.addGround(run);
    world.addPit(pit);
    world.addGround(land);
    return true;
  }

  function wantedSteps(P, loop, boost) {
    var n = P.steps + loop + (boost || 0);
    if (n > P.stepHi) n = P.stepHi;
    if (n < 2) n = 2;
    return n;
  }

  function stopAtRest(note) {
    return note.midi == null;
  }

  function paintPrelude(world, ev, P) {
    var apronLeft = 0;
    var i = 0;
    while (i < ev.length) {
      var e = ev[i];
      if (apronLeft > 0) {
        var skip = e.dur * P.cell;
        groundSlot(world, skip);
        apronLeft -= skip;
        i++;
        continue;
      }
      var bar = [];
      var width = 0;
      var start = e.local;
      var loop = e.loop;
      while (i < ev.length && ev[i].loop === loop && ev[i].local < start + 4 - 0.01) {
        bar.push(ev[i]);
        width += ev[i].dur * P.cell;
        i++;
      }
      var peak = 0;
      var b;
      for (b = 0; b < bar.length; b++) if (bar[b].midi != null && bar[b].midi > peak) peak = bar[b].midi;
      var climax = peak >= 79;
      var want = P.steps + loop + (climax ? 1 : 0);
      if (want > P.stepHi) want = P.stepHi;
      var n = fitSteps(width, want, P.minTread);
      var x = groundSlot(world, width);
      if (n >= 2) {
        var norm = (peak - 76) / 6;
        if (norm < 0) norm = 0;
        if (norm > 1) norm = 1;
        var lo = P.riseLo + loop * 4;
        var hi = Math.round(P.riseLo + (P.riseHi - P.riseLo) * (0.55 + 0.45 * norm) + (climax ? 8 : 0) + loop * 4);
        if (hi > P.clear) hi = P.clear;
        var rises = stairRises(n, lo, hi, P.clear, P.maxTotal, peak + loop * 8);
        var est = 0;
        var r;
        for (r = 0; r < rises.length; r++) est += rises[r];
        var apron = apronFor(est, P.speed);
        var stairW = width;
        if (width - apron >= rises.length * P.minTread) stairW = width - apron;
        var widths = stairWidths(stairW, rises.length, P.minTread, peak + loop);
        if (widths) {
          var top = placeStair(world, x, widths, rises);
          apronLeft = apronFor(top, P.speed) - (width - stairW);
          if (apronLeft < 0) apronLeft = 0;
        }
      }
    }
  }

  function paintMusical(world, ev, P, trackId) {
    var apronLeft = 0;
    var i = 0;
    function eatGround() {
      var w = ev[i].dur * P.cell;
      groundSlot(world, w);
      apronLeft -= w;
      i++;
    }
    while (i < ev.length) {
      if (apronLeft > 0) {
        var pending = ev[i];
        var pendingW = pending.dur * P.cell;
        if (pending.midi != null && pending.dur >= 1.5 && apronLeft < pendingW * 0.42 && pendingW - apronLeft > P.air * 0.85) {
          var head = Math.max(apronLeft, 36);
          groundSlot(world, head);
          apronLeft = 0;
          placePitSpan(world, pendingW - head, P.pit + pending.loop * 10, P.air);
          i++;
          continue;
        }
        eatGround();
        continue;
      }
      var e = ev[i];
      var prev = i > 0 ? ev[i - 1] : null;
      var next = i + 1 < ev.length ? ev[i + 1] : null;
      var late = e.local >= 12 ? 1 : 0;
      var choice = "ground";
      if (e.midi == null) choice = "pit";
      else if (trackId === 4 && e.dur >= 1.5 && e.loop > 0) choice = "pit";
      else if (trackId === 4 && e.dur >= 1.5) choice = "landing";
      else if (trackId === 3 && descentLength(ev, i) >= 3) choice = "drop";
      else if (trackId === 3 && next && next.midi != null && next.dur >= 1 && next.midi - e.midi >= 3) choice = "stair";
      else if (trackId === 3 && next && next.midi != null && e.midi - next.midi >= 4 && e.dur <= 0.5) choice = "spike";
      else if (trackId === 5 && next && next.midi != null && next.midi > e.midi && e.dur <= 0.5) choice = "stair";
      else if (trackId === 5 && next && next.midi != null && next.midi < e.midi) choice = "spike";
      else if (trackId === 4 && risingLength(ev, i) >= 3) choice = "stair";
      else if (trackId === 1 && (onDownbeat(e.local, 3) || (e.midi >= 78 && e.dur >= 1))) choice = "stair";
      else if (trackId === 1 && e.loop > 0 && e.dur <= 0.5 && prev && prev.midi != null && e.midi >= prev.midi) choice = "spike";
      else if (trackId === 4 && e.loop > 0 && next && next.midi != null && e.midi > next.midi) choice = "spike";
      else if (trackId === 5 && e.dur >= 1) choice = "pit";

      if (choice === "ground" || choice === "landing") {
        var w = e.dur * P.cell;
        var x = groundSlot(world, w);
        if (choice === "landing" && w - 80 >= P.air * 0.92) {
          var sw = Math.min(108, w * 0.24);
          var sh = Math.min(P.clear, P.riseLo + (e.local >= 16 ? 18 : 6));
          world.stepBlock(x + w * 0.28, sw, sh);
        }
        i++;
        continue;
      }

      if (choice === "pit") {
        var needPit = 36 + Math.min(P.pit, P.air * 0.48) + P.air * 0.62;
        var gotPit = gatherSpan(ev, i, P.cell, needPit, null);
        var placedPit = placePitSpan(world, gotPit.width, P.pit + e.loop * 12, P.air);
        if (!placedPit && e.midi == null) {
          var forced = Math.min(P.pit, P.air * 0.46);
          world.addGround(32);
          world.addPit(forced);
          world.addGround(Math.max(80, P.air * 0.62));
        }
        i = gotPit.end;
        continue;
      }

      if (choice === "drop") {
        var gotDrop = gatherSpan(ev, i, P.cell, P.air * 2.15, function (note, before) {
          if (note.midi == null) return true;
          if (before && before.midi != null && note.midi > before.midi + 1) return true;
          return false;
        });
        if (gotDrop.width >= P.air * 0.95) {
          layDescent(world, gotDrop.width, P, e.loop > 0);
          i = gotDrop.end;
        } else {
          groundSlot(world, e.dur * P.cell);
          i++;
        }
        continue;
      }

      if (choice === "spike") {
        var gotSpike = gatherSpan(ev, i, P.cell, P.air * 0.98, function (note, before) {
          if (stopAtRest(note)) return true;
          if (trackId === 1 && onDownbeat(note.local, 3)) return true;
          if (trackId === 5 && note.dur >= 1) return true;
          if (trackId === 5 && before && note.midi != null && before.midi != null && note.midi > before.midi) return true;
          if (trackId === 3 && before && note.midi != null && before.midi != null && note.midi - before.midi >= 3) return true;
          return false;
        });
        if (gotSpike.width < P.air * 0.9) {
          groundSlot(world, e.dur * P.cell);
          i++;
          continue;
        }
        var sx = groundSlot(world, gotSpike.width);
        placeSpikeRun(world, sx, gotSpike.width, P.spike + e.loop * 6, P.air);
        i = gotSpike.end;
        continue;
      }

      var boost = 0;
      if (trackId === 1 && e.midi >= 78) boost = 1;
      if (trackId === 1 && late) boost += e.loop > 0 ? 0 : 0;
      if (trackId === 4 && e.local >= 16) boost = 1;
      if (trackId === 5 && e.loop > 0) boost = 1;
      var want = wantedSteps(P, e.loop, boost + (trackId === 1 && late ? 1 : 0));
      var gotStair = gatherSpan(ev, i, P.cell, want * P.minTread + 30, function (note) {
        return stopAtRest(note);
      });
      var nFit = fitSteps(gotStair.width, want, P.minTread);
      if (nFit < 2) {
        var one = e.dur * P.cell;
        var ox = groundSlot(world, one);
        if (one > 120) world.stepBlock(ox + 14, Math.min(110, one * 0.46), Math.min(P.clear, P.riseLo + 6));
        i++;
        continue;
      }
      var rises = stairRises(nFit, P.riseLo + e.loop * 6, Math.min(P.clear, P.riseHi + e.loop * 4 + boost * 4), P.clear, P.maxTotal, (e.midi || 60) + e.loop * 7 + trackId);
      var stairW = gotStair.width;
      var widths = stairWidths(stairW, rises.length, P.minTread, (e.midi || 60) + trackId * 9);
      if (!widths) {
        groundSlot(world, e.dur * P.cell);
        i++;
        continue;
      }
      var used = 0;
      var u;
      for (u = 0; u < widths.length; u++) used += widths[u];
      if (used > gotStair.width) used = gotStair.width;
      var sx2 = groundSlot(world, gotStair.width);
      var topH = placeStair(world, sx2, widths, rises);
      apronLeft = apronFor(topH, P.speed);
      i = gotStair.end;
    }
  }

  function descentLength(ev, i) {
    var n = 1;
    var j = i;
    while (j + 1 < ev.length && ev[j].midi != null && ev[j + 1].midi != null && ev[j + 1].midi < ev[j].midi && ev[j].midi - ev[j + 1].midi <= 5) {
      n++;
      j++;
      if (n >= 6) break;
    }
    return n;
  }

  function risingLength(ev, i) {
    var n = 1;
    var j = i;
    while (j + 1 < ev.length && ev[j].midi != null && ev[j + 1].midi != null && ev[j + 1].midi >= ev[j].midi && ev[j + 1].midi - ev[j].midi <= 3) {
      n++;
      j++;
      if (n >= 6) break;
    }
    return n;
  }

  function layDescent(world, width, P, hard) {
    var near = 34;
    var pit = Math.min(P.pit, Math.round(P.air * 0.42));
    var far = width - near - pit;
    if (far < P.air * 0.62 || pit < 64) {
      var x = groundSlot(world, width);
      var stepW = Math.min(110, width * 0.28);
      if (width - stepW - 36 >= P.air * 0.9) world.stepBlock(x + 28, stepW, Math.min(P.clear, hard ? 86 : 68));
      return;
    }
    world.addGround(near);
    world.addPit(pit);
    world.addGround(far);
  }

  function findHeld(ev, i) {
    var j;
    for (j = i; j < ev.length - 1 && j < i + 8; j++) {
      if (ev[j].midi != null && ev[j + 1].midi != null && ev[j + 1].dur >= 0.99 && ev[j + 1].midi - ev[j].midi >= 3) return j + 1;
    }
    return -1;
  }

  function spanWidth(ev, a, b, cell) {
    var w = 0;
    var k;
    for (k = a; k <= b && k < ev.length; k++) w += ev[k].dur * cell;
    return w;
  }

  function paintMozart(world, ev, P) {
    var apronLeft = 0;
    var i = 0;
    while (i < ev.length) {
      if (apronLeft > 0) {
        var skip = ev[i].dur * P.cell;
        if (apronLeft < skip * 0.55 && descentLength(ev, i) >= 3) apronLeft = 0;
        else {
          groundSlot(world, skip);
          apronLeft -= skip;
          i++;
          continue;
        }
      }
      var e = ev[i];
      if (e.midi == null) {
        groundSlot(world, e.dur * P.cell);
        i++;
        continue;
      }
      if (descentLength(ev, i) >= 3) {
        var gotD = gatherSpan(ev, i, P.cell, 99999, function (note, before) {
          if (note.midi == null) return true;
          if (before && before.midi != null && note.midi > before.midi + 1) return true;
          return false;
        });
        if (gotD.width >= P.air * 0.85) layDescent(world, gotD.width, P, e.loop > 0);
        else groundSlot(world, e.dur * P.cell);
        i = gotD.width >= P.air * 0.85 ? gotD.end : i + 1;
        continue;
      }
      var held = findHeld(ev, i);
      if (held > i) {
        var through = spanWidth(ev, i, held, P.cell);
        var want = wantedSteps(P, e.loop, e.loop > 0 ? 1 : 0);
        var need = want * P.minTread;
        var leadNotes = i;
        var leadW = 0;
        if (through - need >= P.air * 0.9) {
          while (leadNotes < held && through - (leadW + ev[leadNotes].dur * P.cell) >= need && leadW < P.air * 1.02) {
            leadW += ev[leadNotes].dur * P.cell;
            leadNotes++;
          }
        }
        if (leadW >= P.air * 0.9) {
          var spikeX = groundSlot(world, leadW);
          placeSpikeRun(world, spikeX, leadW, P.spike + e.loop * 8, P.air);
        } else {
          leadNotes = i;
          leadW = 0;
        }
        var stairW = through - leadW;
        var n = fitSteps(stairW, want, P.minTread);
        var stairX = groundSlot(world, stairW);
        if (n >= 2) {
          var rises = stairRises(n, P.riseLo + e.loop * 8, Math.min(P.clear, P.riseHi + e.loop * 6), P.clear, P.maxTotal, ev[held].midi + e.loop * 5);
          var widths = stairWidths(stairW, rises.length, P.minTread, ev[held].midi);
          if (widths) {
            var top = placeStair(world, stairX, widths, rises);
            apronLeft = apronFor(top, P.speed);
          }
        }
        i = held + 1;
        continue;
      }
      groundSlot(world, e.dur * P.cell);
      i++;
    }
  }

  function musicBars(ev, cell) {
    var bars = [];
    var bar = { w: 0 };
    var i;
    for (i = 0; i < ev.length; i++) {
      var w = ev[i].dur * cell;
      var room = cell * 4 - bar.w;
      if (bar.w > 1 && w > room + 1) {
        bar.w += room;
        bars.push(bar);
        bar = { w: w - room };
      } else {
        bar.w += w;
      }
      if (bar.w >= cell * 4 - 1) {
        bars.push(bar);
        bar = { w: 0 };
      }
    }
    if (bar.w > 1) bars.push(bar);
    return bars;
  }

  function layMusicStair(world, width, steps, P, salt, late, shape) {
    var tread = Math.round(P.air * (P.trackId >= 4 ? 0.76 : 0.82));
    var minTread = Math.round(P.air * 0.7);
    while (steps > 2 && steps * tread > width * 0.84) steps--;
    if (steps < 2 || width < tread * 2 + 40) {
      world.addGround(width);
      return 0;
    }
    var upCount = shape === 1 ? Math.max(2, steps - 2) : steps;
    var lo = P.riseLo + (late ? 6 : 0);
    var hi = P.clear;
    if (hi < lo) hi = lo;
    var height = 0;
    var heights = [];
    var widths = [];
    var i;
    for (i = 0; i < steps; i++) {
      var rise;
      if (i < upCount) {
        var t = upCount === 1 ? 1 : i / (upCount - 1);
        rise = Math.round(lo + (hi - lo) * (0.4 + 0.6 * t));
        rise += ((Math.abs(salt) + i * 3) % 7) - 3;
        if (rise < 34) rise = 34;
        if (rise > P.clear) rise = P.clear;
        if (height + rise > P.maxTotal) rise = P.maxTotal - height;
        if (rise < 30) break;
        height += rise;
      } else {
        var drop = Math.round(lo * 0.85 + ((salt + i) % 3) * 6);
        height -= drop;
        if (height < 42) height = 42;
      }
      var wide = tread + (((Math.abs(salt) + i * 5) % 5) - 2) * 12;
      if (i === steps - 1) wide += Math.round(tread * 0.28);
      if (wide < minTread) wide = minTread;
      heights.push(height);
      widths.push(wide);
    }
    if (heights.length < 2) {
      world.addGround(width);
      return 0;
    }
    var gap = 0;
    var gapAt = -1;
    if (shape === 2 && heights.length >= 3) {
      gap = Math.round(P.air * 0.16);
      gapAt = heights.length - 1;
      widths[gapAt] = Math.max(widths[gapAt], Math.round(P.air * 1.02));
    }
    var used = gap;
    for (i = 0; i < widths.length; i++) used += widths[i];
    if (used > width - 36) {
      var over = used - (width - 36);
      for (i = 0; i < widths.length - 1 && over > 0; i++) {
        var room = widths[i] - minTread;
        if (room < 0) room = 0;
        var cut = room < over ? room : over;
        widths[i] -= cut;
        over -= cut;
      }
      if (over > 0) widths[widths.length - 1] -= over;
      if (widths[widths.length - 1] < minTread) {
        world.addGround(width);
        return 0;
      }
    }
    var x0 = world.cursor;
    world.addGround(width);
    var cursor = x0 + 6;
    for (i = 0; i < heights.length; i++) {
      if (i === gapAt) cursor += gap;
      world.stepBlock(cursor, widths[i], heights[i]);
      cursor += widths[i];
    }
    if (shape === 4 && width - (cursor - x0) > 90) {
      world.spike(cursor + 10, Math.min(64, width - (cursor - x0) - 28));
    }
    return heights.length;
  }

  function layMusicBlocks(world, width, salt) {
    var x0 = world.cursor;
    world.addGround(width);
    var n = 2 + (Math.abs(salt) % 2);
    var i;
    for (i = 0; i < n; i++) {
      var h = 40 + ((Math.abs(salt) + i * 9) % 5) * 6;
      var bw = 36 + ((Math.abs(salt) + i * 4) % 4) * 8;
      var slot = (width - 100) / n;
      world.block(x0 + 36 + Math.round(slot * i + slot * 0.2), bw, h);
    }
  }

  function layMusicSpikes(world, width, salt) {
    var x0 = world.cursor;
    world.addGround(width);
    var n = 1 + (Math.abs(salt) % 3);
    var i;
    for (i = 0; i < n; i++) {
      var sw = 32 + ((Math.abs(salt) + i * 6) % 5) * 8;
      var slot = (width - 60) / (n + 1);
      world.spike(x0 + Math.round(slot * (i + 1)), sw);
    }
  }

  function layMusicChain(world, width, P, salt, shape) {
    var before = world.cursor;
    var hops = 3;
    if (P.trackId >= 8) hops = 4;
    if (P.trackId >= 15) hops = 5;
    var deadly = P.trackId >= 8;
    var traps = P.trackId >= 11;
    world.addHopChain(hops, shape, salt, width, deadly, traps);
    var used = world.cursor - before;
    if (used < width) world.addGround(width - used);
  }

  function musicPit(P, phrase) {
    var hard = (P.trackId - 1) / 19;
    var ratio = 0.24 + hard * 0.34 + (phrase % 4) * 0.05;
    var pit = Math.round(P.air * ratio);
    if (pit > P.air * 0.68) pit = Math.round(P.air * 0.68);
    if (pit < 80) pit = 80;
    return pit;
  }

  function musicMenu(id) {
    var hard = (id - 1) / 19;
    var pool;
    if (hard < 0.16) pool = [6, 0, 6, 3, 2, 4];
    else if (hard < 0.32) pool = [6, 1, 6, 2, 4, 0];
    else if (hard < 0.5) pool = [6, 2, 6, 5, 1, 4];
    else if (hard < 0.68) pool = [6, 5, 6, 2, 4, 1];
    else if (hard < 0.84) pool = [6, 6, 5, 2, 4, 6];
    else pool = [6, 5, 6, 6, 4, 2];
    var menu = [];
    var rot = (id * 2) % pool.length;
    var i;
    for (i = 0; i < pool.length; i++) menu.push(pool[(i + rot) % pool.length]);
    if (id % 3 === 0) {
      var a = id % menu.length;
      var b = (a + 1) % menu.length;
      var tmp = menu[a];
      menu[a] = menu[b];
      menu[b] = tmp;
    }
    return menu;
  }

  function paintSynced(world, ev, P) {
    var menu = musicMenu(P.trackId);
    var bars = musicBars(ev, P.cell);
    var b = 0;
    var phrase = 0;
    while (b < bars.length) {
      if (b < P.introBars || b + 1 >= bars.length) {
        world.addGround(bars[b].w);
        b++;
        continue;
      }
      var width = bars[b].w + bars[b + 1].w;
      var late = b >= bars.length * 0.45;
      var kind = menu[phrase % menu.length];
      var hard = (P.trackId - 1) / 19;
      var steps = 2 + (phrase % 2);
      if (hard > 0.25) steps += 1;
      if (hard > 0.55) steps += 1;
      if (hard > 0.8 && late) steps += 1;
      if (P.trackId <= 2) steps = 2 + (phrase % 2);
      if (steps > 5) steps = 5;
      if (steps < 2) steps = 2;
      var salt = phrase * 13 + b + P.trackId * 5;
      if (kind === 6 && P.trackId >= 5) {
        layMusicChain(world, width, P, salt, phrase % 4);
      } else if (kind === 3) {
        layMusicBlocks(world, width, salt);
      } else if (kind === 4) {
        layMusicSpikes(world, width, salt);
      } else if (kind === 2 || kind === 5) {
        var pit = musicPit(P, phrase + (kind === 5 ? 1 : 0));
        if (width - pit < 200) pit = Math.max(80, Math.round(width * 0.2));
        world.addPit(pit);
        layMusicStair(world, width - pit, Math.max(2, steps - 1), P, salt, late, kind === 5 ? 2 : 0);
      } else {
        layMusicStair(world, width, steps, P, salt, late, kind === 1 ? 1 : (phrase % 2 === 0 ? 0 : 4));
      }
      phrase++;
      b += 2;
    }
  }

  DM.createTempo = function (track) {
    var world = new World();
    var piece = DM.music.piece(track.id);
    var P = musicProfile(track);
    world.mode = "tempo";
    world.levelIndex = ((track.id - 1) % DM.BIOMES.length) + 1;
    world.track = track;
    world.tempoSpeed = track.speed;
    world.allowShip = false;
    world.waiting = true;
    world.cursor = 0;
    world.addGroundAt(-900, 900);
    world.cursor = DM.config.startX;
    var ev = musicEvents(piece.notes, 1);
    paintSynced(world, ev, P);
    world.length = world.cursor;
    world.finish = world.length - 8;
    world.startX = DM.config.startX;
    world.speedAnchor = world.startX;
    world.songStart = world.startX;
    world.songBeats = (world.finish - world.songStart) / P.cell;
    return world;
  };
})();
