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
     canvas, then sampled cell by cell into characters by how much ink landed
     there, with a little noise so the edges speckle. ---- */
  function asciiArt(kind, cols, rows) {
    var cw = 12, ch = 24, W = cols * cw, H = rows * ch;
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var g = cv.getContext("2d"); if (!g) return "";
    var Rn = rnd(kind.length * 31 + 5);
    function X(t) { return t * W; } function Y(t) { return t * H; }
    function glow(x, y, r, a) { var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(0,0,0," + a + ")"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.lineCap = "round"; g.lineJoin = "round";
    if (kind === "lineage") {
      /* a bold fork: one trunk, two arms, each splitting again; the fuller node is the winner */
      g.strokeStyle = "rgba(0,0,0,.95)";
      function br(x1, y1, x2, y2, w) { var mx = (X(x1) + X(x2)) / 2; g.lineWidth = w; g.beginPath(); g.moveTo(X(x1), Y(y1)); g.bezierCurveTo(mx, Y(y1), mx, Y(y2), X(x2), Y(y2)); g.stroke(); }
      br(0.06, 0.5, 0.4, 0.5, 64);
      br(0.4, 0.5, 0.68, 0.24, 52); br(0.4, 0.5, 0.68, 0.76, 52);
      br(0.68, 0.24, 0.92, 0.1, 36); br(0.68, 0.24, 0.92, 0.4, 36); br(0.68, 0.76, 0.92, 0.6, 36); br(0.68, 0.76, 0.92, 0.9, 36);
      [[0.4, 0.5], [0.68, 0.24], [0.68, 0.76]].forEach(function (p) { glow(X(p[0]), Y(p[1]), 58, 1); });
      glow(X(0.92), Y(0.4), 88, 1);
    } else if (kind === "brain") {
      /* two lobes with grooves cut out, a stem below */
      function lobe(cx, cy, rx, ry) { g.save(); g.translate(X(cx), Y(cy)); g.scale(rx * W, ry * H); var gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, "rgba(0,0,0,.95)"); gr.addColorStop(0.75, "rgba(0,0,0,.7)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore(); }
      lobe(0.4, 0.46, 0.24, 0.33); lobe(0.62, 0.46, 0.24, 0.33); lobe(0.51, 0.34, 0.2, 0.22);
      g.globalCompositeOperation = "destination-out"; g.strokeStyle = "rgba(0,0,0,1)"; g.lineWidth = 6;
      [[0.3, 0.3, 0.45, 0.42, 0.36, 0.6], [0.5, 0.22, 0.55, 0.45, 0.5, 0.7], [0.66, 0.28, 0.6, 0.45, 0.72, 0.62], [0.38, 0.66, 0.5, 0.58, 0.64, 0.7]].forEach(function (q) {
        g.beginPath(); g.moveTo(X(q[0]), Y(q[1])); g.quadraticCurveTo(X(q[2]), Y(q[3]), X(q[4]), Y(q[5])); g.stroke();
      });
      g.globalCompositeOperation = "source-over";
      g.fillStyle = "rgba(0,0,0,.8)"; g.beginPath(); g.moveTo(X(0.47), Y(0.74)); g.lineTo(X(0.55), Y(0.74)); g.lineTo(X(0.57), Y(0.9)); g.lineTo(X(0.45), Y(0.9)); g.closePath(); g.fill();
    } else {
      /* three agents, overlapping, joined */
      g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 7;
      g.beginPath(); g.moveTo(X(0.3), Y(0.36)); g.lineTo(X(0.7), Y(0.36)); g.lineTo(X(0.5), Y(0.72)); g.closePath(); g.stroke();
      [[0.3, 0.36], [0.7, 0.36], [0.5, 0.72]].forEach(function (p) { g.save(); g.translate(X(p[0]), Y(p[1])); g.scale(0.19 * W, 0.19 * H * (W / H)); var gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, "rgba(0,0,0,.95)"); gr.addColorStop(0.7, "rgba(0,0,0,.6)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore(); });
    }
    var d = g.getImageData(0, 0, W, H).data, ramp = " .:-=+*#%@", lines = [];
    for (var r = 0; r < rows; r++) {
      var line = "";
      for (var c = 0; c < cols; c++) {
        var sum = 0;
        for (var y = 0; y < ch; y += 3) for (var x = 0; x < cw; x += 3) sum += d[((r * ch + y) * W + c * cw + x) * 4 + 3];
        var v = sum / (Math.ceil(ch / 3) * Math.ceil(cw / 3) * 255) + (Rn() - 0.5) * 0.22;
        line += v < 0.1 ? " " : ramp[Math.min(ramp.length - 1, Math.floor(v * (ramp.length - 1)))];
      }
      lines.push(line.replace(/\s+$/, ""));
    }
    return lines.join("\n").replace(/^\n+|\n+$/g, "");
  }
  Array.prototype.forEach.call(document.querySelectorAll(".prod[data-art]"), function (card) {
    var pre = card.querySelector(".ascii"); if (pre) pre.textContent = asciiArt(card.getAttribute("data-art"), 38, 20);
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
