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

  if (!stillWanted && hosts.length) {
    var seeds = document.querySelectorAll('.sl-seed');
    var last = -1;

    (function tick(now) {
      requestAnimationFrame(tick);
      var f = Math.floor((now || 0) / STEP_MS) % 3;
      if (f === last) return;
      last = f;
      for (var i = 0; i < seeds.length; i++) seeds[i].setAttribute('seed', SL_SEEDS[f]);
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
