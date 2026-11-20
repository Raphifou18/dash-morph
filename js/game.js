(function () {
  "use strict";
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  var DM = root.DM || (root.DM = {});

  DM.config = {
    groundY: 600,
    runner: { w: 40, h: 68 },
    ship: { w: 54, h: 30 },
    bigScale: 1.6,
    runnerGravity: 2200,
    jumpV: -760,
    bigJumpV: -900,
    jumpBoostMul: 1.18,
    coyote: 0.1,
    jumpBuffer: 0.1,
    shipThrust: -1650,
    shipGravity: 1200,
    shipMax: 520,
    bigShipMul: 1.12,
    endlessBase: 210,
    endlessCoef: 0.000055,
    endlessMax: 720,
    adventureBases: [260, 268, 276, 284, 292, 300, 308, 316, 324, 332, 340, 350, 360, 370, 380, 390, 400, 412, 426, 440],
    adventureCoef: 0.22,
    invuln: 0.8,
    bonusTime: 5,
    speedScale: 1.6,
    slowScale: 0.55,
    coinValue: 10,
    airCoinValue: 1,
    airCoinGap: 36,
    shipUnlock: 15,
    shipDuration: 8,
    shipLift: 110,
    shipLane: 200,
    shipAuto: 0.85,
    ceilingDelay: 2,
    pitDepth: 100,
    pitTrigger: 24,
    distancePerCoin: 100,
    zoomMin: 0.72,
    zoomTime: 0.8,
    spinSpeed: 40 * Math.PI / 180,
    maxPull: 260,
    minPull: 28,
    maxLaunch: 1040,
    slingGravity: 1550,
    boosterVx: 280,
    boosterShipVx: 420,
    boosterTime: 0.45,
    startX: 420,
    biomeSpan: 4200,
    step: 1 / 120
  };

  DM.fx = {
    flies: [],
    dust: [],
    smoke: [],
    reset: function () {
      this.flies.length = 0;
      this.dust.length = 0;
      this.smoke.length = 0;
    },
    puff: function (x, y) {
      var spreads = [-110, -78, -50, -28, -12, 0, 12, 28, 50, 78, 110];
      var i;
      for (i = 0; i < spreads.length; i++) {
        this.smoke.push({
          x: x + spreads[i] * 0.35,
          y: y - 10,
          vx: spreads[i] * 0.55,
          vy: -22 - (i % 3) * 10,
          r: 22 + (i % 3) * 10,
          grow: 36,
          life: 1.1,
          max: 1.1
        });
      }
    },
    fly: function (sx, sy, kind) {
      var target = kind === "heart" ? { x: 980, y: 40 } : { x: 1100, y: 40 };
      if (DM.ui && DM.ui.anchor) target = DM.ui.anchor(kind);
      this.flies.push({
        x: sx, y: sy, x0: sx, y0: sy,
        tx: target.x, ty: target.y,
        t: 0, kind: kind
      });
    },
    tick: function (dt, worldDt) {
      var i;
      for (i = this.flies.length - 1; i >= 0; i--) {
        var f = this.flies[i];
        f.t += dt / 0.5;
        if (f.t >= 1) this.flies.splice(i, 1);
      }
      for (i = this.dust.length - 1; i >= 0; i--) {
        var d = this.dust[i];
        d.life -= worldDt;
        d.x += d.vx * worldDt;
        d.y += d.vy * worldDt;
        if (d.life <= 0) this.dust.splice(i, 1);
      }
      for (i = this.smoke.length - 1; i >= 0; i--) {
        var s = this.smoke[i];
        s.life -= dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 18 * dt;
        if (s.life <= 0) this.smoke.splice(i, 1);
      }
    },
    draw: function (ctx, game) {
      var i;
      ctx.save();
      var zoom = game.zoom || 1;
      var cam = game.cam || { x: 0, y: 0 };
      ctx.setTransform(zoom, 0, 0, zoom, -cam.x * zoom, -cam.y * zoom);
      for (i = 0; i < this.smoke.length; i++) {
        var s = this.smoke[i];
        var grown = 1 - s.life / s.max;
        ctx.globalAlpha = Math.max(0, s.life / s.max) * 0.82;
        ctx.fillStyle = "#b7c0ca";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r + grown * s.grow, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = Math.max(0, s.life / s.max) * 0.9;
        ctx.strokeStyle = "#3e4650";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      for (i = 0; i < this.dust.length; i++) {
        var d = this.dust[i];
        ctx.globalAlpha = Math.max(0, d.life / d.max);
        ctx.fillStyle = "#fff6e0";
        ctx.fillRect(d.x, d.y, 5, 4);
      }
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (i = 0; i < this.flies.length; i++) {
        var f = this.flies[i];
        var k = Math.min(1, f.t);
        var e = 1 - Math.pow(1 - k, 2);
        var x = f.x0 + (f.tx - f.x0) * e;
        var y = f.y0 + (f.ty - f.y0) * e - Math.sin(k * Math.PI) * 36;
        if (f.kind === "heart") {
          DM.heartPath(ctx, x, y, 12);
          ctx.fillStyle = "#ff4d6d";
          ctx.fill();
        } else {
          ctx.fillStyle = "#ffbf1f";
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#8a5a00";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }
  };

  DM.game = {
    state: "menu",
    stateBeforePause: "play",
    mode: "endless",
    levelIndex: 1,
    world: null,
    player: null,
    zoom: 1,
    zoomRecover: 0,
    camY: 0,
    cam: { x: 0, y: 0 },
    acc: 0,
    startGrace: 0,
    menuTime: 0,
    lastPrime: 0,
    firstClear: false,
    ctx: null,
    init: function (canvas) {
      this.canvas = canvas || null;
      this.ctx = canvas ? canvas.getContext("2d") : null;
      this.state = "menu";
      DM.save.ready();
      if (DM.ui) DM.ui.show("menu");
    },
    startEndless: function () {
      this.mode = "endless";
      this.levelIndex = 1;
      this.world = DM.createEndless();
      this.spawnPlayer();
    },
    startTempo: function (id) {
      var track = null;
      var i;
      for (i = 0; i < DM.TRACKS.length; i++) if (DM.TRACKS[i].id === id) track = DM.TRACKS[i];
      if (!track) return;
      var save = DM.save.ready();
      var lastTrack = DM.TRACKS.length;
      if (id < 1 || id > lastTrack || id > (save.unlockedTrack || 1)) return;
      this.mode = "tempo";
      this.trackId = id;
      this.levelIndex = id;
      this.world = DM.createTempo(track);
      this.spawnPlayer();
    },
    startLevel: function (index) {
      var save = DM.save.ready();
      var last = DM.ADVENTURE ? DM.ADVENTURE.length : 20;
      if (index < 1 || index > last || index > save.unlockedLevel) return;
      this.mode = "adventure";
      this.levelIndex = index;
      this.world = DM.createAdventure(index);
      this.spawnPlayer();
    },
    spawnPlayer: function () {
      this.returnSnap = null;
      this.iris = 0;
      this.irisPhase = null;
      this.pastTime = 0;
      this.diamondAcc = 0;
      this.player = new DM.Player();
      this.player.reset(this.world.startX);
      this.world.speedAnchor = this.world.startX;
      this.world.startX = DM.config.startX;
      this.world.armChase();
      DM.bonus.clear();
      DM.fx.reset();
      this.zoom = 1;
      this.zoomRecover = 0;
      this.camY = 0;
      this.camLockX = null;
      this.acc = 0;
      this.startGrace = 0.12;
      this.lastPrime = 0;
      this.attemptTime = 0;
      this.lastBeat = -1;
      this.state = "play";
      if (DM.music) {
        if (this.mode === "tempo") DM.music.stop();
        else if (this.mode === "adventure") {
          DM.music.stop();
          DM.music.modeSong = "silent";
        } else DM.music.startBiome(0);
      }
      if (DM.ui) DM.ui.show("play");
    },
    frame: function (realDt) {
      if (this.zoomRecover > 0 && this.state === "play") {
        this.zoomRecover -= realDt;
        var k = 1 - Math.max(0, this.zoomRecover) / 0.28;
        this.zoom = DM.config.zoomMin + (1 - DM.config.zoomMin) * k;
        if (this.zoomRecover <= 0) this.zoom = 1;
      }
      if (this.state === "ceilingFall") {
        this.fallShip(realDt);
      } else if (this.state === "ceilingWait") {
        this.ceilingWait -= realDt;
        if (this.ceilingWait <= 0) this.die();
      } else if (this.state === "ceilingSave") {
        this.projectShip(realDt);
      } else if (this.state === "burn") {
        this.burnT -= realDt;
        if (this.player) this.player.anim += realDt;
        if (this.world) this.world.time += realDt;
        if (this.burnT <= 0) {
          if (this.player) this.player.burning = false;
          this.state = "play";
          this.skipBurn = true;
          this.resolve(this.pendingHit || "flame");
          this.skipBurn = false;
        }
      } else if (this.state === "pitfall") {
        this.stepPitfall(realDt);
      } else if (this.state === "iris") {
        this.stepIris(realDt);
      } else if (this.state === "pastwait") {
        this.pastWait -= realDt;
        if (this.world) this.world.time += realDt;
        if (this.pastWait <= 0) this.beginDrop();
      } else if (this.state === "pastdrop") {
        this.stepDrop(realDt);
      } else if (this.state === "play") {
        if (!(this.mode === "tempo" && this.world && this.world.waiting)) this.attemptTime += realDt;
        if (this.mode === "past") this.gainDiamonds(realDt);
        if (this.player && this.player.form === "ship") {
          this.player.shipLeft -= realDt;
          if (this.player.shipLeft <= 0) this.revertShip();
        }
        if (this.world && this.mode === "endless" && !this.world.allowShip && this.attemptTime >= DM.config.shipUnlock) {
          this.world.allowShip = true;
          this.world.releaseShips(this.player.x);
        }
        var scale = DM.bonus.scale();
        this.acc += realDt * scale;
        var steps = 0;
        var step = DM.config.step;
        while (this.acc >= step && steps < 6) {
          this.simulate(step);
          this.acc -= step;
          steps++;
        }
        if (steps === 6) this.acc = 0;
        DM.bonus.tick(realDt);
        DM.fx.tick(realDt, realDt * scale);
      } else if (this.state === "slingshot") {
        if (this.mode === "past") this.gainDiamonds(realDt);
        DM.sling.update(realDt, DM.input, this);
        DM.bonus.tick(realDt);
        DM.fx.tick(realDt, realDt);
      } else if (this.state === "menu" || this.state === "adventure" || this.state === "shop") {
        this.menuTime += realDt;
      } else if (this.state === "dead" || this.state === "clear") {
        DM.fx.tick(realDt, 0);
      }
      if (DM.music) {
        if (this.state === "play" && this.mode === "endless" && this.world && this.player) {
          DM.music.syncBiome(this.world.biomeIndexAt(this.player.x));
        }
        DM.music.tick();
      }
      DM.input.jumpEdge = false;
      this.draw();
      if (DM.ui) DM.ui.sync(this);
    },
    simulate: function (dt) {
      if (this.state !== "play") return;
      this.tickGrow(dt);
      var input = DM.input;
      if (this.startGrace > 0) {
        this.startGrace -= dt;
        input.jumpEdge = false;
      }
      if (this.mode === "tempo" && this.world.waiting && (input.jumpEdge || input.jumpHeld || input.left || input.right || input.up || input.down)) {
        this.world.waiting = false;
        this.attemptTime = 0;
        if (DM.music) DM.music.startTrack(this.trackId);
      }
      this.world.follow(this.player.x, this.player);
      var hit = this.player.update(dt, input, this.world);
      if (!(this.mode === "tempo" && this.world.waiting) && this.player.x >= this.world.fireFollowX) this.world.scrolling = true;
      if (this.mode === "tempo") {
        var viewW = 1280 / (this.zoom || 1);
        var camLeft = this.world.scrolling ? this.player.x - viewW * 0.38 : this.world.introCamX;
        this.world.syncFire(dt, camLeft, viewW, this.player);
        this.world.igniteBehind();
      }
      input.jumpEdge = false;
      if (this.state !== "play") return;
      if (this.player.form === "ship" && this.player.invuln <= 0 && this.player.bounds().y <= 1) {
        this.beginCeiling();
        return;
      }
      if (hit === "portal") {
        var gate = this.world.portalPit(this.player);
        if (gate && this.mode === "endless") {
          this.beginPortal(gate);
          return;
        }
      }
      if (hit) {
        this.resolve(hit);
        return;
      }
      var game = this;
      this.world.collect(this.player, function (entity) { game.onPickup(entity); });
      this.world.tick(dt, this.player);
      if (this.state === "play" && (this.mode === "adventure" || this.mode === "tempo") && this.player.x >= this.world.finish) this.win();
    },
    onPickup: function (entity) {
      var player = this.player;
      var C = DM.config;
      if (entity.kind === "coin" || entity.kind === "aircoin") {
        if (entity.kind === "aircoin" && player.form !== "ship") return;
        DM.save.addCoins(entity.kind === "aircoin" ? C.airCoinValue : C.coinValue);
        this.spawnFly(entity, "coin");
        entity.dead = true;
      } else if (entity.kind === "heart") {
        player.lives += 1;
        this.spawnFly(entity, "heart");
        entity.dead = true;
      } else if (entity.kind === "grow") {
        this.beginGrow();
        this.world.suppressBoost("grow", player.x, this.world.moveSpeed(player));
      } else if (entity.kind === "fast" || entity.kind === "slow") {
        DM.bonus.start(entity.kind === "fast" ? "speed" : "slow");
        this.world.suppressBoost(entity.kind, player.x, this.world.moveSpeed(player));
        entity.dead = true;
      } else if (entity.kind === "orb") {
        if (entity.form === "ship") {
          if (this.attemptTime < C.shipUnlock || this.mode === "tempo") return;
          if (player.form !== "ship") {
            player.form = "ship";
            var cruise = C.groundY - C.shipLift;
            if (player.y > cruise) {
              player.y = cruise;
              player.vy = 0;
              player.autoThrust = C.shipAuto;
            } else if (player.vy < 0) {
              player.vy = 0;
              player.autoThrust = 0;
            }
            player.grounded = false;
            player.invuln = Math.max(player.invuln, 0.45);
            player.airJump = 0;
          }
          player.shipLeft = C.shipDuration;
          this.world.suppressBoost("ship", player.x, this.world.moveSpeed(player));
        } else if (player.form !== "runner") {
          var airborne = !player.grounded && player.y <= C.groundY + 2;
          player.form = "runner";
          player.shipLeft = 0;
          player.autoThrust = 0;
          player.invuln = Math.max(player.invuln, 0.2);
          if (airborne) player.airJump = 1;
          this.world.clearRibbon();
        }
      } else if (entity.kind === "booster") {
        player.boost();
      }
    },
    spawnFly: function (entity, kind) {
      var cam = this.camera();
      var sx = (entity.x - cam.x) * this.zoom;
      var sy = (entity.y - cam.y) * this.zoom;
      DM.fx.fly(sx, sy, kind);
    },
    beginGrow: function () {
      var player = this.player;
      if (!player) return;
      if (player.big || player.growing) {
        this.world.removeGrows();
        return;
      }
      player.growing = true;
      player.big = true;
      player.growT = 0;
      player.visualScale = 1;
      this.world.removeGrows();
    },
    tickGrow: function (dt) {
      var player = this.player;
      if (!player || !player.growing) return;
      player.growT += dt;
      var k = Math.min(1, player.growT / 0.9);
      var steps = [1, 1.2, 1.4, DM.config.bigScale];
      player.visualScale = steps[Math.min(3, Math.floor(k * 4))];
      if (k < 1) return;
      player.growing = false;
      player.growT = 0;
      player.big = true;
      player.visualScale = 0;
    },
    resolve: function (kind) {
      if (this.state !== "play" || this.player.invuln > 0) return;
      if (this.mode === "past") {
        this.die();
        return;
      }
      if (kind === "flame" && !this.skipBurn) {
        this.pendingHit = "flame";
        this.burnT = 0.5;
        this.player.burning = true;
        this.state = "burn";
        return;
      }
      if (DM.bonus.hot()) {
        this.die();
        return;
      }
      var hit = kind === "spike" || kind === "obstacle" || kind === "flame" || kind === "pit";
      if (!hit) return;
      if (this.player.big || this.player.lives > 0) {
        if (this.player.big) {
          this.player.big = false;
          this.player.growing = false;
          this.player.growT = 0;
          this.player.visualScale = 0;
          if (DM.music) DM.music.sting();
        } else {
          this.spendLife();
        }
        this.beginSling();
        return;
      }
      this.die();
    },
    spendLife: function () {
      if (!this.player || this.player.lives <= 0) return;
      this.player.lives -= 1;
      if (DM.music) DM.music.sting();
      if (DM.ui) DM.ui.popLife();
    },
    beginCeiling: function () {
      var player = this.player;
      if (!player || player.form !== "ship") return;
      if (DM.bonus.hot() || (!player.big && player.lives <= 0)) {
        this.state = "ceilingFall";
        player.autoThrust = 0;
        if (player.vy < 40) player.vy = 40;
        if (DM.ui) DM.ui.sync(this);
        return;
      }
      this.saveBig = !!player.big;
      if (!player.big) this.spendLife();
      this.saveT = 0;
      this.saveFrom = { x: player.x, y: player.y };
      var cam = this.camera();
      this.saveTo = { x: cam.x + 640, y: 360 };
      player.autoThrust = 0;
      player.vy = 0;
      if (this.saveBig) player.visualScale = DM.config.bigScale;
      this.state = "ceilingSave";
      if (DM.ui) DM.ui.sync(this);
    },
    fallShip: function (dt) {
      var player = this.player;
      var C = DM.config;
      if (!player) return;
      player.vy += C.shipGravity * dt;
      if (player.vy > C.shipMax) player.vy = C.shipMax;
      player.y += player.vy * dt;
      var floor = C.groundY;
      if (this.world.groundAt(player.x) == null) floor = C.groundY + C.pitDepth;
      if (player.y >= floor) {
        player.y = floor;
        player.vy = 0;
        this.state = "ceilingWait";
        this.ceilingWait = C.ceilingDelay;
      }
    },
    projectShip: function (dt) {
      var player = this.player;
      this.saveT += dt;
      var k = Math.min(1, this.saveT / 0.9);
      var e = 1 - Math.pow(1 - k, 3);
      player.x = this.saveFrom.x + (this.saveTo.x - this.saveFrom.x) * e;
      player.y = this.saveFrom.y + (this.saveTo.y - this.saveFrom.y) * e;
      player.vy = 0;
      if (this.saveBig) {
        var steps = [DM.config.bigScale, 1.4, 1.2, 1];
        player.visualScale = steps[Math.min(3, Math.floor(k * 4))];
      }
      if (k < 1) return;
      player.visualScale = 0;
      player.growing = false;
      player.growT = 0;
      if (this.saveBig) player.big = false;
      player.form = "ship";
      player.grounded = false;
      player.vy = 80;
      player.invuln = DM.config.invuln;
      this.state = "play";
      if (DM.ui) DM.ui.show("play");
    },
    revertShip: function () {
      var player = this.player;
      var C = DM.config;
      if (!player || player.form !== "ship") return;
      var airborne = !player.grounded && player.y <= C.groundY + 2;
      player.form = "runner";
      player.shipLeft = 0;
      player.autoThrust = 0;
      if (airborne) player.airJump = 1;
      if (this.world) this.world.clearRibbon();
    },
    beginSling: function () {
      this.state = "slingshot";
      this.world.speedAnchor = this.player.x;
      DM.sling.begin(this.player);
      if (DM.ui) DM.ui.show("slingshot");
    },
    land: function (y) {
      var player = this.player;
      player.freeFly = false;
      player.flyVx = 0;
      player.spin = 0;
      player.big = false;
      player.y = y;
      if (this.world.landingHazard(player)) {
        this.die();
        return;
      }
      if (player.form === "ship") {
        var cruise = DM.config.groundY - DM.config.shipLift;
        player.y = y - 40;
        if (player.y > cruise) player.y = cruise;
        player.vy = 0;
        player.grounded = false;
        player.autoThrust = DM.config.shipAuto;
        player.invuln = 0.45;
      } else {
        player.y = y;
        player.vy = 0;
        player.grounded = true;
        player.invuln = 0.45;
      }
      this.world.speedAnchor = player.x;
      this.zoom = DM.config.zoomMin;
      this.zoomRecover = 0.28;
      this.state = "play";
      if (DM.ui) DM.ui.show("play");
      if (this.mode === "adventure" && player.x >= this.world.finish) this.win();
    },
    gainDiamonds: function (dt) {
      this.pastTime = (this.pastTime || 0) + dt;
      this.diamondAcc = (this.diamondAcc || 0) + dt;
      while (this.diamondAcc >= 10) {
        this.diamondAcc -= 10;
        DM.save.addDiamonds(1);
      }
    },
    beginPortal: function (pit) {
      var player = this.player;
      this.returnSnap = {
        world: this.world,
        mode: this.mode,
        levelIndex: this.levelIndex,
        trackId: this.trackId,
        x: pit.x + pit.w + 56,
        form: player.form,
        big: player.big,
        lives: player.lives,
        shipLeft: player.shipLeft,
        growing: player.growing,
        growT: player.growT,
        visualScale: player.visualScale,
        attemptTime: this.attemptTime,
        pit: pit
      };
      var back = pit.x - 72;
      var guard = 0;
      while (this.world.groundAt(back) == null && guard++ < 16) back -= 36;
      this.returnSnap.x = back;
      this.pitTargetX = pit.x + pit.w * 0.5;
      this.state = "pitfall";
      this.seqT = 0;
      player.grounded = false;
      player.buffer = 0;
      player.onChicken = false;
    },
    stepPitfall: function (dt) {
      var player = this.player;
      player.x += (this.pitTargetX - player.x) * Math.min(1, dt * 6);
      player.vy += 2000 * dt;
      if (player.vy > 1400) player.vy = 1400;
      player.y += player.vy * dt;
      player.anim += dt;
      this.world.time += dt;
      this.seqT += dt;
      if (player.y > DM.config.groundY + DM.config.pitDepth + 36 || this.seqT > 0.85) {
        this.iris = 0;
        this.irisDir = 1;
        this.irisPhase = "toPast";
        this.state = "iris";
      }
    },
    stepIris: function (dt) {
      this.iris += this.irisDir * dt / 0.42;
      if (this.world) this.world.time += dt;
      if (this.irisDir > 0 && this.iris >= 1) {
        this.iris = 1;
        if (this.irisPhase === "toPast") this.openPast();
        else this.restoreRun();
        this.irisDir = -1;
      } else if (this.irisDir < 0 && this.iris <= 0) {
        this.iris = 0;
        if (this.irisPhase === "toPast") {
          this.state = "pastwait";
          this.pastWait = 2;
        } else {
          this.irisPhase = null;
          this.state = "play";
          if (DM.ui) DM.ui.show("play");
        }
      }
    },
    openPast: function () {
      var player = this.player;
      this.mode = "past";
      this.world = DM.createPast();
      this.chickenX = this.world.startX + 260;
      player.form = "runner";
      player.onChicken = false;
      player.hidden = true;
      player.burning = false;
      player.screaming = false;
      player.x = this.chickenX;
      player.y = DM.config.groundY - 340;
      player.vy = 0;
      player.grounded = false;
      player.big = this.returnSnap.big;
      player.lives = this.returnSnap.lives;
      player.shipLeft = 0;
      this.world.scrolling = true;
      this.diamondAcc = 0;
      this.pastTime = 0;
      this.camY = 0;
    },
    beginDrop: function () {
      var player = this.player;
      this.state = "pastdrop";
      player.hidden = false;
      player.screaming = true;
      player.x = this.chickenX;
      player.y = DM.config.groundY - 280;
      player.vy = 80;
      player.grounded = false;
      if (DM.music) DM.music.scream();
    },
    stepDrop: function (dt) {
      var player = this.player;
      player.vy += 1500 * dt;
      player.y += player.vy * dt;
      player.anim += dt;
      if (this.world) this.world.time += dt;
      if (player.y >= DM.config.groundY) {
        player.y = DM.config.groundY;
        player.vy = 0;
        player.grounded = true;
        player.onChicken = true;
        player.screaming = false;
        player.hidden = false;
        player.invuln = 0.35;
        this.state = "play";
        this.world.scrolling = true;
      }
    },
    beginReturn: function () {
      this.iris = 0;
      this.irisDir = 1;
      this.irisPhase = "toBack";
      this.state = "iris";
      if (this.player) {
        this.player.onChicken = false;
        this.player.screaming = false;
        this.player.burning = false;
        this.player.hidden = false;
      }
    },
    restoreRun: function () {
      var snap = this.returnSnap;
      var player = this.player;
      if (!snap || !player) return;
      this.world = snap.world;
      this.mode = snap.mode;
      this.levelIndex = snap.levelIndex;
      this.trackId = snap.trackId;
      this.attemptTime = snap.attemptTime;
      player.x = snap.x;
      player.form = snap.form === "ship" ? "ship" : "runner";
      player.big = !!snap.big;
      player.lives = snap.lives | 0;
      player.shipLeft = player.form === "ship" ? snap.shipLeft : 0;
      player.growing = !!snap.growing;
      player.growT = snap.growT || 0;
      player.visualScale = snap.visualScale || 0;
      player.onChicken = false;
      player.hidden = false;
      player.screaming = false;
      player.burning = false;
      player.vy = 0;
      player.extraVx = 0;
      player.invuln = 1;
      if (player.form === "ship") {
        player.y = DM.config.groundY - DM.config.shipLift;
        player.grounded = false;
      } else {
        player.y = DM.config.groundY;
        player.grounded = true;
      }
      this.camY = 0;
      this.camLockX = null;
      if (snap.pit) snap.pit.spiked = true;
      this.returnSnap = null;
    },
    die: function () {
      if (this.state === "dead") return;
      if (this.mode === "past" && this.returnSnap) {
        if (this.state !== "iris") this.beginReturn();
        return;
      }
      DM.bonus.clear();
      if (DM.music) DM.music.stop();
      var dist = this.distance();
      this.lastPrime = Math.floor(dist / DM.config.distancePerCoin);
      if (this.lastPrime > 0) DM.save.addCoins(this.lastPrime);
      this.player.freeFly = false;
      this.zoom = 1;
      this.zoomRecover = 0;
      this.state = "dead";
      if (DM.ui) DM.ui.show("dead", this);
    },
    win: function () {
      if (this.state !== "play") return;
      DM.bonus.clear();
      if (DM.music) DM.music.stop();
      if (this.mode === "tempo") {
        this.firstClear = DM.save.markTrack(this.trackId, this.attemptTime);
        this.lastPrime = 0;
        this.clearTime = this.attemptTime;
        this.zoom = 1;
        this.state = "clear";
        if (DM.ui) DM.ui.show("clear", this);
        return;
      }
      this.firstClear = DM.save.markClear(this.levelIndex);
      this.lastPrime = this.firstClear ? 50 * this.levelIndex : 0;
      this.zoom = 1;
      this.state = "clear";
      if (DM.ui) DM.ui.show("clear", this);
    },
    restart: function () {
      if (this.mode === "endless" || this.mode === "past") this.startEndless();
      else if (this.mode === "tempo") this.startTempo(this.trackId);
      else this.startLevel(this.levelIndex);
    },
    quit: function () {
      if (DM.music) DM.music.stop();
      this.state = "menu";
      this.player = null;
      if (DM.ui) DM.ui.show("menu");
    },
    togglePause: function () {
      if (this.state === "ceilingFall" || this.state === "ceilingWait" || this.state === "ceilingSave" || this.state === "pitfall" || this.state === "iris" || this.state === "pastwait" || this.state === "pastdrop" || this.state === "burn") return;
      if (this.state === "play" || this.state === "slingshot") {
        this.stateBeforePause = this.state;
        this.state = "pause";
        if (DM.music) DM.music.stop();
        if (DM.ui) DM.ui.show("pause");
      } else if (this.state === "pause") {
        this.state = this.stateBeforePause || "play";
        if (this.state === "play" && this.mode !== "adventure" && DM.music && !(this.mode === "tempo" && this.world && this.world.waiting)) DM.music.resume();
        if (DM.ui) DM.ui.show(this.state);
      }
    },
    distance: function () {
      if (!this.player || !this.world) return 0;
      return Math.max(0, this.player.x - this.world.startX);
    },
    keepInView: function () {
      var player = this.player;
      if (!player || player.hidden || this.state !== "play") return;
      var cam = this.camera();
      var viewW = 1280 / (this.zoom || 1);
      var viewH = 720 / (this.zoom || 1);
      var pad = 6;
      var box = player.bounds();
      var left = cam.x + pad;
      var right = cam.x + viewW - pad;
      var top = cam.y + pad;
      var bottom = cam.y + viewH - pad;
      if (box.x < left) {
        player.x += left - box.x;
        if (player.extraVx < 0) player.extraVx = 0;
      }
      box = player.bounds();
      if (box.x + box.w > right) {
        player.x -= box.x + box.w - right;
        if (player.extraVx > 0) player.extraVx = 0;
      }
      box = player.bounds();
      if (box.y < top) {
        player.y += top - box.y;
        if (player.vy < 0) player.vy = 0;
      }
      box = player.bounds();
      if (box.y + box.h > bottom) {
        player.y -= box.y + box.h - bottom;
        if (player.vy > 0) player.vy = 0;
      }
    },
    camera: function () {
      var zoom = this.zoom || 1;
      var viewW = 1280 / zoom;
      var viewH = 720 / zoom;
      var px = this.player ? this.player.x : DM.config.startX;
      var py = this.player ? this.player.y : DM.config.groundY;
      var world = this.world;
      var x = world && world.scrolling ? px - viewW * 0.38 : (world && world.introCamX ? world.introCamX : px - viewW * 0.28);
      var hold = this.mode === "endless" && world && world.scrolling && (this.state === "play" || (this.state === "pause" && this.stateBeforePause === "play"));
      if (hold) {
        if (this.camLockX == null || x > this.camLockX) this.camLockX = x;
        else x = this.camLockX;
      }
      var y = 0;
      var lookDown = this.state === "pitfall" || (this.state === "iris" && this.irisPhase === "toPast" && this.irisDir > 0);
      var sling = this.state === "slingshot" || (this.state === "pause" && this.stateBeforePause === "slingshot");
      if (lookDown) {
        y = py - viewH * 0.42;
        if (y < 0) y = 0;
      } else if (zoom < 0.98 || sling) {
        y = py - viewH * 0.62;
      }
      if (y > 0) y = 0;
      if (y < -280) y = -280;
      return { x: x, y: y };
    },
    worldToScreen: function (x, y) {
      var cam = this.cam || this.camera();
      return { x: (x - cam.x) * this.zoom, y: (y - cam.y) * this.zoom };
    },
    draw: function () {
      if (!this.ctx || !this.player || !this.world) return;
      if (this.state === "menu" || this.state === "adventure" || this.state === "shop" || this.state === "tracks") return;
      var ctx = this.ctx;
      var cam = this.camera();
      var zoom = this.zoom;
      this.cam = cam;
      var targetY = cam.y;
      this.camY += (targetY - this.camY) * 0.2;
      cam.y = this.camY;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, 1280, 720);
      ctx.setTransform(zoom, 0, 0, zoom, -cam.x * zoom, -cam.y * zoom);
      this.world.draw(ctx, cam, zoom, this.player);
      if (this.mode === "past" && this.player && !this.player.onChicken && DM.drawChicken) {
        DM.drawChicken(ctx, this.chickenX || this.player.x, DM.config.groundY, true, this.world.time);
      }
      this.player.draw(ctx);
      var showSling = this.state === "slingshot" || (this.state === "pause" && this.stateBeforePause === "slingshot");
      if (showSling) DM.sling.drawWorld(ctx, this);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.drawSpeedLines(ctx);
      this.drawBeat(ctx);
      DM.fx.draw(ctx, this);
      if (showSling) DM.sling.drawScreen(ctx, this);
      this.drawIris(ctx);
    },
    drawIris: function (ctx) {
      var t = this.iris || 0;
      if (t <= 0.001) return;
      if (t > 1) t = 1;
      ctx.fillStyle = "#07060a";
      var w = 640 * t;
      var h = 360 * t;
      ctx.fillRect(0, 0, w, 720);
      ctx.fillRect(1280 - w, 0, w, 720);
      ctx.fillRect(0, 0, 1280, h);
      ctx.fillRect(0, 720 - h, 1280, h);
    },
    drawBeat: function (ctx) {
      if (this.mode !== "tempo" || !this.world || !this.world.track) return;
      if (this.state !== "play") return;
      var beat = 60 / this.world.track.bpm;
      var phase = (this.attemptTime / beat) % 1;
      if (phase < 0) phase += 1;
      if (phase > 0.16) return;
      ctx.fillStyle = "rgba(255, 214, 70, " + (0.45 * (1 - phase / 0.16)) + ")";
      ctx.fillRect(0, 0, 1280, 16);
    },
    drawSpeedLines: function (ctx) {
      if (!this.player || this.state !== "play") return;
      var fast = DM.bonus.kind === "speed" || this.world.scrollSpeed(this.player) > 560;
      if (!fast) return;
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "#fff6d8";
      ctx.lineWidth = 2;
      var i;
      var t = this.world.time;
      for (i = 0; i < 8; i++) {
        var y = ((i * 90 + t * 220) % 720);
        ctx.beginPath();
        ctx.moveTo(1280, y);
        ctx.lineTo(980, y + 8);
        ctx.stroke();
      }
      ctx.restore();
    }
  };
})();
