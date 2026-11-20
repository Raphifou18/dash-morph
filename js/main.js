(function () {
  "use strict";
  var DM = window.DM;

  var input = {
    jumpHeld: false,
    jumpEdge: false,
    pointerDown: false,
    pointerX: 640,
    pointerY: 360,
    pointerId: null,
    rightMouse: false
  };
  DM.input = input;

  var stage = document.getElementById("stage");
  var canvas = document.getElementById("game");

  function layout() {
    var scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    stage.style.transform = "scale(" + scale + ")";
    stage.style.left = ((window.innerWidth - 1280 * scale) / 2) + "px";
    stage.style.top = ((window.innerHeight - 720 * scale) / 2) + "px";
  }

  function point(event) {
    var rect = canvas.getBoundingClientRect();
    input.pointerX = (event.clientX - rect.left) / rect.width * 1280;
    input.pointerY = (event.clientY - rect.top) / rect.height * 720;
  }

  function interactive(event) {
    return event.target && event.target.closest && event.target.closest("button, a, input");
  }

  var spaceDown = false;
  var keys = {};
  function letter(event) {
    var value = event.key || "";
    if (value.length !== 1) return "";
    return value.toLowerCase();
  }
  function jumpKey(event) {
    var value = letter(event);
    return event.code === "ArrowUp" || event.code === "KeyZ" || event.code === "KeyW" || value === "z" || value === "w";
  }
  function playKey(event) {
    var value = letter(event);
    return jumpKey(event) || event.code === "ArrowLeft" || event.code === "ArrowRight" || event.code === "ArrowDown" || event.code === "KeyQ" || event.code === "KeyA" || event.code === "KeyS" || event.code === "KeyD" || value === "q" || value === "a" || value === "s" || value === "d";
  }
  canvas.addEventListener("pointerdown", function (event) {
    if (DM.music) DM.music.ensure();
    if (event.button !== 0 && event.pointerType !== "touch") return;
    point(event);
    input.pointerDown = true;
    input.pointerId = event.pointerId;
    if (DM.game.state === "play") input.jumpEdge = true;
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(event.pointerId); } catch (err) {}
    }
  });
  canvas.addEventListener("pointermove", function (event) {
    if (input.pointerId != null && event.pointerId !== input.pointerId) return;
    point(event);
  });
  window.addEventListener("pointerdown", function (event) {
    if (event.button === 2) {
      event.preventDefault();
      if (DM.game && DM.game.state === "play") input.rightMouse = true;
      return;
    }
    if (event.button !== 0 || !DM.game) return;
    if (DM.game.state === "dead") {
      if (interactive(event)) return;
      input.pointerDown = false;
      input.jumpEdge = false;
      input.rightMouse = false;
      DM.game.restart();
      return;
    }
    if (DM.game.state === "play" && !interactive(event)) {
      input.pointerDown = true;
      input.pointerId = event.pointerId;
      input.jumpEdge = true;
    }
  });
  window.addEventListener("pointerup", function (event) {
    if (event.button === 2) input.rightMouse = false;
    if (input.pointerId != null && event.pointerId !== input.pointerId) return;
    point(event);
    input.pointerDown = false;
    input.pointerId = null;
  });
  window.addEventListener("blur", function () { input.rightMouse = false; });
  canvas.addEventListener("contextmenu", function (event) { event.preventDefault(); });

  window.addEventListener("keydown", function (event) {
    if (DM.music) DM.music.ensure();
    if (DM.game && DM.game.state === "dead" && !event.repeat && (event.code === "Enter" || event.code === "NumpadEnter" || event.code === "Space")) {
      event.preventDefault();
      input.pointerDown = false;
      input.jumpEdge = false;
      spaceDown = false;
      DM.game.restart();
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      if (interactive(event)) return;
      if (!spaceDown && !event.repeat && DM.game.state === "play") input.jumpEdge = true;
      spaceDown = true;
    } else if (playKey(event)) {
      if (DM.game && DM.game.state === "play") event.preventDefault();
      var value = letter(event);
      var already = !!(keys[event.code] || (value && keys["char:" + value]));
      if (jumpKey(event) && !already && !event.repeat && DM.game.state === "play") input.jumpEdge = true;
      keys[event.code] = true;
      if (value) keys["char:" + value] = true;
    } else if (event.code === "Escape") {
      event.preventDefault();
      var state = DM.game.state;
      if (state === "ceilingFall" || state === "ceilingWait" || state === "ceilingSave") return;
      if (state === "play" || state === "slingshot" || state === "pause") DM.game.togglePause();
      else if (state === "adventure" || state === "shop" || state === "tracks") DM.ui.show("menu");
    }
  });
  window.addEventListener("keyup", function (event) {
    if (event.code === "Space") spaceDown = false;
    if (playKey(event)) {
      keys[event.code] = false;
      var value = letter(event);
      if (value) keys["char:" + value] = false;
    }
  });

  window.addEventListener("resize", layout);
  layout();
  DM.ui.bind();
  DM.game.init(canvas);

  var last = 0;
  function frame(now) {
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    input.left = !!(keys.ArrowLeft || keys.KeyQ || keys.KeyA || keys["char:q"] || keys["char:a"]);
    input.right = !!(keys.ArrowRight || keys.KeyD || keys["char:d"] || input.rightMouse);
    input.up = !!(keys.ArrowUp || keys.KeyZ || keys.KeyW || keys["char:z"] || keys["char:w"]);
    input.down = !!(keys.ArrowDown || keys.KeyS || keys["char:s"]);
    input.jumpHeld = spaceDown || input.pointerDown || input.up;
    if (!document.hidden) DM.game.frame(dt);
    else last = now;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
