# STUDIOLAND MGMT — engineer profile pages

The Showit engineer page rebuilt as plain HTML/CSS/JS. No build step, no
framework — open the file in a browser and it works.

```
site/
  yago-mann.html      Yago's page (the one in the mockups)
  _template.html      copy this to start a new engineer
  engineer.css        every style, all tokens at the top in :root
  engineer.js         mobile menu + Spotify embed
  assets/
    logo.svg          placeholder lockup — replace with the real logo
    mascot.svg        placeholder BUZZ — replace with the real artwork
    yago-mann.jpg     low-res crop out of your screenshot — replace
    photo-placeholder.svg   shown if an engineer photo is missing
```

## Preview locally

```bash
cd site
python3 -m http.server 8000
# → http://localhost:8000/yago-mann.html
```

(Open it via the server, not `file://` — the SVG filter that makes the torn
edges needs a real origin.)

## Add a new engineer

1. `cp _template.html firstname-lastname.html`
2. Drop their photo in `assets/` and point the `<img src>` at it.
3. Fill in name, role, four bio paragraphs, four Q&A pairs.
4. Paste their Spotify playlist ID into `data-playlist` on the
   `.spotify-embed` div — it's the chunk after `/playlist/` in the share URL.
   Left empty, the card shows a dashed "add a playlist" placeholder instead
   of a broken iframe.
5. Point the three social links at their real URLs.

## Things you'll probably want to change first

**Fonts.** The page currently pulls Anton + Space Grotesk from Google as
stand-ins. When you have the real Showit font files, drop the `.woff2`s in
`assets/fonts/`, uncomment the `@font-face` block at the bottom of
`engineer.css`, and delete the Google `<link>` from each page's `<head>`.

**Logo + mascot.** `assets/logo.svg` and `assets/mascot.svg` are rough
stand-ins I drew so the page renders complete. Swap in the real files — same
filenames means nothing else changes.

**Yago's photo.** `assets/yago-mann.jpg` is cropped out of the screenshot you
sent, so it's soft. Drop in the original.

## How the design works

**Torn paper edges.** Every dark panel is a `.card`. The black shape lives on
a `::before` pseudo-element that gets an SVG turbulence/displacement filter
(`#rough-edge`, defined inline near the top of each page), so the edge shreds
but the text sitting above it stays crisp. Tune the look on that filter:
`scale` = how violent the tear, `baseFrequency` = how fine, `seed` = a
different random tear (give each page a different seed if the repeated shape
starts to read as a pattern).

**Design tokens.** Colors, fonts, spacing, and tear depth are all CSS
variables in `:root` at the top of `engineer.css`. Change them there.

**Desktop vs mobile.** Desktop is a 2×2 grid: photo and Q&A on the left,
name+bio and Spotify on the right. Under 900px the cards become full-bleed
torn bands and reorder to name → photo → bio → Spotify → Q&A, matching the
mobile mockup. The bio card dissolves (`display: contents`) at that
breakpoint so the name band and bio band can be reordered independently while
staying one card on desktop.
