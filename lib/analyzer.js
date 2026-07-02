// Core analysis engine: takes extracted site text (plus optional page signals
// from the crawler) and produces a scored report.

const { CLICHES, GENERIC, STANDOUT } = require('./phrases');

const compiled = (defs) => defs.map((d) => ({ ...d, rx: new RegExp(d.re, 'gi') }));
const CLICHE_RX = compiled(CLICHES);
const GENERIC_RX = compiled(GENERIC);
const STANDOUT_RX = compiled(STANDOUT);

function snippetAround(text, index, matchLen, radius = 70) {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + matchLen + radius);
  let snip = text.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) snip = '…' + snip;
  if (end < text.length) snip = snip + '…';
  return snip;
}

function matchCategory(text, defs, maxSnippets = 2) {
  const findings = [];
  for (const def of defs) {
    def.rx.lastIndex = 0;
    const snippets = [];
    let count = 0;
    let m;
    while ((m = def.rx.exec(text)) !== null) {
      count++;
      if (snippets.length < maxSnippets) {
        snippets.push({
          text: snippetAround(text, m.index, m[0].length),
          match: m[0],
        });
      }
      if (m.index === def.rx.lastIndex) def.rx.lastIndex++; // zero-length guard
      if (count > 200) break;
    }
    if (count > 0) {
      findings.push({
        id: def.id,
        label: def.label,
        count,
        weight: def.weight,
        points: +(def.weight * count).toFixed(1),
        fix: def.fix || null,
        snippets,
      });
    }
  }
  findings.sort((a, b) => b.points - a.points);
  return findings;
}

