(function () {
  "use strict";
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  var DM = root.DM || (root.DM = {});
  if (!DM.BIOMES || !DM.World) return;

  function hash(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function gy() {
    return DM.config.groundY;
  }

  function farCursor(camX, speed, span) {
    var scroll = camX * speed;
    var tile = Math.floor(scroll / span);
    var u = (tile - 1) * span;
    return { u: u, x: u + camX - scroll };
  }

  function march(cam, viewW, speed, span, draw) {
    var cursor = farCursor(cam.x, speed, span);
    var x = cursor.x;
    var u = cursor.u;
    var end = cam.x + viewW + span * 2;
    var guard = 0;
    var step;
    while (x < end && guard++ < 28) {
      step = draw(x, u);
      if (!(step > 8)) step = span;
      x += step;
      u += step;
    }
  }

  function ell(ctx, x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function circ(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function box(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function tri(ctx, x1, y1, x2, y2, x3, y3, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.fill();
  }

  function stamp(ctx, ox, oy, spec) {
    var i;
    var s;
    for (i = 0; i < spec.length; i++) {
      s = spec[i];
      if (s[0] === "e") ell(ctx, ox + s[1], oy + s[2], s[3], s[4], s[5]);
      else if (s[0] === "c") circ(ctx, ox + s[1], oy + s[2], s[3], s[4]);
      else if (s[0] === "r") box(ctx, ox + s[1], oy + s[2], s[3], s[4], s[5]);
      else if (s[0] === "t") tri(ctx, ox + s[1], oy + s[2], ox + s[3], oy + s[4], ox + s[5], oy + s[6], s[7]);
    }
  }

  function motes(ctx, world, cam, viewW, viewH, count, color, speed, radius) {
    var i;
    var x;
    var y;
    ctx.fillStyle = color;
    for (i = 0; i < count; i++) {
      x = cam.x + ((i * 97 + world.time * speed) % (viewW + 50)) - 24;
      y = cam.y + ((i * 53 + world.time * speed * 0.35) % (viewH * 0.82));
      ctx.globalAlpha = 0.28 + hash(i + 3) * 0.55;
      ctx.beginPath();
      ctx.arc(x, y, radius + hash(i) * radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function bubbles(ctx, world, cam, viewW, viewH, count, color) {
    var i;
    var x;
    var y;
    ctx.fillStyle = color;
    for (i = 0; i < count; i++) {
      x = cam.x + ((i * 89) % (viewW + 30));
      y = cam.y + viewH - ((i * 47 + world.time * 40) % (viewH + 30));
      ctx.globalAlpha = 0.3 + hash(i) * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, 2 + hash(i + 2) * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function sun(ctx, cam, viewW, y, r, color) {
    circ(ctx, cam.x + viewW * 0.78, cam.y + y, r, color);
  }

  var MORE = [
    { id: "reef", name: "Récif corallien", edge: "coral", sky: ["#7ec8e0", "#0e5870"], ground: "#e7b48a", deep: "#c48a62", ink: "#083044", pit: "#062433", accent: "#ff6b8a", dust: "#ffe0c2" },
    { id: "volcano", name: "Volcan", edge: "lava", sky: ["#5a2a18", "#1a0c08"], ground: "#3a2a28", deep: "#241816", ink: "#ffb15a", pit: "#140c0a", accent: "#ff5a1f", dust: "#ffd0a0" },
    { id: "shroom", name: "Champignons géants", edge: "spore", sky: ["#f3d0ff", "#6a4a86"], ground: "#6b4a78", deep: "#3e2a48", ink: "#2a1830", pit: "#1a1020", accent: "#ff6b6b", dust: "#ffe6a8" },
    { id: "crystal", name: "Caverne de cristal", edge: "prism", sky: ["#243058", "#0c1024"], ground: "#2c3358", deep: "#1a2038", ink: "#d6e4ff", pit: "#080c18", accent: "#7ef0ff", dust: "#e8f4ff" },
    { id: "isles", name: "Îles flottantes", edge: "breeze", sky: ["#d7eeff", "#6aa4e0"], ground: "#7d9a4a", deep: "#4e6830", ink: "#243018", pit: "#1a2410", accent: "#ffffff", dust: "#e8f6ff" },
    { id: "toxic", name: "Terres toxiques", edge: "ooze", sky: ["#d6f26a", "#3a4a18"], ground: "#5a6230", deep: "#323818", ink: "#1a240c", pit: "#141808", accent: "#c6ff3a", dust: "#e8ff9a" },
    { id: "seabed", name: "Désert des océans", edge: "salt", sky: ["#f6ead4", "#d2a878"], ground: "#ead8b0", deep: "#c4a878", ink: "#6a5030", pit: "#3a2c18", accent: "#7eb8c8", dust: "#fff6e4" },
    { id: "abyss", name: "Abysses", edge: "glow", sky: ["#062028", "#01060a"], ground: "#0c242c", deep: "#071418", ink: "#9ef6ff", pit: "#000408", accent: "#3dffc2", dust: "#b8fff0" },
    { id: "mangrove", name: "Mangrove", edge: "root", sky: ["#d7e28a", "#3e5a32"], ground: "#6a5a3a", deep: "#3e3424", ink: "#1c2414", pit: "#142018", accent: "#8fbf6a", dust: "#e4f0c0" },
    { id: "geyser", name: "Vallée des geysers", edge: "steam", sky: ["#e7f4ff", "#8eb4c8"], ground: "#d7cbb8", deep: "#b09a84", ink: "#4a3a2c", pit: "#2a2018", accent: "#ffffff", dust: "#f7fbff" },
    { id: "clouds", name: "Royaume des nuages", edge: "cloud", sky: ["#f7fbff", "#c5d8f0"], ground: "#f4f7fb", deep: "#d5deea", ink: "#3a4a62", pit: "#b7c4d6", accent: "#f2c14e", dust: "#ffffff" },
    { id: "cursed", name: "Forêt maudite", edge: "curse", sky: ["#3a3050", "#120c18"], ground: "#2a2430", deep: "#161218", ink: "#c8b8e0", pit: "#08060c", accent: "#7a4ad2", dust: "#d0c0e8" },
    { id: "ruins", name: "Ruines antiques", edge: "sand", sky: ["#f2d7a8", "#c47a48"], ground: "#e2c48a", deep: "#b8925a", ink: "#5a3a1c", pit: "#3a2410", accent: "#f6e2a8", dust: "#fff1d0" },
    { id: "alien", name: "Planète extraterrestre", edge: "alien", sky: ["#ff8ad4", "#3a1860"], ground: "#6a3a78", deep: "#3e2048", ink: "#ffe0f4", pit: "#1a0c20", accent: "#7dff6a", dust: "#ffd0f0" },
    { id: "invert", name: "Monde inversé", edge: "flip", sky: ["#6a4a32", "#b7daf5"], ground: "#d7eeff", deep: "#7eb6de", ink: "#5a4030", pit: "#3a6e96", accent: "#ffffff", dust: "#ffffff" },
    { id: "shadow", name: "Royaume des ombres", edge: "shade", sky: ["#1a1428", "#05040a"], ground: "#16121c", deep: "#0c0a10", ink: "#b8a8d0", pit: "#000000", accent: "#6a4a88", dust: "#c8b8e0" },
    { id: "candy", name: "Bonbon", edge: "sugar", sky: ["#ffd6ee", "#ff8ec4"], ground: "#ffb3d0", deep: "#e07aaa", ink: "#6a2048", pit: "#4a1830", accent: "#fff0a8", dust: "#ffffff" },
    { id: "clock", name: "Mécanique", edge: "brass", sky: ["#d8d2c4", "#8a8172"], ground: "#6a6258", deep: "#3e3a34", ink: "#1c1814", pit: "#141210", accent: "#e2b15a", dust: "#f2efe6" },
    { id: "solar", name: "Solaire", edge: "gold", sky: ["#ffe9a0", "#f0b429"], ground: "#c48a18", deep: "#8a5e10", ink: "#4a3008", pit: "#3a2408", accent: "#fff4c4", dust: "#fff8dc" },
    { id: "bluelava", name: "Lave bleue", edge: "bluelava", sky: ["#16344e", "#061018"], ground: "#1a2838", deep: "#101820", ink: "#d0f4ff", pit: "#060c12", accent: "#3ec8ff", dust: "#b8e8ff" }
  ];

  var added;
  for (added = 0; added < MORE.length; added++) DM.BIOMES.push(MORE[added]);

  var POOLS = {
    reef: ["rf_coral", "rf_anemone", "rf_shell", "rf_fish", "rf_star"],
    volcano: ["vl_cone", "vl_vent", "vl_glass", "vl_ember"],
    shroom: ["sh_cap", "sh_spot", "sh_stump", "sh_spore"],
    crystal: ["cr_shard", "cr_cluster", "cr_geode", "cr_glow"],
    isles: ["is_isle", "is_fall", "is_bird", "is_cloud"],
    toxic: ["tx_barrel", "tx_ooze", "tx_tree", "tx_gas"],
    seabed: ["od_ribs", "od_hull", "od_shell", "od_anchor"],
    abyss: ["ab_angler", "ab_jelly", "ab_worm", "ab_lure"],
    mangrove: ["mg_root", "mg_crab", "mg_heron", "mg_lily"],
    geyser: ["gy_cone", "gy_terrace", "gy_pool", "gy_steam"],
    clouds: ["cl_turret", "cl_gate", "cl_dove", "cl_pillar"],
    cursed: ["cu_tree", "cu_grave", "cu_crow", "cu_eye"],
    ruins: ["ru_column", "ru_statue", "ru_urn", "ru_arch"],
    alien: ["al_bulb", "al_egg", "al_spire", "al_saucer"],
    invert: ["iv_tree", "iv_house", "iv_drip", "iv_root"],
    shadow: ["sd_spire", "sd_bat", "sd_candle", "sd_wisp"],
    candy: ["cb_lolly", "cb_drop", "cb_cake", "cb_swirl"],
    clock: ["mk_gear", "mk_clock", "mk_pend", "mk_pipe"],
    solar: ["so_nugget", "so_disk", "so_obelisk", "so_tree"],
    bluelava: ["bl_vent", "bl_shard", "bl_flame", "bl_flow"]
  };

  var PROPS = {
    rf_coral: [
      ["t", 0, 0, -16, -34, 6, -6, "#ff5d7a"],
      ["t", 2, -4, 18, -38, 8, -8, "#ff8a5a"],
      ["t", -2, -8, -4, -46, 8, -18, "#ffd0a8"],
      ["c", -8, -30, 4, "#ffe0c0"],
      ["c", 14, -34, 3.5, "#fff0d0"]
    ],
    rf_anemone: [
      ["e", 0, -6, 12, 5, "#c45a7a"],
      ["t", -8, -8, -14, -28, -2, -8, "#ff8fb0"],
      ["t", -2, -8, 0, -32, 6, -8, "#ffb0c8"],
      ["t", 4, -8, 12, -26, 8, -8, "#ff7aa0"],
      ["c", 0, -30, 3, "#ffe0a0"]
    ],
    rf_shell: [
      ["e", 0, -8, 14, 10, "#f2c9a0"],
      ["e", -2, -10, 8, 6, "#fff0dc"],
      ["t", 8, -8, 18, -4, 10, -14, "#e0a878"]
    ],
    rf_star: [
      ["t", 0, -18, -8, -8, 8, -8, "#ffb03a"],
      ["t", 0, -4, -8, -14, 8, -14, "#ffb03a"],
      ["c", 0, -12, 3, "#fff0c0"]
    ],
    vl_cone: [
      ["t", 0, 0, -22, 0, 0, -48, "#2a201c"],
      ["t", 0, 0, 22, 0, 0, -48, "#3a2a26"],
      ["e", 0, -46, 8, 4, "#ff5a1f"],
      ["c", 0, -52, 3, "#ffd08a"]
    ],
    vl_vent: [
      ["r", -10, -16, 20, 16, "#2c2420"],
      ["e", 0, -16, 8, 4, "#1a100c"],
      ["c", -3, -24, 3, "#ff6a2a"],
      ["c", 4, -28, 2, "#ffd08a"]
    ],
    vl_glass: [
      ["t", 0, 0, -8, -28, 6, 0, "#1a2430"],
      ["t", 2, -4, 10, -22, 4, 0, "#243848"],
      ["t", -2, -10, 2, -34, 6, -8, "#7ec8ff"]
    ],
    vl_ember: [
      ["c", 0, -8, 5, "#ff5a1f"],
      ["c", -7, -4, 3, "#ffb15a"],
      ["c", 6, -12, 2.5, "#ffe08a"]
    ],
    sh_cap: [
      ["r", -4, -28, 8, 28, "#f2e2c8"],
      ["e", 0, -36, 22, 12, "#e24a4a"],
      ["c", -8, -38, 2.5, "#fff0d8"],
      ["c", 6, -40, 2, "#fff0d8"]
    ],
    sh_spot: [
      ["r", -3, -22, 6, 22, "#efe2d0"],
      ["e", 0, -28, 16, 9, "#f2c14e"],
      ["c", -5, -30, 2, "#ffffff"],
      ["c", 4, -28, 1.6, "#ffffff"]
    ],
    sh_stump: [
      ["r", -10, -14, 20, 14, "#6a4030"],
      ["e", 0, -14, 10, 4, "#c48a62"],
      ["c", -3, -15, 1.4, "#3a2018"]
    ],
    cr_shard: [
      ["t", 0, 0, -8, -36, 6, 0, "#9be7ff"],
      ["t", 2, 0, 10, -28, 4, 0, "#d6f4ff"],
      ["t", -2, -12, 2, -42, 5, -10, "#ffffff"]
    ],
    cr_cluster: [
      ["t", -8, 0, -14, -24, -2, 0, "#7ec8ff"],
      ["t", 0, 0, -4, -36, 8, 0, "#e8f8ff"],
      ["t", 6, 0, 4, -20, 14, 0, "#9b8cff"]
    ],
    cr_geode: [
      ["e", 0, -10, 14, 10, "#3a4068"],
      ["e", 0, -12, 8, 6, "#101428"],
      ["c", -3, -13, 2, "#7ef0ff"],
      ["c", 3, -11, 1.6, "#d6e4ff"],
      ["c", 0, -16, 1.5, "#ffffff"]
    ],
    cr_glow: [
      ["c", 0, -14, 8, "#7ef0ff"],
      ["c", 0, -14, 4, "#ffffff"]
    ],
    is_isle: [
      ["e", 0, -28, 20, 8, "#6a5848"],
      ["e", 0, -34, 18, 6, "#8fbf6a"],
      ["t", 6, -34, 10, -48, 16, -32, "#2f6a32"]
    ],
    is_fall: [
      ["e", 0, -36, 16, 6, "#7d9a4a"],
      ["r", -3, -32, 6, 26, "#8ec8f0"],
      ["e", 0, -6, 8, 3, "#d7eeff"]
    ],
    is_cloud: [
      ["e", 0, -16, 16, 8, "#ffffff"],
      ["e", -10, -18, 8, 6, "#f4f8ff"],
      ["e", 10, -14, 7, 5, "#e7f1ff"]
    ],
    tx_barrel: [
      ["r", -8, -22, 16, 22, "#6a8f2a"],
      ["r", -8, -18, 16, 3, "#243018"],
      ["r", -8, -10, 16, 3, "#243018"],
      ["c", 0, -8, 2, "#c6ff3a"]
    ],
    tx_ooze: [
      ["e", 0, -4, 16, 6, "#7dff3a"],
      ["e", -6, -6, 6, 3, "#d6ff6a"],
      ["c", 4, -10, 3, "#e8ff9a"]
    ],
    tx_tree: [
      ["r", -3, -28, 6, 28, "#3a3428"],
      ["t", 0, -20, -16, -8, -4, -24, "#4a4034"],
      ["t", 0, -24, 4, -22, 14, -6, "#3a3428"]
    ],
    od_ribs: [
      ["t", -14, 0, -10, -28, -4, 0, "#f7f1e4"],
      ["t", 14, 0, 10, -28, 4, 0, "#f7f1e4"],
      ["e", 0, -26, 12, 4, "#fffaf0"],
      ["r", -8, -8, 16, 3, "#f7f1e4"]
    ],
    od_hull: [
      ["t", -18, -4, 18, -4, 0, -16, "#8a5a32"],
      ["r", -2, -28, 4, 16, "#6a4030"],
      ["t", -6, -28, 0, -38, 6, -28, "#f2efe6"]
    ],
    od_shell: [
      ["e", 0, -6, 10, 7, "#f2e2c4"],
      ["e", 2, -8, 5, 4, "#fff6e4"],
      ["c", 6, -6, 1.5, "#7eb8c8"]
    ],
    od_anchor: [
      ["r", -2, -26, 4, 22, "#5a6570"],
      ["r", -8, -28, 16, 3, "#5a6570"],
      ["c", -8, -6, 5, "#5a6570"],
      ["c", 8, -6, 5, "#5a6570"]
    ],
    ab_worm: [
      ["r", -3, -20, 6, 20, "#143038"],
      ["e", 0, -22, 8, 5, "#3dffc2"],
      ["c", 0, -22, 2, "#e8fff8"]
    ],
    ab_lure: [
      ["c", 0, -8, 3, "#062028"],
      ["c", 0, -18, 4, "#3dffc2"],
      ["c", 0, -18, 2, "#ffffff"]
    ],
    mg_root: [
      ["t", -16, 0, -6, -40, 2, 0, "#5a4030"],
      ["t", 16, 0, 6, -36, -2, 0, "#6a5040"],
      ["e", 0, -8, 14, 5, "#3e3424"]
    ],
    mg_crab: [
      ["e", 0, -6, 10, 6, "#c4563a"],
      ["c", -4, -10, 3, "#e07a4a"],
      ["c", 4, -10, 3, "#e07a4a"],
      ["c", -3, -8, 1, "#1b140c"],
      ["c", 3, -8, 1, "#1b140c"]
    ],
    mg_lily: [
      ["e", 0, -4, 12, 4, "#3a8f4a"],
      ["e", 0, -6, 4, 3, "#f2c14e"],
      ["c", 0, -6, 1.5, "#fff0c0"]
    ],
    gy_cone: [
      ["t", 0, 0, -16, 0, -2, -28, "#efe6da"],
      ["t", 0, 0, 16, 0, 2, -28, "#d7cbb8"],
      ["e", 0, -30, 6, 4, "#ffffff"]
    ],
    gy_terrace: [
      ["r", -16, -6, 32, 6, "#efe6da"],
      ["r", -12, -12, 24, 6, "#f7f1e6"],
      ["r", -8, -18, 16, 6, "#ffffff"],
      ["e", 0, -20, 5, 2, "#8ec8f0"]
    ],
    gy_pool: [
      ["e", 0, -4, 16, 6, "#7eb8d0"],
      ["e", -4, -5, 6, 2, "#e7f4ff"]
    ],
    cl_turret: [
      ["r", -10, -28, 20, 28, "#f7fbff"],
      ["t", -12, -28, 12, -28, 0, -44, "#f2c14e"],
      ["r", -4, -18, 5, 6, "#9fd0ff"]
    ],
    cl_gate: [
      ["r", -16, -22, 6, 22, "#f4f8ff"],
      ["r", 10, -22, 6, 22, "#f4f8ff"],
      ["e", 0, -22, 16, 8, "#f2c14e"]
    ],
    cl_pillar: [
      ["r", -5, -32, 10, 32, "#ffffff"],
      ["r", -8, -36, 16, 5, "#f2c14e"],
      ["r", -7, -4, 14, 4, "#e7eef8"]
    ],
    cu_tree: [
      ["r", -3, -34, 6, 34, "#1a141c"],
      ["t", 0, -18, -20, -6, -2, -28, "#241820"],
      ["t", 0, -26, 2, -30, 18, -8, "#161018"],
      ["c", -12, -14, 1.6, "#d23b4a"]
    ],
    cu_grave: [
      ["r", -8, -16, 16, 16, "#3a3444"],
      ["e", 0, -16, 8, 6, "#4a4454"],
      ["r", -1, -12, 2, 8, "#c8b8e0"]
    ],
    cu_eye: [
      ["e", 0, -12, 10, 7, "#f4f0e8"],
      ["c", 2, -12, 3, "#1a1020"],
      ["c", 3, -12, 1.2, "#d23b4a"]
    ],
    ru_column: [
      ["r", -6, -36, 12, 36, "#f2e2c0"],
      ["r", -9, -40, 18, 5, "#fff1d0"],
      ["r", -8, -4, 16, 4, "#e2c48a"]
    ],
    ru_statue: [
      ["r", -5, -14, 10, 14, "#e7d3a8"],
      ["c", 0, -22, 6, "#f2e2c0"],
      ["r", -10, -16, 6, 3, "#e7d3a8"],
      ["r", 4, -16, 6, 3, "#e7d3a8"]
    ],
    ru_urn: [
      ["e", 0, -10, 8, 10, "#c47a48"],
      ["r", -5, -20, 10, 4, "#f2c14e"],
      ["t", -4, -20, 0, -28, 4, -20, "#e2a15a"]
    ],
    ru_arch: [
      ["r", -16, -24, 6, 24, "#f2e2c0"],
      ["r", 10, -24, 6, 24, "#f2e2c0"],
      ["e", 0, -24, 16, 10, "#e7d3a8"],
      ["e", 0, -22, 8, 6, "#c47a48"]
    ],
    al_bulb: [
      ["r", -3, -16, 6, 16, "#3a1860"],
      ["e", 0, -28, 12, 14, "#7dff6a"],
      ["c", -3, -30, 2, "#e8ffc8"]
    ],
    al_egg: [
      ["e", 0, -12, 10, 14, "#ff8ad4"],
      ["e", 0, -16, 4, 6, "#fff0f8"],
      ["c", 3, -18, 1.4, "#3a1860"]
    ],
    al_spire: [
      ["t", 0, 0, -10, 0, 0, -46, "#ff8ad4"],
      ["t", 0, 0, 10, 0, 0, -46, "#c45cff"],
      ["c", 0, -40, 3, "#7dff6a"]
    ],
    al_saucer: [
      ["e", 0, -18, 18, 6, "#d0d4e0"],
      ["e", 0, -24, 8, 6, "#7dff6a"],
      ["c", -6, -18, 1.6, "#ff8ad4"],
      ["c", 0, -18, 1.6, "#7ef0ff"],
      ["c", 6, -18, 1.6, "#ffe08a"]
    ],
    iv_house: [
      ["r", -12, -16, 24, 16, "#f4f8fb"],
      ["t", -14, -16, 14, -16, 0, -4, "#d23b4a"],
      ["r", -3, -12, 6, 8, "#6a4a32"],
      ["t", -2, 0, 2, 0, 0, 10, "#5a98c4"]
    ],
    iv_drip: [
      ["c", 0, -22, 4, "#8ec8f0"],
      ["e", 0, -10, 3, 10, "#d7eeff"],
      ["c", 0, -2, 3, "#ffffff"]
    ],
    iv_root: [
      ["t", 0, -40, -8, -8, 0, -36, "#6a4a32"],
      ["t", 0, -40, 10, -6, 2, -34, "#8a6244"],
      ["c", 0, -42, 4, "#5a4030"]
    ],
    sd_spire: [
      ["t", 0, 0, -12, 0, -2, -48, "#0c0a12"],
      ["t", 0, 0, 14, 0, 2, -40, "#16121c"],
      ["c", 0, -28, 1.6, "#b8a8d0"]
    ],
    sd_candle: [
      ["r", -3, -16, 6, 16, "#2a2434"],
      ["e", 0, -20, 3, 5, "#f2c14e"],
      ["c", 0, -24, 1.5, "#fff6d0"]
    ],
    cb_drop: [
      ["c", -6, -8, 7, "#ff4d8d"],
      ["c", 5, -6, 6, "#7dffea"],
      ["c", 0, -14, 5, "#ffe08a"]
    ],
    cb_cake: [
      ["r", -12, -10, 24, 10, "#fff0f6"],
      ["e", 0, -12, 12, 6, "#ff8ec4"],
      ["c", 0, -18, 2, "#ff4d6a"],
      ["r", -1, -18, 2, 6, "#fff6d0"]
    ],
    cb_swirl: [
      ["c", 0, -12, 10, "#fff0a8"],
      ["c", -3, -14, 5, "#ff8ec4"],
      ["c", 2, -10, 3, "#7ec8ff"]
    ],
    mk_pipe: [
      ["r", -4, -28, 8, 28, "#8a8172"],
      ["e", 8, -28, 10, 6, "#6a6258"],
      ["c", 14, -28, 3, "#3e3a34"],
      ["r", -8, -4, 16, 4, "#e2b15a"]
    ],
    so_nugget: [
      ["e", 0, -8, 12, 8, "#ffe08a"],
      ["e", -6, -10, 5, 4, "#fff4c4"],
      ["c", 4, -12, 2, "#fff8dc"]
    ],
    so_disk: [
      ["c", 0, -16, 12, "#f0b429"],
      ["c", 0, -16, 6, "#fff4c4"],
      ["t", 0, -28, -4, -20, 4, -20, "#ffe08a"]
    ],
    so_obelisk: [
      ["t", 0, -40, -8, -6, 8, -6, "#e2b13a"],
      ["r", -6, -6, 12, 6, "#c48a18"],
      ["r", -7, -34, 14, 3, "#fff4c4"]
    ],
    so_tree: [
      ["r", -3, -16, 6, 16, "#a87818"],
      ["c", 0, -28, 12, "#f0b429"],
      ["c", -8, -22, 7, "#ffe08a"],
      ["c", 8, -20, 6, "#fff4c4"]
    ],
    bl_vent: [
      ["t", 0, 0, -18, 0, 0, -26, "#14202c"],
      ["t", 0, 0, 18, 0, 0, -26, "#1c2c3c"],
      ["e", 0, -24, 7, 3, "#3ec8ff"]
    ],
    bl_shard: [
      ["t", 0, 0, -7, -30, 5, 0, "#16344e"],
      ["t", 2, -6, 8, -24, 3, 0, "#3ec8ff"]
    ],
    bl_flow: [
      ["e", 0, -4, 18, 5, "#1a4a68"],
      ["e", -4, -6, 8, 3, "#3ec8ff"],
      ["c", 6, -8, 2, "#d8f6ff"]
    ]
  };

  PROPS.rf_fish = function (ctx, d, t) {
    var y = gy() - 18 - Math.sin(t * 2 + d.phase * 6) * 5;
    var wag = Math.sin(t * 7 + d.phase) * 3;
    ell(ctx, d.x, y, 14, 7, "#ff8a5a");
    tri(ctx, d.x - 12, y, d.x - 22, y - 6 + wag, d.x - 22, y + 6, "#ff5d7a");
    circ(ctx, d.x + 6, y - 2, 1.5, "#083044");
  };

  PROPS.sh_spore = function (ctx, d, t) {
    var y = gy() - 20 - ((t * 16 + d.phase * 40) % 36);
    circ(ctx, d.x, y, 3, "#fff0d8");
    circ(ctx, d.x + 6, y + 8, 2, "#e6c0ff");
  };

  PROPS.is_bird = function (ctx, d, t) {
    var y = gy() - 36 - Math.sin(t * 3 + d.phase * 5) * 8;
    var wing = Math.sin(t * 8 + d.phase) * 6;
    ell(ctx, d.x, y, 8, 3, "#243018");
    tri(ctx, d.x - 2, y, d.x - 12, y - 6 - wing, d.x + 2, y, "#1b140c");
    tri(ctx, d.x + 6, y, d.x + 12, y + 2, d.x + 6, y - 2, "#f2c14e");
  };

  PROPS.tx_gas = function (ctx, d, t) {
    var puff = (t * 10 + d.phase * 20) % 18;
    circ(ctx, d.x, gy() - 8 - puff, 4 + puff * 0.15, "rgba(198, 255, 58, 0.45)");
    circ(ctx, d.x + 4, gy() - 16 - puff, 3, "rgba(232, 255, 154, 0.35)");
  };

  PROPS.ab_angler = function (ctx, d, t) {
    var y = gy() - 16;
    ell(ctx, d.x, y, 16, 8, "#071418");
    tri(ctx, d.x - 14, y, d.x - 24, y - 6, d.x - 22, y + 4, "#0c242c");
    circ(ctx, d.x + 8, y - 2, 1.4, "#ffffff");
    ctx.strokeStyle = "#143038";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(d.x + 4, y - 6);
    ctx.quadraticCurveTo(d.x + 10, y - 24, d.x + 16, y - 20 - Math.sin(t * 3) * 3);
    ctx.stroke();
    circ(ctx, d.x + 16, y - 20 - Math.sin(t * 3) * 3, 3, "#3dffc2");
  };

  PROPS.ab_jelly = function (ctx, d, t) {
    var y = gy() - 28 - Math.sin(t * 1.6 + d.phase * 4) * 8;
    ell(ctx, d.x, y, 12, 8, "rgba(62, 255, 194, 0.75)");
    ell(ctx, d.x, y + 2, 6, 4, "rgba(255,255,255,0.7)");
    box(ctx, d.x - 6, y + 6, 2, 10 + Math.sin(t * 4) * 3, "#7ef0ff");
    box(ctx, d.x, y + 6, 2, 14, "#3dffc2");
    box(ctx, d.x + 5, y + 6, 2, 8, "#7ef0ff");
  };

  PROPS.mg_heron = function (ctx, d, t) {
    var y = gy() - 4;
    box(ctx, d.x - 2, y - 28, 4, 28, "#d7e2ea");
    ell(ctx, d.x + 2, y - 32, 6, 4, "#f4f8fb");
    tri(ctx, d.x + 6, y - 32, d.x + 16, y - 30, d.x + 6, y - 28, "#f2c14e");
    box(ctx, d.x - 1, y - 2, 2, 6, "#c47a48");
    tri(ctx, d.x - 8, y - 16, d.x - 2, y - 20, d.x - 2, y - 12, "#e7eef4");
  };

  PROPS.gy_steam = function (ctx, d, t) {
    var puff = (t * 18 + d.phase * 30) % 26;
    circ(ctx, d.x, gy() - 12 - puff, 5 + puff * 0.2, "rgba(255,255,255,0.55)");
    circ(ctx, d.x + 4, gy() - 24 - puff * 0.6, 4, "rgba(231,244,255,0.4)");
  };

  PROPS.cl_dove = function (ctx, d, t) {
    var y = gy() - 30 - Math.sin(t * 2.4 + d.phase) * 6;
    var wing = Math.sin(t * 9) * 7;
    ell(ctx, d.x, y, 8, 3.5, "#ffffff");
    tri(ctx, d.x, y, d.x - 10, y - wing, d.x + 2, y, "#f4f8ff");
    circ(ctx, d.x + 7, y - 1, 1.2, "#3a4a62");
  };

  PROPS.cu_crow = function (ctx, d, t) {
    var y = gy() - 22;
    ell(ctx, d.x, y, 8, 5, "#120c18");
    tri(ctx, d.x + 6, y - 1, d.x + 14, y + 1, d.x + 6, y + 2, "#f2c14e");
    circ(ctx, d.x + 3, y - 2, 1.2, "#d23b4a");
    tri(ctx, d.x - 4, y, d.x - 14, y - 8 - Math.sin(t * 6) * 3, d.x, y, "#1a141c");
  };

  PROPS.sd_bat = function (ctx, d, t) {
    var y = gy() - 26 - Math.sin(t * 2 + d.phase) * 5;
    var wing = 8 + Math.sin(t * 10) * 4;
    ell(ctx, d.x, y, 4, 3, "#0c0a10");
    tri(ctx, d.x, y, d.x - wing, y - wing, d.x - 2, y + 2, "#16121c");
    tri(ctx, d.x, y, d.x + wing, y - wing, d.x + 2, y + 2, "#16121c");
    circ(ctx, d.x - 1, y - 1, 1, "#d23b4a");
  };

  PROPS.sd_wisp = function (ctx, d, t) {
    var y = gy() - 18 - Math.sin(t * 2 + d.phase * 5) * 8;
    circ(ctx, d.x, y, 6, "rgba(106, 74, 136, 0.55)");
    circ(ctx, d.x, y, 2.5, "#e4d8f8");
  };

  PROPS.cb_lolly = function (ctx, d) {
    box(ctx, d.x - 2, gy() - 28, 4, 28, "#fff6ea");
    circ(ctx, d.x, gy() - 34, 12, "#ff4d8d");
    circ(ctx, d.x, gy() - 34, 7, "#fff0a8");
    circ(ctx, d.x, gy() - 34, 3, "#7ec8ff");
  };

  PROPS.mk_gear = function (ctx, d, t) {
    var i;
    ctx.save();
    ctx.translate(d.x, gy() - 18);
    ctx.rotate(t * 0.8 + d.phase * 6);
    circ(ctx, 0, 0, 12, "#c4a46a");
    circ(ctx, 0, 0, 4, "#3e3a34");
    ctx.fillStyle = "#e2c48a";
    for (i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -18, 6, 7);
    }
    ctx.restore();
  };

  PROPS.mk_clock = function (ctx, d, t) {
    var x = d.x;
    var y = gy() - 20;
    circ(ctx, x, y, 16, "#f2efe6");
    circ(ctx, x, y, 13, "#1c1814");
    circ(ctx, x, y, 11, "#fffaf0");
    ctx.strokeStyle = "#1c1814";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(t * 0.4) * 7, y - Math.cos(t * 0.4) * 7);
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(t * 0.08) * 5, y - Math.cos(t * 0.08) * 5);
    ctx.stroke();
    box(ctx, x - 3, y + 12, 6, 8, "#6a6258");
  };

  PROPS.mk_pend = function (ctx, d, t) {
    var swing = Math.sin(t * 2 + d.phase) * 0.5;
    var x = d.x;
    var y = gy() - 34;
    box(ctx, x - 8, y, 16, 5, "#e2b15a");
    ctx.strokeStyle = "#6a5840";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 5);
    ctx.lineTo(x + Math.sin(swing) * 16, y + 28);
    ctx.stroke();
    circ(ctx, x + Math.sin(swing) * 16, y + 30, 5, "#c4a46a");
  };

  PROPS.iv_tree = function (ctx, d) {
    var x = d.x;
    var y = gy();
    ell(ctx, x, y - 8, 16, 10, "#8ec8f0");
    box(ctx, x - 3, y - 36, 6, 28, "#6a4a32");
    tri(ctx, x - 10, y - 34, x, y - 48, x + 2, y - 30, "#5a4030");
    tri(ctx, x + 8, y - 32, x, y - 46, x - 2, y - 28, "#8a6244");
  };

  PROPS.bl_flame = function (ctx, d, t) {
    var h = 16 + Math.sin(t * 9 + d.phase * 5) * 5;
    tri(ctx, d.x, gy(), d.x - 7, gy(), d.x, gy() - h, "#3ec8ff");
    tri(ctx, d.x, gy(), d.x + 6, gy(), d.x, gy() - h * 0.7, "#d8f6ff");
  };

  var FAR = {
    reef: function (ctx, cam, viewW, viewH) {
      var base = gy() - 150;
      march(cam, viewW, 0.002, 200, function (x, u) {
        var h = 60 + hash(u) * 90;
        var color = hash(u + 3) > 0.5 ? "#ff6b8a" : "#ff8f5a";
        tri(ctx, x, base + 24, x + 30, base - h, x + 78, base + 24, color);
        circ(ctx, x + 30, base - h + 6, 9, "#ffd0a8");
        return 150;
      });
      var i;
      for (i = 0; i < 6; i++) {
        var fx = cam.x + ((i * 210 + this.time * 26) % (viewW + 80)) - 30;
        var fy = cam.y + 70 + hash(i + 4) * 200;
        ell(ctx, fx, fy, 18, 6, i % 2 ? "#ffe08a" : "#7ee0ff");
        tri(ctx, fx - 16, fy, fx - 28, fy - 6, fx - 26, fy + 5, "#ff8a5a");
      }
      bubbles(ctx, this, cam, viewW, viewH, 18, "rgba(255,255,255,0.85)");
    },
    volcano: function (ctx, cam, viewW, viewH) {
      var base = gy() - 140;
      sun(ctx, cam, viewW, 150, 70, "rgba(255, 90, 31, 0.35)");
      march(cam, viewW, 0.0016, 280, function (x, u) {
        var h = 90 + hash(u) * 110;
        tri(ctx, x, base + 30, x + 50, base - h, x + 130, base + 30, "#241816");
        ell(ctx, x + 50, base - h + 8, 14, 6, "#ff5a1f");
        circ(ctx, x + 50, base - h - 4, 5, "#ffd08a");
        return 200;
      });
      motes(ctx, this, cam, viewW, viewH, 22, "#ffb15a", 18, 2);
    },
    shroom: function (ctx, cam, viewW) {
      var base = gy() - 150;
      march(cam, viewW, 0.0018, 240, function (x, u) {
        var h = 70 + hash(u) * 80;
        var cap = hash(u + 2) > 0.5 ? "#e24a4a" : "#f2c14e";
        box(ctx, x + 28, base - h, 16, h + 20, "#f2e2c8");
        ell(ctx, x + 36, base - h, 36, 18, cap);
        circ(ctx, x + 24, base - h - 2, 4, "#fff6ea");
        circ(ctx, x + 46, base - h + 2, 3, "#fff6ea");
        return 180;
      });
      motes(ctx, this, cam, viewW, 720, 14, "#fff0d8", 10, 2);
    },
    crystal: function (ctx, cam, viewW, viewH) {
      var base = gy() - 120;
      march(cam, viewW, 0.0022, 160, function (x, u) {
        var h = 40 + hash(u) * 90;
        tri(ctx, x + 20, cam.y + 8, x + 8, cam.y + h, x + 34, cam.y + h * 0.7, hash(u) > 0.5 ? "#7ef0ff" : "#d6e4ff");
        tri(ctx, x, base + 10, x + 16, base - h * 0.6, x + 28, base + 10, "#9be7ff");
        return 140;
      });
      motes(ctx, this, cam, viewW, viewH, 20, "#ffffff", 6, 1.6);
    },
    isles: function (ctx, cam, viewW) {
      var base = gy() - 160;
      sun(ctx, cam, viewW, 78, 36, "#fff6d0");
      march(cam, viewW, 0.0015, 300, function (x, u) {
        var y = base - 20 - hash(u) * 90;
        ell(ctx, x + 50, y + 16, 46, 16, "#6a5848");
        ell(ctx, x + 50, y + 6, 40, 12, "#8fbf6a");
        box(ctx, x + 46, y + 16, 6, 28 + hash(u + 1) * 20, "#9fd0ff");
        return 240;
      });
    },
    toxic: function (ctx, cam, viewW, viewH) {
      var base = gy() - 150;
      this.drawFernHills(ctx, cam, viewW, base, 0.002, "#3a4420");
      march(cam, viewW, 0.0024, 220, function (x, u) {
        box(ctx, x + 20, base - 50, 8, 70, "#2a2818");
        tri(ctx, x + 24, base - 30, x, base - 10, x + 20, base - 40, "#323018");
        tri(ctx, x + 24, base - 46, x + 28, base - 36, x + 48, base - 8, "#2a2818");
        return 200;
      });
      bubbles(ctx, this, cam, viewW, viewH, 16, "rgba(198, 255, 58, 0.7)");
    },
    seabed: function (ctx, cam, viewW) {
      var base = gy() - 150;
      sun(ctx, cam, viewW, 84, 48, "#fff6e4");
      this.drawDunes(ctx, cam, viewW, base, 0.002, "#e6d2a8", 70);
      this.drawDunes(ctx, cam, viewW, base + 22, 0.0035, "#f3e6cc", 40);
      march(cam, viewW, 0.0016, 420, function (x, u) {
        if (hash(u) > 0.55) {
          tri(ctx, x, base + 10, x + 16, base - 48, x + 28, base + 10, "#fffaf0");
          tri(ctx, x + 36, base + 10, x + 22, base - 48, x + 48, base + 10, "#f7f1e4");
          ell(ctx, x + 24, base - 46, 16, 5, "#fffaf0");
        } else {
          tri(ctx, x, base + 16, x + 70, base + 16, x + 54, base - 10, "#8a5a32");
          box(ctx, x + 30, base - 28, 4, 28, "#6a4030");
        }
        return 360;
      });
    },
    abyss: function (ctx, cam, viewW, viewH) {
      var base = gy() - 80;
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.fillRect(cam.x - 20, cam.y, viewW + 40, base - cam.y);
      march(cam, viewW, 0.0012, 520, function (x) {
        ell(ctx, x + 80, base - 40, 70, 22, "#041014");
        circ(ctx, x + 120, base - 48, 4, "#3dffc2");
        box(ctx, x + 118, base - 70, 2, 22, "#143038");
        return 480;
      });
      motes(ctx, this, cam, viewW, viewH, 28, "#3dffc2", 8, 1.5);
      bubbles(ctx, this, cam, viewW, viewH, 10, "rgba(158, 246, 255, 0.45)");
    },
    mangrove: function (ctx, cam, viewW) {
      var base = gy() - 130;
      ctx.fillStyle = "rgba(90, 120, 70, 0.35)";
      ctx.fillRect(cam.x - 10, base + 10, viewW + 20, 80);
      march(cam, viewW, 0.002, 180, function (x, u) {
        var h = 50 + hash(u) * 70;
        tri(ctx, x, base + 20, x + 18, base - h, x + 10, base + 20, "#3e3424");
        tri(ctx, x + 40, base + 20, x + 22, base - h * 0.8, x + 30, base + 20, "#5a4030");
        ell(ctx, x + 20, base - h, 16, 8, "#3a5a28");
        return 150;
      });
    },
    geyser: function (ctx, cam, viewW) {
      var base = gy() - 150;
      this.drawPeaks(ctx, cam, viewW, base + 10, 0.002, "#d7cbb8", 70);
      march(cam, viewW, 0.0022, 200, function (x, u) {
        var h = 30 + ((this.time * 24 + hash(u) * 40) % 50);
        box(ctx, x + 20, base - h, 10, h + 16, "rgba(255,255,255,0.75)");
        ell(ctx, x + 25, base - h, 14, 8, "rgba(255,255,255,0.8)");
        return 180;
      }.bind(this));
    },
    clouds: function (ctx, cam, viewW) {
      var base = gy() - 160;
      sun(ctx, cam, viewW, 70, 34, "#fff6d0");
      march(cam, viewW, 0.0014, 340, function (x, u) {
        var y = base - hash(u) * 30;
        ell(ctx, x + 40, y, 50, 16, "#ffffff");
        ell(ctx, x + 16, y + 4, 24, 12, "#f7fbff");
        if (hash(u + 2) > 0.4) {
          box(ctx, x + 28, y - 36, 22, 28, "#f7fbff");
          tri(ctx, x + 24, y - 36, x + 54, y - 36, x + 39, y - 58, "#f2c14e");
        }
        return 260;
      });
    },
    cursed: function (ctx, cam, viewW, viewH) {
      var base = gy() - 140;
      circ(ctx, cam.x + viewW * 0.72, cam.y + 78, 28, "#e4d8f0");
      this.drawPeaks(ctx, cam, viewW, base, 0.0018, "#1a1422", 120);
      march(cam, viewW, 0.0025, 160, function (x, u) {
        box(ctx, x + 16, base - 40, 6, 60, "#120c18");
        tri(ctx, x + 18, base - 20, x - 4, base, x + 14, base - 36, "#1a1020");
        if (hash(u) > 0.6) circ(ctx, x + 8, base - 24, 2, "#d23b4a");
        return 140;
      });
      motes(ctx, this, cam, viewW, viewH, 12, "#c8b8e0", 8, 1.4);
    },
    ruins: function (ctx, cam, viewW) {
      var base = gy() - 150;
      sun(ctx, cam, viewW, 86, 40, "#ffe7b0");
      this.drawDunes(ctx, cam, viewW, base + 16, 0.002, "#e2b878", 50);
      march(cam, viewW, 0.0018, 220, function (x, u) {
        var h = 40 + hash(u) * 70;
        if (hash(u + 1) > 0.45) {
          box(ctx, x + 10, base - h, 14, h + 16, "#f2e2c0");
          box(ctx, x + 6, base - h - 8, 22, 8, "#fff1d0");
        } else {
          tri(ctx, x, base + 10, x + 50, base + 10, x + 25, base - 36, "#e7d3a8");
          box(ctx, x + 8, base - 8, 8, 18, "#f2e2c0");
          box(ctx, x + 32, base - 8, 8, 18, "#f2e2c0");
        }
        return 180;
      });
    },
    alien: function (ctx, cam, viewW) {
      var base = gy() - 150;
      circ(ctx, cam.x + viewW * 0.22, cam.y + 70, 26, "#fff0c8");
      circ(ctx, cam.x + viewW * 0.8, cam.y + 110, 18, "#7dff6a");
      this.drawFernHills(ctx, cam, viewW, base, 0.002, "#4a2060");
      march(cam, viewW, 0.002, 200, function (x, u) {
        box(ctx, x + 18, base - 20, 6, 36, "#3a1860");
        ell(ctx, x + 21, base - 34, 14, 16, hash(u) > 0.5 ? "#7dff6a" : "#ff8ad4");
        return 170;
      });
    },
    invert: function (ctx, cam, viewW) {
      var top = cam.y;
      march(cam, viewW, 0.002, 180, function (x, u) {
        var h = 36 + hash(u) * 70;
        tri(ctx, x + 20, top, x + 8, top + h, x + 30, top + h * 0.55, "#5a4030");
        tri(ctx, x + 40, top, x + 28, top + h * 0.8, x + 52, top + h * 0.4, "#6a4a32");
        return 150;
      });
      this.drawDunes(ctx, cam, viewW, gy() - 36, 0.003, "#ffffff", 48);
    },
    shadow: function (ctx, cam, viewW, viewH) {
      var base = gy() - 140;
      circ(ctx, cam.x + viewW * 0.7, cam.y + 90, 26, "#2a2040");
      march(cam, viewW, 0.0017, 200, function (x, u) {
        var h = 80 + hash(u) * 100;
        tri(ctx, x, base + 20, x + 24, base - h, x + 48, base + 20, "#0c0a12");
        if (hash(u + 2) > 0.5) {
          circ(ctx, x + 18, base - h * 0.45, 2, "#b8a8d0");
          circ(ctx, x + 28, base - h * 0.45, 2, "#b8a8d0");
        }
        return 160;
      });
      motes(ctx, this, cam, viewW, viewH, 10, "#6a4a88", 6, 1.5);
    },
    candy: function (ctx, cam, viewW) {
      var base = gy() - 150;
      this.drawDunes(ctx, cam, viewW, base, 0.002, "#ff8ec4", 70);
      this.drawDunes(ctx, cam, viewW, base + 20, 0.0034, "#fff0a8", 40);
      march(cam, viewW, 0.002, 220, function (x, u) {
        box(ctx, x + 24, base - 20, 6, 40, "#fff6ea");
        circ(ctx, x + 27, base - 36, 16, hash(u) > 0.5 ? "#ff4d8d" : "#7ec8ff");
        circ(ctx, x + 27, base - 36, 8, "#fff0a8");
        return 190;
      });
    },
    clock: function (ctx, cam, viewW) {
      var base = gy() - 150;
      var world = this;
      march(cam, viewW, 0.0018, 200, function (x, u) {
        var r = 22 + hash(u) * 18;
        var y = base - 10 - hash(u + 1) * 40;
        ctx.save();
        ctx.translate(x + 40, y);
        ctx.rotate(world.time * 0.25 + hash(u));
        ctx.strokeStyle = "#8a7048";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#e2c48a";
        var tooth;
        for (tooth = 0; tooth < 6; tooth++) {
          ctx.rotate(Math.PI / 3);
          ctx.fillRect(-3, -r - 6, 6, 8);
        }
        ctx.restore();
        if (hash(u + 4) > 0.55) {
          circ(ctx, x + 40, base - 70, 18, "#f2efe6");
          circ(ctx, x + 40, base - 70, 14, "#1c1814");
          circ(ctx, x + 40, base - 70, 11, "#fffaf0");
        }
        return 180;
      });
    },
    solar: function (ctx, cam, viewW) {
      var base = gy() - 150;
      sun(ctx, cam, viewW, 74, 62, "#fff4c4");
      sun(ctx, cam, viewW, 74, 40, "#ffe08a");
      this.drawDunes(ctx, cam, viewW, base, 0.002, "#e2b13a", 80);
      this.drawDunes(ctx, cam, viewW, base + 20, 0.0035, "#f0c85a", 46);
      march(cam, viewW, 0.0015, 360, function (x) {
        tri(ctx, x + 20, base + 10, x + 8, base - 70, x + 32, base + 10, "#fff4c4");
        return 340;
      });
    },
    bluelava: function (ctx, cam, viewW, viewH) {
      var base = gy() - 140;
      march(cam, viewW, 0.0016, 260, function (x, u) {
        var h = 70 + hash(u) * 80;
        tri(ctx, x, base + 24, x + 46, base - h, x + 110, base + 24, "#101820");
        ell(ctx, x + 46, base - h + 6, 12, 5, "#3ec8ff");
        return 200;
      });
      ctx.strokeStyle = "#3ec8ff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      var lx;
      ctx.moveTo(cam.x, base + 6);
      for (lx = 0; lx <= viewW; lx += 28) {
        ctx.lineTo(cam.x + lx, base + 6 + Math.sin(lx * 0.05 + this.time * 2) * 6);
      }
      ctx.stroke();
      motes(ctx, this, cam, viewW, viewH, 16, "#7ef0ff", 14, 1.8);
    }
  };

  var decorPool = DM.World.prototype.decorPool;
  DM.World.prototype.decorPool = function (x) {
    if (this.mode !== "past") {
      var biome = DM.BIOMES[this.biomeIndexAt(x)];
      if (biome && POOLS[biome.id]) return POOLS[biome.id];
    }
    return decorPool.call(this, x);
  };

  DM.World.prototype.drawExtraDecor = function (ctx, d) {
    var spec = PROPS[d.kind];
    if (!spec) return false;
    var t = this.time || 0;
    if (typeof spec === "function") spec(ctx, d, t);
    else stamp(ctx, d.x, gy(), spec);
    return true;
  };

  var drawParallax = DM.World.prototype.drawParallax;
  DM.World.prototype.drawParallax = function (ctx, biome, cam, viewW, viewH) {
    if (biome && FAR[biome.id]) {
      ctx.save();
      FAR[biome.id].call(this, ctx, cam, viewW, viewH);
      ctx.restore();
      return;
    }
    drawParallax.call(this, ctx, biome, cam, viewW, viewH);
  };

  var checkId;
  var checkN;
  for (checkId in POOLS) {
    if (!Object.prototype.hasOwnProperty.call(POOLS, checkId)) continue;
    for (checkN = 0; checkN < POOLS[checkId].length; checkN++) {
      if (!PROPS[POOLS[checkId][checkN]]) throw new Error("Décor manquant : " + POOLS[checkId][checkN]);
    }
    if (!FAR[checkId]) throw new Error("Ciel manquant : " + checkId);
  }
})();
