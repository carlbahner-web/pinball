/* STUDIOLAND MGMT — engineer profile page behavior.
   Three small jobs: the boil, the mobile menu toggle, and the Spotify embed. */

(function () {
  'use strict';

  /* ---- The boil (Brand Bible 2.6) -------------------------------------
     This is the packaged StudioLand recipe, copied from the reference
     implementation shipping in BUZZ's Wild Ride. Do not re-derive it.

     Hand-inked linework redrawn on an ~8fps three-phase clock. The whole
     shape is displaced together, so the wobbling fill edge IS the border.

     The traps, each of which reads as "horrible" when hit:
       1. It STEPS between three fixed seeds. Anything smooth — a CSS
          transition, SMIL, scrolling the noise — reads as jelly.
       2. The filter goes on a shape layer BEHIND the text, never on the
          element. Labels stay crisp.
       3. The border must BE the displaced shape's edge, not a CSS border
          with something wobbling over it.
       4. The numbers are small: baseFrequency 0.02 isotropic, numOctaves 1,
          scale 2.7. Bigger scale reads drunk; higher frequency reads
          electric.
       5. The filter needs an explicit region or the displaced edge clips
          flat against an invisible box.
       6. The ink needs contrast with its field or nothing appears to boil.
          Here the charcoal panel carries its own edge against the mustard
          ground; on a dark ground the ink would have to flip to cream.

     One clock, one world: every .sl-seed turbulence node steps together, so
     the whole page is on the same held frame. */

  var NS = 'http://www.w3.org/2000/svg';
  var SL_SEEDS = [2, 9, 15];
  var STEP_MS = 130;                     // ~8fps
  var root = document.documentElement;
  var phase = 0;                 // the shared 3-phase index, driven by the clock

  var stillWanted =
    root.getAttribute('data-boil') === 'off' ||
    (window.matchMedia &&
     window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* The shape layer: an <svg> holding one rect inside the filtered group.
     SVG is a replaced element — the CSS must give .sl-boil a width and a
     height, or it sits at its 300x150 intrinsic size and the panel vanishes. */
  function attach(el) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'sl-boil');
    svg.setAttribute('aria-hidden', 'true');
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('filter', 'url(#slBoil)');
    var rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('class', 'face');
    g.appendChild(rect);
    svg.appendChild(g);
    el.insertBefore(svg, el.firstChild);
  }

  var hosts = document.querySelectorAll('.card, .name-block, .bio-body, .logo--on-ink');
  Array.prototype.forEach.call(hosts, attach);
  if (hosts.length) root.classList.add('has-boil');

  /* --cel-on lets the stylesheet decide which elements carry a shape at a
     given breakpoint. It matters: on desktop the name block and bio copy sit
     INSIDE the bio card and share its shape, and giving them their own would
     paint a charcoal rect over their own text — a positioned element paints
     above in-flow content, so the text simply disappears. */
  function sync() {
    Array.prototype.forEach.call(hosts, function (el) {
      var on = getComputedStyle(el).getPropertyValue('--cel-on').trim() !== '0';
      var svg = el.querySelector(':scope > svg.sl-boil');
      if (svg) svg.style.display = on ? '' : 'none';
    });
  }
  sync();

  var syncTimer;
  window.addEventListener('resize', function () {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(sync, 150);
  });



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
       3. It STEPS three phases at ~130ms, and the phase shifts the noise SEED
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

  var MARKS = {
    website: function (ink, raw) {
      ink.beginPath();
      ink.moveTo(14, 86); ink.lineTo(14, 44);
      ink.bezierCurveTo(14, 25, 30, 12, 50, 12);
      ink.bezierCurveTo(70, 12, 86, 25, 86, 44);
      ink.lineTo(86, 86); ink.lineTo(14, 86);
      ink.stroke();
      ink.beginPath(); ink.moveTo(14, 62); ink.lineTo(86, 62); ink.stroke();
      ink.beginPath(); ink.moveTo(22, 40); ink.lineTo(78, 40); ink.stroke();
      ink.beginPath();
      ink.moveTo(50, 12); ink.bezierCurveTo(39, 24, 35, 42, 35, 54); ink.lineTo(35, 86);
      ink.stroke();
      ink.beginPath();
      ink.moveTo(50, 12); ink.bezierCurveTo(61, 24, 65, 42, 65, 54); ink.lineTo(65, 86);
      ink.stroke();
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

  // Trap 5: the emphasis dashes are a repeating set, so they take static wonk
  // rather than boiling — a row of marks that all wobble reads as strobe.
  var RAYS = {
    website:  [[-1, 24, -12, 15], [23, 3, 17, -9], [50, -6, 50, -17], [77, 3, 83, -9], [101, 24, 112, 15]],
    instagram:[[4, 6, -5, -3], [50, -2, 50, -15], [96, 6, 105, -3], [4, 94, -5, 103], [96, 94, 105, 103]],
    email:    [[0, 14, -9, 4], [28, 6, 24, -7], [72, 6, 76, -7], [100, 14, 109, 4]]
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
      var f = Math.floor((now || 0) / STEP_MS) % 3;
      if (f === last) return;
      last = f;
      phase = f;
      for (var i = 0; i < seeds.length; i++) seeds[i].setAttribute('seed', SL_SEEDS[f]);
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

      var frame = document.createElement('iframe');
      frame.src = 'https://open.spotify.com/embed/playlist/' +
        encodeURIComponent(id) + '?utm_source=generator&theme=0';
      frame.title = title;
      frame.loading = 'lazy';
      frame.allow =
        'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      frame.setAttribute('allowfullscreen', '');
      host.appendChild(frame);
    }
  );
})();
