/* re-forge landing: frame fitting + the hero's one orchestrated motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Fit each app frame to its container. Frames are drawn at a fixed
     design width and scaled with `zoom`, so layout height follows. Below a
     floor the frame stays legible and scrolls inside its own wrapper. ---- */
  var wraps = Array.prototype.slice.call(document.querySelectorAll(".frame-wrap"));
  function fit() {
    wraps.forEach(function (w) {
      var win = w.querySelector(".window");
      if (!win) return;
      /* Under 700px the sidebar is chrome the phone cannot afford: drop it and
         draw the main view alone, so the tree or board is what shows first. */
      w.classList.toggle("is-narrow", w.clientWidth < 700);
      var fw = parseFloat(getComputedStyle(w).getPropertyValue("--fw")) || 1120;
      var floor = parseFloat(w.getAttribute("data-min-zoom") || "0.62");
      var z = Math.min(1, w.clientWidth / fw);
      if (z < floor) z = floor;
      win.style.setProperty("--z", z.toFixed(4));
      w.classList.toggle("has-overflow", fw * z > w.clientWidth + 1);
    });
  }
  wraps.forEach(function (w) {
    w.addEventListener("scroll", function () {
      w.classList.toggle("at-end", w.scrollLeft + w.clientWidth >= w.scrollWidth - 2);
    }, { passive: true });
  });
  fit();
  window.addEventListener("resize", fit);
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(fit);
    wraps.forEach(function (w) { ro.observe(w); });
  }

  /* ---- Hero, phase one: lineage vines grow out of the window and bud.
     Starts shortly after load; the tree inside waits for it to finish. ---- */
  var heroSec = document.querySelector(".hero");
  var vine = heroSec && heroSec.querySelector(".vine");
  var VINES_MS = 2400;
  var grownAt = 0;
  if (vine) {
    setTimeout(function () {
      heroSec.classList.add("is-grown");
      grownAt = Date.now();
    }, 250);
  }
  function vinesRemaining() {
    if (!vine || reduce.matches || getComputedStyle(vine).display === "none") return 0;
    if (!grownAt) return VINES_MS + 250;
    return Math.max(0, VINES_MS - (Date.now() - grownAt));
  }

  /* ---- Hero, phase two: the lineage tree draws itself once, generation by
     generation, and the status line narrates. Reduced motion shows the final
     state. ---- */
  var hero = document.querySelector("[data-evo]");
  var status = hero && hero.querySelector("[data-status]");
  var MSGS = [
    "capturing: 21 days of sessions collected, threshold met",
    "generation 1: candidates spawned from repeated workflows",
    "generation 2: scored against <b>1,136</b> captured outcomes",
    "generation 3: 2 candidates retired, weakest lineage pruned",
    "generation 4: lineage <b>e → h → k</b> survives and specialises",
    "specialised agent ready: <b>typecheck → fix → commit</b>"
  ];
  function narrate() {
    if (!status) return;
    if (reduce.matches) { status.innerHTML = MSGS[MSGS.length - 1]; return; }
    var i = 0;
    (function step() {
      status.innerHTML = MSGS[i];
      i += 1;
      if (i < MSGS.length) setTimeout(step, 950);
    })();
  }
  function play() {
    setTimeout(function () {
      hero.classList.add("is-live");
      narrate();
    }, vinesRemaining());
  }
  if (hero) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { play(); io.disconnect(); }
      }, { threshold: 0.2 });
      io.observe(hero);
    } else {
      play();
    }
  }
})();
