/* re-forge v3: the selection funnel (dashboard and centrepiece), scroll reveals. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Funnel. Stages of candidates, left to right: a dense grid, a thinner
     grid, a column, a few, one. Every dot links to a parent in the next stage;
     lines of candidates that fail are drawn lighter, the surviving lineage a
     little darker, and the last segment green. Deterministic, so it is the
     same picture on every load. ---- */
  function rnd(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
  function buildFunnel(svg, W, H, dense) {
    var R = rnd(7);
    var pad = 24, top = 22, bot = H - 22;
    var stages = dense
      ? [{ n: 320, cols: 16 }, { n: 184, cols: 8 }, { n: 32, cols: 1 }, { n: 4, cols: 1 }, { n: 1, cols: 1 }]
      : [{ n: 160, cols: 8 }, { n: 92, cols: 4 }, { n: 16, cols: 1 }, { n: 4, cols: 1 }, { n: 1, cols: 1 }];
    var colX = [0, 0.27, 0.54, 0.77, 0.96].map(function (t) { return pad + t * (W - pad * 2); });
    var gap = dense ? 6.4 : 8;
    var pts = [];
    stages.forEach(function (s, si) {
      var arr = [];
      var rows = Math.ceil(s.n / s.cols);
      var h = Math.min(bot - top, (rows - 1) * gap);
      var rowGap = rows > 1 ? h / (rows - 1) : 0;
      var y0 = (top + bot) / 2 - h / 2;
      for (var i = 0; i < s.n; i++) {
        var c = i % s.cols, r = Math.floor(i / s.cols);
        arr.push({ x: colX[si] + c * gap, y: y0 + r * rowGap, parent: null, alive: true, id: i });
      }
      pts.push(arr);
    });
    /* parents: each dot in stage i maps to a dot in stage i+1 by vertical proximity, with jitter */
    for (var si = 0; si < pts.length - 1; si++) {
      var next = pts[si + 1];
      pts[si].forEach(function (p) {
        var best = 0, bd = Infinity;
        var j = Math.floor(R() * next.length);
        for (var k = 0; k < next.length; k++) { var d = Math.abs(next[k].y - p.y) + R() * 30; if (d < bd) { bd = d; best = k; } }
        p.parent = R() < 0.85 ? best : j;
      });
    }
    /* the surviving lineage: walk back from the winner picking one child per stage */
    var lineage = [pts[4][0]];
    for (var si2 = 3; si2 >= 0; si2--) {
      var target = lineage[0];
      var kids = pts[si2].filter(function (p) { return pts[si2 + 1][p.parent] === target; });
      var pick = kids.length ? kids[Math.floor(kids.length / 2)] : pts[si2][Math.floor(pts[si2].length / 2)];
      lineage.unshift(pick);
    }
    /* survivors of a stage: the dots whose parent is itself a survivor of the
       next stage; the winner seeds the chain. Everything else fails at the
       next generation and fades. */
    var surv = [];
    surv[4] = [pts[4][0]];
    for (var s4 = 3; s4 >= 0; s4--) {
      var nextSurv = surv[s4 + 1];
      surv[s4] = pts[s4].filter(function (p) { return nextSurv.indexOf(pts[s4 + 1][p.parent]) >= 0; });
      /* keep the survivor share honest to the stage counts: about the size of the next stage */
      var want = pts[s4 + 1].length;
      if (surv[s4].length > want) surv[s4] = surv[s4].filter(function (p, i) { return i % Math.ceil(surv[s4].length / want) === 0 || lineage.indexOf(p) >= 0; });
    }
    function leadsToWin(p, si) { return surv[si].indexOf(p) >= 0; }
    var out = [];
    /* rules and captions */
    for (var c = 0; c < 5; c++) out.push('<line class="rule" x1="' + colX[c].toFixed(1) + '" y1="' + (top - 10) + '" x2="' + colX[c].toFixed(1) + '" y2="' + (bot + 10) + '"/>');
    /* lines: only from the last column of a grid (its "edge") to keep the picture legible */
    for (var g = 0; g < 4; g++) {
      var from = pts[g], to = pts[g + 1], cols = stages[g].cols;
      from.forEach(function (p) {
        if (cols > 1 && p.id % cols < cols - 2) return;
        var q = to[p.parent];
        var isLin = lineage.indexOf(p) >= 0 && lineage.indexOf(q) >= 0;
        var weak = !leadsToWin(p, g);
        var cls = "ln g" + g + (isLin ? (g === 3 ? " final" : " lin") : weak ? " weak" : " mid");
        var x1 = p.x + 3, x2 = q.x - 3, mx = (x1 + x2) / 2;
        out.push('<path class="' + cls + '" pathLength="1" d="M' + x1.toFixed(1) + ' ' + p.y.toFixed(1) + ' C' + mx.toFixed(1) + ' ' + p.y.toFixed(1) + ' ' + mx.toFixed(1) + ' ' + q.y.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + q.y.toFixed(1) + '"/>');
      });
    }
    pts.forEach(function (arr, si) {
      arr.forEach(function (p) {
        var cls = "dot st" + si + (si === 4 ? " win" : (si < 4 && !leadsToWin(p, si)) ? " out" : "");
        var r = si === 4 ? 6 : si === 3 ? 3.2 : si === 2 ? 2.4 : 1.6;
        out.push('<circle class="' + cls + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r + '"/>');
      });
    });
    svg.innerHTML = out.join("");
  }

  /* ---- Nav: lifts into a narrower pill after the first scroll. Hysteresis
     (lift past 64px, settle under 12px) so it never flickers at the edge. ---- */
  var navEl = document.querySelector(".nav"), navFloating = false;
  function navState() {
    var y = window.scrollY;
    if (!navFloating && y > 64) navFloating = true;
    else if (navFloating && y < 12) navFloating = false;
    navEl.classList.toggle("is-floating", navFloating);
  }
  if (navEl) { navState(); window.addEventListener("scroll", navState, { passive: true }); }

  var funnels = Array.prototype.slice.call(document.querySelectorAll("[data-funnel]"));
  funnels.forEach(function (svg) {
    var vb = svg.getAttribute("viewBox").split(" ");
    buildFunnel(svg, +vb[2], +vb[3], svg.getAttribute("data-funnel") === "viz");
  });

  /* stage the reveal: dashboard right away, the centrepiece when it scrolls in */
  function play(svg, fast) {
    if (svg.__played) return;
    svg.__played = true;
    var step = fast ? 350 : 900;
    if (reduce.matches) { for (var i = 1; i <= 5; i++) svg.classList.add("s" + i); svg.classList.add("done"); return; }
    var i = 1;
    (function next() {
      svg.classList.add("s" + i);
      i += 1;
      if (i <= 5) setTimeout(next, step); else setTimeout(function () { svg.classList.add("done"); }, 1500);
    })();
  }
  var dashFunnel = document.querySelector('[data-funnel="dash"]');
  if (dashFunnel) setTimeout(function () { play(dashFunnel, true); }, 900);

  var viz = document.querySelector('[data-funnel="viz"]');
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.target === viz) play(viz, false);
        else e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    if (viz) io.observe(viz);
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    if (viz) play(viz, true);
    reveals.forEach(function (el) { el.classList.add("in"); });
  }
})();
