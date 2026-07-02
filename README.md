# Signal Check

**Is your studio's website copy signal — or noise?**

Signal Check finds and analyzes the websites of music producers, mixing/mastering
engineers, and recording studios, and grades the copy on what actually matters:

- **Standout signals** (rewarded) — verifiable specifics: named consoles and
  outboard gear, Grammy/RIAA/chart credits, links to Discogs/AllMusic/Muso,
  transparent pricing, concrete process details (revisions, stems, sample rates),
  playable work embedded on the page.
- **Generic boilerplate** (penalized) — interchangeable industry filler any
  studio could claim: "professional quality", "radio-ready", "affordable rates",
  "all genres", "years of experience", "satisfaction guaranteed".
- **AI clichés** (heavily penalized) — stock LLM phrasing: "elevate your sound",
  "take your music to the next level", "sonic journey", "in today's fast-paced
  world", "it's not just X — it's Y", plus structural tells like em-dash density,
  rule-of-three overload, "From X to Y" scaffolding, and uniform sentence rhythm.

Each flagged phrase comes with snippets from the actual page and, for the worst
offenders, a suggested fix direction. Sites get an **originality score** and a
verdict: *Standout*, *Solid but safe*, *Generic*, or *AI-cliché heavy*.

## Running it

```bash
npm install
npm start          # http://localhost:3000
```

Requires Node 18+ (uses the built-in fetch). `npm run dev` restarts on change,
`npm test` runs the analyzer smoke tests.

## Using it

- **Analyze a site** — enter a URL. The crawler fetches the homepage plus up to
  four key subpages (about, services, credits, rates…), extracts the copy, and
  scores it. Analyze several sites in one session and a comparison table builds
  up below the report.
- **Paste copy** — for JavaScript-only sites the crawler can't read, or for
  checking a draft bio/services page *before* it goes live.
- **Find sites** — a discovery search (role + genre + city) via DuckDuckGo's
  HTML endpoint, with marketplaces and social platforms filtered out so you get
  actual personal/studio websites, each with a one-click **Analyze** button.

## How scoring works

Phrase matches are weighted and scored as density per 1,000 words (with a floor
so short bios aren't over-penalized); structural AI tells add flat penalties;
standout findings score on absolute counts with a breadth bonus across distinct
signal types. See `lib/phrases.js` for the full pattern database — it's designed
to be easy to extend — and `lib/analyzer.js` for the scoring.

The scores are heuristic. Signal Check can't hear the mixes — use it to find
weak language and missing proof, not to judge the engineer.

## Project layout

```
server.js           Express app + API routes
lib/phrases.js      Pattern database (clichés / boilerplate / standout signals)
lib/analyzer.js     Scoring engine + structural AI-tell detection
lib/extract.js      Fetch, readable-text extraction, light same-origin crawl
lib/search.js       DuckDuckGo site discovery with platform filtering
public/             Frontend (vanilla HTML/CSS/JS, dark theme)
test/               Analyzer smoke tests
```
