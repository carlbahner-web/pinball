// Site discovery: query DuckDuckGo's HTML endpoint (no API key required) and
// return candidate producer/engineer sites, filtering out the big platforms
// that aren't personal/studio websites.

const cheerio = require('cheerio');

const SKIP_DOMAINS =
  /(?:^|\.)(?:youtube\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com|linkedin\.com|yelp\.com|reddit\.com|wikipedia\.org|soundbetter\.com|fiverr\.com|upwork\.com|airgigs\.com|thumbtack\.com|bark\.com|yellowpages\.com|indeed\.com|glassdoor\.com|amazon\.com|apple\.com|spotify\.com|soundcloud\.com|bandcamp\.com|duckduckgo\.com)$/i;

function decodeDuckLink(href) {
  try {
    const u = new URL(href, 'https://duckduckgo.com');
    const uddg = u.searchParams.get('uddg');
    return uddg ? decodeURIComponent(uddg) : href;
  } catch {
    return href;
  }
}

async function searchSites(query) {
  const endpoint = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  let res;
  try {
    res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        Accept: 'text/html',
      },
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`Search request failed: HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const results = [];
  const seen = new Set();
  $('.result').each((_, el) => {
    const a = $(el).find('a.result__a').first();
    const rawHref = a.attr('href');
    if (!rawHref) return;
    const url = decodeDuckLink(rawHref);
    let host;
    try {
      host = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return;
    }
    if (SKIP_DOMAINS.test(host) || seen.has(host)) return;
    seen.add(host);
    results.push({
      url,
      host,
      title: a.text().trim(),
      snippet: $(el).find('.result__snippet').text().trim(),
    });
  });
  return results.slice(0, 12);
}

module.exports = { searchSites };
