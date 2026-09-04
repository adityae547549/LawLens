document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('bookmarksPage')) return;

  if (!Utils.isAuthenticated()) {
    window.location.href = './login.html';
    return;
  }

  loadBookmarks();
});

async function loadBookmarks() {
  const container = document.getElementById('bookmarksList');
  if (!container) return;

    container.innerHTML = Utils.renderSkeleton('card', 3);

  try {
    const data = await Utils.api('/bookmarks');

    if (!data.bookmarks || data.bookmarks.length === 0) {
      container.innerHTML = Utils.renderEmptyState('🔖', 'No bookmarks yet', 'Bookmark articles while browsing to save them here');
      return;
    }

    container.innerHTML = data.bookmarks.map((b, i) => `
      <div class="card" style="margin-bottom:var(--spacing-md);animation:fadeIn 0.3s ease ${i * 0.05}s both;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--spacing-md);">
          <div style="flex:1;min-width:0;">
            <h4 style="margin-bottom:var(--spacing-xs);font-size:1rem;">${Utils.escapeHtml(b.title)}</h4>
            <p style="font-size:0.85rem;color:var(--text-tertiary);margin-bottom:var(--spacing-sm);">
              From: ${Utils.escapeHtml(b.fileName)} • Bookmarked ${Utils.formatDate(b.createdAt)}
            </p>
            <p style="font-size:0.9rem;color:var(--text-secondary);margin:0;">
              ${Utils.escapeHtml(b.preview || 'No preview available')}
            </p>
          </div>
          <div style="display:flex;gap:var(--spacing-xs);flex-shrink:0;">
            <button class="btn btn-ghost btn-sm" onclick="viewBookmark('${b.articleId}')">View</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--error);" onclick="removeBookmark('${b.id}')">Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('⚠', 'Failed to load bookmarks', err.message);
  }
}

async function removeBookmark(id) {
  if (!confirm('Remove this bookmark?')) return;
  try {
    await Utils.api(`/bookmarks/${id}`, { method: 'DELETE' });
    loadBookmarks();
    Utils.showToast('Bookmark removed', 'success');
  } catch (err) {
    Utils.showToast('Failed to remove bookmark', 'error');
  }
}

async function addBookmark(articleId, title) {
  try {
    await Utils.api('/bookmarks', {
      method: 'POST',
      body: { articleId, title: title || `Article ${articleId}` }
    });
    Utils.showToast('Bookmark added', 'success');
    return true;
  } catch (err) {
    if (err.message.includes('Already bookmarked')) {
      Utils.showToast('Already bookmarked', 'warning');
    } else {
      Utils.showToast('Failed to bookmark', 'error');
    }
    return false;
  }
}

function viewBookmark(id) {
  if (id) window.location.href = `./article.html?id=${id}`;
}

window.removeBookmark = removeBookmark;
window.addBookmark = addBookmark;
window.viewBookmark = viewBookmark;
