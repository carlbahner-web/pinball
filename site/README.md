# STUDIOLAND MGMT — engineer profile pages

The Showit engineer page rebuilt as plain HTML/CSS/JS. No build step, no
framework — open the file in a browser and it works.

Built against **SL_REF_Visual_Brand_Bible_v3**; the section numbers below point
back at it.

```
site/
  yago-mann.html      Yago's page (the one in the mockups)
  _template.html      copy this to start a new engineer
  engineer.css        every style; canonical palette + tokens at the top
  engineer.js         the boil, mobile menu, Spotify embed
  fetch-assets.sh     mirrors the live brand assets here for offline work
  assets/
    studioland_mgmt_1.png   the MGMT lockup (dark build)
    Buzz The Mascot5.png    BUZZ
    website-noise-3.webp    the paper grain, flattened onto white
    logo.png                the plain wordmark (cream build)
    yago-mann.webp          Yago's photo
    mascot-placeholder.svg  stand-ins, only appear if an asset 404s
    photo-placeholder.svg
```

## Preview locally

```bash
cd site
./fetch-assets.sh          # optional — pulls the real logo, BUZZ, grain, fonts
python3 -m http.server 8000
# → http://localhost:8000/yago-mann.html
```

**Serve `site/` as the web root.** Asset paths are root-relative (`/assets/…`,
`/fonts/…`) so they match the live site, which means the folder you serve has
to be the root. Don't open it over `file://` either — the SVG filter behind
the inked panels needs a real origin.

## How assets resolve

Brand assets are referenced at the paths they already live at on
`welcometostudioland.netlify.app`, so a page dropped onto that site works with
nothing to copy:

| Path | What | In the repo? |
|---|---|---|
| `/assets/studioland_mgmt_1.png` | the MGMT lockup, header + footer | yes |
| `/assets/Buzz%20The%20Mascot5.png` | BUZZ in the footer | yes |
| `/assets/logo.png` | the plain wordmark, used as the lockup's fallback | yes |
| `/assets/website-noise-3.webp` | the paper grain (`website-noise.webp` / `-2` are the other cuts) | yes, flattened |
| `/fonts/dwfairfield-webfont.woff2` + `.woff` | display face | no |
| `/fonts/TAYWingman.woff2` + `.woff` | body face | no |

Every image carries an `onerror` fallback, so a missing file degrades to
something sensible instead of a broken icon.

**The logo fallback is the real wordmark.** If the MGMT lockup ever 404s,
`assets/logo.png` takes over — the plain mark, arrow-I signpost intact — so
nothing here types the wordmark in a font, which 1.3 forbids. That one is the
*cream* build, so the handler also adds `logo--on-ink`, a torn charcoal Box1
behind it; cream artwork on a cream bar would be invisible. If you ever see
the mark on a small dark chip, that's the fallback firing.

**The lockup is sized by width, not height** (`clamp(120px, 12vw, 152px)`).
It's a stacked mark — at a header-ish 46px height it renders 76px wide and the
arrow-I stops reading, under the ~140px floor in 1.3.

If these pages ever get hosted on a **different origin** than the fonts, the
font requests need a CORS header on them. Same origin, no issue.

## Add a new engineer

1. `cp _template.html firstname-lastname.html`
2. Upload their photo to the site and point the `<img src>` at it. The
   existing engineer photos follow `firstname-lastname.webp`
   (`nick-nagurka.webp`, `tim-howarth.webp`…), so the template ships as
   `/assets/ENGINEER-SLUG.webp`.
3. Fill in name, role, four bio paragraphs, four Q&A pairs.
4. Paste their Spotify playlist ID into `data-playlist` on the
   `.spotify-embed` div — it's the chunk after `/playlist/` in the share URL.
   Left empty, the card shows a dashed "add a playlist" placeholder instead
   of a broken iframe.
5. Point the three social links at their real URLs.
6. Leave the boil alone. The seeds `[2, 9, 15]` are part of the published
   recipe, not a per-page flourish — every StudioLand surface steps through
   the same three, which is what makes them look like one world.

## Still owed

- **`TAYWingman.woff2`.** Only the `.woff` exists, so body text loads at
  roughly 30% more weight than it needs to.
