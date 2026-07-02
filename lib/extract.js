// Fetch a site, extract readable copy, and lightly crawl the pages that
// matter for judging a producer/engineer's pitch (about, services, credits…).

const cheerio = require('cheerio');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 SignalCheck/1.0';

const MAX_BYTES = 2_500_000;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_PAGES = 5;

const INTERESTING_LINK = /about|bio|story|services|mix|master|record|produc|studio|credits?|discograph|work|clients?|portfolio|rates?|pricing|book/i;
const CREDIT_DOMAINS = /discogs\.com|allmusic\.com|muso\.ai|jaxsta\.com/i;
const AUDIO_EMBED = /soundcloud\.com|spotify\.com|bandcamp\.com|youtube\.com|youtu\.be|vimeo\.com|audiomack\.com|player\./i;

function normalizeUrl(input) {
  let raw = String(input || '').trim();
  if (!raw) throw new Error('No URL provided');
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  const url = new URL(raw);
  if (!/^https?:$/.test(url.protocol)) throw new Error('Only http(s) URLs are supported');
  return url;
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const type = res.headers.get('content-type') || '';
    if (!type.includes('html') && !type.includes('text')) {
      throw new Error(`Not an HTML page (content-type: ${type})`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.slice(0, MAX_BYTES).toString('utf8');
  } finally {
    clearTimeout(timer);
  }
}

function extractPage(html, pageUrl) {
  const $ = cheerio.load(html);
  // Keep iframes in the DOM — they carry no body text but collectSignals
  // reads their src to detect audio/video embeds.
  $('script, style, noscript, svg, template').remove();

  const title = ($('title').first().text() || '').trim();
  const metaDesc = ($('meta[name="description"]').attr('content') || '').trim();

  // Prefer semantic content containers; fall back to body.
  const root = $('main').length ? $('main') : $('body');
  const parts = [];
  root.find('h1, h2, h3, h4, p, li, blockquote, figcaption, dt, dd').each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    if (t.length >= 3) parts.push(t);
  });
  // Sites built entirely from divs (common with site builders) yield nothing
  // above — fall back to the whole body text.
  let text = parts.join('\n');
  if (text.split(/\s+/).length < 40) {
    text = root.text().replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
  }

  return { $, title, metaDesc, text };
}

function collectSignals($, baseUrl, signals) {
  $('iframe, [data-src], audio, video, a[href]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('href') || '';
    if (AUDIO_EMBED.test(src)) signals.audioEmbeds++;
  });
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (CREDIT_DOMAINS.test(href) && !signals.creditLinks.includes(href)) {
      signals.creditLinks.push(href);
    }
  });
}

function sameOriginLinks($, baseUrl) {
  const found = new Map();
  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    const label = $(el).text().replace(/\s+/g, ' ').trim();
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) return;
    let abs;
    try {
      abs = new URL(href, baseUrl);
    } catch {
      return;
    }
    if (abs.origin !== baseUrl.origin) return;
    abs.hash = '';
    const key = abs.href.replace(/\/$/, '');
    if (key === baseUrl.href.replace(/\/$/, '')) return;
    if (INTERESTING_LINK.test(abs.pathname) || INTERESTING_LINK.test(label)) {
      if (!found.has(key)) found.set(key, abs.href);
    }
  });
  return [...found.values()];
}

async function crawlSite(inputUrl) {
  const base = normalizeUrl(inputUrl);
  const signals = { audioEmbeds: 0, creditLinks: [] };
  const pages = [];
  const errors = [];

  const homeHtml = await fetchHtml(base.href); // hard failure if homepage is unreachable
  const home = extractPage(homeHtml, base);
  collectSignals(home.$, base, signals);
  pages.push({ url: base.href, title: home.title, words: home.text.split(/\s+/).length });
  let combined = [home.metaDesc, home.text].filter(Boolean).join('\n');

  const links = sameOriginLinks(home.$, base).slice(0, MAX_PAGES - 1);
  const results = await Promise.allSettled(
    links.map(async (href) => {
      const html = await fetchHtml(href);
      return { href, page: extractPage(html, new URL(href)) };
    })
  );
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const { href, page } = r.value;
      collectSignals(page.$, base, signals);
      pages.push({ url: href, title: page.title, words: page.text.split(/\s+/).length });
      combined += '\n' + page.text;
    } else {
      errors.push(String(r.reason && r.reason.message || r.reason));
    }
  }

  return {
    url: base.href,
    siteTitle: home.title,
    metaDescription: home.metaDesc,
    text: combined,
    pages,
    signals,
    crawlErrors: errors,
  };
}

module.exports = { crawlSite, normalizeUrl };
