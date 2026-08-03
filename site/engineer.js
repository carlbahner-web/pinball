/* STUDIOLAND MGMT — engineer profile page behavior.
   Three small jobs: the boil, the mobile menu toggle, and the Spotify embed. */

(function () {
  'use strict';

  /* ---- The boil (Brand Bible 2.6) -------------------------------------
     The signature motion: the same stroke redrawn slightly differently on a
     ~8fps three-phase clock, like cels traced by hand. Every torn panel edge
     reads off --edge, so cycling that one variable boils the whole page.
     The torn silhouette itself lives in a separate, fixed #tear pass — only
     the small boil pass cycles, so the edge breathes instead of re-rolling.

     What deliberately does NOT boil, per the rules:
       - text (labels stay crisp above the boiling shapes)
       - the photo (finished artwork never warps — the panel behind it boils
         instead, which is the "boiling silhouette" rule)
       - anything with dense repeating marks (nothing here has them)

     Held still for prefers-reduced-motion, for a hidden tab, and for
     <html data-boil="off">. */

  var PHASES = ['url(#boil-0)', 'url(#boil-1)', 'url(#boil-2)'];
  var FRAME_MS = 125;                     // 8fps
  var root = document.documentElement;

  var stillWanted =
    root.getAttribute('data-boil') === 'off' ||
    (window.matchMedia &&
     window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  if (!stillWanted) {
    var phase = 0;
    var last = 0;

    var tick = function (now) {
      if (now - last >= FRAME_MS) {
        last = now;
        phase = (phase + 1) % PHASES.length;
        root.style.setProperty('--edge', PHASES[phase]);
      }
      if (!document.hidden) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    // rAF stops in a background tab; restart the clock when we come back
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { last = 0; requestAnimationFrame(tick); }
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
