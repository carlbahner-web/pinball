/* STUDIOLAND MGMT — engineer profile page behavior.
   Three small jobs: the boil, the mobile menu toggle, and the Spotify embed. */

(function () {
  'use strict';

  /* ---- The boil (Brand Bible 2.6) -------------------------------------
     The signature motion: the same contour redrawn slightly differently on a
     three-phase clock, like cels traced by hand. Every panel edge reads off
     --edge, so cycling that one variable boils the whole page.

     Three cels at 12fps loop every quarter second. If the repeat becomes
     recognisable, add seeded #rough-edge filters and list them in PHASES —
     that lengthens the loop without touching the clock.

     What deliberately does NOT boil, per the rules:
       - text (labels stay crisp above the boiling shapes)
       - the photo (finished artwork never warps — the panel behind it boils
         instead, which is the "boiling silhouette" rule)
       - anything with dense repeating marks (nothing here has them)

     Held still for prefers-reduced-motion, for a hidden tab, and for
     <html data-boil="off">. */

  var PHASES = ['url(#rough-edge-0)', 'url(#rough-edge-1)', 'url(#rough-edge-2)'];
  // 12fps — classic cel animation ran on twos: 12 drawings per second against
  // a 24fps camera. (The bible says ~8; this is the authentic cadence, chosen
  // deliberately.) Expressed as a rate so the number you read is the number
  // you set.
  var FPS = 12;
  var FRAME_MS = 1000 / FPS;
  var root = document.documentElement;

  var stillWanted =
    root.getAttribute('data-boil') === 'off' ||
    (window.matchMedia &&
     window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  if (!stillWanted) {
    var phase = 0;
    var next = null;

    // Advance the deadline by a whole frame each time rather than resetting it
    // to now. Resetting quantises up to the next vsync -- 125ms becomes 133ms
    // on a 60Hz display, i.e. 7.5fps -- whereas accumulating lets gaps
    // alternate 133/117 and average out to the 125ms the clock asks for.
    var tick = function (now) {
      if (next === null) next = now;
      if (now >= next) {
        // a hidden tab or a long stall leaves the deadline far behind; resync
        // instead of firing a burst of catch-up phases
        next = (now - next > FRAME_MS * 4) ? now + FRAME_MS : next + FRAME_MS;
        phase = (phase + 1) % PHASES.length;
        root.style.setProperty('--edge', PHASES[phase]);
      }
      if (!document.hidden) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    // rAF stops in a background tab; restart the clock when we come back
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
