(function () {
  "use strict";
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  var DM = root.DM || (root.DM = {});

  var EDGE_COLORS = {
    fire: ["#ff6a00", "#ffd166", "#ff3b1f", "#fff1c9"],
    ice: ["#e8f7ff", "#9ad7ff", "#ffffff", "#d6f3ff"],
    neon: ["#39f3ff", "#ff3df0", "#f6ff5a", "#ffffff"],
    leaves: ["#7cdb4a", "#2f9e44", "#d4f5a6", "#e8ffc8"],
    stars: ["#ffffff", "#9eb6ff", "#ffe38a", "#d0dcff"]
  };

  DM.sling = {
    phase: "rise",
    t: 0,
    fromY: 0,
    hoverY: 0,
    waitRelease: false,
    dragging: false,
    dragX: 0,
    dragY: 0,
    pull: 0,
    aimX: 0,
    aimY: 0,
    taught: false,
    particles: [],
    launched: false,
    begin: function (player) {
      var C = DM.config;
      this.phase = "rise";
      this.t = 0;
      this.fromY = player.y;
      this.hoverY = Math.max(150, player.y - 250);
      this.waitRelease = !!(DM.input && DM.input.pointerDown);
      this.dragging = false;
      this.pull = 0;
      this.taught = false;
      this.particles = [];
      this.launched = false;
      player.spin = 0;
      player.vy = 0;
      player.extraVx = 0;
      player.freeFly = false;
      player.grounded = false;
      if (DM.game) DM.game.zoom = 1;
      if (C) this.hoverY = Math.min(this.hoverY, C.groundY - 80);
    },
    update: function (dt, input, game) {
      var player = game.player;
      var C = DM.config;
      if (this.phase === "rise") {
        this.t += dt;
        var k = Math.min(1, this.t / C.zoomTime);
        k = k * k * (3 - 2 * k);
        player.y = this.fromY + (this.hoverY - this.fromY) * k;
        player.spin += C.spinSpeed * dt;
        game.zoom = 1 + (C.zoomMin - 1) * k;
        if (this.t >= C.zoomTime) {
          this.phase = "aim";
          player.y = this.hoverY;
          game.zoom = C.zoomMin;
        }
        return;
      }
      if (this.phase === "aim") {
        player.spin += C.spinSpeed * dt;
        game.zoom = C.zoomMin;
        player.y = this.hoverY;
        this.hintT = (this.hintT || 0) + dt;
        if (this.waitRelease) {
          if (!input.pointerDown) this.waitRelease = false;
          return;
        }
        if (input.pointerDown) {
          if (!this.dragging) {
            this.dragging = true;
            this.dragX = input.pointerX;
            this.dragY = input.pointerY;
          }
          var dx = input.pointerX - this.dragX;
          var dy = input.pointerY - this.dragY;
          this.pull = Math.sqrt(dx * dx + dy * dy);
          this.aimX = dx;
          this.aimY = dy;
          if (this.pull > 18) this.taught = true;
        } else if (this.dragging) {
          this.dragging = false;
          if (this.pull >= C.minPull) this.launch(player, game);
          else this.pull = 0;
        }
        return;
      }
      if (this.phase === "fly") {
        this.t += dt;
        player.prevY = player.y;
        player.vy += C.slingGravity * dt;
        player.x += player.flyVx * dt;
        player.y += player.vy * dt;
        var mapFloor = C.groundY;
        if (game.world.pitAt(player.x) || game.world.groundAt(player.x) == null) mapFloor = C.groundY + C.pitDepth;
        if (player.y > mapFloor) {
          player.y = mapFloor;
          if (player.vy > 0) player.vy = 0;
        }
        game.world.follow(player.x, player);
        var i;
        for (i = this.particles.length - 1; i >= 0; i--) {
          var p = this.particles[i];
          p.life -= dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 40 * dt;
          if (p.life <= 0) this.particles.splice(i, 1);
        }
        if (this.t > 0.12) {
          var surface = game.world.landingSurface(player);
          if (surface) {
            if (DM.fx && DM.fx.puff) DM.fx.puff(player.x, surface.y);
            if (surface.hazard) game.die();
            else game.land(surface.y);
            return;
          }
        }
        if (player.y > C.groundY + 240) game.die();
      }
    },
    launch: function (player, game) {
      var C = DM.config;
      var len = this.pull || 1;
      var clamped = Math.min(len, C.maxPull);
      var speed = (clamped / C.maxPull) * C.maxLaunch;
      var dirX = -this.aimX / len;
      var dirY = -this.aimY / len;
      player.flyVx = dirX * speed;
      player.vy = dirY * speed;
      player.freeFly = true;
      player.spin = 0;
      this.phase = "fly";
      this.t = 0;
      this.launched = true;
      this.spawnEdge(game, dirX, dirY);
    },
    spawnEdge: function (game, dirX, dirY) {
      var biome = game.world.biome(game.player);
      var colors = EDGE_COLORS[biome.edge] || EDGE_COLORS.fire;
      var screen = game.worldToScreen(game.player.x, game.player.y);
      var vx = dirX;
      var vy = dirY;
      var tx = vx > 0 ? (1240 - screen.x) / vx : vx < 0 ? (40 - screen.x) / vx : 1e9;
      var ty = vy > 0 ? (680 - screen.y) / vy : vy < 0 ? (40 - screen.y) / vy : 1e9;
      var edge = tx < ty ? (vx > 0 ? "right" : "left") : (vy > 0 ? "bottom" : "top");
      var i;
      for (i = 0; i < 36; i++) {
        var along = Math.random();
        var x = 640;
        var y = 360;
        if (edge === "right") { x = 1240; y = 40 + along * 640; }
        else if (edge === "left") { x = 40; y = 40 + along * 640; }
        else if (edge === "top") { y = 40; x = 40 + along * 1200; }
        else { y = 680; x = 40 + along * 1200; }
        this.particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 80 - dirX * 40,
          vy: (Math.random() - 0.5) * 80 - dirY * 30,
          life: 0.45 + Math.random() * 0.35,
          max: 0.8,
          color: colors[i % colors.length],
          size: 4 + Math.random() * 10
        });
      }
    },
    predict: function () {
      var C = DM.config;
      var len = this.pull || 1;
      var clamped = Math.min(len, C.maxPull);
      var speed = (clamped / C.maxPull) * C.maxLaunch;
      var dirX = -this.aimX / len;
      var dirY = -this.aimY / len;
      var pts = [];
      var x = DM.game.player.x;
      var y = DM.game.player.y;
      var vx = dirX * speed;
      var vy = dirY * speed;
      var step = 0.045;
      var n;
      for (n = 0; n < 28; n++) {
        vy += C.slingGravity * step;
        x += vx * step;
        y += vy * step;
        pts.push({ x: x, y: y, vx: vx, vy: vy });
      }
      return { pts: pts, deg: Math.round(Math.atan2(-dirY, dirX) * 180 / Math.PI), dirX: dirX, dirY: dirY };
    },
    drawWorld: function (ctx, game) {
      if (this.phase !== "aim" || !this.dragging || this.pull < 8) return;
      var pred = this.predict();
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 8]);
      ctx.beginPath();
      ctx.moveTo(game.player.x, game.player.y);
      var i;
      for (i = 0; i < pred.pts.length; i++) ctx.lineTo(pred.pts[i].x, pred.pts[i].y);
      ctx.stroke();
      ctx.setLineDash([]);
      for (i = 0; i < pred.pts.length; i += 2) {
        ctx.beginPath();
        ctx.arc(pred.pts[i].x, pred.pts[i].y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    drawScreen: function (ctx, game) {
      var player = game.player;
      var origin = game.worldToScreen(player.x, player.y);
      if (this.phase === "aim" && this.dragging && this.pull >= 8) {
        var pred = this.predict();
        ctx.save();
        ctx.strokeStyle = "rgba(20,16,12,0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(origin.x + this.aimX, origin.y + this.aimY);
        ctx.stroke();
        ctx.fillStyle = "#fff8ea";
        ctx.beginPath();
        ctx.arc(origin.x + this.aimX, origin.y + this.aimY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1b140c";
        ctx.font = "bold 18px Trebuchet MS, Segoe UI, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(pred.deg + "°", origin.x + 16, origin.y - 18);
        var power = Math.min(1, this.pull / DM.config.maxPull);
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(origin.x - 40, origin.y + 28, 80, 8);
        ctx.fillStyle = power > 0.85 ? "#ff5a3c" : "#ffbf1f";
        ctx.fillRect(origin.x - 40, origin.y + 28, 80 * power, 8);
        ctx.restore();
      }
      if (this.phase === "aim" && !this.taught) this.drawHint(ctx, origin);
      if (!this.particles.length) return;
      var i;
      ctx.save();
      for (i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size * 0.6);
      }
      ctx.restore();
    },
    drawHint: function (ctx, origin) {
      var wobble = Math.sin((this.hintT || 0) * 5) * 16;
      ctx.save();
      ctx.translate(origin.x, origin.y - 86);
      ctx.fillStyle = "rgba(255,248,235,0.94)";
      ctx.strokeStyle = "#1b140c";
      ctx.lineWidth = 3;
      round(ctx, -132, -18, 264, 36, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#1b140c";
      ctx.font = "bold 16px Trebuchet MS, Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Tire en arrière, puis lâche", 0, 0);
      ctx.restore();
      ctx.save();
      ctx.translate(origin.x - 78 + wobble, origin.y + 6);
      ctx.fillStyle = "#ffbf1f";
      ctx.strokeStyle = "#1b140c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, 6);
      ctx.lineTo(36, 16);
      ctx.lineTo(16, 22);
      ctx.stroke();
      ctx.restore();
    }
  };

  function round(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
})();
