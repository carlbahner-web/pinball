# STUDIOLAND MGMT — engineer profile pages

The Showit engineer page rebuilt as plain HTML/CSS/JS. One HTML page, one
stylesheet, one script — nothing to install to *view* it. The pages themselves
are generated from a template plus a JSON of copy; see **Add a new engineer**.

Built against **SL_REF_Visual_Brand_Bible_v3**; the section numbers below point
back at it.

```
site/
  engineers/
    yago-mann.json         one engineer's copy, plain prose
    _new-engineer.json     copy this to start a new one
  _template.html           the markup, with {{TOKEN}} holes. Edit this, not the pages.
  build-page.py            engineers/*.json + _template.html → <slug>.html
  build-standalone.py      <slug>.html → <slug>.standalone.html (everything inlined)

  yago-mann.html           GENERATED. Do not hand-edit.
  yago-mann.standalone.html  GENERATED. One self-contained file, ~450KB.

  engineer.css        every style; canonical palette + tokens at the top
  engineer.js         the boil, mobile menu, Spotify embed
  fetch-assets.sh     mirrors the live brand assets here for offline work
  fonts/
    dwfairfield-webfont.woff2   display face
    TAYWingman.woff2 + .woff    body face
  assets/
    studioland-mgmt.webp    the MGMT lockup (dark build)
    buzz-mascot.webp        BUZZ
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

Asset paths are **relative** (`assets/…`, `fonts/…`), so `site/` can be served
from any prefix — a subfolder, a raw-file proxy, a Pages site. Don't open it
over `file://` though: the SVG filter behind the inked panels needs a real
origin. If you need something that survives `file://` and Dropbox and every
other place that disagrees about what "/" means, use the `.standalone.html`.

## How assets resolve

Brand assets are referenced at the paths they already live at on
`welcometostudioland.netlify.app`, so a page dropped onto that site works with
nothing to copy:

| Path | What | In the repo? |
|---|---|---|
| `assets/studioland-mgmt.webp` | the MGMT lockup, header + footer | yes |
| `assets/buzz-mascot.webp` | BUZZ in the footer | yes |
| `assets/logo.png` | the plain wordmark, used as the lockup's fallback | yes |
| `assets/website-noise-3.webp` | the paper grain (`website-noise.webp` / `-2` are the other cuts) | yes, flattened |
| `fonts/dwfairfield-webfont.woff2` | display face | yes |
| `fonts/TAYWingman.woff2` + `.woff` | body face | yes |

The PNG originals (`studioland_mgmt_1.png`, `Buzz The Mascot5.png`) are still
here; the pages point at the WebP re-encodes, which is most of why the page
went from 1371KB to ~450KB.

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

```bash
cd site
cp engineers/_new-engineer.json engineers/firstname-lastname.json
#  … fill it in, drop their photo in assets/ …
python3 build-page.py engineers/firstname-lastname.json
```

That writes `firstname-lastname.html` **and** `firstname-lastname.standalone.html`.
Rebuild everything with `python3 build-page.py engineers/*.json`.

What goes in the JSON:

| Field | |
|---|---|
| `slug` | the file name, no extension |
| `name`, `first_name`, `role` | `first_name` only feeds the questions heading |
| `photo` | path relative to `site/`. Existing photos follow `assets/firstname-lastname.webp` |
| `photo_alt` | what is happening in the picture, for anyone who can't see it |
| `bio` | a list of paragraphs |
| `questions` | a list of `{q, a}`. **Don't number them** — the numbering and the "in four questions" heading are generated from the count |
| `spotify_playlist` | the chunk after `/playlist/` in the share URL. Left `""`, the card shows a dashed "add a playlist" placeholder instead of a broken iframe |
| `website`, `instagram`, `email` | |

Write the copy as **plain prose**. Escaping, curly quotes, en dashes and
ellipses are applied at build time, so the JSON stays readable and you never
hand-type an entity. The build refuses to run on a missing required field, a
photo that isn't there, or a `{{TOKEN}}` nothing filled — it fails loudly
rather than shipping a page with a hole in it.

**The `.html` files are outputs.** They used to be hand-kept copies of the
template and they drifted apart on nearly every change — a fix would land in
one and be forgotten in the other. Edit `_template.html` or the JSON and
rebuild; anything typed into a generated page disappears at the next build.

The photo's `width`/`height` attributes are read from the file, never guessed:
they're the browser's aspect-ratio hint, so a wrong pair makes the page jump
while the image loads. Rasters need Pillow (`pip install pillow`); SVGs are
read from the `viewBox`.

Leave the boil alone. The seeds are part of the published recipe, not a
per-page flourish — every StudioLand surface steps through the same list,
which is what makes them look like one world.

## Still owed

- **Somewhere to host it.** Nothing is deployed. The folder is ready to serve
  from any prefix, but no host, no deploy config, no Pages setting exists yet.
- **Eyes on the Spotify embed.** `open.spotify.com` is blocked from the
  sandbox this was built in, so the player has never actually been *seen*
  rendering. Everything around it — the placeholder when `data-playlist` is
  empty, the sizing, the lazy iframe — is verified; the iframe itself isn't.
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
- **`boil-canvas.html`, if the social marks should boil.** They're drawn
  linework, so they'd need the canonical path-re-emission boil. What's in
  `engineer.js` is a local approximation of that mechanism (value noise along
  the outward normal, Catmull-Rom closed), written for the panels — not the
  published recipe, whose numbers (lattice 46 design units, phase offset
  +7.31, the amplitude registry) aren't reconstructable from prose. If the
  marks are ever meant to move, that file has to come across first.
