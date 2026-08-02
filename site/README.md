# STUDIOLAND MGMT — engineer profile pages

The Showit engineer page rebuilt as plain HTML/CSS/JS. No build step, no
framework — open the file in a browser and it works.

Built against **SL_REF_Visual_Brand_Bible_v2**; the section numbers below point
back at it.

```
site/
  yago-mann.html      Yago's page (the one in the mockups)
  _template.html      copy this to start a new engineer
  engineer.css        every style; canonical palette + tokens at the top
  engineer.js         the boil, mobile menu, Spotify embed
  assets/
    logo.svg          PLACEHOLDER — see "Assets still owed" below
    mascot.svg        PLACEHOLDER BUZZ — same
    yago-mann.jpg     low-res crop out of the screenshot — replace
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
6. Change the three `seed` values in the page's `<svg class="svg-defs">` so
   this page's tear differs from its neighbours' (identical wear across
   surfaces is the tell that texture is painted on, not printed in — 2.2).

## Assets still owed (the page runs on stand-ins until these land)

| Drop in as | What it is | Until then |
|---|---|---|
| `assets/fonts/DWFairfield.woff2` | display face (1.2) | falls back to a condensed sans |
| `assets/fonts/DWFairfieldNarrow.woff2` | the Narrow cut | — |
| `assets/fonts/TAYWingman.woff2` | body face (1.2) | falls back to a humanist sans |
| `assets/noise.webp` | Carl's grain overlay, cropped + flattened like the game's (2.2 Tier 1) | the ground renders flat, which breaks "never ship a colored field with no grain" |
| `assets/plate-01.png` | a distress sheet, density-on-white, no alpha (2.2 Tier 2) | `card--weathered` has nothing to multiply |
| `assets/logo.svg` | the real MGMT lockup | **currently a typed stand-in, which the bible forbids** — the wordmark is custom artwork and must never be re-typed in a font (1.3) |
| `assets/mascot.svg` | real BUZZ artwork | a rough placeholder built to the 1.4 model-sheet notes |
| `assets/yago-mann.jpg` | the original photo | a soft crop out of the screenshot |

Filenames are wired up already — dropping the real files in is the whole job.

## What the brand bible dictates here

**Color (1.1).** Every value is canonical, declared once in `:root`, and used
through role variables (`--ground`, `--ink`, `--band-soft`…). Don't write a
raw hex anywhere else. The page ground is **Midway Mustard `#F6CC60`** — the
Showit page's `#f2b930` was drifted mustard, and mustard under the multiply
grain lands close to what you had.

**Type (1.2).** Two faces, DW Fairfield (display, all-caps) and TAY Wingman
(body). The Google-font stand-ins are gone; the stacks behind the real faces
are load-time fallbacks only. DW Fairfield has one weight — nothing on this
page asks for a synthetic bold.

**Texture (2.2).** The code-generated speck pattern is retired. Tier 1 is
Carl's real grain multiplied over the ground. Tier 2 is the
`card--weathered` class: it lands a **whole, fitted** distress sheet on a
panel's ground while the contents stay clean on top — multiply, never normal,
never cropped-and-tiled, never scaled at paint time.

**Box1 (2.3).** Every dark panel is a torn-edge Box1. On mobile they go
full-bleed as bands.

**The boil (2.6).** Live on by default. Three seeded redraws of the same
edge, cycled on an 8fps three-phase clock, driven by one CSS variable
(`--edge`) so the whole page boils together. What deliberately doesn't move,
per the rules: **text** stays crisp on top, and **the photo never warps** —
the torn panel *behind* it boils instead, which is the "boiling silhouette
behind finished artwork" rule. Nothing here has dense repeating marks or a
regular lattice, so nothing strobes. The ink is charcoal on a mustard ground,
so the boiling edge has a field to contrast against.

Hold it still with `data-boil="off"` on the `<html>` tag. It also stops for
`prefers-reduced-motion` and in a background tab.

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
