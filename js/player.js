(function () {
  "use strict";
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  var DM = root.DM || (root.DM = {});

  var LOOKS = {
    classique: { body: "#ffcc33", accent: "#e07a00", ink: "#2a2118", eye: "#2a2118", kind: "human" },
    dino: { body: "#57b35a", accent: "#2f7d38", ink: "#16331a", eye: "#102014", kind: "dino" },
    cube: { body: "#49c0ff", accent: "#1d6dff", ink: "#102033", eye: "#102033", kind: "cube" },
    astronaute: { body: "#e8eef5", accent: "#f0b429", ink: "#1c2430", eye: "#14324a", kind: "astro" },
    chat: { body: "#f4a259", accent: "#e76f51", ink: "#3a2418", eye: "#2a160f", kind: "cat" },
    robot: { body: "#9aa3ad", accent: "#3ee0c2", ink: "#1d242c", eye: "#08211c", kind: "robot" },
    oiseau: { body: "#ff5d73", accent: "#ffd166", ink: "#3a1420", eye: "#2a1018", kind: "bird" },
    spectre: { body: "#b08cff", accent: "#f4edff", ink: "#2a1848", eye: "#1a1030", kind: "ghost" },
    renard: { body: "#e07a3a", accent: "#fff3e0", ink: "#3a2010", eye: "#1a1008", kind: "fox" },
    lapin: { body: "#f7f4ef", accent: "#f2a7c3", ink: "#3a3038", eye: "#201820", kind: "bunny" },
    ninja: { body: "#2c3140", accent: "#e23b4a", ink: "#101218", eye: "#f4f7ff", kind: "ninja" },
    chevalier: { body: "#c5ccd6", accent: "#f0c14a", ink: "#1c2430", eye: "#142033", kind: "knight" },
    sorcier: { body: "#3d348b", accent: "#f2d04b", ink: "#1a1430", eye: "#f7f3ff", kind: "wizard" },
    pirate: { body: "#6b3a2a", accent: "#f4f4f4", ink: "#24140e", eye: "#1a100c", kind: "pirate" },
    panda: { body: "#f7f7f7", accent: "#1c1c1c", ink: "#111111", eye: "#111111", kind: "panda" },
    alien: { body: "#7dce6a", accent: "#d7ff6a", ink: "#163318", eye: "#081408", kind: "alien" }
  };

  function look(id) {
    return LOOKS[id] || LOOKS.classique;
  }

  function roundRect(ctx, x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function eye(ctx, ink, x, y, s) {
    ctx.fillStyle = "#fffdf8";
    ctx.beginPath();
    ctx.arc(x, y, 4.2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(x + 1.2 * s, y, 2 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRunner(ctx, id, bob, sit) {
    var L = look(id);
    var s = bob || 0;
    if (!sit) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = L.ink;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (L.kind === "cube") {
      ctx.save();
      ctx.translate(0, -28 + Math.sin(s) * 2);
      ctx.rotate(Math.sin(s * 2) * 0.08);
      ctx.fillStyle = L.body;
      roundRect(ctx, -18, -18, 36, 36, 6);
      ctx.fill();
      ctx.stroke();
      eye(ctx, L.eye, -6, -2, 1);
      eye(ctx, L.eye, 8, -2, 1);
      ctx.restore();
      return;
    }

    if (L.kind === "dino") {
      var leg = Math.sin(s * 10);
      ctx.strokeStyle = L.ink;
      ctx.fillStyle = L.body;
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(-14, -8 + leg * 6);
      ctx.lineTo(-4, 0);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, -8);
      ctx.lineTo(12, -8 - leg * 6);
      ctx.lineTo(4, 0);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-20, -30);
      ctx.quadraticCurveTo(-34, -16, -16, -18);
      ctx.quadraticCurveTo(-8, -36, 8, -48);
      ctx.lineTo(22, -40);
      ctx.lineTo(16, -28);
      ctx.quadraticCurveTo(4, -20, -6, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      eye(ctx, L.eye, 8, -40, 0.9);
      return;
    }

    var legSwing = Math.sin(s * 10) * 7;
    ctx.fillStyle = L.body;
    if (sit) {
      ctx.beginPath();
      ctx.moveTo(-10, -24);
      ctx.lineTo(8, -16);
      ctx.lineTo(6, -8);
      ctx.lineTo(-8, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-2, -22);
      ctx.lineTo(16, -12);
      ctx.lineTo(14, -4);
      ctx.lineTo(0, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-8, -26);
      ctx.lineTo(-12, -6);
      ctx.lineTo(-12 + legSwing, 0);
      ctx.lineTo(-2, -4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, -26);
      ctx.lineTo(8, -6);
      ctx.lineTo(8 - legSwing, 0);
      ctx.lineTo(0, -4);
      ctx.fill();
      ctx.stroke();
    }

    if (L.kind === "ghost") {
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(-16, -24);
      ctx.lineTo(-16, -46);
      ctx.quadraticCurveTo(-16, -66, 0, -66);
      ctx.quadraticCurveTo(16, -66, 16, -46);
      ctx.lineTo(16, -24);
      ctx.lineTo(8, -30);
      ctx.lineTo(0, -22);
      ctx.lineTo(-8, -30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      eye(ctx, L.eye, -6, -46, 1);
      eye(ctx, L.eye, 6, -46, 1);
      ctx.globalAlpha = 1;
      return;
    }

    roundRect(ctx, -14, -52, 28, 30, 8);
    ctx.fill();
    ctx.stroke();

    if (L.kind === "cat") {
      ctx.beginPath();
      ctx.moveTo(-12, -50);
      ctx.lineTo(-18, -64);
      ctx.lineTo(-4, -52);
      ctx.moveTo(12, -50);
      ctx.lineTo(18, -64);
      ctx.lineTo(4, -52);
      ctx.fill();
      ctx.stroke();
    } else if (L.kind === "astro") {
      ctx.fillStyle = L.accent;
      roundRect(ctx, -10, -46, 20, 12, 4);
      ctx.fill();
      ctx.strokeStyle = L.ink;
      ctx.stroke();
    } else if (L.kind === "robot") {
      ctx.fillStyle = L.accent;
      ctx.fillRect(-2, -62, 4, 10);
      ctx.beginPath();
      ctx.arc(0, -64, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (L.kind === "bird") {
      ctx.fillStyle = L.accent;
      ctx.beginPath();
      ctx.moveTo(10, -40);
      ctx.lineTo(24, -36);
      ctx.lineTo(10, -32);
      ctx.fill();
      ctx.fillStyle = L.body;
      ctx.beginPath();
      ctx.ellipse(-2, -36, 10, 6, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (L.kind !== "bird") {
      eye(ctx, L.kind === "astro" ? "#08283c" : L.eye, -5, -40, 1);
      eye(ctx, L.kind === "astro" ? "#08283c" : L.eye, 6, -40, 1);
    } else {
      eye(ctx, L.eye, 2, -38, 0.9);
    }
    drawMark(ctx, L);
    ctx.fillStyle = L.accent;
    if (L.kind === "human" || L.kind === "robot") {
      ctx.fillRect(-8, -34, 16, 5);
    }
  }

  function drawMark(ctx, L) {
    ctx.fillStyle = L.accent;
    ctx.strokeStyle = L.ink;
    if (L.kind === "fox") {
      ctx.beginPath();
      ctx.moveTo(-12, -50);
      ctx.lineTo(-20, -66);
      ctx.lineTo(-4, -52);
      ctx.moveTo(10, -50);
      ctx.lineTo(18, -66);
      ctx.lineTo(2, -52);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-14, -28);
      ctx.quadraticCurveTo(-36, -20, -40, -8);
      ctx.quadraticCurveTo(-24, -16, -12, -24);
      ctx.fill();
    } else if (L.kind === "bunny") {
      ctx.beginPath();
      ctx.ellipse(-8, -68, 4, 14, -0.2, 0, Math.PI * 2);
      ctx.ellipse(8, -68, 4, 14, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (L.kind === "ninja") {
      ctx.fillStyle = L.accent;
      ctx.fillRect(-14, -44, 28, 6);
    } else if (L.kind === "knight") {
      ctx.fillStyle = L.accent;
      ctx.fillRect(-12, -58, 24, 6);
      ctx.fillRect(-2, -64, 4, 8);
    } else if (L.kind === "wizard") {
      ctx.beginPath();
      ctx.moveTo(-14, -50);
      ctx.lineTo(0, -84);
      ctx.lineTo(14, -50);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (L.kind === "pirate") {
      ctx.fillStyle = L.accent;
      ctx.fillRect(-14, -54, 28, 6);
      ctx.fillStyle = L.ink;
      ctx.beginPath();
      ctx.arc(6, -40, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (L.kind === "panda") {
      ctx.fillStyle = L.accent;
      ctx.beginPath();
      ctx.arc(-10, -54, 6, 0, Math.PI * 2);
      ctx.arc(10, -54, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-5, -40, 6, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(6, -40, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (L.kind === "alien") {
      ctx.strokeStyle = L.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -52);
      ctx.lineTo(-10, -70);
      ctx.moveTo(6, -52);
      ctx.lineTo(10, -70);
      ctx.stroke();
      ctx.fillStyle = L.accent;
      ctx.beginPath();
      ctx.arc(-10, -72, 3, 0, Math.PI * 2);
      ctx.arc(10, -72, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawShip(ctx, id, bob) {
    var L = look(id);
    var flicker = 0.6 + Math.sin((bob || 0) * 18) * 0.4;
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 20, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = L.ink;
    ctx.lineJoin = "round";
    ctx.fillStyle = L.body;
    ctx.beginPath();
    ctx.moveTo(-26, -8);
    ctx.lineTo(8, -18);
    ctx.lineTo(28, -8);
    ctx.lineTo(10, 2);
    ctx.lineTo(-24, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = L.accent;
    ctx.beginPath();
    ctx.ellipse(6, -10, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = L.kind === "ghost" ? "rgba(255,255,255,0.35)" : "#fff6d8";
    ctx.globalAlpha = flicker;
    ctx.beginPath();
    ctx.moveTo(-28, -4);
    ctx.lineTo(-40, 0);
    ctx.lineTo(-28, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (L.kind === "cat") {
      ctx.fillStyle = L.body;
      ctx.beginPath();
      ctx.moveTo(-4, -16);
      ctx.lineTo(-10, -28);
      ctx.lineTo(0, -16);
      ctx.moveTo(8, -16);
      ctx.lineTo(14, -28);
      ctx.lineTo(4, -16);
      ctx.fill();
      ctx.stroke();
    } else if (L.kind === "dino") {
      ctx.fillStyle = L.accent;
      ctx.fillRect(18, -16, 8, 6);
    } else if (L.kind === "astro") {
      ctx.fillStyle = L.accent;
      ctx.fillRect(-8, -20, 8, 4);
    }
    eye(ctx, L.eye, 6, -10, 0.7);
  }

  DM.paintCharacter = function (ctx, id, form, x, y, scale, phase, gear) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (form === "ship") drawShip(ctx, id, phase || 0);
    else drawRunner(ctx, id, phase || 0);
    drawAccessory(ctx, gear, look(id).kind, form === "ship");
    ctx.restore();
  };

  function Player() {
    this.reset(420);
  }

  Player.prototype.reset = function (x) {
    var C = DM.config;
    this.x = x;
    this.y = C.groundY;
    this.prevY = this.y;
    this.vy = 0;
    this.extraVx = 0;
    this.form = "runner";
    this.big = false;
    this.lives = 0;
    this.grounded = true;
    this.coyote = 0;
    this.buffer = 0;
    this.boostT = 0;
    this.invuln = 0;
    this.anim = 0;
    this.spin = 0;
    this.look = DM.save.ready().equipped;
    this.flyVx = 0;
    this.freeFly = false;
    this.autoThrust = 0;
    this.airJump = 0;
    this.shipLeft = 0;
    this.visualScale = 0;
    this.growing = false;
    this.growT = 0;
    this.onChicken = false;
    this.burning = false;
    this.screaming = false;
    this.hidden = false;
  };

  Player.prototype.scale = function () {
    if (this.visualScale > 0) return this.visualScale;
    return this.big ? DM.config.bigScale : 1;
  };

  Player.prototype.bounds = function () {
    var C = DM.config;
    var s = this.scale();
    var base = this.form === "ship" ? C.ship : C.runner;
    var w = base.w * s;
    var h = base.h * s;
    var insetX = 7;
    var insetTop = 4;
    var insetBot = 2;
    return {
      x: this.x - w / 2 + insetX,
      y: this.y - h + insetTop,
      w: Math.max(8, w - insetX * 2),
      h: Math.max(8, h - insetTop - insetBot)
    };
  };

  Player.prototype.boost = function () {
    var C = DM.config;
    if (this.form === "runner") {
      this.extraVx = C.boosterVx;
      this.boostT = C.boosterTime;
      if (this.grounded || this.coyote > 0) {
        var j = (this.big ? C.bigJumpV : C.jumpV) * C.jumpBoostMul;
        this.vy = j;
        this.grounded = false;
        this.coyote = 0;
      }
    } else {
      this.extraVx = C.boosterShipVx;
      this.vy -= 160;
    }
  };

  Player.prototype.update = function (dt, input, world) {
    var C = DM.config;
    if (this.freeFly) return null;
    var dir = 0;
    if (!world.waiting) {
      if (input.right) dir += 1;
      if (input.left) dir -= 1;
    }
    this.x += (dir * world.moveSpeed(this) + this.extraVx) * dt;
    this.extraVx *= Math.exp(-5 * dt);
    this.prevY = this.y;
    this.anim += dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.form === "runner") this.stepRunner(dt, input, world);
    else this.stepShip(dt, input);
    if (this.form === "runner" && this.grounded && DM.fx && Math.floor(this.anim * 12) !== Math.floor((this.anim - dt) * 12)) {
      DM.fx.dust.push({ x: this.x - 10, y: this.y, vx: -40, vy: -20, life: 0.35, max: 0.35 });
      if (DM.fx.dust.length > 40) DM.fx.dust.shift();
    }
    if (world.holdShelves) world.holdShelves(this);
    if (world.keepOnMap) world.keepOnMap(this);
    if (DM.game && DM.game.keepInView) DM.game.keepInView();
    if (world.holdSpikedWalls) world.holdSpikedWalls(this);
    if (this.invuln > 0) return null;
    return world.sense(this);
  };

  Player.prototype.stepRunner = function (dt, input, world) {
    var C = DM.config;
    this.vy += C.runnerGravity * dt;
    if (world.mode === "tempo" && input.down && !this.grounded) this.vy += C.runnerGravity * 0.65 * dt;
    if (this.vy > 1500) this.vy = 1500;
    this.y += this.vy * dt;
    var surface = world.surfaceAt(this);
    if (surface != null && this.vy >= 0 && this.prevY <= surface + 1 && this.y >= surface - 0.01) {
      this.y = surface;
      this.vy = 0;
      this.grounded = true;
      this.coyote = C.coyote;
    } else {
      if (this.grounded) this.coyote = C.coyote;
      this.grounded = false;
      if (this.coyote > 0) this.coyote -= dt;
    }
    if (surface != null && this.grounded) this.airJump = 0;
    if (input.jumpEdge) this.buffer = C.jumpBuffer;
    else if (this.buffer > 0) this.buffer -= dt;
    var inPit = world.groundAt(this.x) == null && this.y > C.groundY + 4;
    if (inPit) {
      this.buffer = 0;
      this.airJump = 0;
    }
    var jv = this.big ? C.bigJumpV : C.jumpV;
    if (world.mode === "tempo" && world.track && !world.waiting) {
      jv = DM.music && DM.music.jumpSpeed ? DM.music.jumpSpeed(world.track.bpm) : 2200 * (60 / world.track.bpm);
    }
    if (this.boostT > 0) jv *= C.jumpBoostMul;
    if (!inPit && this.buffer > 0 && (this.grounded || this.coyote > 0)) {
      this.vy = -Math.abs(jv);
      this.grounded = false;
      this.coyote = 0;
      this.buffer = 0;
      this.airJump = this.onChicken ? 1 : 0;
    } else if (!inPit && this.buffer > 0 && this.airJump > 0) {
      this.vy = -Math.abs(jv);
      this.grounded = false;
      this.buffer = 0;
      this.airJump = 0;
    }
    if (this.boostT > 0) this.boostT -= dt;
  };

  Player.prototype.stepShip = function (dt, input) {
    var C = DM.config;
    var auto = this.autoThrust > 0;
    if (auto) this.autoThrust -= dt;
    var thrust = auto || input.jumpHeld;
    var acc = thrust ? C.shipThrust : C.shipGravity;
    if (this.big && thrust) acc *= C.bigShipMul;
    this.vy += acc * dt;
    var max = C.shipMax * (this.big ? C.bigShipMul : 1);
    if (this.vy < -max) this.vy = -max;
    if (this.vy > max) this.vy = max;
    this.y += this.vy * dt;
    if (auto) {
      var lane = C.groundY - C.shipLane;
      if (this.y < lane) {
        this.y = lane;
        if (this.vy < 0) this.vy = 0;
      }
    }
    var limit = C.ship.h * this.scale() - 4;
    if (this.y < limit) {
      this.y = limit;
      if (this.vy < 0) this.vy = 0;
    }
    this.grounded = false;
  };

  Player.prototype.draw = function (ctx) {
    if (this.hidden) return;
    if (this.invuln > 0 && !this.burning && Math.floor(this.anim * 16) % 2 === 0) return;
    var C = DM.config;
    var s = this.scale();
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.spin) ctx.rotate(this.spin);
    ctx.scale(s, s);
    if (DM.bonus && DM.bonus.kind === "speed") {
      ctx.shadowColor = "rgba(255, 196, 40, 0.8)";
      ctx.shadowBlur = 12;
    } else if (DM.bonus && DM.bonus.kind === "slow") {
      ctx.shadowColor = "rgba(90, 170, 255, 0.8)";
      ctx.shadowBlur = 12;
    }
    if (this.onChicken) {
      drawChicken(ctx, 0, 0, false, this.anim);
      ctx.save();
      ctx.translate(8, -26);
      drawRunner(ctx, this.look, 0, true);
      drawAccessory(ctx, DM.save && DM.save.ready ? DM.save.ready().accessory : "", look(this.look).kind, false);
      if (this.screaming) {
        ctx.fillStyle = "#2a140c";
        ctx.beginPath();
        ctx.ellipse(2, -34, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (this.form === "ship") drawShip(ctx, this.look, this.anim);
    else drawRunner(ctx, this.look, this.grounded ? this.anim : 0);
    if (!this.onChicken) drawAccessory(ctx, DM.save && DM.save.ready ? DM.save.ready().accessory : "", look(this.look).kind, this.form === "ship");
    if (this.screaming && !this.onChicken) {
      ctx.fillStyle = "#2a140c";
      ctx.beginPath();
      ctx.ellipse(2, -34, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (this.burning) this.drawFlames(ctx);
    if (C) { /* keep reference used */ }
  };

  Player.prototype.drawFlames = function (ctx) {
    var t = this.anim * 16;
    var i;
    ctx.save();
    ctx.translate(this.x, this.y);
    for (i = 0; i < 6; i++) {
      var h = 26 + Math.sin(t + i * 1.4) * 12;
      var x = -18 + i * 7;
      ctx.fillStyle = i % 2 ? "#ffd15a" : "#ff4a12";
      ctx.beginPath();
      ctx.moveTo(x, -8);
      ctx.quadraticCurveTo(x + 4, -8 - h, x + 9, -8);
      ctx.fill();
    }
    ctx.restore();
  };

  function gearSpot(kind, compact) {
    if (compact) return { x: 4, neck: -16, hat: -30, eye: -12 };
    if (kind === "cube") return { x: 0, neck: -30, hat: -52, eye: -30 };
    if (kind === "dino") return { x: 8, neck: -34, hat: -58, eye: -40 };
    if (kind === "ghost") return { x: 0, neck: -44, hat: -74, eye: -48 };
    if (kind === "bird") return { x: 2, neck: -34, hat: -56, eye: -38 };
    return { x: 0, neck: -44, hat: -70, eye: -40 };
  }

  function drawAccessory(ctx, id, kind, compact) {
    if (!id) return;
    var spot = gearSpot(kind, compact);
    ctx.save();
    ctx.translate(spot.x, 0);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1b140c";
    if (id === "echarpe") {
      ctx.fillStyle = "#d23b4a";
      ctx.beginPath();
      ctx.moveTo(spot.x * 0 - 4, spot.neck);
      ctx.quadraticCurveTo(-28, spot.neck + 16, -46, spot.neck + 30);
      ctx.lineTo(-38, spot.neck + 38);
      ctx.quadraticCurveTo(-18, spot.neck + 18, 2, spot.neck + 6);
      ctx.fill();
    } else if (id === "bonnet") {
      ctx.fillStyle = "#2f6fad";
      ctx.beginPath();
      ctx.arc(0, spot.hat, compact ? 10 : 14, Math.PI, 0);
      ctx.lineTo(compact ? 10 : 14, spot.hat + 8);
      ctx.lineTo(compact ? -10 : -14, spot.hat + 8);
      ctx.fill();
      ctx.fillStyle = "#f7fbff";
      ctx.beginPath();
      ctx.arc(0, spot.hat - (compact ? 10 : 16), compact ? 4 : 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === "lunettes") {
      ctx.strokeStyle = "#1b140c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-7, spot.eye, 6, 0, Math.PI * 2);
      ctx.arc(8, spot.eye, 6, 0, Math.PI * 2);
      ctx.moveTo(-1, spot.eye);
      ctx.lineTo(2, spot.eye);
      ctx.stroke();
    } else if (id === "cape") {
      ctx.fillStyle = "#7a2f8a";
      ctx.beginPath();
      ctx.moveTo(-10, spot.neck);
      ctx.lineTo(-34, spot.neck + 8);
      ctx.quadraticCurveTo(-30, spot.neck + 46, -8, spot.neck + 28);
      ctx.closePath();
      ctx.fill();
    } else if (id === "couronne") {
      ctx.fillStyle = "#f0c14a";
      ctx.beginPath();
      ctx.moveTo(-12, spot.hat + 8);
      ctx.lineTo(-12, spot.hat - 4);
      ctx.lineTo(-6, spot.hat + 2);
      ctx.lineTo(0, spot.hat - 10);
      ctx.lineTo(6, spot.hat + 2);
      ctx.lineTo(12, spot.hat - 4);
      ctx.lineTo(12, spot.hat + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (id === "noeud") {
      ctx.fillStyle = "#e23b4a";
      ctx.beginPath();
      ctx.moveTo(0, spot.neck + 4);
      ctx.lineTo(-14, spot.neck - 4);
      ctx.lineTo(-14, spot.neck + 12);
      ctx.closePath();
      ctx.moveTo(0, spot.neck + 4);
      ctx.lineTo(14, spot.neck - 4);
      ctx.lineTo(14, spot.neck + 12);
      ctx.closePath();
      ctx.fill();
    } else if (id === "ailes") {
      ctx.fillStyle = "rgba(232, 244, 255, 0.95)";
      ctx.beginPath();
      ctx.moveTo(-8, spot.neck);
      ctx.quadraticCurveTo(-40, spot.neck - 20, -36, spot.neck + 16);
      ctx.quadraticCurveTo(-20, spot.neck + 4, -8, spot.neck + 8);
      ctx.moveTo(8, spot.neck);
      ctx.quadraticCurveTo(40, spot.neck - 20, 36, spot.neck + 16);
      ctx.quadraticCurveTo(20, spot.neck + 4, 8, spot.neck + 8);
      ctx.fill();
      ctx.stroke();
    } else if (id === "masque") {
      ctx.fillStyle = "#1c2430";
      ctx.beginPath();
      ctx.ellipse(0, spot.eye, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f7fbff";
      ctx.fillRect(-8, spot.eye - 2, 4, 3);
      ctx.fillRect(4, spot.eye - 2, 4, 3);
    }
    ctx.restore();
  }

  function drawChicken(ctx, x, y, graze, time) {
    var peck = graze ? Math.max(0, Math.sin(time * 5)) * 8 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#f4f0e4";
    ctx.beginPath();
    ctx.ellipse(0, -18, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e23b2f";
    ctx.beginPath();
    ctx.moveTo(6, -30);
    ctx.lineTo(2, -38);
    ctx.lineTo(12, -34);
    ctx.fill();
    ctx.fillStyle = "#f6d34a";
    ctx.beginPath();
    ctx.arc(16, -28 + peck, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e07a12";
    ctx.beginPath();
    ctx.moveTo(24, -28 + peck);
    ctx.lineTo(40, -24 + peck);
    ctx.lineTo(24, -20 + peck);
    ctx.fill();
    ctx.fillStyle = "#f4f0e4";
    ctx.beginPath();
    ctx.moveTo(-12, -16);
    ctx.quadraticCurveTo(-36, -28, -46, -12);
    ctx.quadraticCurveTo(-28, -8, -12, -12);
    ctx.fill();
    ctx.strokeStyle = "#e07a12";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(-10, 0);
    ctx.moveTo(8, -6);
    ctx.lineTo(12, 0);
    ctx.stroke();
    if (graze) {
      ctx.fillStyle = "#6f8f32";
      ctx.fillRect(-8, -2, 3, 6);
      ctx.fillRect(4, -2, 3, 7);
    }
    ctx.restore();
  }

  DM.drawChicken = drawChicken;

  DM.Player = Player;
})();
