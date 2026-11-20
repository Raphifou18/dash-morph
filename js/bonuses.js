(function () {
  "use strict";
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  var DM = root.DM || (root.DM = {});

  DM.bonus = {
    kind: null,
    time: 0,
    start: function (kind) {
      this.kind = kind;
      this.time = DM.config.bonusTime;
    },
    tick: function (realDt) {
      if (!this.kind) return;
      this.time -= realDt;
      if (this.time <= 0) {
        this.kind = null;
        this.time = 0;
      }
    },
    scale: function () {
      if (this.kind === "speed") return DM.config.speedScale;
      if (this.kind === "slow") return DM.config.slowScale;
      return 1;
    },
    hot: function () {
      return this.kind === "speed" || this.kind === "slow";
    },
    clear: function () {
      this.kind = null;
      this.time = 0;
    },
    label: function () {
      if (this.kind === "speed") return "Rapidité " + this.time.toFixed(1) + " s";
      if (this.kind === "slow") return "Ralenti " + this.time.toFixed(1) + " s";
      return "";
    }
  };
})();
