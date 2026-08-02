/* STUDIOLAND MGMT — engineer profile page behavior.
   Two small jobs: the mobile menu toggle and the Spotify embed. */

(function () {
  'use strict';

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
