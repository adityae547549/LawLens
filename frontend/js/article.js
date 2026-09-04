document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('articlePage')) return;

  const params = new URLSearchParams(window.location.search);
  const articleId = params.get('id');

  if (articleId) {
    loadArticle(articleId);
    loadRelatedArticles(articleId);
  } else {
    document.getElementById('articleContent').innerHTML = Utils.renderEmptyState('📄', 'No article selected', 'Select an article from search or chat to view it here');
  }
});

async function loadArticle(id) {
  const container = document.getElementById('articleContent');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:3rem;"><div class="loading-spinner" style="margin:0 auto;"></div></div>';

  try {
    const data = await Utils.api(`/articles/${id}`);
    const article = data.article;

    container.innerHTML = `
      <div style="margin-bottom:var(--spacing-lg);">
        <div style="display:flex;align-items:center;gap:var(--spacing-md);margin-bottom:var(--spacing-md);flex-wrap:wrap;">
          <span class="badge badge-primary">${Utils.escapeHtml(article.fileType)}</span>
          <span class="badge">${Utils.escapeHtml(article.fileName)}</span>
          <span class="badge">Chunk ${article.chunkIndex + 1}</span>
        </div>
        <h1 style="font-size:1.5rem;margin-bottom:var(--spacing-md);">${Utils.escapeHtml(article.fileName)}</h1>
        <div id="articleText" style="background:var(--bg-tertiary);border-radius:var(--radius-lg);padding:var(--spacing-lg);line-height:1.8;font-size:0.95rem;">
          ${formatArticleText(article.text)}
        </div>
      </div>
      <div style="display:flex;gap:var(--spacing-sm);flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="explainArticle('${id}')">
          Explain in Simple Language
        </button>
        <button class="btn btn-secondary" onclick="addBookmark('${id}', ${JSON.stringify(article.fileName).replace(/"/g, '&quot;')})">
          Bookmark Article
        </button>
        <button class="btn btn-ghost" onclick="Utils.copyToClipboard(document.getElementById('articleText').textContent)">
          Copy Text
        </button>
      </div>
      <div id="articleExplanation" style="margin-top:var(--spacing-lg);"></div>
    `;
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('⚠', 'Article not found', err.message || 'The article could not be loaded');
  }
}

async function loadRelatedArticles(id) {
  const container = document.getElementById('relatedArticles');
  if (!container) return;

  try {
    const data = await Utils.api(`/articles/${id}/related`);

    if (!data.articles || data.articles.length === 0) {
      container.innerHTML = '<p style="color:var(--text-tertiary);">No related articles found</p>';
      return;
    }

    container.innerHTML = data.articles.map(a => `
      <div class="card" style="margin-bottom:var(--spacing-sm);padding:var(--spacing-md);cursor:pointer;" onclick="window.location.href='/article?id=${a.id}'">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--spacing-sm);">
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.85rem;font-weight:500;margin-bottom:4px;">${Utils.escapeHtml(a.fileName)}</div>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin:0;">${Utils.escapeHtml(a.text.slice(0, 150))}...</p>
          </div>
          <span style="font-size:0.75rem;color:var(--text-tertiary);white-space:nowrap;">${(a.score * 100).toFixed(0)}%</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p style="color:var(--text-tertiary);">Failed to load related articles</p>';
  }
}

async function explainArticle(id) {
  const container = document.getElementById('articleExplanation');
  if (!container) return;

  container.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';

  try {
    const data = await Utils.api(`/articles/${id}/explain`);
    container.innerHTML = `
      <div class="card" style="background:var(--accent-glow);border-color:var(--accent-primary);">
        <h4 style="margin-bottom:var(--spacing-md);">Simple Explanation</h4>
        <div style="line-height:1.7;font-size:0.95rem;">${formatArticleText(data.explanation)}</div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div class="card" style="border-color:var(--error);"><p style="color:var(--error);">Failed to generate explanation</p></div>';
  }
}

function formatArticleText(text) {
  if (!text) return '';
  const escaped = Utils.escapeHtml(text);
  return escaped
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

window.explainArticle = explainArticle;
window.addBookmark = addBookmark;
