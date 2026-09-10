/* re-forge v3: the selection funnel (dashboard and centrepiece), scroll reveals. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Lineage. Columns are generations, left to right. Every agent in a
     generation descends from one of the previous generation's elites, so the
     picture branches like a family tree while the population narrows toward a
     single winner. Elites are ringed; the winner's ancestry is drawn in black
     and its last step in green. Deterministic: the same picture on every load. ---- */
  var STAGES = 6, WIN_GEN = 4;
  function rnd(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
  function buildFunnel(svg, W, H, dense) {
    var R = rnd(11);
    var top = 18, bot = H - 18;
    /* the winner is found in generation 4; generation 5 still runs a few candidates and none beats it */
    var gens = dense
      ? [{ n: 128, cols: 2, e: 6 }, { n: 96, cols: 2, e: 6 }, { n: 56, cols: 1, e: 5 }, { n: 28, cols: 1, e: 4 }, { n: 12, cols: 1, e: 3 }, { n: 6, cols: 1, e: 0 }]
      : [{ n: 26, cols: 1, e: 4 }, { n: 22, cols: 1, e: 4 }, { n: 18, cols: 1, e: 3 }, { n: 12, cols: 1, e: 3 }, { n: 7, cols: 1, e: 2 }, { n: 4, cols: 1, e: 0 }];
    var G = gens.length;
    var colX = gens.map(function (_, k) { return ((k + 0.5) / G) * W; });
    var gap = dense ? 5.5 : 8, rowMax = dense ? 5 : 8;
    function place(arr, g) {
      var cols = gens[g].cols, rows = Math.ceil(arr.length / cols);
      var h = Math.min(bot - top, (rows - 1) * rowMax * (1 + 0.25 * g)), rowGap = rows > 1 ? h / (rows - 1) : 0, y0 = (top + bot) / 2 - h / 2;
      arr.forEach(function (p, i) {
        var c = i % cols, r = Math.floor(i / cols);
        p.x = colX[g] + (c - (cols - 1) / 2) * gap; p.y = y0 + r * rowGap; p.g = g; p.id = i;
      });
    }
    /* spread picks: e indices evenly across n, jittered, never the lineage index */
    function pickElites(arr, e, keep) {
      var out = [keep], n = arr.length, minGap = Math.max(2, Math.floor(n / (e * 2.2)));
      function clear(i) { return out.every(function (p) { return Math.abs(p.id - i) >= minGap; }); }
      for (var k = 0; k < e - 1; k++) {
        var t = Math.round(((k + 0.5) / (e - 1)) * (n - 1) + (R() - 0.5) * (n / (e * 2)));
        var i = -1;
        for (var d = 0; d < n && i < 0; d++) { if (t + d < n && clear(t + d)) i = t + d; else if (t - d >= 0 && clear(t - d)) i = t - d; }
        if (i < 0) break;
        out.push(arr[i]);
      }
      return out;
    }
    var pts = [], elites = [], lineage = [];
    pts[0] = []; for (var i0 = 0; i0 < gens[0].n; i0++) pts[0].push({ parent: null });
    place(pts[0], 0);
    lineage[0] = pts[0][Math.floor(gens[0].n * (0.45 + R() * 0.1))];
    elites[0] = pickElites(pts[0], gens[0].e, lineage[0]);
    for (var g = 1; g < G; g++) {
      var par = elites[g - 1].slice().sort(function (a, b) { return a.y - b.y; });
      if (gens[g].n < par.length) par = [lineage[g - 1]];
      var afterWin = g > WIN_GEN;
      /* after the winner is found its own line breeds only lightly, and nothing that follows is highlighted */
      var n = gens[g].n, w = par.map(function (p) { return p === lineage[g - 1] ? (afterWin ? 0.45 : 2.2) : 0.55 + R() * 0.9; });
      var sum = w.reduce(function (a, b) { return a + b; }, 0);
      var counts = w.map(function (x) { return Math.max(1, Math.floor(x / sum * n)); });
      var left = n - counts.reduce(function (a, b) { return a + b; }, 0);
      while (left > 0) { counts[w.indexOf(Math.max.apply(null, w))] += 1; left -= 1; }
      for (var guard = 0; left < 0 && guard < 50; guard++) { for (var q = 0; q < counts.length && left < 0; q++) if (counts[q] > 1) { counts[q] -= 1; left += 1; } }
      var arr = [];
      par.forEach(function (p, k) { for (var c = 0; c < counts[k]; c++) arr.push({ parent: p }); });
      place(arr, g); pts[g] = arr;
      if (!afterWin) {
        var kids = arr.filter(function (p) { return p.parent === lineage[g - 1]; });
        lineage[g] = kids[Math.floor(kids.length / 2)];
      }
      elites[g] = gens[g].e === 0 ? [] : g === WIN_GEN ? [lineage[g]].concat(pickElites(arr, gens[g].e, lineage[g]).slice(1)) : pickElites(arr, gens[g].e, lineage[g]);
    }
    var winner = lineage[WIN_GEN];
    var out = [];
    for (var c = 0; c < G; c++) out.push('<line class="rule" x1="' + colX[c].toFixed(1) + '" y1="' + (top - 8) + '" x2="' + colX[c].toFixed(1) + '" y2="' + (bot + 8) + '"/>');
    for (var g2 = 1; g2 < G; g2++) {
      pts[g2].forEach(function (p) {
        var q = p.parent, onLin = lineage.indexOf(p) >= 0;
        var cls = "ln g" + (g2 - 1) + (onLin ? (p === winner ? " final" : " lin") : elites[g2].indexOf(p) >= 0 ? " mid" : " weak");
        var x1 = q.x + 3, x2 = p.x - 3, mx = (x1 + x2) / 2;
        out.push('<path class="' + cls + '" pathLength="1" d="M' + x1.toFixed(1) + ' ' + q.y.toFixed(1) + ' C' + mx.toFixed(1) + ' ' + q.y.toFixed(1) + ' ' + mx.toFixed(1) + ' ' + p.y.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + p.y.toFixed(1) + '"/>');
      });
    }
    pts.forEach(function (arr, g3) {
      var base = g3 >= 3 ? 2.6 : dense ? 1.5 : 1.8;
      arr.forEach(function (p) {
        var isWin = p === winner, isLin = lineage.indexOf(p) >= 0, isEl = elites[g3].indexOf(p) >= 0;
        /* only the winner's line is highlighted; other survivors are just a shade darker, never ringed */
        var cls = "dot st" + g3 + (isWin ? " win" : isLin ? " lin" : isEl ? " elite" : " out");
        var r = isWin ? 5.5 : isLin ? base * 1.45 : isEl ? base * 1.2 : base;
        out.push('<circle class="' + cls + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r + '"/>');
        if (isLin || isWin) out.push('<circle class="ring st' + g3 + (isWin ? ' win' : '') + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (r + (isWin ? 4 : 2.6)) + '"/>');
      });
    });
    svg.innerHTML = out.join("");
  }

  var funnels = Array.prototype.slice.call(document.querySelectorAll("[data-funnel]"));
  funnels.forEach(function (svg) {
    var vb = svg.getAttribute("viewBox").split(" ");
    buildFunnel(svg, +vb[2], +vb[3], svg.getAttribute("data-funnel") === "viz");
  });

  /* stage the reveal: dashboard right away, the centrepiece when it scrolls in */
  function play(svg, fast) {
    if (svg.__played) return;
    svg.__played = true;
    var step = fast ? 300 : 800;
    if (reduce.matches) { for (var i = 1; i <= STAGES; i++) svg.classList.add("s" + i); svg.classList.add("done"); return; }
    var i = 1;
    (function next() {
      svg.classList.add("s" + i);
      i += 1;
      if (i <= STAGES) setTimeout(next, step); else setTimeout(function () { svg.classList.add("done"); }, 1500);
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
