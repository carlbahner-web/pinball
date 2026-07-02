/* Signal Check frontend */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const history = [];

/* ---------- tabs ---------- */
$$('.tab').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});
function switchTab(name) {
  $$('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + name));
}

/* ---------- helpers ---------- */
function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
function highlight(snippet) {
  const text = esc(snippet.text);
  const match = esc(snippet.match || '');
  if (!match) return text;
  const i = text.toLowerCase().indexOf(match.toLowerCase());
  if (i === -1) return text;
  return text.slice(0, i) + '<mark>' + text.slice(i, i + match.length) + '</mark>' + text.slice(i + match.length);
}
function setStatus(el, msg, isError = false, busy = false) {
  if (!msg) { el.hidden = true; return; }
  el.hidden = false;
  el.classList.toggle('error', isError);
  el.innerHTML = (busy ? '<span class="spinner"></span>' : '') + esc(msg);
}
async function api(path, opts) {
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (HTTP ${res.status})`);
  return data;
}

const VERDICT_META = {
  'Standout':          { cls: 'verdict-standout', icon: '◎', dot: 'd-good' },
  'Solid but safe':    { cls: 'verdict-safe',     icon: '◍', dot: 'd-warn' },
  'Generic':           { cls: 'verdict-generic',  icon: '▢', dot: 'd-warn' },
  'AI-cliché heavy':   { cls: 'verdict-cliche',   icon: '⚠', dot: 'd-crit' },
};

/* ---------- report rendering ---------- */
function renderReport(container, r) {
  const vm = VERDICT_META[r.verdict] || VERDICT_META['Generic'];
  const m = r.metrics;

  const meter = (name, cls, value, note) => `
    <div class="meter m-${cls}">
      <div class="meter-head">
        <span class="meter-name"><span class="dot d-${cls === 'warn' ? 'warn' : cls === 'crit' ? 'crit' : 'good'}"></span>${esc(name)}</span>
        <span class="meter-val">${value}<span style="color:var(--text-muted);font-weight:400"> / 100</span></span>
      </div>
      <div class="track"><div class="fill" style="width:${value}%"></div></div>
      <div class="hint" style="margin-top:4px">${esc(note)}</div>
    </div>`;

  const findingBlock = (f, kind) => `
    <div class="finding f-${kind}">
      <div class="f-head">
        <span class="f-label">${esc(f.label)}</span>
        <span class="f-count">×${f.count}</span>
      </div>
      ${f.snippets.map((s) => `<div class="snippet">${highlight(s)}</div>`).join('')}
      ${f.fix ? `<div class="fix">${esc(f.fix)}</div>` : ''}
    </div>`;

  const column = (title, dotCls, kind, list, emptyMsg) => `
    <div class="finding-col">
      <header><span class="dot ${dotCls}" style="width:9px;height:9px;border-radius:50%;display:inline-block"></span>${esc(title)}<span class="count-pill">${list.length}</span></header>
      ${list.length ? list.map((f) => findingBlock(f, kind)).join('') : `<div class="empty">${esc(emptyMsg)}</div>`}
    </div>`;

  const tellsHtml = r.aiTells.length
    ? `<h2 class="section-title">Structural AI tells</h2>
       <div class="tells">${r.aiTells.map((t) => `
         <div class="tell"><b>${esc(t.label)}</b><span>${esc(t.detail)}</span></div>`).join('')}
       </div>`
    : '';

  const pagesHtml = r.pages && r.pages.length
    ? `<p class="pages-note">Analyzed ${r.pages.length} page${r.pages.length > 1 ? 's' : ''}: ${r.pages.map((p) => `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(new URL(p.url).pathname === '/' ? 'home' : new URL(p.url).pathname)}</a>`).join(' · ')}${r.crawlErrors && r.crawlErrors.length ? ` — ${r.crawlErrors.length} subpage(s) could not be fetched` : ''}</p>`
    : '';

  container.innerHTML = `
    <div class="verdict-banner ${vm.cls}">
      <span class="v-icon">${vm.icon}</span>
      <div>
        <h2>${esc(r.verdict)}${r.siteTitle ? ` — ${esc(r.siteTitle)}` : ''}</h2>
        <p>${esc(r.verdictDetail)}</p>
      </div>
    </div>

    <div class="score-grid">
      <div class="hero-tile">
        <span class="label">Originality score</span>
        <span class="value">${r.scores.originality}<small> / 100</small></span>
        <span class="sub">standout substance minus boilerplate and cliché</span>
      </div>
      <div class="meters">
        ${meter('Standout signals', 'good', r.scores.standout, 'Verifiable specifics: credits, gear, awards, pricing, process')}
        ${meter('Generic boilerplate', 'warn', r.scores.generic, 'Interchangeable industry filler — any studio could claim it')}
        ${meter('AI clichés', 'crit', r.scores.cliche, 'Stock LLM phrasing and structural tells')}
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-tile"><div class="label">Words analyzed</div><div class="value">${m.wordCount.toLocaleString()}</div></div>
      <div class="stat-tile"><div class="label">Cliché density</div><div class="value">${r.totals.clichePer1k}</div><div class="note">weighted hits / 1k words</div></div>
      <div class="stat-tile"><div class="label">Lexical diversity</div><div class="value">${m.lexicalDiversity}</div><div class="note">unique / total words</div></div>
      <div class="stat-tile"><div class="label">Avg sentence</div><div class="value">${m.avgSentenceLen}</div><div class="note">words (σ ${m.sentenceLenStdDev})</div></div>
    </div>

    ${tellsHtml}

    <h2 class="section-title">What was found</h2>
    <div class="findings-grid">
      ${column('Standout', 'd-good', 'standout', r.findings.standout, 'No verifiable specifics found — no named gear, credits, awards, pricing, or process details. This is the biggest opportunity.')}
      ${column('Generic', 'd-warn', 'generic', r.findings.generic, 'No industry boilerplate detected. Clean.')}
      ${column('AI clichés', 'd-crit', 'cliche', r.findings.cliches, 'No stock AI phrasing detected. Clean.')}
    </div>

    ${pagesHtml}
  `;
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- history table ---------- */
function pushHistory(r) {
  if (!r.url) return;
  history.push(r);
  const section = $('#history-section');
  section.hidden = history.length < 2;
  const tbody = $('#history-table tbody');
  tbody.innerHTML = history.map((h) => {
    const vm = VERDICT_META[h.verdict] || VERDICT_META['Generic'];
    return `<tr>
      <td><a href="${esc(h.url)}" target="_blank" rel="noopener" style="color:var(--text-primary)">${esc(h.siteTitle || h.url)}</a></td>
      <td><span class="v-chip"><span class="dot ${vm.dot}"></span>${esc(h.verdict)}</span></td>
      <td class="num">${h.scores.originality}</td>
      <td class="num">${h.scores.standout}</td>
      <td class="num">${h.scores.generic}</td>
      <td class="num">${h.scores.cliche}</td>
      <td class="num">${h.metrics.wordCount.toLocaleString()}</td>
    </tr>`;
  }).join('');
}

/* ---------- analyze tab ---------- */
async function runAnalysis(url) {
  const status = $('#analyze-status');
  const btn = $('#analyze-btn');
  $('#url-input').value = url;
  switchTab('analyze');
  btn.disabled = true;
  $('#report').innerHTML = '';
  setStatus(status, `Crawling ${url} — fetching homepage and key subpages…`, false, true);
  try {
    const r = await api('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    setStatus(status, '');
    renderReport($('#report'), r);
    pushHistory(r);
  } catch (err) {
    setStatus(status, err.message, true);
  } finally {
    btn.disabled = false;
  }
}
$('#analyze-btn').addEventListener('click', () => {
  const url = $('#url-input').value.trim();
  if (url) runAnalysis(url);
});
$('#url-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('#analyze-btn').click();
});

/* ---------- paste tab ---------- */
$('#paste-btn').addEventListener('click', async () => {
  const text = $('#paste-input').value.trim();
  const status = $('#paste-status');
  if (!text) return;
  $('#paste-btn').disabled = true;
  $('#paste-report').innerHTML = '';
  setStatus(status, 'Analyzing copy…', false, true);
  try {
    const r = await api('/api/analyze-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    setStatus(status, '');
    renderReport($('#paste-report'), r);
  } catch (err) {
    setStatus(status, err.message, true);
  } finally {
    $('#paste-btn').disabled = false;
  }
});

/* ---------- find tab ---------- */
$('#find-btn').addEventListener('click', async () => {
  const role = $('#find-role').value;
  const genre = $('#find-genre').value.trim();
  const loc = $('#find-location').value.trim();
  const q = [genre, role, loc, 'website'].filter(Boolean).join(' ');
  const status = $('#find-status');
  const box = $('#find-results');
  $('#find-btn').disabled = true;
  box.innerHTML = '';
  setStatus(status, `Searching for: ${q}`, false, true);
  try {
    const data = await api('/api/search?q=' + encodeURIComponent(q));
    setStatus(status, data.results.length ? '' : 'No candidate sites found — try a broader query.');
    box.innerHTML = data.results.map((r) => `
      <div class="find-card">
        <div class="fc-main">
          <h3>${esc(r.title || r.host)}</h3>
          <span class="fc-host">${esc(r.host)}</span>
          <p>${esc(r.snippet)}</p>
        </div>
        <button class="btn-secondary" data-url="${esc(r.url)}">Analyze →</button>
      </div>`).join('');
    $$('.find-card .btn-secondary', box).forEach((b) =>
      b.addEventListener('click', () => runAnalysis(b.dataset.url))
    );
  } catch (err) {
    setStatus(status, err.message, true);
  } finally {
    $('#find-btn').disabled = false;
  }
});
