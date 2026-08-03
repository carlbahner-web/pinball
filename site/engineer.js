/* STUDIOLAND MGMT — engineer profile page behavior.
   Three small jobs: the boil, the mobile menu toggle, and the Spotify embed. */

(function () {
  'use strict';

  /* ---- The boil (Brand Bible 2.6) -------------------------------------
     The signature motion: the same contour redrawn slightly differently on a
     three-cel clock, like linework traced by hand.

     The contours are GEOMETRY, not filters. An SVG filter recomputes
     feTurbulence for every pixel of every panel on every frame, which is fine
     for one small element and ruinous for five big ones twelve times a
     second — the large panels fall behind and the page judders. Here each
     cel's outline is solved once as a path, and animating is swapping a `d`
     attribute: no per-frame pixel work at all.

     Smooth by construction, too. The outline is a sum of a few harmonics
     around the perimeter, drawn through a Catmull-Rom spline, so it curves
     like a brush instead of spiking like a tear.

     What deliberately does NOT boil, per the rules:
       - text (labels stay crisp above the boiling shapes)
       - the photo (finished artwork never warps — the panel behind it boils
         instead, which is the "boiling silhouette" rule)
       - anything with dense repeating marks (nothing here has them)

     Held still for prefers-reduced-motion, for a hidden tab, and for
     <html data-boil="off">. */

  var NS = 'http://www.w3.org/2000/svg';
  var CELS = 3;                  // three drawings in the cycle
  var FPS = 8;                   // the bible's three-phase clock (2.6)
  var FRAME_MS = 1000 / FPS;
  var root = document.documentElement;

  var stillWanted =
    root.getAttribute('data-boil') === 'off' ||
    (window.matchMedia &&
     window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* A closed, smooth, seeded wobble around the perimeter.

     The harmonics are chosen from the perimeter LENGTH, not from a fixed
     count. A fixed count spreads the same few waves around whatever it is
     drawn on, so a tall card gets long lazy curves while the little logo chip
     gets tight ripples from identical settings — the ink reads at a different
     size on every panel. Deriving the base harmonic from `wave` keeps the
     wobble the same number of pixels across regardless of what it wraps.

     Periodic by construction, so the contour meets itself cleanly. */
  function wobble(seed) {
    var r = seed * 9301 + 49297;
    var rand = function () { r = (r * 9301 + 49297) % 233280; return r / 233280; };
    var phase = [rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2];
    var weight = [1, 0.45, 0.2];
    var norm = weight[0] + weight[1] + weight[2];
    return function (t, perimeter, wave) {
      // how many full waves fit around this particular outline
      var k = Math.max(1, Math.round(perimeter / wave));
      var v = 0;
      for (var i = 0; i < 3; i++) {
        v += weight[i] * Math.sin(2 * Math.PI * k * (i + 1) * t + phase[i]);
      }
      return v / norm;
    };
  }

  /* Walk a rounded rectangle by arc length, returning point + outward normal. */
  function outline(w, h, r, steps) {
    r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    var straight = 2 * (w - 2 * r) + 2 * (h - 2 * r);
    var arcs = 2 * Math.PI * r;
    var total = straight + arcs;
    var pts = [];
    for (var i = 0; i < steps; i++) {
      var s = (i / steps) * total, x, y, nx, ny, a;
      var top = w - 2 * r, side = h - 2 * r, q = (Math.PI / 2) * r;
      if (s < top) { x = r + s; y = 0; nx = 0; ny = -1; }
      else if ((s -= top) < q) { a = -Math.PI / 2 + s / r; x = w - r + Math.cos(a) * r; y = r + Math.sin(a) * r; nx = Math.cos(a); ny = Math.sin(a); }
      else if ((s -= q) < side) { x = w; y = r + s; nx = 1; ny = 0; }
      else if ((s -= side) < q) { a = s / r; x = w - r + Math.cos(a) * r; y = h - r + Math.sin(a) * r; nx = Math.cos(a); ny = Math.sin(a); }
      else if ((s -= q) < top) { x = w - r - s; y = h; nx = 0; ny = 1; }
      else if ((s -= top) < q) { a = Math.PI / 2 + s / r; x = r + Math.cos(a) * r; y = h - r + Math.sin(a) * r; nx = Math.cos(a); ny = Math.sin(a); }
      else if ((s -= q) < side) { x = 0; y = h - r - s; nx = -1; ny = 0; }
      else { a = Math.PI + (s - side) / r; x = r + Math.cos(a) * r; y = r + Math.sin(a) * r; nx = Math.cos(a); ny = Math.sin(a); }
      pts.push([x, y, nx, ny, i / steps]);
    }
    return pts;
  }

  /* Catmull-Rom through the offset points, emitted as cubic beziers. */
  function celPath(w, h, radius, amp, wave, noise) {
    var rr = Math.max(0, Math.min(radius, Math.min(w, h) / 2));
    var perimeter = 2 * (w - 2 * rr) + 2 * (h - 2 * rr) + 2 * Math.PI * rr;
    // enough points to resolve the shortest harmonic: three waves per sample
    // would alias it into a different shape entirely
    var steps = Math.round(Math.min(900, Math.max(40, perimeter / (wave / 14))));
    var base = outline(w, h, radius, steps);
    var P = base.map(function (p) {
      var d = noise(p[4], perimeter, wave) * amp;
      return [p[0] + p[2] * d, p[1] + p[3] * d];
    });
    var n = P.length, d = 'M' + P[0][0].toFixed(1) + ',' + P[0][1].toFixed(1);
    for (var i = 0; i < n; i++) {
      var p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) +
           ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) +
           ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    return d + 'Z';
  }

  var noises = [];
  for (var c = 0; c < CELS; c++) noises.push(wobble(7 + c * 16));

  var panels = [];

  function build(panel) {
    var cs = getComputedStyle(panel.el);
    var box = panel.el.getBoundingClientRect();
    var bx = parseFloat(cs.getPropertyValue('--cel-x')) || 0;
    var by = parseFloat(cs.getPropertyValue('--cel-y')) || 0;
    var w = Math.round(box.width + bx * 2), h = Math.round(box.height + by * 2);
    // Fail loudly rather than feeding a runaway: if a stylesheet change ever
    // puts the contour back in flow, its width feeds the panel that sizes it.
    if (w > window.innerWidth * 4 || h > window.innerHeight * 12) {
      panel.svg.style.display = 'none';
      return;
    }
    // --cel-on lets the stylesheet decide which elements carry a contour at a
    // given breakpoint, rather than duplicating that logic here
    if (cs.getPropertyValue('--cel-on').trim() === '0') {
      panel.svg.style.display = 'none';
      panel.w = panel.h = 0;
      return;
    }
    panel.svg.style.display = '';
    if (!w || !h || (w === panel.w && h === panel.h)) return;
    panel.w = w; panel.h = h;
    panel.svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    panel.svg.style.width = w + 'px';
    panel.svg.style.height = h + 'px';
    var radius = parseFloat(cs.getPropertyValue('--cel-radius')) || 26;
    var amp = parseFloat(cs.getPropertyValue('--cel-amp')) || 6;
    var wave = parseFloat(cs.getPropertyValue('--cel-wave')) || 130;
    // Each cel is its own <path>, drawn once. Swapping which one is visible
    // beats rewriting a `d` attribute every frame: at these wavelengths a
    // contour is ~20KB of path data, and re-parsing that twelve hundred times
    // a minute is real work for no reason.
    for (var i = 0; i < CELS; i++) {
      panel.paths[i].setAttribute('d', celPath(w, h, radius, amp, wave, noises[i]));
      panel.paths[i].style.display = (i === (panel.phase || 0)) ? '' : 'none';
    }
  }

  function attach(el) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'cel');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('preserveAspectRatio', 'none');
    var paths = [];
    for (var i = 0; i < CELS; i++) {
      var path = document.createElementNS(NS, 'path');
      if (i) path.style.display = 'none';
      svg.appendChild(path);
      paths.push(path);
    }
    el.insertBefore(svg, el.firstChild);
    var panel = { el: el, svg: svg, paths: paths, phase: 0, w: 0, h: 0 };
    panels.push(panel);
    build(panel);
  }

  Array.prototype.forEach.call(
    document.querySelectorAll('.card, .name-block, .bio-body, .logo--on-ink'),
    attach
  );

  if (panels.length) {
    root.classList.add('has-cel');
    // the class swaps the CSS box for the drawn one; sizes change with it
    panels.forEach(function (p) { p.w = 0; build(p); });
  }

  /* A panel's height is not settled at parse time — the photo card grows when
     its image arrives, and the bands reflow at the breakpoint. Watch each
     panel rather than the window, or the contour keeps the size it was born
     with and the content overruns it. build() only touches an absolutely
     positioned child, so observing here cannot feed back into itself. */
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var panel = entries[i].target._celPanel;
        if (panel) build(panel);
      }
    });
    panels.forEach(function (p) { p.el._celPanel = p; ro.observe(p.el); });
  } else {
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { panels.forEach(build); }, 150);
    });
    window.addEventListener('load', function () { panels.forEach(build); });
  }

  if (!stillWanted && panels.length) {
    var phase = 0, next = null;

    // Advance the deadline by a whole frame rather than resetting it to now:
    // resetting quantises up to the next vsync and runs slow.
    var tick = function (now) {
      if (next === null) next = now;
      if (now >= next) {
        next = (now - next > FRAME_MS * 4) ? now + FRAME_MS : next + FRAME_MS;
        phase = (phase + 1) % CELS;
        for (var i = 0; i < panels.length; i++) {
          var p = panels[i];
          p.paths[p.phase].style.display = 'none';
          p.paths[phase].style.display = '';
          p.phase = phase;
        }
      }
      if (!document.hidden) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { next = null; requestAnimationFrame(tick); }
    });
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
