(function () {
  "use strict";
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  var DM = root.DM || (root.DM = {});

  function el(id) {
    return document.getElementById(id);
  }

  function formatTime(t) {
    t = Math.max(0, t || 0);
    var m = Math.floor(t / 60);
    var s = t - m * 60;
    var whole = Math.floor(s);
    var frac = Math.floor((s - whole) * 10);
    return m + ":" + (whole < 10 ? "0" : "") + whole + "." + frac;
  }

  function paint(canvas, id, form, scale, gear) {
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    DM.paintCharacter(ctx, id, form, canvas.width / 2, canvas.height - 10, scale || 1.15, 0.4, gear || "");
  }

  DM.ui = {
    mode: "",
    shopPage: 0,
    levelPage: 0,
    trackPage: 0,
    bind: function () {
      var ui = this;
      el("btn-endless").addEventListener("click", function () { DM.game.startEndless(); });
      el("btn-adventure").addEventListener("click", function () {
        ui.levelPage = 0;
        ui.show("adventure");
      });
      el("btn-level-prev").addEventListener("click", function () {
        if (ui.levelPage > 0) ui.levelPage -= 1;
        ui.renderLevels();
      });
      el("btn-level-next").addEventListener("click", function () {
        if (ui.levelPage < 2) ui.levelPage += 1;
        ui.renderLevels();
      });
      el("btn-tempo").addEventListener("click", function () {
        ui.trackPage = 0;
        DM.game.state = "tracks";
        ui.show("tracks");
      });
      el("btn-tempo-prev").addEventListener("click", function () {
        if (ui.trackPage > 0) ui.trackPage -= 1;
        ui.renderTracks();
      });
      el("btn-tempo-next").addEventListener("click", function () {
        if (ui.trackPage < 2) ui.trackPage += 1;
        ui.renderTracks();
      });
      el("btn-shop").addEventListener("click", function () {
        ui.shopPage = 0;
        ui.show("shop");
      });
      el("btn-shop-prev").addEventListener("click", function () {
        if (ui.shopPage > 0) ui.shopPage -= 1;
        ui.renderShop();
      });
      el("btn-shop-next").addEventListener("click", function () {
        if (ui.shopPage < 2) ui.shopPage += 1;
        ui.renderShop();
      });
      el("btn-levels-back").addEventListener("click", function () { ui.show("menu"); });
      el("btn-tempo-back").addEventListener("click", function () {
        DM.game.state = "menu";
        ui.show("menu");
      });
      el("btn-shop-back").addEventListener("click", function () { ui.show("menu"); });
      el("btn-pause").addEventListener("click", function () { DM.game.togglePause(); });
      el("btn-resume").addEventListener("click", function () { DM.game.togglePause(); });
      el("btn-restart").addEventListener("click", function () { DM.game.restart(); });
      el("btn-quit").addEventListener("click", function () { DM.game.quit(); });
      el("btn-replay").addEventListener("click", function () { DM.game.restart(); });
      el("btn-next").addEventListener("click", function () {
        var game = DM.game;
        if (game.mode === "tempo") {
          var lastTrack = DM.TRACKS ? DM.TRACKS.length : 20;
          if (game.trackId < lastTrack) game.startTempo(game.trackId + 1);
          else {
            ui.trackPage = Math.floor((game.trackId - 1) / 8);
            game.state = "tracks";
            ui.show("tracks");
          }
        } else if (DM.ADVENTURE && game.levelIndex < DM.ADVENTURE.length) game.startLevel(game.levelIndex + 1);
        else {
          ui.levelPage = DM.ADVENTURE ? Math.floor((game.levelIndex - 1) / 8) : 0;
          ui.show("adventure");
        }
      });
      el("btn-clear-menu").addEventListener("click", function () { DM.game.quit(); });
    },
    show: function (name, game) {
      this.mode = name;
      el("screen-menu").hidden = name !== "menu";
      el("screen-levels").hidden = name !== "adventure";
      el("screen-tempo").hidden = name !== "tracks";
      el("screen-shop").hidden = name !== "shop";
      var hudOn = name === "play" || name === "pause" || name === "dead" || name === "slingshot" || name === "clear";
      el("hud").hidden = !hudOn;
      el("action-dock").hidden = !(name === "pause" || name === "dead");
      el("clear-dock").hidden = name !== "clear";
      el("btn-pause").hidden = !(name === "play" || name === "slingshot" || name === "pause");
      el("btn-resume").hidden = name !== "pause";
      el("dock-prime").hidden = name !== "dead";
      el("dock-score").hidden = name !== "dead";
      if (name === "pause") el("dock-title").textContent = "Pause";
      if (name === "dead") {
        el("dock-title").textContent = "Perdu";
        var prime = game && game.lastPrime ? game.lastPrime : 0;
        el("dock-prime").textContent = prime > 0 ? "+" + prime + " pièces de distance" : "Prime de distance : 0";
        var runScore = game ? Math.floor(game.distance()) : 0;
        var beaten = game && game.mode === "endless" && game.recordPlayed;
        el("dock-score").textContent = beaten ? "Cette partie " + runScore + " m · nouveau record" : "Cette partie " + runScore + " m";
      }
      if (name === "clear" && game) {
        var next = el("btn-next");
        if (game.mode === "tempo" && game.world && game.world.track) {
          var best = DM.save.ready().times[String(game.trackId)];
          var trackBiome = DM.BIOMES[(game.world.track.biome == null ? game.trackId - 1 : game.world.track.biome) % DM.BIOMES.length];
          el("clear-title").textContent = "Monde " + game.trackId + " réussi";
          el("clear-sub").textContent = game.world.track.name + " · " + trackBiome.name + " · " + formatTime(game.clearTime || 0);
          el("clear-prime").textContent = game.firstClear ? "Nouveau record" : "Record " + formatTime(best || 0);
          next.textContent = DM.TRACKS && game.trackId >= DM.TRACKS.length ? "Mondes" : "Monde suivant";
        } else {
          var course = DM.ADVENTURE && DM.ADVENTURE[game.levelIndex - 1];
          var biome = course ? DM.BIOMES[course.biome] : DM.BIOMES[(game.levelIndex - 1) % DM.BIOMES.length];
          el("clear-title").textContent = "Niveau " + game.levelIndex + " réussi";
          el("clear-sub").textContent = course ? course.name + " · " + biome.name : biome.name;
          el("clear-prime").textContent = game.firstClear ? "+" + game.lastPrime + " pièces" : "Niveau déjà réussi";
          if (!DM.ADVENTURE || game.levelIndex >= DM.ADVENTURE.length) next.textContent = "Niveaux";
          else next.textContent = "Niveau suivant";
        }
      }
      if (name === "menu") this.paintMenu();
      this.renderScores();
      if (name === "adventure") this.renderLevels();
      if (name === "tracks") this.renderTracks();
      if (name === "shop") this.renderShop();
      this.sync(DM.game);
    },
    sync: function (game) {
      var save = DM.save.ready();
      el("menu-coins").textContent = String(save.coins);
      el("shop-coins").textContent = String(save.coins);
      el("coins").textContent = String(save.coins);
      var bestEl = el("hud-best");
      if (bestEl) {
        bestEl.textContent = "Record " + (save.bestDistance | 0) + " m";
        bestEl.hidden = !(game && (game.mode === "endless" || game.mode === "past"));
      }
      var gems = String(save.diamonds | 0);
      el("menu-gems").textContent = gems;
      el("shop-gems").textContent = gems;
      el("gems").textContent = gems;
      if (!game || !game.player || !game.world) {
        el("lives").textContent = "0";
        return;
      }
      el("lives").textContent = String(game.player.lives | 0);
      var biome = game.world.biome(game.player);
      if (game.mode === "tempo") {
        el("hud-title").textContent = formatTime(game.attemptTime || 0);
        el("hud-sub").textContent = game.world.track ? game.world.track.name : "Musique";
      } else if (game.mode === "endless") {
        el("hud-title").textContent = Math.floor(game.distance()) + " m";
        el("hud-sub").textContent = biome.name;
      } else if (game.mode === "past") {
        el("hud-title").textContent = Math.floor(game.pastTime || 0) + " s";
        el("hud-sub").textContent = "Monde du passé";
      } else {
        el("hud-title").textContent = "Niveau " + game.levelIndex;
        el("hud-sub").textContent = game.world.levelName ? game.world.levelName + " · " + biome.name : biome.name;
      }
      var form = game.player.form === "ship" ? "Vaisseau " + Math.max(0, game.player.shipLeft).toFixed(1) + "s" : "Coureur";
      var size = game.player.big ? "Grand" : "Normal";
      if (game.player.growing) size = "Grandit";
      else if (game.player.visualScale > 1.05 && game.player.visualScale < DM.config.bigScale - 0.05) size = "Rétrécit";
      var bonus = DM.bonus.label();
      var hint = game.player.onChicken ? "Assis sur le poulet. Droite, D ou clic droit. Clic gauche ou Z, puis encore en l’air" : (game.player.form === "ship" ? "Droite, D ou clic droit pour avancer, maintenir le clic gauche pour monter" : "Droite, D ou clic droit pour avancer, clic gauche ou Z pour sauter");
      if (game.mode === "tempo" && game.world && game.world.waiting) hint = "Droite, D, clic droit, clic gauche ou Z pour commencer";
      el("hud-status").textContent = form + " · " + size + (bonus ? " · " + bonus : "") + " · " + hint;
      var locked = game.state === "ceilingFall" || game.state === "ceilingWait" || game.state === "ceilingSave" || game.state === "pitfall" || game.state === "iris" || game.state === "pastwait" || game.state === "pastdrop" || game.state === "burn" || game.state === "record";
      if (locked) el("btn-pause").hidden = true;
      var equipped = DM.shop.item(save.equipped);
      el("menu-equipped").textContent = equipped.name;
    },
    renderScores: function () {
      var list = el("score-list");
      if (!list || !DM.save) return;
      var scores = DM.save.ready().scores || [];
      list.innerHTML = "";
      if (!scores.length) {
        var empty = document.createElement("li");
        empty.className = "empty";
        empty.textContent = "Aucune course encore";
        list.appendChild(empty);
        return;
      }
      var i;
      for (i = 0; i < scores.length; i++) {
        var row = document.createElement("li");
        var rank = document.createElement("span");
        var dist = document.createElement("span");
        var time = document.createElement("span");
        rank.textContent = String(i + 1);
        dist.textContent = scores[i].m + " m";
        time.textContent = scores[i].s > 0 ? formatTime(scores[i].s) : "—";
        row.appendChild(rank);
        row.appendChild(dist);
        row.appendChild(time);
        list.appendChild(row);
      }
    },
    paintMenu: function () {
      var save = DM.save.ready();
      paint(el("preview"), save.equipped, "runner", 1.15, save.accessory);
      paint(el("preview-ship"), save.equipped, "ship", 1.05, save.accessory);
    },
    renderLevels: function () {
      var host = el("level-list");
      var save = DM.save.ready();
      var courses = DM.ADVENTURE || [];
      var page = this.levelPage || 0;
      if (page < 0) page = 0;
      if (page > 2) page = 2;
      this.levelPage = page;
      host.innerHTML = "";
      el("level-note").textContent = "Vingt niveaux, du plus facile au plus difficile. Pas de musique, pas de bonus.";
      el("level-page").textContent = "Niveaux · " + (page + 1) + " / 3";
      el("btn-level-prev").disabled = page === 0;
      el("btn-level-next").disabled = page === 2;
      var start = page * 8;
      var slice = courses.slice(start, start + 8);
      var i;
      for (i = 0; i < slice.length; i++) {
        var index = start + i + 1;
        var course = slice[i];
        var biome = DM.BIOMES[course.biome % DM.BIOMES.length];
        var button = document.createElement("button");
        button.type = "button";
        button.className = "level-btn";
        button.style.setProperty("--stripe", biome.accent);
        var locked = index > save.unlockedLevel;
        var cleared = save.cleared.indexOf(index) >= 0;
        button.disabled = locked;
        button.innerHTML = "<span class='lvl-index'>" + index + "</span><span class='lvl-copy'><strong>" + course.name + "</strong><em>" + biome.name + " · " + (locked ? "Verrouillé" : cleared ? "Réussi" : "À jouer") + "</em></span>";
        if (!locked) {
          (function (n) {
            button.addEventListener("click", function () { DM.game.startLevel(n); });
          })(index);
        }
        host.appendChild(button);
      }
    },
    renderTracks: function () {
      var host = el("tempo-list");
      var save = DM.save.ready();
      if (!save.times) save.times = {};
      if (!save.clearedTracks) save.clearedTracks = [];
      var courses = DM.TRACKS || [];
      var page = this.trackPage || 0;
      if (page < 0) page = 0;
      if (page > 2) page = 2;
      this.trackPage = page;
      host.innerHTML = "";
      el("tempo-note").textContent = "Vingt mondes, du plus facile au plus difficile. Finir un monde ouvre seulement le suivant.";
      el("tempo-page").textContent = "Mondes · " + (page + 1) + " / 3";
      el("btn-tempo-prev").disabled = page === 0;
      el("btn-tempo-next").disabled = page === 2;
      var start = page * 8;
      var slice = courses.slice(start, start + 8);
      var unlocked = save.unlockedTrack || 1;
      var i;
      for (i = 0; i < slice.length; i++) {
        var track = slice[i];
        var index = track.id;
        var biome = DM.BIOMES[(track.biome == null ? index - 1 : track.biome) % DM.BIOMES.length];
        var button = document.createElement("button");
        button.type = "button";
        button.className = "level-btn";
        button.style.setProperty("--stripe", biome.accent);
        var locked = index > unlocked;
        var best = save.times[String(index)];
        var cleared = save.clearedTracks.indexOf(index) >= 0;
        var state = locked ? "Verrouillé" : (best != null ? "Record " + formatTime(best) : cleared ? "Réussi" : "À jouer");
        button.disabled = locked;
        button.innerHTML = "<span class='lvl-index'>" + index + "</span><span class='lvl-copy'><strong>" + track.name + "</strong><em>" + biome.name + " · " + state + "</em></span>";
        if (!locked) {
          (function (n) {
            button.addEventListener("click", function () { DM.game.startTempo(n); });
          })(index);
        }
        host.appendChild(button);
      }
    },
    renderShop: function () {
      var host = el("shop-grid");
      var save = DM.save.ready();
      var page = this.shopPage || 0;
      if (page < 0) page = 0;
      if (page > 2) page = 2;
      this.shopPage = page;
      host.innerHTML = "";
      var note = el("shop-note");
      var label = el("shop-page");
      el("btn-shop-prev").disabled = page === 0;
      el("btn-shop-next").disabled = page === 2;
      if (page === 2) {
        label.textContent = "Accessoires";
        note.textContent = "Dernière page. Les accessoires s'achètent en diamants et se portent sur tous les personnages.";
        this.renderAccessoryPage(host, save);
        return;
      }
      label.textContent = "Skins · " + (page + 1) + " / 2";
      note.textContent = page === 0 ? "Du moins cher au plus cher." : "Suite des skins, toujours du moins cher au plus cher.";
      var skins = DM.catalog.slice().sort(function (a, b) { return a.price - b.price; });
      var start = page * 8;
      var slice = skins.slice(start, start + 8);
      var i;
      for (i = 0; i < slice.length; i++) this.renderSkinCard(host, save, slice[i]);
    },
    renderSkinCard: function (host, save, item) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "shop-card" + (save.equipped === item.id ? " is-equipped" : "");
      var owned = save.owned.indexOf(item.id) >= 0;
      var canvas = document.createElement("canvas");
      canvas.width = 120;
      canvas.height = 124;
      card.appendChild(canvas);
      var name = document.createElement("strong");
      name.textContent = item.name;
      card.appendChild(name);
      var price = document.createElement("em");
      if (save.equipped === item.id) price.textContent = "Équipé";
      else if (owned) price.textContent = "Choisir";
      else price.textContent = item.price + " pièces";
      card.appendChild(price);
      if (!owned && save.coins < item.price) card.className += " is-poor";
      card.addEventListener("click", function () {
        var result = DM.shop.choose(item.id);
        if (result === "poor") el("shop-note").textContent = "Pas assez de pièces";
        else el("shop-note").textContent = result === "bought" ? "Personnage débloqué" : "";
        DM.ui.renderShop();
        DM.ui.sync(DM.game);
      });
      host.appendChild(card);
      paint(canvas, item.id, "runner", 0.78, save.accessory);
    },
    renderAccessoryPage: function (host, save) {
      var wearer = save.equipped || "classique";
      var a;
      for (a = 0; a < DM.accessories.length; a++) {
        var gear = DM.accessories[a];
        var ownedGear = save.ownedAccessories && save.ownedAccessories.indexOf(gear.id) >= 0;
        var card = document.createElement("button");
        card.type = "button";
        card.className = "shop-card" + (save.accessory === gear.id ? " is-equipped" : "");
        var canvas = document.createElement("canvas");
        canvas.width = 120;
        canvas.height = 124;
        card.appendChild(canvas);
        var labelA = document.createElement("strong");
        labelA.textContent = gear.name;
        card.appendChild(labelA);
        var priceA = document.createElement("em");
        if (save.accessory === gear.id) priceA.textContent = "Équipé";
        else if (ownedGear) priceA.textContent = "Choisir";
        else priceA.textContent = gear.price + " diamants";
        card.appendChild(priceA);
        if (!ownedGear && (save.diamonds | 0) < gear.price) card.className += " is-poor";
        (function (id) {
          card.addEventListener("click", function () {
            var result = DM.shop.chooseAccessory(id);
            DM.ui.renderShop();
            DM.ui.sync(DM.game);
            if (result === "poor") el("shop-note").textContent = "Pas assez de diamants";
            else if (result === "bought") el("shop-note").textContent = "Accessoire débloqué";
            else if (result === "cleared") el("shop-note").textContent = "Accessoire retiré";
          });
        })(gear.id);
        host.appendChild(card);
        paint(canvas, wearer, "runner", 0.78, gear.id);
      }
    },
    popLife: function () {
      var node = el("life-pop");
      if (!node) return;
      node.classList.remove("is-pop");
      void node.offsetWidth;
      node.classList.add("is-pop");
      clearTimeout(this.popTimer);
      this.popTimer = setTimeout(function () { node.classList.remove("is-pop"); }, 700);
    },
    anchor: function (kind) {
      var node = el(kind === "heart" ? "lives" : "coins");
      var canvas = el("game");
      if (!node || !canvas) return { x: kind === "heart" ? 980 : 1100, y: 40 };
      var er = node.getBoundingClientRect();
      var cr = canvas.getBoundingClientRect();
      if (!cr.width || !cr.height) return { x: kind === "heart" ? 980 : 1100, y: 40 };
      return {
        x: (er.left + er.width / 2 - cr.left) / cr.width * 1280,
        y: (er.top + er.height / 2 - cr.top) / cr.height * 720
      };
    }
  };
})();
