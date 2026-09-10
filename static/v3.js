/* re-forge v3: the selection funnel (dashboard and centrepiece), scroll reveals. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Lineage. Columns are generations, left to right. Every agent in a
     generation descends from one of the previous generation's elites, so the
     picture branches like a family tree while the population narrows toward a
     single winner. Elites are ringed; the winner's ancestry is drawn in black
     and its last step in green. Deterministic: the same picture on every load. ---- */
  var STAGES = 6;
  function rnd(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
  function buildFunnel(svg, W, H, dense) {
    var R = rnd(11);
    var top = 18, bot = H - 18;
    var gens = dense
      ? [{ n: 128, cols: 2, e: 6 }, { n: 96, cols: 2, e: 6 }, { n: 56, cols: 1, e: 5 }, { n: 28, cols: 1, e: 4 }, { n: 12, cols: 1, e: 3 }, { n: 1, cols: 1, e: 1 }]
      : [{ n: 26, cols: 1, e: 4 }, { n: 22, cols: 1, e: 4 }, { n: 18, cols: 1, e: 3 }, { n: 12, cols: 1, e: 3 }, { n: 7, cols: 1, e: 2 }, { n: 1, cols: 1, e: 1 }];
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
      var n = gens[g].n, w = par.map(function (p) { return p === lineage[g - 1] ? 2.2 : 0.55 + R() * 0.9; });
      var sum = w.reduce(function (a, b) { return a + b; }, 0);
      var counts = w.map(function (x) { return Math.max(1, Math.floor(x / sum * n)); });
      var left = n - counts.reduce(function (a, b) { return a + b; }, 0);
      while (left > 0) { counts[w.indexOf(Math.max.apply(null, w))] += 1; left -= 1; }
      for (var guard = 0; left < 0 && guard < 50; guard++) { for (var q = 0; q < counts.length && left < 0; q++) if (counts[q] > 1) { counts[q] -= 1; left += 1; } }
      var arr = [];
      par.forEach(function (p, k) { for (var c = 0; c < counts[k]; c++) arr.push({ parent: p }); });
      place(arr, g); pts[g] = arr;
      var kids = arr.filter(function (p) { return p.parent === lineage[g - 1]; });
      lineage[g] = kids[Math.floor(kids.length / 2)];
      elites[g] = g === G - 1 ? [lineage[g]] : pickElites(arr, gens[g].e, lineage[g]);
    }
    var out = [];
    for (var c = 0; c < G; c++) out.push('<line class="rule" x1="' + colX[c].toFixed(1) + '" y1="' + (top - 8) + '" x2="' + colX[c].toFixed(1) + '" y2="' + (bot + 8) + '"/>');
    for (var g2 = 1; g2 < G; g2++) {
      pts[g2].forEach(function (p) {
        var q = p.parent, onLin = lineage.indexOf(p) >= 0;
        var cls = "ln g" + (g2 - 1) + (onLin ? (g2 === G - 1 ? " final" : " lin") : elites[g2].indexOf(p) >= 0 ? " mid" : " weak");
        var x1 = q.x + 3, x2 = p.x - 3, mx = (x1 + x2) / 2;
        out.push('<path class="' + cls + '" pathLength="1" d="M' + x1.toFixed(1) + ' ' + q.y.toFixed(1) + ' C' + mx.toFixed(1) + ' ' + q.y.toFixed(1) + ' ' + mx.toFixed(1) + ' ' + p.y.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + p.y.toFixed(1) + '"/>');
      });
    }
    pts.forEach(function (arr, g3) {
      var base = g3 === G - 1 ? 6 : g3 >= 3 ? 2.6 : dense ? 1.5 : 1.8;
      arr.forEach(function (p) {
        var isWin = g3 === G - 1, isLin = lineage.indexOf(p) >= 0, isEl = elites[g3].indexOf(p) >= 0;
        var cls = "dot st" + g3 + (isWin ? " win" : isLin ? " lin" : isEl ? " elite" : " out");
        var r = isWin ? base : isEl ? base * 1.45 : base;
        out.push('<circle class="' + cls + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r + '"/>');
        if (isEl) out.push('<circle class="ring st' + g3 + (isWin ? ' win' : isLin ? ' lin' : '') + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (r + (isWin ? 4 : 2.6)) + '"/>');
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

  /* ---- Product illustrations drawn in type. Each shape is painted on a small
     canvas, then sampled cell by cell into a coverage grid. At rest a small
     seeded jitter speckles the edges (same every load); on hover/focus the
     sampled coverage shimmers glyph-by-glyph while the silhouette itself
     stays put. ---- */
  var ramp = " .:-=+*#%@";
  function hash01(n) { var s = Math.sin(n) * 43758.5453123; return s - Math.floor(s); }
  function sampleAscii(kind, cols, rows) {
    var cw = 12, ch = 24, W = cols * cw, H = rows * ch;
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var g = cv.getContext("2d"); if (!g) return null;
    function X(t) { return t * W; } function Y(t) { return t * H; }
    function disc(x, y, r, a) { var gr = g.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r); gr.addColorStop(0, "rgba(0,0,0," + a + ")"); gr.addColorStop(0.86, "rgba(0,0,0," + a + ")"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(X(x), Y(y), r, 0, 7); g.fill(); }
    g.lineCap = "round"; g.lineJoin = "round";
    if (kind === "lineage") {
      /* DNA double helix: two sine strands phase-offset by pi, running top to
         bottom. A quarter-turn phase offset keeps both ends visibly split
         into two strands instead of pinching to a point; rungs land wherever
         the strands are far apart. */
      var yTop = 0.1, yBot = 0.9, turns = 1.4, amp = 0.34, midX = 0.5, phase0 = Math.PI / 2;
      function sx(t, phase) { return midX + amp * Math.sin(t * turns * Math.PI * 2 + phase0 + phase); }
      function sy(t) { return yTop + t * (yBot - yTop); }
      function strand(phase) {
        g.beginPath();
        for (var i = 0; i <= 60; i++) { var t = i / 60, px = X(sx(t, phase)), py = Y(sy(t)); if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); }
        g.stroke();
      }
      g.strokeStyle = "rgba(0,0,0,.96)"; g.lineWidth = 36;
      strand(0); strand(Math.PI);
      g.lineWidth = 16;
      var sepThresh = 0.85 * (2 * amp), stepT = 36 / H;
      for (var t = 0; t <= 1; t += stepT) {
        var xA = sx(t, 0), xB = sx(t, Math.PI);
        if (Math.abs(xA - xB) >= sepThresh) { var y = Y(sy(t)); g.beginPath(); g.moveTo(X(xA), y); g.lineTo(X(xB), y); g.stroke(); }
      }
    } else if (kind === "brain") {
      /* one solid, elongated cerebral mass with a scalloped top edge (built
         from overlapping bumps), a cerebellum bulge fused to its lower back,
         and a short stem; the fissure and grooves are then cut in as thin
         creases so they read as surface detail rather than splitting the
         mass apart. */
      function ellipse(cx, cy, rx, ry, a) { g.save(); g.translate(X(cx), Y(cy)); g.scale(rx * W, ry * H); g.fillStyle = "rgba(0,0,0," + a + ")"; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore(); }
      ellipse(0.5, 0.42, 0.34, 0.25, 1);
      [[0.3, 0.19, 46], [0.42, 0.16, 48], [0.58, 0.16, 48], [0.7, 0.19, 46]].forEach(function (q) { disc(q[0], q[1], q[2], 1); });
      disc(0.15, 0.42, 44, 1); disc(0.85, 0.42, 44, 1);
      ellipse(0.5, 0.72, 0.17, 0.1, 1);
      g.fillStyle = "rgba(0,0,0,.95)";
      g.beginPath(); g.moveTo(X(0.46), Y(0.78)); g.lineTo(X(0.54), Y(0.78)); g.lineTo(X(0.56), Y(0.9)); g.lineTo(X(0.44), Y(0.9)); g.closePath(); g.fill();
      g.globalCompositeOperation = "destination-out"; g.strokeStyle = "rgba(0,0,0,1)";
      g.lineWidth = 20; g.beginPath(); g.moveTo(X(0.5), Y(0.22)); g.lineTo(X(0.5), Y(0.56)); g.stroke();
      g.lineWidth = 13;
      [[0.28, 0.28, 0.36, 0.36, 0.3, 0.46], [0.72, 0.28, 0.64, 0.36, 0.7, 0.46],
        [0.66, 0.5, 0.58, 0.55, 0.64, 0.6]].forEach(function (q) {
        g.beginPath(); g.moveTo(X(q[0]), Y(q[1])); g.quadraticCurveTo(X(q[2]), Y(q[3]), X(q[4]), Y(q[5])); g.stroke();
      });
      g.globalCompositeOperation = "source-over";
    } else {
      /* four agents around a shared, slightly larger hub, joined by thick links */
      var pos = { top: [0.5, 0.17], right: [0.82, 0.5], bottom: [0.5, 0.83], left: [0.18, 0.5], center: [0.5, 0.5] };
      g.strokeStyle = "rgba(0,0,0,.95)"; g.lineWidth = 36;
      ["top", "right", "bottom", "left"].forEach(function (k) { g.beginPath(); g.moveTo(X(pos.center[0]), Y(pos.center[1])); g.lineTo(X(pos[k][0]), Y(pos[k][1])); g.stroke(); });
      ["top", "right", "bottom", "left"].forEach(function (k) { disc(pos[k][0], pos[k][1], 62, .97); });
      disc(pos.center[0], pos.center[1], 82, .98);
    }
    var d = g.getImageData(0, 0, W, H).data, grid = new Float32Array(cols * rows);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var sum = 0, n = 0;
        for (var yy = 0; yy < ch; yy += 3) for (var xx = 0; xx < cw; xx += 3) { sum += d[((r * ch + yy) * W + c * cw + xx) * 4 + 3]; n++; }
        grid[r * cols + c] = sum / (n * 255);
      }
    }
    return { grid: grid, cols: cols, rows: rows };
  }
  /* renders the sampled grid to text; every line is exactly `cols` chars so
     the CSS text-align:center never shifts one row relative to another */
  function renderAscii(data, noiseFn) {
    var cols = data.cols, rows = data.rows, grid = data.grid, lines = [];
    for (var r = 0; r < rows; r++) {
      var line = "";
      for (var c = 0; c < cols; c++) {
        var v = grid[r * cols + c];
        if (v <= 0.02) { line += " "; continue; }
        var vv = v + noiseFn(c, r); vv = vv < 0 ? 0 : vv > 1 ? 1 : vv;
        line += vv < 0.1 ? " " : ramp[Math.min(ramp.length - 1, Math.floor(vv * (ramp.length - 1)))];
      }
      lines.push(line);
    }
    while (lines.length && !/\S/.test(lines[0])) lines.shift();
    while (lines.length && !/\S/.test(lines[lines.length - 1])) lines.pop();
    return lines.join("\n");
  }
  Array.prototype.forEach.call(document.querySelectorAll(".prod[data-art]"), function (card) {
    var pre = card.querySelector(".ascii"); if (!pre) return;
    var kind = card.getAttribute("data-art");
    var data = sampleAscii(kind, 56, 30); if (!data) return;
    var Rn = rnd(kind.length * 31 + 5);
    var staticText = renderAscii(data, function () { return (Rn() - 0.5) * 0.22; });
    pre.textContent = staticText;
    if (reduce.matches) return; /* reduced-motion: static only, never shimmer */
    var rafId = null, lastFrame = 0;
    function shimmerNoise(c, r, t) {
      var band = 0.12 * Math.sin(c * 0.35 + r * 0.5 - t * 0.004);
      var jitter = (hash01(c * 12.9898 + r * 78.233 + Math.floor(t / 70) * 0.6180339) - 0.5) * 0.16;
      return band + jitter;
    }
    function frame(ts) {
      if (ts - lastFrame < 71) { rafId = requestAnimationFrame(frame); return; }
      lastFrame = ts;
      pre.textContent = renderAscii(data, function (c, r) { return shimmerNoise(c, r, ts); });
      rafId = requestAnimationFrame(frame);
    }
    function start() { if (!rafId) rafId = requestAnimationFrame(frame); }
    function stop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } pre.textContent = staticText; }
    card.addEventListener("mouseenter", start);
    card.addEventListener("mouseleave", stop);
    card.addEventListener("focus", start);
    card.addEventListener("blur", stop);
  });

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
