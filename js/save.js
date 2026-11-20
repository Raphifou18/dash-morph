(function () {
  "use strict";
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  var DM = root.DM || (root.DM = {});

  var KEYS = {
    coins: "dashmorph.coins",
    owned: "dashmorph.owned",
    equipped: "dashmorph.equipped",
    unlockedLevel: "dashmorph.unlockedLevel",
    cleared: "dashmorph.cleared",
    tracks: "dashmorph.tracks",
    unlockedTrack: "dashmorph.unlockedTrack",
    clearedTracks: "dashmorph.clearedTracks",
    times: "dashmorph.times",
    diamonds: "dashmorph.diamonds",
    ownedAccessories: "dashmorph.ownedAccessories",
    accessory: "dashmorph.accessory"
  };

  var data = null;

  function storage() {
    try {
      return root.localStorage;
    } catch (err) {
      return null;
    }
  }

  function readJSON(raw, fallback) {
    if (!raw) return fallback;
    try {
      var value = JSON.parse(raw);
      return value == null ? fallback : value;
    } catch (err) {
      return fallback;
    }
  }

  function load() {
    var store = storage();
    var coins = 0;
    var owned = ["classique"];
    var equipped = "classique";
    var unlockedLevel = 1;
    var cleared = [];
    var tracks = [];
    var unlockedTrack = 1;
    var clearedTracks = [];
    var times = {};
    var diamonds = 0;
    var ownedAccessories = [];
    var accessory = "";
    if (store) {
      var parsedCoins = parseInt(store.getItem(KEYS.coins) || "0", 10);
      if (isFinite(parsedCoins) && parsedCoins > 0) coins = parsedCoins | 0;
      var parsedOwned = readJSON(store.getItem(KEYS.owned), ["classique"]);
      if (Object.prototype.toString.call(parsedOwned) === "[object Array]") {
        owned = parsedOwned.filter(function (id) { return typeof id === "string"; });
      }
      if (owned.indexOf("classique") < 0) owned.unshift("classique");
      equipped = store.getItem(KEYS.equipped) || "classique";
      var parsedLevel = parseInt(store.getItem(KEYS.unlockedLevel) || "1", 10);
      if (isFinite(parsedLevel)) unlockedLevel = parsedLevel;
      var parsedCleared = readJSON(store.getItem(KEYS.cleared), []);
      if (Object.prototype.toString.call(parsedCleared) === "[object Array]") {
        cleared = parsedCleared.filter(function (n) { return typeof n === "number" && n >= 1 && n <= 20; });
      }
      var parsedTracks = readJSON(store.getItem(KEYS.tracks), []);
      if (Object.prototype.toString.call(parsedTracks) === "[object Array]") {
        tracks = parsedTracks.filter(function (n) { return typeof n === "number" && n >= 1 && n <= 20; });
      }
      var rawUnlock = store.getItem(KEYS.unlockedTrack);
      var parsedUnlock = parseInt(rawUnlock || "", 10);
      if (rawUnlock != null && isFinite(parsedUnlock)) unlockedTrack = parsedUnlock;
      else {
        var bought = 0;
        var ti;
        for (ti = 0; ti < tracks.length; ti++) if (tracks[ti] > bought) bought = tracks[ti];
        if (bought > 0) unlockedTrack = bought;
      }
      var parsedClearedTracks = readJSON(store.getItem(KEYS.clearedTracks), []);
      if (Object.prototype.toString.call(parsedClearedTracks) === "[object Array]") {
        clearedTracks = parsedClearedTracks.filter(function (n) { return typeof n === "number" && n >= 1 && n <= 20; });
      }
      var parsedTimes = readJSON(store.getItem(KEYS.times), {});
      if (parsedTimes && typeof parsedTimes === "object") times = parsedTimes;
      var parsedDiamonds = parseInt(store.getItem(KEYS.diamonds) || "0", 10);
      if (isFinite(parsedDiamonds) && parsedDiamonds > 0) diamonds = parsedDiamonds | 0;
      var parsedAccessories = readJSON(store.getItem(KEYS.ownedAccessories), []);
      if (Object.prototype.toString.call(parsedAccessories) === "[object Array]") {
        ownedAccessories = parsedAccessories.filter(function (id) { return typeof id === "string"; });
      }
      accessory = store.getItem(KEYS.accessory) || "";
    }
    if (!DM.catalog) {
      data = blank(coins, owned, equipped, unlockedLevel, cleared, tracks, times, diamonds, ownedAccessories, accessory, unlockedTrack, clearedTracks);
      return data;
    }
    if (!find(equipped)) equipped = "classique";
    owned = owned.filter(find);
    if (owned.indexOf("classique") < 0) owned.unshift("classique");
    if (unlockedLevel < 1) unlockedLevel = 1;
    if (unlockedLevel > 20) unlockedLevel = 20;
    if (unlockedTrack < 1) unlockedTrack = 1;
    if (unlockedTrack > 20) unlockedTrack = 20;
    ownedAccessories = ownedAccessories.filter(knownAccessory);
    if (!knownAccessory(accessory)) accessory = "";
    data = {
      coins: coins,
      owned: owned,
      equipped: equipped,
      unlockedLevel: unlockedLevel,
      cleared: cleared,
      tracks: tracks,
      unlockedTrack: unlockedTrack,
      clearedTracks: clearedTracks,
      times: times,
      diamonds: diamonds,
      ownedAccessories: ownedAccessories,
      accessory: accessory
    };
    return data;
  }

  function knownAccessory(id) {
    if (!DM.accessories) return id === "echarpe" || id === "bonnet";
    var i;
    for (i = 0; i < DM.accessories.length; i++) if (DM.accessories[i].id === id) return true;
    return false;
  }

  function blank(coins, owned, equipped, unlockedLevel, cleared, tracks, times, diamonds, ownedAccessories, accessory, unlockedTrack, clearedTracks) {
    return {
      coins: coins,
      owned: owned,
      equipped: equipped,
      unlockedLevel: unlockedLevel,
      cleared: cleared,
      tracks: tracks || [],
      unlockedTrack: unlockedTrack || 1,
      clearedTracks: clearedTracks || [],
      times: times || {},
      diamonds: diamonds || 0,
      ownedAccessories: ownedAccessories || [],
      accessory: accessory || ""
    };
  }

  function find(id) {
    if (!DM.catalog) return id === "classique";
    for (var i = 0; i < DM.catalog.length; i++) {
      if (DM.catalog[i].id === id) return DM.catalog[i];
    }
    return null;
  }

  function persist() {
    var store = storage();
    if (!store || !data) return;
    try {
      store.setItem(KEYS.coins, String(data.coins | 0));
      store.setItem(KEYS.owned, JSON.stringify(data.owned));
      store.setItem(KEYS.equipped, data.equipped);
      store.setItem(KEYS.unlockedLevel, String(data.unlockedLevel | 0));
      store.setItem(KEYS.cleared, JSON.stringify(data.cleared));
      store.setItem(KEYS.tracks, JSON.stringify(data.tracks || []));
      store.setItem(KEYS.unlockedTrack, String(data.unlockedTrack | 0));
      store.setItem(KEYS.clearedTracks, JSON.stringify(data.clearedTracks || []));
      store.setItem(KEYS.times, JSON.stringify(data.times || {}));
      store.setItem(KEYS.diamonds, String(data.diamonds | 0));
      store.setItem(KEYS.ownedAccessories, JSON.stringify(data.ownedAccessories || []));
      store.setItem(KEYS.accessory, data.accessory || "");
    } catch (err) {}
  }

  DM.save = {
    ready: function () {
      if (!data || (DM.catalog && !find(data.equipped))) load();
      return data;
    },
    addDiamonds: function (n) {
      n = n | 0;
      if (n <= 0) return this.ready().diamonds | 0;
      this.ready();
      data.diamonds = (data.diamonds | 0) + n;
      persist();
      return data.diamonds;
    },
    addCoins: function (n) {
      n = n | 0;
      if (n <= 0) return this.ready().coins;
      this.ready();
      data.coins += n;
      persist();
      return data.coins;
    },
    markClear: function (level) {
      this.ready();
      var first = data.cleared.indexOf(level) < 0;
      if (first) {
        data.cleared.push(level);
        data.coins += 50 * level;
      }
      var lastLevel = DM.ADVENTURE ? DM.ADVENTURE.length : 20;
      if (level >= 1 && level < lastLevel && data.unlockedLevel < level + 1) data.unlockedLevel = level + 1;
      if (data.unlockedLevel > lastLevel) data.unlockedLevel = lastLevel;
      persist();
      return first;
    },
    buyTrack: function (id) {
      this.ready();
      id = id | 0;
      if (!data.tracks) data.tracks = [];
      if (data.tracks.indexOf(id) >= 0) return "owned";
      if (id > 1 && data.tracks.indexOf(id - 1) < 0) return "locked";
      var track = null;
      var i;
      if (!DM.TRACKS) return "missing";
      for (i = 0; i < DM.TRACKS.length; i++) if (DM.TRACKS[i].id === id) track = DM.TRACKS[i];
      if (!track || track.price == null) return "missing";
      if (data.coins < track.price) return "poor";
      data.coins -= track.price;
      data.tracks.push(id);
      persist();
      return "bought";
    },
    markTrack: function (id, seconds) {
      var best = this.markTime(id, seconds);
      this.ready();
      id = id | 0;
      if (!data.clearedTracks) data.clearedTracks = [];
      if (id >= 1 && data.clearedTracks.indexOf(id) < 0) data.clearedTracks.push(id);
      var last = DM.TRACKS ? DM.TRACKS.length : 20;
      if (id >= 1 && id < last && data.unlockedTrack < id + 1) data.unlockedTrack = id + 1;
      if (data.unlockedTrack > last) data.unlockedTrack = last;
      persist();
      return best;
    },
    markTime: function (id, seconds) {
      this.ready();
      if (!data.times) data.times = {};
      var key = String(id);
      var prev = data.times[key];
      var best = prev == null || seconds < prev;
      if (best) data.times[key] = Math.round(seconds * 100) / 100;
      persist();
      return best;
    }
  };
})();
