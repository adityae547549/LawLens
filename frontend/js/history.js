document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('historyPage')) return;

  if (!Utils.isAuthenticated()) {
    window.location.href = '/login';
    return;
  }

  loadHistory();
});

async function loadHistory() {
  const convEl = document.getElementById('historyConversations');
  const searchEl = document.getElementById('historySearches');

  try {
    const data = await Utils.api('/history');

    if (convEl) {
      if (data.conversations && data.conversations.length > 0) {
        convEl.innerHTML = data.conversations.map(c => `
          <div class="card" style="margin-bottom:var(--spacing-sm);padding:var(--spacing-md);cursor:pointer;" onclick="window.location.href='/chat?id=${c.id}'">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:var(--spacing-md);">
              <div style="flex:1;min-width:0;">
                <div style="font-weight:500;margin-bottom:4px;">${Utils.escapeHtml(c.title)}</div>
                <div style="font-size:0.8rem;color:var(--text-tertiary);">
                  ${c.messageCount} messages • ${Utils.formatDate(c.createdAt)}
                </div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();deleteHistoryConv('${c.id}')">Delete</button>
            </div>
          </div>
        `).join('');
      } else {
        convEl.innerHTML = Utils.renderEmptyState('💬', 'No conversations yet', 'Start a chat to see your history here');
      }
    }

    if (searchEl) {
      if (data.searches && data.searches.length > 0) {
        searchEl.innerHTML = data.searches.map(s => `
          <div class="card" style="margin-bottom:var(--spacing-sm);padding:var(--spacing-md);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-weight:500;margin-bottom:2px;">${Utils.escapeHtml(s.query)}</div>
                <div style="font-size:0.8rem;color:var(--text-tertiary);">
                  ${s.mode || 'hybrid'} search • ${s.resultCount || 0} results • ${Utils.formatDate(s.timestamp)}
                </div>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        searchEl.innerHTML = Utils.renderEmptyState('🔍', 'No searches yet', 'Your search history will appear here');
      }
    }
  } catch (err) {
    Utils.showToast('Failed to load history', 'error');
  }
}

async function deleteHistoryConv(id) {
  if (!confirm('Delete this conversation?')) return;
  try {
    await Utils.api(`/chat/conversations/${id}`, { method: 'DELETE' });
    loadHistory();
    Utils.showToast('Conversation deleted', 'success');
  } catch (err) {
    Utils.showToast('Failed to delete', 'error');
  }
}

async function clearAllHistory() {
  if (!confirm('Clear all chat and search history? This cannot be undone.')) return;
  try {
    await Utils.api('/history/clear', { method: 'DELETE' });
    loadHistory();
    Utils.showToast('All history cleared', 'success');
  } catch (err) {
    Utils.showToast('Failed to clear history', 'error');
  }
}

window.deleteHistoryConv = deleteHistoryConv;
window.clearAllHistory = clearAllHistory;
