/* re-forge v3: the selection funnel (dashboard and centrepiece), scroll reveals. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Lineage tree. Seven columns, a couple of dozen agents, laid by hand so
     the picture stays legible: one start, branches, retirements marked with a
     cross, one bold ancestry that dips through a low scorer in generation 2
     and reaches the winner in generation 4. The winner has no children; the
     other lines carry on to generation 6 and never beat it. ---- */
  var STAGES = 7;
  var TREE = [
    /* [column, row 0..1, parent index, kind] */
    [0, 0.50, -1, "lin"],
    [1, 0.50, 0, "lin"],
    [2, 0.20, 1, ""], [2, 0.36, 1, ""], [2, 0.66, 1, "lin low"], [2, 0.92, 1, ""],
    [3, 0.08, 2, ""], [3, 0.36, 3, ""], [3, 0.50, 4, "lin"], [3, 0.78, 5, ""], [3, 0.92, 5, "ret"],
    [4, 0.08, 6, ""], [4, 0.22, 8, "win"], [4, 0.36, 7, "ret"], [4, 0.64, 8, ""], [4, 0.92, 9, ""],
    [5, 0.08, 11, ""], [5, 0.50, 14, ""], [5, 0.78, 15, "ret"], [5, 0.92, 15, ""],
    [6, 0.22, 16, ""], [6, 0.64, 17, ""], [6, 0.92, 19, ""]
  ];
  var CAPS = ["start", "gen 1", "gen 2", "gen 3", "gen 4", "gen 5", "gen 6"];
  function buildFunnel(svg, W, H, dense) {
    var r = dense ? 8 : 5.5, labels = !dense;
    var padX = dense ? 60 : 40, top = r + 6, bot = H - (labels ? 30 : r + 6);
    var colX = CAPS.map(function (_, k) { return padX + (k / (CAPS.length - 1)) * (W - padX * 2); });
    var nodes = TREE.map(function (t) { return { c: t[0], x: colX[t[0]], y: top + t[1] * (bot - top), parent: t[2], kind: t[3] }; });
    var out = [];
    if (labels) CAPS.forEach(function (cap, k) { out.push('<text class="cap" x="' + colX[k].toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle">' + cap + '</text>'); });
    nodes.forEach(function (n) {
      if (n.parent < 0) return;
      var q = nodes[n.parent];
      var isLin = /lin|win/.test(n.kind) && /lin/.test(q.kind);
      var cls = "ln g" + q.c + (isLin ? (/win/.test(n.kind) ? " final" : " lin") : /ret/.test(n.kind) ? " ret" : "");
      var x1 = q.x + r, x2 = n.x - r, mx = (x1 + x2) / 2;
      out.push('<path class="' + cls + '" pathLength="1" d="M' + x1.toFixed(1) + ' ' + q.y.toFixed(1) + ' C' + mx.toFixed(1) + ' ' + q.y.toFixed(1) + ' ' + mx.toFixed(1) + ' ' + n.y.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + n.y.toFixed(1) + '"/>');
    });
    nodes.forEach(function (n) {
      var k = n.kind;
      if (/win/.test(k)) out.push('<circle class="halo c' + n.c + '" cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="' + (r + 4.5) + '"/>');
      out.push('<circle class="nd c' + n.c + (k ? " " + k : "") + '" cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="' + r + '"/>');
      if (/ret/.test(k)) { var d = r * 0.42; out.push('<path class="x c' + n.c + '" d="M' + (n.x - d).toFixed(1) + ' ' + (n.y - d).toFixed(1) + 'l' + (2 * d).toFixed(1) + ' ' + (2 * d).toFixed(1) + 'M' + (n.x + d).toFixed(1) + ' ' + (n.y - d).toFixed(1) + 'l' + (-2 * d).toFixed(1) + ' ' + (2 * d).toFixed(1) + '"/>'); }
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
    var step = fast ? 340 : 720;
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
