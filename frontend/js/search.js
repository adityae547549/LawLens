document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('searchPage')) return;

  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const searchMode = document.getElementById('searchMode');

  if (searchForm) searchForm.addEventListener('submit', handleSearch);

  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(handleAutoSuggest, 400));
    searchInput.focus();
  }

  loadRecentSearches();
});

async function handleSearch(e) {
  e.preventDefault();
  const query = document.getElementById('searchInput').value.trim();
  const mode = (document.getElementById('searchMode') || {}).value || 'legal';
  const resultsEl = document.getElementById('searchResults');
  const countEl = document.getElementById('resultCount');
  const recentEl = document.getElementById('recentSearches');

  if (!query) return;

  const useWebSearch = mode === 'web' || mode === 'hybrid';

  if (recentEl) recentEl.style.display = 'none';
  resultsEl.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="loading-spinner" style="margin:0 auto;"></div></div>';

  try {
    const data = await Utils.api('/search', {
      method: 'POST',
      body: { query, mode, useWebSearch }
    });

    const localResults = data.results.filter(r => r.type === 'local');
    const webResults = data.results.filter(r => r.type === 'web');

    let countText = `${data.total} results found`;
    if (localResults.length > 0 && webResults.length > 0) {
      countText = `${localResults.length} local + ${webResults.length} web results`;
    } else if (webResults.length > 0) {
      countText = `${webResults.length} web results`;
    }
    if (countEl) countEl.textContent = countText;

    if (data.results.length === 0) {
      resultsEl.innerHTML = Utils.renderEmptyState('🔍', 'No results found', 'Try a different search query or mode');
      return;
    }

    let html = '';

    if (localResults.length > 0) {
      html += '<div style="margin-bottom:var(--spacing-lg);"><h3 style="font-size:0.9rem;color:var(--text-tertiary);margin-bottom:var(--spacing-sm);text-transform:uppercase;letter-spacing:0.05em;">📚 Legal Documents</h3></div>';
      html += localResults.map((r, i) => `
        <div class="card" style="margin-bottom:var(--spacing-md);animation:fadeIn 0.3s ease ${i * 0.05}s both;cursor:pointer;" onclick="viewArticle('${r.id}')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--spacing-md);margin-bottom:var(--spacing-sm);">
            <div>
              <span class="badge badge-primary">${Utils.escapeHtml(r.fileName)}</span>
              <span class="badge">${Utils.escapeHtml(r.fileType)}</span>
            </div>
            <span style="font-size:0.8rem;color:var(--text-tertiary);">${(r.score * 100).toFixed(0)}% match</span>
          </div>
          <p style="font-size:0.9rem;color:var(--text-secondary);margin:0;line-height:1.6;">
            ${Utils.escapeHtml(r.text.slice(0, 400))}${r.text.length > 400 ? '...' : ''}
          </p>
        </div>
      `).join('');
    }

    if (webResults.length > 0) {
      html += '<div style="margin:var(--spacing-lg) 0 var(--spacing-sm);"><h3 style="font-size:0.9rem;color:var(--text-tertiary);margin-bottom:var(--spacing-sm);text-transform:uppercase;letter-spacing:0.05em;">🌐 Web Sources</h3></div>';
      html += webResults.map((r, i) => `
        <div class="card" style="margin-bottom:var(--spacing-md);animation:fadeIn 0.3s ease ${(localResults.length + i) * 0.05}s both;cursor:pointer;border-left:3px solid var(--success);" data-open-url="${Utils.escapeHtml(r.url || '')}" role="link" tabindex="0">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--spacing-md);margin-bottom:var(--spacing-sm);">
            <div>
              <span class="badge badge-success">Web</span>
              <span style="font-size:0.85rem;font-weight:500;color:var(--text-primary);margin-left:0.5rem;">${Utils.escapeHtml(r.fileName)}</span>
            </div>
          </div>
          <p style="font-size:0.9rem;color:var(--text-secondary);margin:0;line-height:1.6;">
            ${Utils.escapeHtml(r.text.slice(0, 300))}${r.text.length > 300 ? '...' : ''}
          </p>
          ${r.url ? `<p style="font-size:0.75rem;color:var(--info);margin-top:0.5rem;margin-bottom:0;">🔗 ${Utils.escapeHtml(r.url)}</p>` : ''}
        </div>
      `).join('');
    }

    resultsEl.innerHTML = html;
    loadRecentSearches();
  } catch (err) {
    resultsEl.innerHTML = Utils.renderEmptyState('⚠', 'Search failed', err.message || 'Please try again');
  }
}

async function handleAutoSuggest() {
  const query = document.getElementById('searchInput').value.trim();
  const suggestionsEl = document.getElementById('searchSuggestions');

  if (!query || query.length < 2) {
    if (suggestionsEl) suggestionsEl.innerHTML = '';
    return;
  }

  try {
    const data = await Utils.api(`/search/suggestions?query=${encodeURIComponent(query)}`);
    if (suggestionsEl && data.suggestions) {
      suggestionsEl.innerHTML = data.suggestions.map(s =>
        `<div class="nav-item" onclick="document.getElementById('searchInput').value='${Utils.escapeHtml(s.text.slice(0, 100))}';document.getElementById('searchForm').dispatchEvent(new Event('submit'));" style="cursor:pointer;font-size:0.85rem;">
          <span>${Utils.escapeHtml(s.text.slice(0, 120))}</span>
         </div>`
      ).join('');
    }
  } catch (err) {
    // Silently fail for suggestions
  }
}

async function loadRecentSearches() {
  const recentEl = document.getElementById('recentSearches');
  if (!recentEl) return;

  try {
    const data = await Utils.api('/search/recent');
    if (data.searches && data.searches.length > 0) {
      recentEl.style.display = 'block';
      recentEl.querySelector('.recent-list').innerHTML = data.searches.slice(0, 10).map(s =>
        `<div class="nav-item" onclick="document.getElementById('searchInput').value='${Utils.escapeHtml(s.query)}';document.getElementById('searchForm').dispatchEvent(new Event('submit'));" style="cursor:pointer;">
          <span style="font-size:0.9rem;">🔍</span>
          <span>${Utils.escapeHtml(s.query)}</span>
          <span style="margin-left:auto;font-size:0.75rem;color:var(--text-tertiary);">${Utils.formatDate(s.timestamp)}</span>
         </div>`
      ).join('');
    }
  } catch (err) {
    // Silent fail
  }
}

async function clearSearchHistory() {
  try {
    await Utils.api('/search/clear', { method: 'DELETE' });
    const recentEl = document.getElementById('recentSearches');
    if (recentEl) recentEl.style.display = 'none';
    Utils.showToast('Search history cleared', 'success');
  } catch (err) {
    Utils.showToast('Failed to clear history', 'error');
  }
}

function viewArticle(id) {
  if (id && id.startsWith('http')) {
    window.open(id, '_blank');
  } else if (id) {
    window.location.href = `/article.html?id=${id}`;
  }
}

window.clearSearchHistory = clearSearchHistory;
window.viewArticle = viewArticle;