- **A cheaper footer.** The social marks are the biggest thing left on the
  per-frame bill — 3.8% of one core on a 4×-throttled phone, redrawn on
  canvas every step. Twelve pre-rendered bitmaps per mark would take it to
  roughly nothing. Not done because nobody has complained about the footer.
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

**The boil (2.6).** There are two boils — the SVG displacement filter for DOM
shapes, path re-emission for drawn linework. `design-system/components/boil.html`
is the filter, copied verbatim rather than reimplemented; v3 is explicit that
re-deriving it from prose produces something over-complicated and wrong, and
this page proved that the hard way before the file turned up (scale 13, then
22, across three and four octaves — trap #4 exactly).

The published filter numbers: `fractalNoise`, `baseFrequency="0.02"`,
`numOctaves="1"`, region `x -25% y -30% w 155% h 175%`, stepped every 130ms.
Two deliberate departures from the recipe, both measured:

- **`scale="7"`, not 2.7.** Carl's call after seeing the ladder. Measured at
  the edge with the clock frozen: 2.0–3.0px of raggedness, 0.85px of travel
  between frames. The sides move about a third as much as the top and bottom,
  because the colour matrix compresses X to 0.3.
- **Twelve seeds, not three.** Three seeds × ~7.7 presented frames a second is
  a loop restarting 2.6 times a second, and consecutive frames differ by 0.5%
  of their pixels — which reads as roughly 2fps, and got reported as exactly
  that. Twelve puts the loop at 1.56s. Same step, same amplitude.

**The panels run the path boil, not the filter.** This is the larger
departure, and it's a performance one. A solid fill can only *show*
displacement at its boundary — move a charcoal pixel onto another charcoal
pixel and nothing happened (proven by striping the interior: 2.4% of interior
pixels change per frame against 0.0% for the flat fill the page ships). So the
filter was spending a turbulence field and a per-pixel resample across every
panel to move a rim. Measured flat out on 16 visible panels: filter 33fps,
path 60fps. Shrinking the filter *region* doesn't help (33.6 vs 33.0), which
pins the cost on the pipeline rather than on wasted area. `data-boil-mode="filter"`
on `<html>` puts it back.

That equivalence holds only while the fill is one flat colour. Put a Tier-2
weathering plate inside a panel and the two stop matching, because the filter
would ripple the plate and the path won't.

BUZZ's inked outline stays on the filter regardless: `feMorphology` grows a
silhouette out of the raster's alpha channel, which no path can do. The three
social marks are drawn linework and stay untouched. Every bitmap (the lockup,
the photo, BUZZ) gets a boiling shape *behind* it, never a warp — 2.6's
silhouette rule.

**If you change anything else, change colors, radius and stroke weight —
nothing else.**

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

**Value gap (1.1).** The footer used to be a Foggy Mint nav band sitting
against the mustard ground — a 0.09 luminance gap against the 0.17 floor, so
the seam was soft. It's now one cream footer, and the separation is carried by
a boiling torn edge (`#slBoilSeam`, scale 26) instead of by a colour step.
That reads harder than either colour pair did, and it's one band instead of
two. Every adjacency on the page now clears the floor.

## How the torn edge works

Each dark panel's charcoal shape lives in an `<svg>` layer behind the content,
so the edge shreds while the text above it stays crisp. In the default path
mode `engineer.js` draws that edge directly as a filled wobbly path; in filter
mode a plain `<rect>` goes through the turbulence/displacement filter in the
page head. Tune it on the filter defs: `scale` = how violent the tear,
`baseFrequency` = how fine, `seed` = which tear.

The svg is a replaced element, so it needs an explicit width and height —
`inset: 0` alone leaves it at 300×150.

With scripts off there's no path to draw, so the panels fall back to a plain
CSS background: straight edges, right colours, all the copy legible. The
`js` class on `<html>` is what switches between the two.

## Layout

**Desktop** is a hero card spanning the full width, then Q&A and Spotify side
by side under it. The hero card is one panel containing the photo, the name,
the role and the bio: the photo is `float: left`, so the name and the opening
paragraphs set alongside it as a second column and the text then closes back
under it — a magazine wrap, not a grid cell. Nothing in that column carries a
`max-width`; a block box sits *under* a float, only its line boxes wrap, so a
measure cap there would have given the wrapped column 13 characters a line.

**Phones** (`max-width: 699px`, or `max-width: 900px` in portrait) go
single-column and reorder to name → photo → bio → Spotify → Q&A. The panels
stay four-sided cards rather than full-bleed bands — a band only ever shows
two of the boil's four sides, and the wobble on the left and right runs off
screen.

The breakpoint tests **shape, not just width**, which is why the second clause
is there: a landscape phone is wide but short, and treating it as a desktop is
what keeps it in two columns instead of stacking a full-height photo above the
text. A separate rule lifts the photo's `max-height` in that case, scoped
`min-width: 700px` — without that guard it also caught the 667px portrait
case and produced an 808px photo, over two screens tall.
