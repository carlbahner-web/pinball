const express = require('express');
const path = require('path');
const { analyze } = require('./lib/analyzer');
const { crawlSite } = require('./lib/extract');
const { searchSites } = require('./lib/search');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Analyze a live site: crawl homepage + key subpages, then score the copy.
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Provide a "url" in the request body.' });
  try {
    const site = await crawlSite(url);
    if (site.text.split(/\s+/).length < 25) {
      return res.status(422).json({
        error:
          'Could not extract meaningful text — the site may render entirely with JavaScript. Try the "Paste copy" tab instead.',
        url: site.url,
      });
    }
    const report = analyze(site.text, site.signals);
    res.json({
      url: site.url,
      siteTitle: site.siteTitle,
      pages: site.pages,
      crawlErrors: site.crawlErrors,
      ...report,
    });
  } catch (err) {
    res.status(502).json({ error: `Could not fetch site: ${err.message}` });
  }
});

// Analyze pasted copy directly (draft copy, JS-rendered sites, etc.).
app.post('/api/analyze-text', (req, res) => {
  const { text } = req.body || {};
  if (!text || String(text).trim().split(/\s+/).length < 20) {
    return res.status(400).json({ error: 'Paste at least ~20 words of copy to analyze.' });
  }
  res.json({ url: null, siteTitle: 'Pasted copy', pages: [], ...analyze(String(text)) });
});

// Discover candidate sites via DuckDuckGo's HTML endpoint.
app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Provide a search query.' });
  try {
    const results = await searchSites(q);
    res.json({ query: q, results });
  } catch (err) {
    res.status(502).json({
      error: `Search unavailable (${err.message}). You can still paste URLs directly into the Analyze tab.`,
      query: q,
    });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Signal Check running at http://localhost:${PORT}`);
});
