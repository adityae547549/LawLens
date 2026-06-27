document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.constitution-page')) return;

  initTabs();
  initArticleSearch();
  initTopicSearch();
  initAmendments();
});

function initTabs() {
  document.querySelectorAll('.search-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.search-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });
}

function initArticleSearch() {
  const btn = document.getElementById('searchArticleBtn');
  const input = document.getElementById('articleInput');
  if (btn && input) {
    btn.addEventListener('click', () => searchArticle(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); searchArticle(input.value); }
    });
  }
}

function initTopicSearch() {
  const btn = document.getElementById('searchTopicBtn');
  const input = document.getElementById('topicInput');
  if (btn && input) {
    btn.addEventListener('click', () => searchTopic(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); searchTopic(input.value); }
    });
  }
}

function initAmendments() {
  loadAmendments();
  const searchInput = document.getElementById('amendmentSearch');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(() => {
      filterAmendments(searchInput.value);
    }, 300));
  }
}

async function searchArticle(num) {
  if (!num || isNaN(num)) {
    Utils.showToast('Please enter a valid article number', 'error');
    return;
  }

  const resultsEl = document.getElementById('searchResults');
  const contentEl = document.getElementById('resultsContent');
  const panels = document.querySelector('.search-tabs');
  const quickLinks = document.querySelector('.quick-links');

  panels.style.display = 'none';
  quickLinks.style.display = 'none';
  resultsEl.style.display = 'block';
  contentEl.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="loading-spinner" style="margin:0 auto;"></div><p style="margin-top:1rem;color:var(--text-tertiary);">Searching Article ' + num + '...</p></div>';

  try {
    const data = await Utils.api('/constitution/search?article=' + num);
    renderArticleResults(data, contentEl);
  } catch (err) {
    contentEl.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--error);">Failed to search. Make sure the server is running.</div>';
  }
}

async function searchTopic(topic) {
  if (!topic || topic.trim().length < 2) {
    Utils.showToast('Please enter a topic (at least 2 characters)', 'error');
    return;
  }

  const resultsEl = document.getElementById('searchResults');
  const contentEl = document.getElementById('resultsContent');
  const panels = document.querySelector('.search-tabs');
  const quickLinks = document.querySelector('.quick-links');

  panels.style.display = 'none';
  quickLinks.style.display = 'none';
  resultsEl.style.display = 'block';
  contentEl.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="loading-spinner" style="margin:0 auto;"></div><p style="margin-top:1rem;color:var(--text-tertiary);">Searching for "' + Utils.escapeHtml(topic) + '"...</p></div>';

  try {
    const data = await Utils.api('/constitution/search?topic=' + encodeURIComponent(topic));
    renderTopicResults(data, contentEl);
  } catch (err) {
    contentEl.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--error);">Failed to search. Make sure the server is running.</div>';
  }
}

async function loadAmendments() {
  const listEl = document.getElementById('amendmentList');
  try {
    const data = await Utils.api('/constitution/amendments');
    window._amendments = data.amendments;
    renderAmendments(data.amendments, listEl);
  } catch (err) {
    listEl.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-tertiary);">Failed to load amendments.</div>';
  }
}

function renderAmendments(amendments, container) {
  if (!amendments || amendments.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-tertiary);">No amendments found.</div>';
    return;
  }
  container.innerHTML = amendments.map(a => `
    <div class="amendment-item" onclick="explainAmendment(${a.num}, '${Utils.escapeHtml(a.name).replace(/'/g, "\\'")}', ${a.year})">
      <div class="amendment-num">${a.num}</div>
      <div class="amendment-info">
        <h4>${Utils.escapeHtml(a.name)}</h4>
        <p>${Utils.escapeHtml(a.description)}</p>
      </div>
      <div class="amendment-year">${a.year}</div>
    </div>
  `).join('');
}

function filterAmendments(query) {
  if (!window._amendments) return;
  const q = query.toLowerCase();
  const filtered = window._amendments.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q) ||
    String(a.num).includes(q) ||
    String(a.year).includes(q)
  );
  renderAmendments(filtered, document.getElementById('amendmentList'));
}

