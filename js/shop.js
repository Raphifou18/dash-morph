(function () {
  "use strict";
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  var DM = root.DM || (root.DM = {});

  DM.accessories = [
    { id: "echarpe", name: "Écharpe", price: 6 },
    { id: "bonnet", name: "Bonnet", price: 8 },
    { id: "lunettes", name: "Lunettes", price: 10 },
    { id: "cape", name: "Cape", price: 12 },
    { id: "couronne", name: "Couronne", price: 14 },
    { id: "noeud", name: "Nœud", price: 16 },
    { id: "ailes", name: "Ailes", price: 18 },
    { id: "masque", name: "Masque", price: 20 }
  ];

  DM.catalog = [
    { id: "classique", name: "Classique", price: 0 },
    { id: "dino", name: "Dino", price: 120 },
    { id: "cube", name: "Cube", price: 300 },
    { id: "astronaute", name: "Astronaute", price: 600 },
    { id: "chat", name: "Chat", price: 950 },
    { id: "robot", name: "Robot", price: 1400 },
    { id: "oiseau", name: "Oiseau", price: 2100 },
    { id: "spectre", name: "Spectre", price: 2900 },
    { id: "renard", name: "Renard", price: 3700 },
    { id: "lapin", name: "Lapin", price: 4600 },
    { id: "ninja", name: "Ninja", price: 5600 },
    { id: "chevalier", name: "Chevalier", price: 6800 },
    { id: "sorcier", name: "Sorcier", price: 8100 },
    { id: "pirate", name: "Pirate", price: 9500 },
    { id: "panda", name: "Panda", price: 11000 },
    { id: "alien", name: "Alien", price: 12900 }
  ];

  function item(id) {
    for (var i = 0; i < DM.catalog.length; i++) {
      if (DM.catalog[i].id === id) return DM.catalog[i];
    }
    return DM.catalog[0];
  }

  DM.shop = {
    item: item,
    owned: function (id) {
      return DM.save.ready().owned.indexOf(id) >= 0;
    },
    equippedId: function () {
      return DM.save.ready().equipped;
    },
    choose: function (id) {
      var it = item(id);
      if (!it) return "missing";
      var save = DM.save.ready();
      if (save.owned.indexOf(id) >= 0) {
        save.equipped = id;
        DM.save.ready();
        try {
          root.localStorage.setItem("dashmorph.equipped", id);
        } catch (err) {}
        return "equipped";
      }
      if (save.coins < it.price) return "poor";
      save.coins -= it.price;
      save.owned.push(id);
      save.equipped = id;
      try {
        root.localStorage.setItem("dashmorph.coins", String(save.coins | 0));
        root.localStorage.setItem("dashmorph.owned", JSON.stringify(save.owned));
        root.localStorage.setItem("dashmorph.equipped", id);
      } catch (err) {}
      return "bought";
    },
    accessory: function (id) {
      var i;
      for (i = 0; i < DM.accessories.length; i++) {
        if (DM.accessories[i].id === id) return DM.accessories[i];
      }
      return null;
    },
    chooseAccessory: function (id) {
      var it = this.accessory(id);
      if (!it) return "missing";
      var save = DM.save.ready();
      if (!save.ownedAccessories) save.ownedAccessories = [];
      if (save.accessory === id) {
        save.accessory = "";
        try { root.localStorage.setItem("dashmorph.accessory", ""); } catch (err) {}
        return "cleared";
      }
      if (save.ownedAccessories.indexOf(id) >= 0) {
        save.accessory = id;
        try { root.localStorage.setItem("dashmorph.accessory", id); } catch (err) {}
        return "equipped";
      }
      if ((save.diamonds | 0) < it.price) return "poor";
      save.diamonds -= it.price;
      save.ownedAccessories.push(id);
      save.accessory = id;
      try {
        root.localStorage.setItem("dashmorph.diamonds", String(save.diamonds | 0));
        root.localStorage.setItem("dashmorph.ownedAccessories", JSON.stringify(save.ownedAccessories));
        root.localStorage.setItem("dashmorph.accessory", id);
      } catch (err) {}
      return "bought";
    }
  };
})();
