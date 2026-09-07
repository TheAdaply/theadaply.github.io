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

  /* ---- Nav: lifts into a floating pill once the page has scrolled. ---- */
  var navEl = document.querySelector(".nav");
  function navState() { if (navEl) navEl.classList.toggle("is-floating", window.scrollY > 24); }
  navState();
  window.addEventListener("scroll", navState, { passive: true });

  /* ---- Lineage graphs. One trunk rises from an origin and forks generation
     by generation on shared arcs. Built from the measured layout, so it never
     touches the copy it grows around, at any width. Used twice: out of the
     window in the hero, out of the wordmark at the end. ---- */
  var GROW_MS = 2400;
  function makeGraph(section, svg, opts) {
    var settled = false, grownAt = 0, started = false;
    function build() {
      var hb = section.getBoundingClientRect();
      var W = Math.round(hb.width), H = Math.round(hb.height);
      if (W < 360) { svg.innerHTML = ""; return; }
      var origin = opts.origin(hb);
      if (!origin) { svg.innerHTML = ""; return; }
      var ox = origin.x, oy = origin.y;
      var topLimit = opts.topLimit || 24;
      var scale = Math.max(0.5, Math.min(1, W / 1440)) * (opts.scale || 1);
      var sx = 1.32;
      var radii = [92, 178, 266, 356, 448].map(function (r) { return r * scale; });
      var margin = 22;
      var rects = [];
      function addRects(el, byLine) {
        if (!el) return;
        if (byLine) {
          var rg = document.createRange(); rg.selectNodeContents(el);
          Array.prototype.forEach.call(rg.getClientRects(), function (b) { if (b.width && b.height) rects.push(b); });
        } else rects.push(el.getBoundingClientRect());
      }
      opts.copy.forEach(function (sel) { Array.prototype.forEach.call(section.querySelectorAll(sel[0]), function (el) { addRects(el, sel[1]); }); });
      rects = rects.map(function (b) { return { l: b.left - hb.left - margin, r: b.right - hb.left + margin, t: b.top - hb.top - margin, b: b.bottom - hb.top + margin }; });
      function free(x, y) {
        if (y < topLimit || x < 14 || x > W - 14) return false;
        for (var i = 0; i < rects.length; i++) { var q = rects[i]; if (x > q.l && x < q.r && y > q.t && y < q.b) return false; }
        return true;
      }
      function pt(r, th) { return { x: ox + r * sx * Math.sin(th), y: oy - r * Math.cos(th) }; }
      function dir(th) { var v = { x: sx * Math.sin(th), y: -Math.cos(th) }; var n = Math.hypot(v.x, v.y); return { x: v.x / n, y: v.y / n }; }
      function seed(a, b) { var s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); }
      var nodes = [], edges = [];
      var root = { gen: 0, th: 0, lo: -1.12, hi: 1.12, p: pt(radii[0], 0), id: 0 };
      nodes.push(root);
      function grow(node) {
        if (node.gen + 1 >= radii.length) return;
        var mid = (node.lo + node.hi) / 2;
        var kids = [{ lo: node.lo, hi: mid }, { lo: mid, hi: node.hi }];
        var made = 0;
        kids.forEach(function (k) {
          var th = (k.lo + k.hi) / 2;
          var r = radii[node.gen + 1];
          var p = pt(r, th);
          var m = pt((r + radii[node.gen]) / 2, (th + node.th) / 2);
          if (!free(p.x, p.y) || !free(m.x, m.y)) return;
          var ret = node.gen >= 1 && made > 0 && seed(node.gen, nodes.length) < 0.28;
          var child = { gen: node.gen + 1, th: th, lo: k.lo, hi: k.hi, p: p, id: nodes.length, ret: ret, parent: node };
          nodes.push(child); edges.push({ a: node, b: child }); made++;
          if (!ret) grow(child);
        });
      }
      grow(root);
      var tips = nodes.filter(function (n) { return !n.ret && !edges.some(function (e) { return e.a === n; }); });
      var maxGen = tips.reduce(function (m, n) { return Math.max(m, n.gen); }, 0);
      var cands = tips.filter(function (n) { return n.gen >= Math.max(1, maxGen - 1); });
      var win = cands.sort(function (a, b) { return Math.abs(a.th - 0.62) - Math.abs(b.th - 0.62); })[0] || root;
      var chain = []; for (var n = win; n; n = n.parent) { n.lin = true; chain.unshift(n); }
      root.lin = true;
      var rmax = radii[Math.min(radii.length - 1, maxGen)] || radii[0];
      function tAt(r) { return (r / rmax) * GROW_MS / 1000; }
      function curve(a, b) {
        var da = dir(a.th), db = dir(b.th);
        var d = Math.hypot(b.p.x - a.p.x, b.p.y - a.p.y) * 0.46;
        return "C" + (a.p.x + da.x * d).toFixed(1) + "," + (a.p.y + da.y * d).toFixed(1) + " " +
               (b.p.x - db.x * d).toFixed(1) + "," + (b.p.y - db.y * d).toFixed(1) + " " + b.p.x.toFixed(1) + "," + b.p.y.toFixed(1);
      }
      var out = [];
      for (var g = 1; g <= maxGen; g++) {
        var seg = [], segs = [];
        var span = nodes.filter(function (n) { return n.gen === g; }).map(function (n) { return n.th; });
        if (!span.length) continue;
        var lo = Math.min.apply(null, span) - 0.16, hi = Math.max.apply(null, span) + 0.16;
        for (var th = lo; th <= hi; th += 0.02) {
          var q = pt(radii[g], th);
          if (free(q.x, q.y)) seg.push(q.x.toFixed(1) + "," + q.y.toFixed(1));
          else if (seg.length) { segs.push(seg); seg = []; }
        }
        if (seg.length) segs.push(seg);
        segs.forEach(function (sg) {
          if (sg.length < 6) return;
          out.push('<path class="ring" pathLength="1" style="--d:' + tAt(radii[g]).toFixed(2) + 's" d="M' + sg.join(" L") + '"/>');
        });
      }
      out.push('<path class="edge lin" pathLength="1" style="--d:0s;--t:' + tAt(radii[0]).toFixed(2) + 's" d="M' + ox + ',' + oy + ' L' + root.p.x.toFixed(1) + ',' + root.p.y.toFixed(1) + '"/>');
      edges.forEach(function (e) {
        var cls = "edge" + (e.a.lin && e.b.lin ? " lin" : "") + (e.b.ret ? " toret" : "");
        var d0 = tAt(radii[e.a.gen]), d1 = tAt(radii[e.b.gen]);
        out.push('<path class="' + cls + '" pathLength="1" style="--d:' + d0.toFixed(2) + 's;--t:' + (d1 - d0).toFixed(2) + 's" d="M' + e.a.p.x.toFixed(1) + ',' + e.a.p.y.toFixed(1) + ' ' + curve(e.a, e.b) + '"/>');
      });
      var fd = "M" + ox + "," + oy + " L" + root.p.x.toFixed(1) + "," + root.p.y.toFixed(1);
      for (var i = 1; i < chain.length; i++) fd += " " + curve(chain[i - 1], chain[i]);
      out.push('<path class="flow" pathLength="100" style="--d:' + (GROW_MS / 1000 + 0.3).toFixed(2) + 's" d="' + fd + '"/>');
      out.push('<circle class="base" cx="' + ox + '" cy="' + oy + '" r="3"/>');
      (function () {
        var right = win.th >= 0, lx = win.p.x + (right ? 14 : -14), ly = win.p.y + 4;
        var boxW = 58, ok = true;
        for (var k = 0; k <= boxW; k += 12) if (!free(lx + (right ? k : -k), ly - 6) || !free(lx + (right ? k : -k), ly + 6)) ok = false;
        if (ok) out.push('<text class="tag" style="--d:' + (tAt(radii[win.gen]) + 0.35).toFixed(2) + 's" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '"' + (right ? "" : ' text-anchor="end"') + '>' + (opts.tag || "survives") + '</text>');
      })();
      nodes.forEach(function (n) {
        var isTip = !edges.some(function (e) { return e.a === n; });
        var cls = "node" + (n.ret ? " ret" : n === win ? " win" : n.lin ? " lin" : " fork");
        var r = n === win ? 5.5 : n.ret ? 3.6 : 4;
        if (n === win) out.push('<circle class="halo" style="--d:' + (tAt(radii[n.gen]) + 0.5).toFixed(2) + 's" cx="' + n.p.x.toFixed(1) + '" cy="' + n.p.y.toFixed(1) + '" r="6"/>');
        out.push('<circle class="' + cls + '" style="--d:' + tAt(radii[n.gen]).toFixed(2) + 's" cx="' + n.p.x.toFixed(1) + '" cy="' + n.p.y.toFixed(1) + '" r="' + r + '"' + (isTip ? ' data-tip="1"' : "") + '/>');
      });
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.innerHTML = out.join("");
      svg.classList.toggle("settled", settled);
    }
    function start() {
      if (started) return;
      started = true;
      build();
      section.classList.add("is-grown");
      grownAt = Date.now();
      setTimeout(function () { settled = true; svg.classList.add("settled"); }, GROW_MS + 1200);
    }
    var rebuildT;
    function rebuild() { if (!started) return; clearTimeout(rebuildT); rebuildT = setTimeout(build, 80); }
    window.addEventListener("resize", rebuild);
    if ("ResizeObserver" in window && opts.watch) new ResizeObserver(rebuild).observe(section.querySelector(opts.watch));
    return {
      start: start,
      remaining: function () {
        if (reduce.matches) return 0;
        if (!grownAt) return GROW_MS + 900;
        return Math.max(0, GROW_MS - (Date.now() - grownAt));
      }
    };
  }

  /* Hero: out of the window, once the fonts have settled the line boxes. */
  var heroSec = document.querySelector(".hero");
  var heroGraph = null;
  if (heroSec && heroSec.querySelector(".lineage-graph")) {
    heroGraph = makeGraph(heroSec, heroSec.querySelector(".lineage-graph"), {
      origin: function (hb) {
        var win = heroSec.querySelector(".hero-stage .window");
        if (!win) return null;
        var wb = win.getBoundingClientRect();
        return { x: hb.width / 2, y: wb.top - hb.top + 36 };
      },
      copy: [[".h1", true], [".hero-sub", true], [".cta-row .btn", false]],
      watch: ".hero-copy"
    });
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(function () { setTimeout(heroGraph.start, 120); });
    setTimeout(heroGraph.start, 900);
  }
  function growRemaining() { return heroGraph ? heroGraph.remaining() : 0; }

  /* Final: out of the bottom edge, where the wordmark sits, when scrolled to. */
  var finalSec = document.querySelector(".final");
  if (finalSec && finalSec.querySelector(".lineage-graph")) {
    var finalGraph = makeGraph(finalSec, finalSec.querySelector(".lineage-graph"), {
      origin: function (hb) { return { x: hb.width / 2, y: hb.height + 30 }; },
      copy: [["h2", true], [".sub", true], [".cta-row .btn", false]],
      watch: ".final-in",
      tag: "your agent"
    });
    if ("IntersectionObserver" in window) {
      var fio = new IntersectionObserver(function (en) { if (en.some(function (e) { return e.isIntersecting; })) { finalGraph.start(); fio.disconnect(); } }, { threshold: 0.25 });
      fio.observe(finalSec);
    } else finalGraph.start();
  }

  /* ---- Backdrops: a slow, grainy field drawn with a tiny WebGL shader at half
     resolution. Paper, wash and warm light behind the hero; night, indigo and
     violet behind the close. Pauses offscreen; static under reduced motion;
     falls back to the CSS gradient where WebGL is unavailable. ---- */
  function shader(host, cv, pal) {
    if (!host || !cv) return;
    var gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    var vs = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
    var fs = "precision mediump float;uniform vec2 u_res;uniform float u_t;uniform vec3 u_c0,u_c1,u_c2;uniform float u_fade;" +
      "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}" +
      "float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}" +
      "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}" +
      "void main(){vec2 uv=gl_FragCoord.xy/u_res;vec2 p=vec2(uv.x*u_res.x/u_res.y,uv.y);float t=u_t*.045;" +
      "vec2 q=vec2(fbm(p*1.5+t),fbm(p*1.5-t*.6+vec2(5.2,1.3)));float n=fbm(p*1.1+1.8*q+vec2(t*.3,-t*.15));" +
      "vec3 col=mix(u_c0,u_c1,smoothstep(.32,.82,n));col=mix(col,u_c2,smoothstep(.58,.98,q.y)*.45);" +
      "float keep=mix(1.,smoothstep(.05,.62,uv.y),u_fade);col=mix(u_c0,col,keep);" +
      "col+=(hash(gl_FragCoord.xy+fract(u_t*.7))-.5)*.022;gl_FragColor=vec4(col,1.);}";
    function sh(t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    var prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var a = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, "u_res"), uT = gl.getUniformLocation(prog, "u_t");
    gl.uniform3fv(gl.getUniformLocation(prog, "u_c0"), pal.c0);
    gl.uniform3fv(gl.getUniformLocation(prog, "u_c1"), pal.c1);
    gl.uniform3fv(gl.getUniformLocation(prog, "u_c2"), pal.c2);
    gl.uniform1f(gl.getUniformLocation(prog, "u_fade"), pal.fade);
    host.classList.add("has-shader");
    var visible = true, raf = 0, t0 = performance.now();
    function size() {
      var w = Math.max(1, Math.round(host.clientWidth / 2)), h = Math.max(1, Math.round(host.clientHeight / 2));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    }
    function frame(now) {
      raf = 0; size();
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uT, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (visible && !reduce.matches) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) raf = requestAnimationFrame(frame); }
    start();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en.some(function (e) { return e.isIntersecting; }); if (visible) start(); }, { threshold: 0 }).observe(host);
    }
    window.addEventListener("resize", function () { size(); start(); });
    reduce.addEventListener && reduce.addEventListener("change", start);
  }
  shader(heroSec, heroSec && heroSec.querySelector(".hero-shader"),
    { c0: [.980, .976, .965], c1: [.885, .875, .990], c2: [.992, .955, .900], fade: 1 });
  shader(finalSec, finalSec && finalSec.querySelector(".final-shader"),
    { c0: [.043, .055, .102], c1: [.14, .13, .36], c2: [.26, .13, .40], fade: 0 });


  /* ---- How it works: the stage follows whichever step is nearest the middle
     of the viewport. Stages are cumulative, so scrolling back unwinds them. ---- */
  (function evo() {
    var stage = document.querySelector(".evo-stage");
    var steps = Array.prototype.slice.call(document.querySelectorAll(".evo-step"));
    if (!stage || !steps.length) return;
    var cap = stage.querySelector("[data-evo-cap]");
    var CAPS = ["waiting for enough of your team's work",
      "capturing: 21 active days, 84,310 tool calls in",
      "generation 2: four candidates spawned from one repeated workflow",
      "scoring: 1,136 captured outcomes replayed against every candidate",
      "retiring: two candidates pruned, the weakest lineage cut",
      "specialised: k survives, typecheck \u2192 fix \u2192 commit at 91% pass"];
    if (reduce.matches) stage.classList.add("reduced");
    var current = -1;
    function setStage(n) {
      if (n === current) return;
      current = n;
      stage.setAttribute("data-s", n);
      for (var i = 1; i <= 5; i++) stage.classList.toggle("s" + i, i <= n);
      steps.forEach(function (s) { s.classList.toggle("on", +s.getAttribute("data-stage") === n); });
      if (cap) cap.textContent = CAPS[n];
    }
    function update() {
      var mid = window.innerHeight * 0.5, best = 0, bestD = Infinity;
      steps.forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (r.top < mid && r.bottom > mid) { best = +s.getAttribute("data-stage"); bestD = 0; return; }
        var d = r.top >= mid ? r.top - mid : mid - r.bottom;
        if (d < bestD && r.top < mid) { bestD = d; best = +s.getAttribute("data-stage"); }
      });
      var first = steps[0].getBoundingClientRect();
      if (first.top > window.innerHeight * 0.85) best = 0;
      setStage(best);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  })();

  /* ---- Problem: the two runs race when they scroll into view. ---- */
  (function race() {
    var twin = document.querySelector(".twin");
    if (!twin) return;
    var timers = Array.prototype.slice.call(twin.querySelectorAll("[data-timer]"));
    function fmt(sec) { var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60); return h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
    function run() {
      if (reduce.matches) return;
      twin.classList.add("is-racing");
      var longest = Math.max.apply(null, timers.map(function (t) { return +t.getAttribute("data-timer"); }));
      var DUR = 2600, t0 = performance.now();
      timers.forEach(function (t) { t.textContent = fmt(0); });
      (function tick(now) {
        var p = Math.min(1, (now - t0) / DUR);
        var e = 1 - Math.pow(1 - p, 2);
        timers.forEach(function (t) { var total = +t.getAttribute("data-timer"); t.textContent = fmt(Math.min(total, e * longest)); });
        if (p < 1) requestAnimationFrame(tick); else twin.classList.add("raced");
      })(t0);
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) { if (en.some(function (e) { return e.isIntersecting; })) { run(); io.disconnect(); } }, { threshold: 0.5 });
      io.observe(twin);
    }
  })();

  /* ---- Proof: numbers count up once, when the strip is in view. ---- */
  (function counters() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    if (!els.length) return;
    function render(el, v) {
      var d = +(el.getAttribute("data-decimals") || 0);
      var txt = d ? v.toFixed(d) : Math.round(v).toLocaleString("en-US");
      el.textContent = (el.getAttribute("data-prefix") || "") + txt + (el.getAttribute("data-suffix") || "");
    }
    function go(el) {
      var target = +el.getAttribute("data-count"), t0 = performance.now(), DUR = 1400;
      (function tick(now) {
        var p = Math.min(1, (now - t0) / DUR), e = 1 - Math.pow(1 - p, 3);
        render(el, target * e);
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }
    if (reduce.matches || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { go(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---- Product tour: each frame settles flat as it scrolls into view. Skipped
     on phones, where the frame scrolls sideways inside its wrapper. ---- */
  (function tilt() {
    if (!window.gsap || !window.ScrollTrigger || reduce.matches) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.matchMedia().add("(min-width: 900px)", function () {
      document.querySelectorAll(".tour-item .frame-wrap").forEach(function (w) {
        if (w.classList.contains("has-overflow")) return;
        var win = w.querySelector(".window");
        gsap.fromTo(win, { rotateX: 9, y: 36, opacity: .55 }, {
          rotateX: 0, y: 0, opacity: 1, ease: "none",
          scrollTrigger: { trigger: w, start: "top 92%", end: "top 45%", scrub: 0.6 }
        });
      });
    });
  })();

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
    }, growRemaining());
  }
  if (hero) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { play(); io.disconnect(); }
      }, { threshold: 0.1 });
      io.observe(hero);
    } else {
      play();
    }
  }
})();