function renderArticleResults(data, container) {
  let html = '<h2 style="margin-bottom:1rem;">Article ' + data.article + '</h2>';

  if (data.amendment) {
    html += `<div style="padding:1rem;background:var(--accent-glow);border:1px solid var(--accent-primary);border-radius:var(--radius-md);margin-bottom:1rem;">
      <strong>${data.amendment.name} (${data.amendment.year})</strong><br>
      <span style="font-size:0.9rem;color:var(--text-secondary);">${data.amendment.description}</span>
    </div>`;
  }

  if (data.results && data.results.length > 0) {
    html += '<div class="results-grid">';
    for (const r of data.results) {
      html += `<div class="result-card">
        <h3>${Utils.escapeHtml(r.fileName || 'Constitution of India')}</h3>
        <p>${Utils.escapeHtml(r.text)}</p>
        <div style="margin-top:0.75rem;display:flex;gap:0.5rem;">
          <button class="btn btn-ghost btn-sm" onclick="askAIArticle(${data.article})">💬 Ask AI to Explain</button>
          <button class="btn btn-ghost btn-sm" onclick="Utils.copyToClipboard('${Utils.escapeHtml(r.text).replace(/'/g, "\\'").replace(/\n/g, "\\n")}')">📋 Copy Text</button>
        </div>
      </div>`;
    }
    html += '</div>';
  } else {
    html += '<div style="text-align:center;padding:2rem;color:var(--text-tertiary);">No results found for this article.</div>';
  }

  html += `<div style="margin-top:1.5rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
    <a href="./chat.html" class="btn btn-primary btn-sm" onclick="localStorage.setItem('lawlense_chat_prefill','Explain Article ${data.article} in detail');">💬 Ask AI About Article ${data.article}</a>
    <a href="./compare.html" class="btn btn-ghost btn-sm">⚖️ Compare with Another Article</a>
    <a href="./quiz.html" class="btn btn-ghost btn-sm">🧠 Quiz on This Article</a>
  </div>`;

  container.innerHTML = html;
}

function renderTopicResults(data, container) {
  let html = '<h2 style="margin-bottom:1rem;">Results for "' + Utils.escapeHtml(data.topic) + '"</h2>';

  if (data.results && data.results.length > 0) {
    html += '<div class="results-grid">';
    for (const r of data.results) {
      html += `<div class="result-card">
        <h3>${Utils.escapeHtml(r.fileName || 'Constitution of India')}</h3>
        <p>${Utils.escapeHtml(r.text)}</p>
        <div style="margin-top:0.5rem;">
          <span style="font-size:0.75rem;color:var(--text-tertiary);">Score: ${(r.score * 100).toFixed(0)}%</span>
        </div>
      </div>`;
    }
    html += '</div>';
  } else {
    html += '<div style="text-align:center;padding:2rem;color:var(--text-tertiary);">No results found for this topic.</div>';
  }

  html += `<div style="margin-top:1.5rem;">
    <a href="./chat.html" class="btn btn-primary btn-sm" onclick="localStorage.setItem('lawlense_chat_prefill','Tell me about ${data.topic.replace(/'/g, "\\'")} in the Indian Constitution');">💬 Ask AI About "${Utils.escapeHtml(data.topic)}"</a>
  </div>`;

  container.innerHTML = html;
}

function hideResults() {
  document.getElementById('searchResults').style.display = 'none';
  document.querySelector('.search-tabs').style.display = '';
  document.querySelector('.quick-links').style.display = '';
}

function quickSearch(articleNum) {
  document.getElementById('articleInput').value = articleNum;
  document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.search-panel').forEach(p => p.classList.remove('active'));
  document.querySelector('[data-tab="article"]').classList.add('active');
  document.getElementById('panel-article').classList.add('active');
  searchArticle(articleNum);
}

function askAIArticle(articleNum) {
  localStorage.setItem('lawlense_chat_prefill', 'Explain Article ' + articleNum + ' of the Indian Constitution in detail');
  window.location.href = './chat.html';
}

function explainAmendment(num, name, year) {
  localStorage.setItem('lawlense_chat_prefill', 'Explain the ' + name + ' (' + year + ') — what did it change in the Constitution?');
  window.location.href = './chat.html';
}

window.quickSearch = quickSearch;
window.askAIArticle = askAIArticle;
window.explainAmendment = explainAmendment;
window.hideResults = hideResults;