// Structural writing metrics — the "AI tells" that live in rhythm and
// punctuation rather than word choice.
function structuralMetrics(text) {
  const words = text.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w));
  const wordCount = words.length || 1;
  const per1k = (n) => +((n / wordCount) * 1000).toFixed(2);

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3);
  const lens = sentences.map((s) => s.split(/\s+/).length);
  const avgLen = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const stdDev = lens.length
    ? Math.sqrt(lens.reduce((a, b) => a + (b - avgLen) ** 2, 0) / lens.length)
    : 0;

  const lower = words.map((w) => w.toLowerCase().replace(/[^a-z']/g, '')).filter(Boolean);
  const sample = lower.slice(0, 2000);
  const lexicalDiversity = sample.length ? new Set(sample).size / sample.length : 0;

  const emDashCount = (text.match(/—|–| - /g) || []).length;
  const exclamationCount = (text.match(/!/g) || []).length;
  const emojis = (text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
  const ruleOfThreeCount = (text.match(/\b[\w-]+,\s+[\w-]+,\s+and\s+[\w-]+/gi) || []).length;
  const fromXtoY = (text.match(/\bFrom\s+[\w' -]{2,30}\s+to\s+[\w' -]{2,30}[,.]/g) || []).length;

  const firstPerson = (text.match(/\bI\b|\bI'(?:m|ve|ll|d)\b|\bmy\b/g) || []).length;
  const corporateWe = (text.match(/\bwe\b|\bwe'(?:re|ve|ll|d)\b|\bour\b/gi) || []).length;

  return {
    wordCount,
    sentenceCount: sentences.length,
    avgSentenceLen: +avgLen.toFixed(1),
    sentenceLenStdDev: +stdDev.toFixed(1),
    lexicalDiversity: +lexicalDiversity.toFixed(3),
    emDashCount,
    emDashesPer1k: per1k(emDashCount),
    exclamationCount,
    exclamationsPer1k: per1k(exclamationCount),
    emojiCount: emojis,
    ruleOfThreeCount,
    ruleOfThreePer1k: per1k(ruleOfThreeCount),
    fromXtoYCount: fromXtoY,
    firstPersonCount: firstPerson,
    corporateWeCount: corporateWe,
  };
}

// Convert structural metrics into named "AI tells" with point penalties.
function detectTells(m) {
  const tells = [];
  const add = (id, label, detail, points) => tells.push({ id, label, detail, points });

  // Each tell needs both real density AND a real absolute count, so a single
  // em-dash in a short bio can't trip it.
  if (m.emDashCount >= 4 && m.emDashesPer1k >= 5)
    add('em-dash', 'Heavy em-dash use', `${m.emDashCount} em-dashes (${m.emDashesPer1k} per 1,000 words) — LLM prose leans hard on the em-dash.`, Math.min(12, m.emDashesPer1k * 1.5));
  if (m.ruleOfThreeCount >= 4 && m.ruleOfThreePer1k >= 6)
    add('rule-of-three', 'Rule-of-three overload', `${m.ruleOfThreeCount} "X, Y, and Z" triads (${m.ruleOfThreePer1k} per 1,000 words) — AI copy stacks triads relentlessly.`, Math.min(12, m.ruleOfThreePer1k));
  if (m.fromXtoYCount >= 2)
    add('from-x-to-y', '"From X to Y" scaffolding', `${m.fromXtoYCount} sentences open with "From … to …" — a stock AI range construction.`, Math.min(10, m.fromXtoYCount * 3));
  if (m.sentenceCount >= 12 && m.sentenceLenStdDev > 0 && m.sentenceLenStdDev < 4)
    add('uniform-rhythm', 'Uniform sentence rhythm', `Sentence length barely varies (σ = ${m.sentenceLenStdDev} across ${m.sentenceCount} sentences). Human copy has more bounce.`, 8);
  if (m.exclamationCount >= 5 && m.exclamationsPer1k >= 8)
    add('exclamation', 'Exclamation-point enthusiasm', `${m.exclamationCount} exclamation points (${m.exclamationsPer1k} per 1,000 words).`, 6);
  if (m.emojiCount >= 6)
    add('emoji', 'Emoji-decorated copy', `${m.emojiCount} emojis in body copy — a hallmark of template/AI landing pages.`, 6);
  if (m.wordCount >= 300 && m.lexicalDiversity < 0.38)
    add('low-diversity', 'Low vocabulary variety', `Lexical diversity ${m.lexicalDiversity} — the same words recycled throughout.`, 8);

  return tells.map((t) => ({ ...t, points: +t.points.toFixed(1) }));
}

// Positive signals the crawler observed outside the text itself.
function siteSignalFindings(signals = {}) {
  const out = [];
  if (signals.audioEmbeds > 0)
    out.push({ id: 'audio-embeds', label: 'Playable work on the page', count: signals.audioEmbeds, weight: 4, points: Math.min(12, signals.audioEmbeds * 4), fix: null, snippets: [{ text: `${signals.audioEmbeds} audio/video embed(s) — visitors can hear the work without leaving.`, match: '' }] });
  if (signals.creditLinks && signals.creditLinks.length)
    out.push({ id: 'credit-links', label: 'Links to verifiable credit databases', count: signals.creditLinks.length, weight: 6, points: Math.min(12, signals.creditLinks.length * 6), fix: null, snippets: signals.creditLinks.slice(0, 2).map((u) => ({ text: u, match: '' })) });
  return out;
}

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function analyze(text, signals = {}) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const metrics = structuralMetrics(cleaned);
  const per1k = (pts) => (pts / metrics.wordCount) * 1000;
  // Scoring uses a floored word count so a handful of matches on a short bio
  // page doesn't explode into an extreme density score.
  const effWords = Math.max(metrics.wordCount, 400);
  const scoreDensity = (pts) => (pts / effWords) * 1000;

  const cliches = matchCategory(cleaned, CLICHE_RX);
  const generic = matchCategory(cleaned, GENERIC_RX);
  const standout = [...matchCategory(cleaned, STANDOUT_RX), ...siteSignalFindings(signals)];
  const tells = detectTells(metrics);

  const clichePoints = cliches.reduce((a, f) => a + f.points, 0);
  const genericPoints = generic.reduce((a, f) => a + f.points, 0);
  const standoutPoints = standout.reduce((a, f) => a + f.points, 0);
  const tellPoints = tells.reduce((a, t) => a + t.points, 0);

  // Phrase scores are density-based (per 1,000 words, with a short-text
  // floor) so long sites aren't punished for having more text; structural
  // tells add flat points.
  const clicheScore = clamp(Math.round(scoreDensity(clichePoints) * 2.4 + tellPoints));
  const genericScore = clamp(Math.round(scoreDensity(genericPoints) * 2.2));
  // Standout is absolute, not density-based: capped points per finding plus a
  // bonus for breadth across distinct signal types.
  const standoutScore = clamp(Math.round(
    standout.reduce((a, f) => a + Math.min(f.points, f.weight * 2.5), 0) * 1.4 +
    standout.length * 5
  ));

  const originality = clamp(Math.round(
    46 + standoutScore * 0.62 - clicheScore * 0.42 - genericScore * 0.28
  ));

  let verdict, verdictDetail;
  if (clicheScore >= 55 && scoreDensity(clichePoints) >= 8) {
    verdict = 'AI-cliché heavy';
    verdictDetail = 'This copy reads like it came straight out of a chatbot — dense with stock AI phrasing and short on anything a competitor couldn’t paste onto their own site.';
  } else if (originality >= 68 && standoutScore >= 45) {
    verdict = 'Standout';
    verdictDetail = 'Specific, verifiable, and distinctive — the copy earns trust with concrete credits, gear, and process details instead of adjectives.';
  } else if (originality >= 45) {
    verdict = 'Solid but safe';
    verdictDetail = 'Competent copy with some real substance, but leaning on interchangeable industry phrasing. A pass to replace boilerplate with specifics would lift it.';
  } else {
    verdict = 'Generic';
    verdictDetail = 'Little here distinguishes this site from thousands of others. Swap the boilerplate for named credits, real gear, transparent pricing, and playable work.';
  }

  return {
    scores: {
      originality,
      standout: standoutScore,
      generic: genericScore,
      cliche: clicheScore,
    },
    verdict,
    verdictDetail,
    metrics,
    findings: { standout, generic, cliches },
    aiTells: tells,
    totals: {
      clichePoints: +clichePoints.toFixed(1),
      genericPoints: +genericPoints.toFixed(1),
      standoutPoints: +standoutPoints.toFixed(1),
      clichePer1k: +per1k(clichePoints).toFixed(1),
      genericPer1k: +per1k(genericPoints).toFixed(1),
    },
  };
}

module.exports = { analyze };