- **A distress sheet.** This is the one place the page doesn't meet a v3
  Don't: the panels are colored fields carrying no texture. Tier-1 grain
  can't fix it — measured on charcoal it lands at 0.36 stddev against 2.25 on
  the mustard ground, because multiply only darkens and charcoal is already
  near the floor, so adding it would be invisible weight. The bible's own
  answer for panels is the Tier-2 plate (2.2, "texture the ground of a
  panel"). `card--weathered` is wired and waiting for `/assets/plate-01.png`
  — density-on-white, no alpha.
- **A decision on the panel treatment.** 2.5 says boiling panels take fill,
  border AND a hard offset shadow as one displaced shape. Ours is fill only,
  which matches the Showit mockup but not the component spec. Adding a cream
  stroke and an offset shadow is a handful of lines; it's a design change, so
  it's yours to call.
- **The DW Fairfield Narrow cut** isn't among the webfonts — only the regular
  is wired. Nothing here needs Narrow, but that's why it's absent from the
  stack.
- **The lockup's ink is `#2D2D2D`,** one step off canonical Charcoal
  `#2C2C2A`. Invisible in practice, but by 1.1 the asset is the thing that's
  wrong, so it's worth a pass next time that file is regenerated.

## What the brand bible dictates here

**Color (1.1).** Every value is canonical, declared once in `:root`, and used
through role variables (`--ground`, `--ink`, `--band-soft`…). Don't write a
raw hex anywhere else. The page ground is **Midway Mustard `#F6CC60`** — the
Showit page's `#f2b930` was drifted mustard, and mustard under the multiply
grain lands close to what you had.

**Type (1.2).** Two faces, DW Fairfield (display, all-caps) and TAY Wingman
(body), served from `/fonts/`. No third-party font host. The stacks behind
them — a condensed sans, a humanist sans — are load-time fallbacks only. DW
Fairfield has one weight; nothing on this page asks for a synthetic bold.

**Texture (2.2).** The code-generated speck pattern is retired. Tier 1 is the
real overlay multiplied over the ground.

The committed grain is **flattened onto white with alpha dropped** — the form
2.2 asks a texture sheet to be. The site's copy is an alpha overlay instead,
and under multiply the two are equivalent: multiply-then-composite of `(C, a)`
is a plain multiply by `a*C + (1-a)`, measured at 0.18/255 mean difference.
Flattening took it from 1388KB to 71KB. Both live at the same path, so
whichever one serves, the page looks the same.

Worth knowing why multiply and not normal, since this file's marks are mostly
*light*: measured on the mustard ground, normal blend moves the blue channel
most (σ 3.55 vs 0.97) — the light flecks wash the color toward grey. Multiply
holds the hue and only deepens value, exactly as 2.2 says. Under multiply the
light flecks are no-ops and the dark specks do the work, which is what you see.

Tier 2 is the `card--weathered` class: it lands a **whole, fitted** distress sheet on a
panel's ground while the contents stay clean on top — multiply, never normal,
never cropped-and-tiled, never scaled at paint time.

**Box1 (2.3).** Every dark panel is a Box1, its edge painted by the boil's
displaced shape. On mobile they go full-bleed as bands.

**The boil (2.6).** This is `design-system/components/boil.html` copied
verbatim — the packaged recipe, not a reimplementation. v3 is explicit that
re-deriving it from prose produces something over-complicated and wrong, and
this page proved that the hard way before the file turned up: it ran at scale
13 and then 22 across three and four octaves, five to eight times the
recipe's `scale="2.7"` / `numOctaves="1"`, which is its trap #4 exactly.

The published numbers, unchanged here: `fractalNoise`, `baseFrequency="0.02"`
isotropic, `numOctaves="1"`, `scale="2.7"`, seeds `[2, 9, 15]` stepped every
130ms, filter region `x -25% y -30% w 155% h 175%`. **If you change anything,
change colors, radius and stroke weight — nothing else.**

The four promoted traps, and where each is honoured:

- **It steps, never glides** — one rAF clock in `engineer.js` sets `seed` on
  every `.sl-seed` node, so the whole page holds the same frame.
- **The displaced fill edge IS the border** — the panels carry no CSS border
  at all; the rect inside the filtered group paints their edge.
- **The filter has a declared region** — without it the displaced edge clips
  flat against an invisible box.
- **The ink contrasts its field** — charcoal panels against the mustard
  ground. On a dark ground the ink would have to flip to cream.

Also: the shape layer is an `<svg>`, a replaced element, so it needs an
explicit width and height. `inset: 0` alone leaves it at 300x150.

Hold it still with `data-boil="off"` on the `<html>` tag. It also stops for
`prefers-reduced-motion`.

**Value gap (1.1) — one thing to look at.** The footer nav band (Foggy Mint,
luminance ≈0.59) sits directly against the mustard ground (≈0.64). That's a
0.05 gap against the 0.17 floor, so the seam is soft. It's the one place the
original design and the rule disagree, and it's your call: leaving it matches
the mockup, or `--band-soft: var(--harbor-teal)` splits them hard. Every
other adjacency on the page clears the floor.

## How the torn edge works

Each dark panel's black shape lives on a `::before` pseudo-element that
carries the SVG turbulence/displacement filter, so the edge shreds while the
text sitting above it stays crisp. Tune it on the filter defs in the page
head: `scale` = how violent the tear, `baseFrequency` = how fine, `seed` =
which tear.

## Desktop vs mobile

Desktop is a 2×2 grid: photo and Q&A on the left, name+bio and Spotify on the
right. Under 900px the cards become full-bleed torn bands and reorder to
name → photo → bio → Spotify → Q&A, matching the mobile mockup. The bio card
dissolves (`display: contents`) at that breakpoint so the name band and bio
band can reorder independently while staying one card on desktop.
