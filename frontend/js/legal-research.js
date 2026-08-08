let currentMode = 'judgment';
let currentFilter = 'all';
let currentSearchMode = 'strict';

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.research-page')) return;
if (!Utils.isAuthenticated()) { window.location.href = './login.html'; return; }

  initModeCards();
  initFilters();
  initSearch();
  initSearchModeSelector();
});

function initModeCards() {
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentMode = card.dataset.mode;
      updatePlaceholder();
    });
  });
}

function initFilters() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
    });
  });
}

function initSearchModeSelector() {
  document.querySelectorAll('.search-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.search-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSearchMode = btn.dataset.mode;
    });
  });
}

function initSearch() {
  const btn = document.getElementById('researchBtn');
  const input = document.getElementById('researchInput');
  const aiBtn = document.getElementById('aiSummarizeBtn');
  const clearBtn = document.getElementById('clearResearchBtn');

  if (btn) btn.addEventListener('click', doResearch);
  if (aiBtn) aiBtn.addEventListener('click', doAISummary);
  if (clearBtn) clearBtn.addEventListener('click', clearResults);
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doResearch();
      }
    });
  }
}

function updatePlaceholder() {
  const input = document.getElementById('researchInput');
  if (!input) return;
  const placeholders = {
    'judgment': 'Search judgments (e.g., Maneka Gandhi v. Union of India)...',
    'act': 'Search acts (e.g., Indian Penal Code, Companies Act 2013)...',
    'section': 'Search sections (e.g., Section 302 IPC, Section 138 NI Act)...',
    'term': 'Understand legal terms (e.g., What is Habeas Corpus?)...',
    'compare': 'Compare two concepts (e.g., Article 14 vs Article 15)...'
  };
  input.placeholder = placeholders[currentMode] || placeholders.judgment;
}

async function doResearch() {
  const input = document.getElementById('researchInput');
  const query = input?.value.trim();
  if (!query) {
    Utils.showToast('Please enter a search query', 'error');
    return;
  }

  const resultsEl = document.getElementById('researchResults');
  resultsEl.style.display = 'block';
  resultsEl.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="loading-spinner" style="margin:0 auto;"></div><p style="margin-top:1rem;color:var(--text-tertiary);">Researching...</p></div>';

  try {
    const data = await Utils.api('/ai/generate', {
      method: 'POST',
      body: {
        prompt: buildResearchPrompt(query, currentMode, currentFilter),
        mode: 'legal-research',
        useWebSearch: true,
        searchMode: currentSearchMode
      }
    });

    renderResearchResults(data, resultsEl);
  } catch (err) {
    resultsEl.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--error);">Research failed. Make sure the server is running.</div>';
  }
}

async function doAISummary() {
  const input = document.getElementById('researchInput');
  const query = input?.value.trim();
  if (!query) {
    Utils.showToast('Please enter a topic to summarize', 'error');
    return;
  }

  const resultsEl = document.getElementById('researchResults');
  resultsEl.style.display = 'block';
  resultsEl.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="loading-spinner" style="margin:0 auto;"></div><p style="margin-top:1rem;color:var(--text-tertiary);">AI is analyzing...</p></div>';

  try {
    const data = await Utils.api('/ai/generate', {
      method: 'POST',
      body: {
        prompt: `Summarize the following legal topic comprehensively: "${query}". Include: 1) Key legal principles, 2) Relevant statutes/sections, 3) Important case law, 4) Current status/position of law, 5) Practical implications. Cite all sources.`,
        mode: 'legal-research',
        useWebSearch: true,
        searchMode: currentSearchMode
      }
    });

    renderResearchResults(data, resultsEl);
  } catch (err) {
    resultsEl.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--error);">AI summary failed. Make sure the server is running.</div>';
  }
}

function buildResearchPrompt(query, mode, filter) {
  const filterDesc = {
    'all': '',
    'sc': 'Focus on Supreme Court judgments only.',
    'hc': 'Focus on High Court judgments only.',
    'central': 'Focus on Central Acts and Parliament legislation.',
    'constitutional': 'Focus on Constitutional provisions and amendments.'
  };

  const modePrompts = {
    'judgment': `Search for and explain the following judgment/case: "${query}". Include: case name, court, year, bench, key facts, legal issues, judgment, and impact. ${filterDesc[filter]}`,
    'act': `Search for and explain the following act/law: "${query}". Include: full name, year enacted, key provisions, sections, objectives, and current status. ${filterDesc[filter]}`,
    'section': `Search for and explain the following legal section: "${query}". Include: section number, act it belongs to, text, punishment/penalty, ingredients, and relevant case law. ${filterDesc[filter]}`,
    'term': `Explain the following legal term/doctrine: "${query}". Include: definition, origin, elements, application in Indian law, and landmark cases. ${filterDesc[filter]}`,
    'compare': `Compare and contrast the following two legal concepts: "${query}". Include: key similarities, key differences, when each applies, and relevant case law. ${filterDesc[filter]}`
  };

  return modePrompts[mode] || modePrompts.judgment;
}

function renderResearchResults(data, container) {
  let html = '';

  if (data.searchStrategy) {
    html += Utils.renderSearchStrategy(data.searchStrategy);
  }

  if (data.answer) {
    html += `<div class="ai-result">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h3 style="margin:0;">🤖 AI Research Result</h3>
        <div style="display:flex;gap:0.4rem;">
          <button class="btn btn-ghost btn-sm" onclick="Utils.copyToClipboard(this.closest('.ai-result').dataset.content)">📋 Copy</button>
          <button class="btn btn-ghost btn-sm" onclick="Utils.downloadBrandedPDF(this.closest('.ai-result').dataset.content, 'Legal Research')">📄 PDF</button>
          <button class="btn btn-ghost btn-sm" onclick="shareResearchResult(this)">🔗 Share</button>
        </div>
      </div>
      <pre style="font-family:inherit;white-space:pre-wrap;margin:0;">${Utils.escapeHtml(data.answer)}</pre>
    </div>`;
  }

  if (data.citations && data.citations.length > 0) {
    html += Utils.renderCitations(data.citations);
  }

  if (data.confidence) {
    const capped = Math.min(data.confidence, 100);
    const color = capped >= 70 ? 'var(--success)' : capped >= 40 ? 'var(--warning)' : 'var(--error)';
    html += `<div style="margin-top:1rem;display:flex;align-items:center;gap:0.5rem;">
      <div style="height:4px;width:80px;background:var(--bg-tertiary);border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${capped}%;background:${color};border-radius:2px;"></div>
      </div>
      <span style="font-size:0.75rem;color:var(--text-tertiary);">Confidence: ${capped}% — ${data.confidenceLabel || ''}</span>
    </div>`;
  }

  container.innerHTML = html;

  const aiResult = container.querySelector('.ai-result');
  if (aiResult && data.answer) {
    aiResult.dataset.content = data.answer;
  }
}

function clearResults() {
  const input = document.getElementById('researchInput');
  const results = document.getElementById('researchResults');
  if (input) input.value = '';
  if (results) { results.innerHTML = ''; results.style.display = 'none'; }
}

function setQuery(text) {
  const input = document.getElementById('researchInput');
  if (input) {
    input.value = text;
    input.focus();
  }
}

function shareResearchResult(btn) {
  const result = btn.closest('.ai-result');
  if (result && result.dataset.content) {
    Utils.shareContent(result.dataset.content, [], 'Legal Research — LawLens');
  }
}

window.setQuery = setQuery;
window.viewSource = (id) => { if (id) window.location.href = `./article.html?id=${id}`; };
