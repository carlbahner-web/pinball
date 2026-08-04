/* STUDIOLAND MGMT — engineer profile page behavior.
   Three small jobs: the boil, the mobile menu toggle, and the Spotify embed. */

(function () {
  'use strict';

  /* ---- The boil (Brand Bible 2.6) -------------------------------------
     This is the packaged StudioLand recipe, copied from the reference
     implementation shipping in BUZZ's Wild Ride. Do not re-derive it.

     Hand-inked linework redrawn on an ~8fps twelve-phase clock. The whole
     shape is displaced together, so the wobbling fill edge IS the border.

     The traps, each of which reads as "horrible" when hit:
       1. It STEPS between fixed seeds. Anything smooth — a CSS transition,
          SMIL, scrolling the noise — reads as jelly.
       2. The filter goes on a shape layer BEHIND the text, never on the
          element. Labels stay crisp.
       3. The border must BE the displaced shape's edge, not a CSS border
          with something wobbling over it.
       4. The numbers are small: baseFrequency 0.02 isotropic, numOctaves 1.
          The packaged scale is 2.7; this page runs 7 on panels and 26 on the
          footer seam, both argued for where they are set. Bigger reads drunk;
          higher frequency reads electric.
       5. The filter needs an explicit region or the displaced edge clips
          flat against an invisible box.
       6. The ink needs contrast with its field or nothing appears to boil.
          Here the charcoal panel carries its own edge against the mustard
          ground; on a dark ground the ink would have to flip to cream.

     One clock, one world: every .sl-seed turbulence node steps together, so
     the whole page is on the same held frame. */

  var NS = 'http://www.w3.org/2000/svg';
  /* Twelve seeds, not the recipe's three.

     Three was not running slow — measured on this page, the panel edge changes
     7.7 times a second with a 132ms gap, unchanged at 4x and 6x CPU throttle on
     a phone viewport. But three frames at 7.7fps is a loop that RESTARTS 2.6
     times a second, and consecutive frames differ by only 0.5% of pixels with
     the edge travelling 0.76px. A 2.6Hz cycle of three near-identical images
     does not read as eight frames a second; it reads as about two, which is
     exactly what it was reported as.

     Twelve puts the loop at 1.56s, long enough that it stops registering as a
     repeat. Nothing else changes: same 130ms step, same amplitude. */
  var SL_SEEDS = [2, 9, 15, 23, 31, 44, 52, 61, 70, 78, 86, 95];
  var STEP_MS = 130;                     // ~8fps
  var root = document.documentElement;
  var phase = 0;            // shared index into SL_SEEDS, driven by the clock

  /* Marks the page as scripted. Everything below draws things the markup
     cannot declare — the boil shapes, the social marks, the player — and a
     no-JS reader has to get something sensible instead. See the fallbacks at
     the end of engineer.css. */
  root.classList.add('js');

  var stillWanted =
    root.getAttribute('data-boil') === 'off' ||
    (window.matchMedia &&
     window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---- The panel shape -------------------------------------------------
     Two ways to make a charcoal panel whose edge wobbles, switchable with
     data-boil-mode on <html>:

       "path"   (default) draw the wobbly outline directly as a filled path
       "filter" push the whole rect through the displacement filter

     They look the same because a solid fill can only SHOW displacement at
     its boundary — move a charcoal pixel to another charcoal pixel and
     nothing happened. Proven by putting stripes inside the filtered rect:
     the interior ripples, and 2.4% of interior pixels change per frame
     against 0.0% for the solid fill the page ships.

     So the filter spends a turbulence field and a per-pixel resample across
     the entire panel every frame to move a rim. Measured flat out on 16
     visible panels: filter 33fps, path 60fps — half the per-frame cost for
     the same picture. Shrinking the filter REGION does not help (106% vs
     155% measured 33.6 vs 33.0), which is what pins the cost on the
     pipeline rather than on wasted area.

     This is a deliberate departure. 2.6 assigns the displacement filter to
     DOM shapes and path re-emission to drawn linework, and this gives the
     panels the linework technique. It is only equivalent while the fill is
     one flat colour: put a Tier-2 weathering plate inside a panel and the
     two stop matching, because the filter would ripple the plate and this
     will not. BUZZ's inked outline stays on the filter regardless — it
     grows a silhouette out of a raster alpha channel, which no path can do. */

  var BOIL_MODE = root.getAttribute('data-boil-mode') === 'filter' ? 'filter' : 'path';

  /* One lap of a rounded rectangle, every point pushed along its own outward
     normal by the shared noise, closed with a Catmull-Rom so the wander is
     smooth rather than faceted. Same vnoise() the social marks use, so the
     whole page wobbles out of one source. */
  function wobblyRoundRect(w, h, r, amp, seed) {
    if (w <= 0 || h <= 0) return '';
    r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    var pts = [], i, a;
    var straight = 12, arcStep = Math.PI / 12;

    function push(x, y, nx, ny, key) {
      var o = (vnoise(key, seed) - 0.5) * 2 * amp;
      pts.push([x + nx * o, y + ny * o]);
    }
    function edge(x0, y0, x1, y1, nx, ny, k0) {
      var len = Math.hypot(x1 - x0, y1 - y0);
      var n = Math.max(1, Math.round(len / straight));
      for (i = 0; i < n; i++) {
        var t = i / n;
        push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, nx, ny, k0 + len * t);
      }
      return k0 + len;
    }
    function corner(cx, cy, a0, k0) {
      for (a = 0; a < Math.PI / 2 - 1e-6; a += arcStep) {
        var ang = a0 + a;
        push(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r,
             Math.cos(ang), Math.sin(ang), k0 + a * r);
      }
      return k0 + (Math.PI / 2) * r;
    }

    var k = 0;
    k = edge(r, 0, w - r, 0, 0, -1, k);                       // top
    k = corner(w - r, r, -Math.PI / 2, k);                    // top-right
    k = edge(w, r, w, h - r, 1, 0, k);                        // right
    k = corner(w - r, h - r, 0, k);                           // bottom-right
    k = edge(w - r, h, r, h, 0, 1, k);                        // bottom
    k = corner(r, h - r, Math.PI / 2, k);                     // bottom-left
    k = edge(0, h - r, 0, r, -1, 0, k);                       // left
    k = corner(r, r, Math.PI, k);                             // top-left

    var d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    for (i = 0; i < pts.length; i++) {
      var p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i],
          p2 = pts[(i + 1) % pts.length], p3 = pts[(i + 2) % pts.length];
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) +
           ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) +
           ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    return d + 'Z';
  }

  /* Matched to the filter by measurement, not by eye. Sampling the same strip
     of panel edge from live frames in both modes: the filter gives 7.7px of
     raggedness and 0.73px of travel per step, this gives 5.8px and 0.73px.
     Travel is the number that matters — it is the motion the eye reads — and
     it matches exactly. The path runs slightly less ragged WITHIN a frame,
     because its wander is smoothed along the outline by a Catmull-Rom rather
     than sampled per pixel. */
  var PATH_AMP = 1.38;

  function attach(el) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'sl-boil');
    svg.setAttribute('aria-hidden', 'true');

    if (BOIL_MODE === 'path') {
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('class', 'face');
      path.setAttribute('transform', 'translate(2,2)');   // the filter's 2px inset
      svg.appendChild(path);
    } else {
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('filter', 'url(#slBoil)');
      var rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('class', 'face');
      /* Geometry as ATTRIBUTES first, refined by CSS where it is supported.
         x/y/width/height/rx/ry only became CSS properties in Safari 17.4; on
         anything older the stylesheet's calc() sizing is ignored, the rect has
         no dimensions, and EVERY charcoal panel silently disappears. */
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('rx', '16');
      rect.setAttribute('ry', '16');
      g.appendChild(rect);
      svg.appendChild(g);
    }
    el.insertBefore(svg, el.firstChild);
  }

  var hosts = document.querySelectorAll('.card, .name-block, .hero-photo, .bio-body, .logo--on-ink');
  Array.prototype.forEach.call(hosts, attach);
  if (hosts.length) root.classList.add('has-boil');

  /* --cel-on lets the stylesheet decide which elements carry a shape at a
     given breakpoint. It matters: on desktop the name block and bio copy sit
     INSIDE the bio card and share its shape, and giving them their own would
     paint a charcoal rect over their own text — a positioned element paints
     above in-flow content, so the text simply disappears. */
  /* Twelve outlines per panel, cut once per size and then only swapped. The
     work that used to happen every frame in the filter now happens when the
     panel's box changes, which is a resize or a font landing — not 7.7 times
     a second. */
  var shapes = [];

  function buildPaths() {
    if (BOIL_MODE !== 'path') return;
    shapes = [];
    Array.prototype.forEach.call(hosts, function (el) {
      var svg = el.querySelector(':scope > svg.sl-boil');
      if (!svg) return;
      var face = svg.querySelector('path.face');
      if (!face) return;
      var b = svg.getBoundingClientRect();
      if (b.width < 8 || b.height < 8) return;
      var r = parseFloat(getComputedStyle(el).getPropertyValue('--cel-radius')) || 16;
      var cache = [];
      for (var i = 0; i < SL_SEEDS.length; i++) {
        cache.push(wobblyRoundRect(b.width - 4, b.height - 4, r, PATH_AMP, SL_SEEDS[i]));
      }
      shapes.push({ face: face, cache: cache, w: Math.round(b.width), h: Math.round(b.height) });
    });
    paintPaths(phase);
  }

  function paintPaths(f) {
    for (var i = 0; i < shapes.length; i++) {
      shapes[i].face.setAttribute('d', shapes[i].cache[f % shapes[i].cache.length]);
    }
  }

  function sync() {
    Array.prototype.forEach.call(hosts, function (el) {
      var on = getComputedStyle(el).getPropertyValue('--cel-on').trim() !== '0';
      var svg = el.querySelector(':scope > svg.sl-boil');
      if (svg) svg.style.display = on ? '' : 'none';
    });
  }
  sync();
  buildPaths();

  var syncTimer;
  function refresh() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () { sync(); buildPaths(); }, 150);
  }
  window.addEventListener('resize', refresh);
  window.addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

  /* A panel's height follows its copy, so it also changes when a face lands or
     an image decodes. Watching the boxes catches those without polling.
     Safe against the feedback loop that a size-writing observer would cause:
     this only READS boxes and writes a `d`, and the shape layer is absolutely
     positioned, so nothing it does can alter the layout it just measured. */
  if (window.ResizeObserver && BOIL_MODE === 'path') {
    var ro = new ResizeObserver(refresh);
    Array.prototype.forEach.call(hosts, function (el) { ro.observe(el); });
  }



  /* ---- The canvas boil (2.6) ------------------------------------------
     Copied from design-system/components/boil-canvas.html. The OTHER boil.

     The two are not interchangeable. The SVG filter above pushes rendered
     pixels around, which is right for a DOM rectangle and wrong for drawn
     linework — over artwork it gives a smeary, thick-and-thin wobble. This
     one re-emits the PATH with every point offset by noise, so the line
     wanders while its weight stays constant, which is what a hand-traced cel
     actually does. The social marks are drawn linework, so they take this.

     The five traps specific to it:
       1. Key the noise on WORLD position, not screen and not time. These
          marks don't scroll, so their own design coordinates are the world.
       2. Subdivide long segments — a straight line jittered only at its ends
          just tilts. Bowing needs interior points.
       3. It STEPS through the phases at ~130ms, and the phase shifts the SEED
          (+7.31), so each is a different tracing rather than the same wobble
          slid sideways.
       4. Amplitudes are in DESIGN units scaled at draw time, never device
          pixels, or the boil changes character between phone and desktop.
       5. Dense repeating marks use sjit() — same noise, no phase offset — so
          they carry permanent wonk without strobing.

     One clock drives this and the SVG seeds together, so DOM and canvas ink
     breathe in the same world. */

  function hashN(i, seed) { var s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return s - Math.floor(s); }

  function vnoise(x, seed) {
    var c = 46, i = Math.floor(x / c), t = x / c - i;
    var a = hashN(i, seed), b = hashN(i + 1, seed);
    var u = (1 - Math.cos(t * Math.PI)) / 2;
    return a + (b - a) * u;
  }

  function jit(x, seed, amp) {
    return (vnoise(x, seed + phase * 7.31) - 0.5) * 2 * amp;
  }

  function sjit(x, seed, amp) {
    return (vnoise(x, seed) - 0.5) * 2 * amp;
  }

  var BOIL = { mark: 1.15, ray: 0.9 };   // design units

  var inkAmp = 0, inkKey = 0, S = 1;

  function inkCtx(base) {
    var hp = false, lx = 0, ly = 0;
    var K = function (x, y) { return (x / S + inkKey) + (y / S) * 0.37; };
    var pt = function (x, y, start) {
      var k = K(x, y);
      var jx = x + jit(k, 58.2, inkAmp) * S, jy = y + jit(k, 91.7, inkAmp) * S;
      (start && !hp) ? base.moveTo(jx, jy) : base.lineTo(jx, jy); hp = true;
    };
    var seg = function (ax, ay, bx, by) {
      var L = Math.hypot(bx - ax, by - ay);
      var N = Math.max(1, Math.min(14, Math.round(L / (16 * S))));
      for (var i = 1; i <= N; i++) pt(ax + (bx - ax) * i / N, ay + (by - ay) * i / N, false);
    };
    var over = {
      beginPath: function () { hp = false; base.beginPath(); },
      moveTo: function (x, y) {
        var k = K(x, y);
        base.moveTo(x + jit(k, 58.2, inkAmp) * S, y + jit(k, 91.7, inkAmp) * S);
        hp = true; lx = x; ly = y;
      },
      lineTo: function (x, y) { if (!hp) over.moveTo(x, y); else { seg(lx, ly, x, y); lx = x; ly = y; } },
      bezierCurveTo: function (ax, ay, bx, by, x, y) {
        var L = Math.hypot(ax - lx, ay - ly) + Math.hypot(bx - ax, by - ay) + Math.hypot(x - bx, y - by);
        var N = Math.max(2, Math.min(20, Math.round(L / (3.5 * S))));
        for (var i = 1; i <= N; i++) {
          var t = i / N, u = 1 - t;
          pt(u * u * u * lx + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * x,
             u * u * u * ly + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * y, false);
        }
        lx = x; ly = y;
      },
      arc: function (cx, cy, r, a0, a1, ccw) {
        var d = a1 - a0;
        if (ccw) { if (d > 0) d -= Math.PI * 2; } else if (d < 0) d += Math.PI * 2;
        var N = Math.max(6, Math.min(26, Math.round(Math.abs(d) * r / (11 * S))));
        for (var i = 0; i <= N; i++) { var a = a0 + d * i / N; pt(cx + Math.cos(a) * r, cy + Math.sin(a) * r, i === 0); }
        lx = cx + Math.cos(a0 + d) * r; ly = cy + Math.sin(a0 + d) * r;
      }
    };
    var bound = {};
    return new Proxy(base, {
      get: function (t, p) {
        if (inkAmp && p in over) return over[p];
        var c = bound[p]; if (c !== undefined) return c;
        var v = t[p];
        if (typeof v === 'function') { var b = v.bind(t); bound[p] = b; return b; }
        return v;
      },
      set: function (t, p, v) { t[p] = v; return true; }
    });
  }

  /* ---- The three social marks, in a 132 x 134 design space -------------- */

  function roundRect(ink, x, y, w, h, r) {
    ink.beginPath();
    ink.moveTo(x + r, y);
    ink.lineTo(x + w - r, y);
    ink.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    ink.lineTo(x + w, y + h - r);
    ink.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    ink.lineTo(x + r, y + h);
    ink.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    ink.lineTo(x, y + r);
    ink.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  }

  /* Half an ellipse from pole to pole, bulging to w at the equator. Two of
     them mirrored make the circle read as a sphere instead of a disc.
     0.5523 is the standard cubic-bezier circle constant, applied per quarter
     — one cubic for a whole half-ellipse visibly flattens at the poles. */
  var GLOBE_R = 38;
  function meridian(ink, w) {
    var R = GLOBE_R, K = 0.5523;
    ink.beginPath();
    ink.moveTo(50, 50 - R);
    ink.bezierCurveTo(50 + K * w, 50 - R, 50 + w, 50 - K * R, 50 + w, 50);
    ink.bezierCurveTo(50 + w, 50 + K * R, 50 + K * w, 50 + R, 50, 50 + R);
    ink.stroke();
  }

  /* A line of latitude: a horizontal chord of the sphere, so its width comes
     from the circle rather than being picked by eye. */
  function parallel(ink, dy) {
    var hw = Math.sqrt(GLOBE_R * GLOBE_R - dy * dy);
    ink.beginPath();
    ink.moveTo(50 - hw, 50 + dy);
    ink.lineTo(50 + hw, 50 + dy);
    ink.stroke();
  }

  var MARKS = {
    /* A globe, not a silo. The old mark was an arch closed off with a flat
       bottom, which reads as a grain silo or a birdcage — the one thing it
       didn't read as was a sphere. Circle, equator, a pair of parallels, and
       a mirrored meridian pair.

       The full latitude grid is a deliberate choice, not the cheapest one.
       It costs density: at 46px this mark measures 21.1% ink coverage
       against 14.6% for instagram and email, so it is the heaviest of the
       three and will always be. Dropping the two parallels would bring it to
       18.0% and match the row better — that is the trade if it ever reads
       too dark on a real phone. The grid is what makes it unmistakably a
       globe rather than a lens, and that won. */
    website: function (ink, raw) {
      ink.beginPath(); ink.arc(50, 50, GLOBE_R, 0, Math.PI * 2); ink.stroke();
      ink.beginPath(); ink.moveTo(50 - GLOBE_R, 50); ink.lineTo(50 + GLOBE_R, 50); ink.stroke();
      parallel(ink, -19);
      parallel(ink,  19);
      meridian(ink,  19);
      meridian(ink, -19);
    },
    instagram: function (ink, raw) {
      roundRect(ink, 16, 16, 68, 68, 20); ink.stroke();
      ink.beginPath(); ink.arc(50, 50, 17, 0, Math.PI * 2); ink.stroke();
      ink.beginPath(); ink.arc(70, 30, 3.5, 0, Math.PI * 2); raw.fill();   // built by ink, filled raw
    },
    email: function (ink, raw) {
      roundRect(ink, 10, 24, 80, 52, 6); ink.stroke();
      ink.beginPath(); ink.moveTo(10, 30); ink.lineTo(50, 58); ink.lineTo(90, 30); ink.stroke();
    }
  };

  /* ---- The emphasis rays ------------------------------------------------
     Trap 5: these are a repeating set, so they take static wonk rather than
     boiling — a row of marks that all wobble reads as strobe.

     They used to be three hand-authored tables, and measured against each
     other they did not agree on anything: 5 / 5 / 4 rays, angular gaps
     running from 27 to 88 degrees, lengths from 11 to 14.2, four of them not
     even pointing away from their own centre, and instagram alone throwing
     two extra down at the bottom corners. Generated now, from one rule, so
     every mark emanates identically — five rays, 30 degrees apart across a
     120 degree arc, equal length, each standing the same clearance off its
     own artwork.

     Clearance off the SILHOUETTE rather than off a shared circle. A shared
     circle has to clear the widest mark, and the envelope is wide and short:
     it would float the top ray a long way above the flap while pressing the
     outer two into the corners. Hugging each outline is what keeps the
     spacing reading as deliberate. */
  /* gap 15: rendered 9 / 12 / 15 at both shipping sizes and picked from the
     ladder. The looser standoff lets the rays read as their own gesture
     rather than as a fringe on the artwork. */
  var RAY = { bearings: [-60, -30, 0, 30, 60], gap: 15, len: 13 };

  /* Each silhouette as a rounded box — a circle is just a box whose corner
     radius equals its half-size, so one expression covers all three. */
  var HULL = {
    website:   { hw: GLOBE_R, hh: GLOBE_R, cr: GLOBE_R },
    instagram: { hw: 34, hh: 34, cr: 20 },
    email:     { hw: 40, hh: 26, cr: 6 }
  };

  function sdRoundBox(px, py, h) {
    var dx = Math.abs(px) - (h.hw - h.cr), dy = Math.abs(py) - (h.hh - h.cr);
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) +
           Math.min(Math.max(dx, dy), 0) - h.cr;
  }

  /* How far the outline reaches along a unit direction. Bisection, not a
     closed form: the same six lines then serve circle, squircle and
     rectangle, and it runs three times at startup rather than per frame. */
  function hullReach(h, ux, uy) {
    var lo = 0, hi = 200;
    for (var i = 0; i < 40; i++) {
      var mid = (lo + hi) / 2;
      if (sdRoundBox(ux * mid, uy * mid, h) < 0) lo = mid; else hi = mid;
    }
    return lo;
  }

  function buildRays(kind) {
    var h = HULL[kind];
    return RAY.bearings.map(function (deg) {
      var a = deg * Math.PI / 180, ux = Math.sin(a), uy = -Math.cos(a);
      var r0 = hullReach(h, ux, uy) + RAY.gap, r1 = r0 + RAY.len;
      return [50 + ux * r0, 50 + uy * r0, 50 + ux * r1, 50 + uy * r1];
    });
  }

  var RAYS = {
    website:   buildRays('website'),
    instagram: buildRays('instagram'),
    email:     buildRays('email')
  };

  var marks = [];

  /* The recipe's proxy expects SCREEN pixels, with S the design->screen scale:
     it keys noise on x/S to recover world units and scales the offset back by
     S. Drawing design coordinates under a scaled canvas transform instead
     applies S twice — amplitude and wavelength both come out wrong. So the
     marks are authored in design units and converted here, and the canvas
     transform stays identity. */
  function designInk(ink, s, ox, oy) {
    return {
      beginPath: function () { ink.beginPath(); },
      moveTo: function (x, y) { ink.moveTo(ox + x * s, oy + y * s); },
      lineTo: function (x, y) { ink.lineTo(ox + x * s, oy + y * s); },
      bezierCurveTo: function (ax, ay, bx, by, x, y) {
        ink.bezierCurveTo(ox + ax * s, oy + ay * s, ox + bx * s, oy + by * s, ox + x * s, oy + y * s);
      },
      arc: function (cx, cy, r, a0, a1, ccw) { ink.arc(ox + cx * s, oy + cy * s, r * s, a0, a1, ccw); },
      stroke: function () { ink.stroke(); }
    };
  }

  function drawMark(m) {
    var raw = m.raw;
    var dpr = Math.min(2, window.devicePixelRatio || 1);   // the game's DPR cap
    var css = m.el.getBoundingClientRect().width;
    if (!css) return;
    var px = Math.round(css * dpr);
    if (m.el.width !== px) { m.el.width = px; m.el.height = Math.round(px * 134 / 132); }

    S = px / 132;                     // design units -> screen px
    var ox = 16 * S, oy = 18 * S;     // the design space starts at -16,-18
    var d = designInk(m.ink, S, ox, oy);

    raw.setTransform(1, 0, 0, 1, 0, 0);
    raw.clearRect(0, 0, m.el.width, m.el.height);
    raw.lineWidth = 6 * S;
    raw.lineCap = 'round';
    raw.lineJoin = 'round';
    raw.strokeStyle = m.color;
    raw.fillStyle = m.color;

    inkKey = 0;                       // these marks don't scroll; design IS world
    inkAmp = BOIL.mark;
    MARKS[m.kind](d, raw);

    inkAmp = 0;                       // rays drawn straight, then wonked by sjit
    raw.beginPath();
    RAYS[m.kind].forEach(function (r, i) {
      var w = sjit(r[0] + i * 13, 4.9, BOIL.ray);
      raw.moveTo(ox + (r[0] + w) * S, oy + (r[1] + w * 0.4) * S);
      raw.lineTo(ox + (r[2] + w) * S, oy + (r[3] + w * 0.4) * S);
    });
    raw.stroke();
  }

  Array.prototype.forEach.call(document.querySelectorAll('canvas.mark'), function (el) {
    var raw = el.getContext('2d');
    marks.push({
      el: el, raw: raw, ink: inkCtx(raw),
      kind: el.getAttribute('data-mark'),
      color: '#2C2C2A'
    });
  });

  /* The ink comes from CSS `color`, which is the whole point — a mark on a
     mustard ground and a mark on a dark panel want different ink, and the
     stylesheet is where that belongs. But getComputedStyle forces a style
     recalc, so reading it per frame would mean 24 recalcs a second for three
     small icons. Read it when it can actually have changed instead: once now,
     and again on resize, which is the only thing that moves a mark across a
     breakpoint. */
  function readColors() {
    for (var i = 0; i < marks.length; i++) {
      var c = getComputedStyle(marks[i].el).getPropertyValue('color').trim();
      if (c) marks[i].color = c;
    }
  }
  readColors();

  function drawMarks() { for (var i = 0; i < marks.length; i++) drawMark(marks[i]); }
  drawMarks();
  window.addEventListener('resize', function () {
    setTimeout(function () { readColors(); drawMarks(); }, 150);
  });

  /* ---- The clock ------------------------------------------------------
     One loop for both boils: it steps the SVG seeds and redraws the canvas
     marks on the same ~130ms phase, so nothing on the page is on its own
     beat. */

  if (!stillWanted) {
    var seeds = document.querySelectorAll('.sl-seed');
    var last = -1;

    (function tick(now) {
      requestAnimationFrame(tick);
      /* off SL_SEEDS.length, not a hardcoded 3 — the phase index also drives
         the canvas marks' jitter, so both boils get the same number of states
         and stay on one clock */
      var f = Math.floor((now || 0) / STEP_MS) % SL_SEEDS.length;
      if (f === last) return;
      last = f;
      phase = f;
      /* Seeds still step for the two things that genuinely need the filter:
         BUZZ's grown outline and the footer seam. */
      for (var i = 0; i < seeds.length; i++) seeds[i].setAttribute('seed', SL_SEEDS[f]);
      paintPaths(f);
      drawMarks();
    })(0);
  }

  /* ---- Mobile menu ---------------------------------------------------- */

  var toggle = document.querySelector('.topbar__menu');
  var nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---- Spotify embed --------------------------------------------------
     Each .spotify-embed reads its playlist id from data-playlist. Empty id
     renders a placeholder instead of a broken iframe, so a half-finished
     page still looks intentional. */

  Array.prototype.forEach.call(
    document.querySelectorAll('.spotify-embed'),
    function (host) {
      var id = (host.getAttribute('data-playlist') || '').trim();
      var title = host.getAttribute('data-title') || 'Spotify playlist';

      if (!id) {
        var note = document.createElement('div');
        note.className = 'spotify-embed__placeholder';
        note.textContent =
          'Spotify playlist goes here — paste the playlist ID into ' +
          'data-playlist on this element.';
        host.appendChild(note);
        return;
      }

      /* Mounted eagerly, on purpose. It was briefly deferred until the card
         came into view, on the grounds that a third-party player is JS of
         unknown weight and was measured fetching at 1619ms on Fast 3G. That
         is a real cost, but only on a slow link: above roughly 35 Mbps this
         page stops being bandwidth-bound at all, and 100 Mbps and 250 Mbps
         measure identically. Deferring bought nothing on the connections
         people actually have, and cost a player that isn't ready when the
         card is reached. Load it with everything else. */
      var frame = document.createElement('iframe');
      frame.src = 'https://open.spotify.com/embed/playlist/' +
        encodeURIComponent(id) + '?utm_source=generator&theme=0';
      frame.title = title;
      frame.allow =
        'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      /* no allowfullscreen: `allow` above already grants fullscreen and takes
         precedence over it, and setting both makes the browser warn. */
      host.appendChild(frame);
    }
  );
})();
