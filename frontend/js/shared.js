/* shared.js — Loads and displays shared content */
(function() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const loading = document.getElementById('sharedLoading');
  const content = document.getElementById('sharedContent');
  const error = document.getElementById('sharedError');

  if (!token) {
    showError();
    return;
  }

  loadShared(token);

  async function loadShared(tok) {
    try {
      const res = await fetch(`${API_BASE}/share/${tok}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      showContent(data);
    } catch {
      showError();
    }
  }

  function showContent(data) {
    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'none';
    if (!content) return;
    content.style.display = 'block';

    const title = data.title || 'Shared Content';
    const sharedContent = data.content || data.text || '';
    const citations = data.citations || [];

    let html = `<div style="padding:var(--spacing-lg);text-align:left;">`;
    html += `<h2 style="font-size:1.2rem;margin-bottom:var(--spacing-md);">${escapeHtml(title)}</h2>`;
    html += `<div style="white-space:pre-wrap;line-height:1.7;font-size:0.95rem;">${formatText(sharedContent)}</div>`;

    if (citations.length > 0) {
      html += `<div style="margin-top:var(--spacing-lg);padding-top:var(--spacing-md);border-top:1px solid var(--border-color);">`;
      html += `<div style="font-size:0.8rem;font-weight:600;color:var(--text-tertiary);margin-bottom:var(--spacing-sm);">Sources</div>`;
      citations.forEach(c => {
        const label = c.trustLabel || c.label || 'Source';
        const name = c.fileName || c.name || label;
        html += `<div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:4px;">${escapeHtml(name)}</div>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
    content.innerHTML = html;
  }

  function showError() {
    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'none';
    if (error) error.style.display = 'block';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function formatText(text) {
    return escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:var(--bg-tertiary);padding:0.1em 0.3em;border-radius:3px;font-size:0.9em;">$1</code>');
  }
})();
