/* re-forge v3: the selection funnel (dashboard and centrepiece), scroll reveals. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Lineage. Columns are generations, left to right. Every agent descends
     from a parent in the column before it. The elites of a generation breed
     most of the next one, but a few low scorers breed too, and that is the
     point: the winning line runs through one of them, and the winner shows up
     in generation 4. The population stays the same size every generation, the
     winner's own children are not highlighted, and two more generations of
     elites never beat it. Not hill-climbing. Deterministic on every load. ---- */
  var STAGES = 7, WIN_GEN = 4, WILD_GEN = 2;
  function rnd(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
  function buildFunnel(svg, W, H, dense) {
    var R = rnd(11);
    var top = 18, bot = H - 18;
    var gens = [];
    for (var gi = 0; gi < STAGES; gi++) gens.push(dense ? { n: 72, cols: 2, e: 6, w: 2 } : { n: 18, cols: 1, e: 4, w: 1 });
    var G = gens.length;
    var colX = gens.map(function (_, k) { return ((k + 0.5) / G) * W; });
    var gap = dense ? 5.5 : 8, rowMax = dense ? 9 : 10.5;
    function place(arr, g) {
      var cols = gens[g].cols, rows = Math.ceil(arr.length / cols);
      var h = Math.min(bot - top, (rows - 1) * rowMax), rowGap = rows > 1 ? h / (rows - 1) : 0, y0 = (top + bot) / 2 - h / 2;
      arr.forEach(function (p, i) {
        var c = i % cols, r = Math.floor(i / cols);
        p.x = colX[g] + (c - (cols - 1) / 2) * gap; p.y = y0 + r * rowGap; p.g = g; p.id = i;
      });
    }
    /* spread picks evenly across the column, jittered, never near an already taken agent */
    function pick(arr, count, taken, minGap, exclude) {
      var out = [], n = arr.length;
      function clear(i) { return (!exclude || exclude.indexOf(arr[i]) < 0) && taken.concat(out).every(function (p) { return Math.abs(p.id - i) >= minGap; }); }
      for (var k = 0; k < count; k++) {
        var t = Math.round(((k + 0.5) / count) * (n - 1) + (R() - 0.5) * (n / (count * 2)));
        var i = -1;
        for (var d = 0; d < n && i < 0; d++) { if (t + d < n && clear(t + d)) i = t + d; else if (t - d >= 0 && clear(t - d)) i = t - d; }
        if (i < 0) break;
        out.push(arr[i]);
      }
      return out;
    }
    var pts = [], elites = [], wilds = [], lineage = [], winner = null;
    pts[0] = []; for (var i0 = 0; i0 < gens[0].n; i0++) pts[0].push({ parent: null });
    place(pts[0], 0);
    lineage[0] = pts[0][Math.floor(gens[0].n * 0.5)];
    elites[0] = [lineage[0]].concat(pick(pts[0], gens[0].e - 1, [lineage[0]], Math.max(2, Math.floor(gens[0].n / (gens[0].e * 2.2)))));
    wilds[0] = pick(pts[0], gens[0].w, elites[0], 2);
    for (var g = 1; g < G; g++) {
      /* the winner breeds one generation, lightly; its children are never highlighted and never breed */
      var par = elites[g - 1].map(function (p) { return { p: p, w: p === winner ? 0.45 : p === lineage[g - 1] ? 2.2 : 0.55 + R() * 0.9 }; })
        .concat(wilds[g - 1].map(function (p) { return { p: p, w: p === lineage[g - 1] ? 2.2 : 0.35 }; }));
      par.sort(function (a, b) { return a.p.y - b.p.y; });
      var n = gens[g].n;
      while (par.length > n) { var minI = 0; par.forEach(function (x, i) { if (x.w < par[minI].w) minI = i; }); par.splice(minI, 1); }
      var sum = par.reduce(function (a, x) { return a + x.w; }, 0);
      var counts = par.map(function (x) { return Math.max(1, Math.floor(x.w / sum * n)); });
      var left = n - counts.reduce(function (a, b) { return a + b; }, 0);
      while (left > 0) { var maxI = 0; par.forEach(function (x, i) { if (x.w > par[maxI].w) maxI = i; }); counts[maxI] += 1; left -= 1; }
      for (var guard = 0; left < 0 && guard < 50; guard++) { for (var q = 0; q < counts.length && left < 0; q++) if (counts[q] > 1) { counts[q] -= 1; left += 1; } }
      var arr = [];
      par.forEach(function (x, k) { for (var c = 0; c < counts[k]; c++) arr.push({ parent: x.p }); });
      place(arr, g); pts[g] = arr;
      if (g <= WIN_GEN) {
        var kids = arr.filter(function (p) { return p.parent === lineage[g - 1]; });
        /* the detour: in the wild generation the line runs through a low scorer at the edge of its family */
        lineage[g] = g === WILD_GEN ? kids[kids.length - 1] : kids[Math.floor(kids.length / 2)];
      }
      if (g === WIN_GEN) winner = lineage[g];
      var lin = lineage[g], taken = lin ? [lin] : [];
      var winKids = winner ? arr.filter(function (p) { return p.parent === winner; }) : [];
      var minGap = Math.max(2, Math.floor(n / (Math.max(1, gens[g].e) * 2.2)));
      if (g === WILD_GEN) { elites[g] = pick(arr, gens[g].e, taken, minGap); wilds[g] = [lin].concat(pick(arr, gens[g].w - 1, elites[g].concat(taken), 2)); }
      else { elites[g] = (lin ? [lin] : []).concat(pick(arr, gens[g].e - (lin ? 1 : 0), taken, minGap, winKids)); wilds[g] = pick(arr, gens[g].w, elites[g], 2, winKids); }
    }
    var out = [];
    for (var c = 0; c < G; c++) out.push('<line class="rule" x1="' + colX[c].toFixed(1) + '" y1="' + (top - 8) + '" x2="' + colX[c].toFixed(1) + '" y2="' + (bot + 8) + '"/>');
    for (var g2 = 1; g2 < G; g2++) {
      pts[g2].forEach(function (p) {
        var q = p.parent, onLin = lineage.indexOf(p) >= 0 && lineage.indexOf(q) >= 0;
        var cls = "ln g" + (g2 - 1) + (onLin ? (p === winner ? " final" : " lin") : elites[g2].indexOf(p) >= 0 ? " mid" : " weak");
        var x1 = q.x + 3, x2 = p.x - 3, mx = (x1 + x2) / 2;
        out.push('<path class="' + cls + '" pathLength="1" d="M' + x1.toFixed(1) + ' ' + q.y.toFixed(1) + ' C' + mx.toFixed(1) + ' ' + q.y.toFixed(1) + ' ' + mx.toFixed(1) + ' ' + p.y.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + p.y.toFixed(1) + '"/>');
      });
    }
    pts.forEach(function (arr, g3) {
      var base = dense ? 1.6 : 2.2;
      arr.forEach(function (p) {
        var isWin = p === winner, isLin = lineage.indexOf(p) >= 0, isEl = elites[g3].indexOf(p) >= 0, isWild = wilds[g3].indexOf(p) >= 0;
        var cls = "dot st" + g3 + (isWin ? " win" : isWild ? (isLin ? " wild lin" : " wild out") : isLin ? " lin" : isEl ? " elite" : " out");
        var r = isWin ? 4.6 : isEl || isWild ? base * 1.45 : base;
        out.push('<circle class="' + cls + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r + '"/>');
        if (isEl || isWild) out.push('<circle class="ring st' + g3 + (isWin ? ' win' : isWild ? ' wild' : '') + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (r + (isWin ? 3.4 : 2.6)) + '"/>');
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
