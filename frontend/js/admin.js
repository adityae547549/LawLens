document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('adminPage')) return;
  if (!Utils.isAuthenticated()) { window.location.href = '/login'; return; }
  loadAdminDashboard();
  initAdminTabs();
  initPromptEditor();
  initDatasetUpload();
  loadVectorStats();
  loadConfidenceDashboard();
});

async function loadAdminDashboard() {
  try {
    const data = await Utils.api('/admin/dashboard');
    const stats = [
      { value: data.stats.users, label: 'Users' },
      { value: data.stats.documents, label: 'Chunks' },
      { value: data.stats.conversations, label: 'Conversations' },
      { value: data.stats.bookmarks, label: 'Bookmarks' },
      { value: data.stats.searches, label: 'Searches' }
    ];
    const container = document.getElementById('adminStats');
    if (container) {
      container.innerHTML = stats.map(s => `
        <div class="admin-stat"><div class="admin-stat-value">${s.value}</div><div class="admin-stat-label">${s.label}</div></div>
      `).join('');
    }
  } catch (err) {
    Utils.showToast('Failed to load admin dashboard', 'error');
  }
}

function initAdminTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const content = document.getElementById(tab.dataset.tab);
      if (content) content.classList.add('active');
      if (tab.dataset.tab === 'users') loadUsers();
      if (tab.dataset.tab === 'logs') loadLogs();
      if (tab.dataset.tab === 'metrics') loadMetrics();
      if (tab.dataset.tab === 'datasets') loadDatasets();
      if (tab.dataset.tab === 'vector') loadVectorStats();
      if (tab.dataset.tab === 'confidence') loadConfidenceDashboard();
    });
  });
}

async function loadUsers() {
  const container = document.getElementById('usersList');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="loading-spinner" style="margin:0 auto;"></div></div>';
  try {
    const data = await Utils.api('/admin/users');
    container.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>${data.users.map(u => `
          <tr>
            <td><strong>${Utils.escapeHtml(u.name)}</strong></td>
            <td>${Utils.escapeHtml(u.email)}</td>
            <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : ''}">${u.role}</span></td>
            <td>${Utils.formatDate(u.createdAt)}</td>
            <td>${u.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">Delete</button>` : '<span style="color:var(--text-tertiary);font-size:0.85rem;">Protected</span>'}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('⚠', 'Failed to load users', err.message);
  }
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  try {
    await Utils.api(`/admin/users/${id}`, { method: 'DELETE' });
    loadUsers();
    Utils.showToast('User deleted', 'success');
  } catch (err) {
    Utils.showToast(err.message || 'Failed to delete user', 'error');
  }
}

async function rebuildVectorDB() {
  if (!confirm('Rebuild the vector database from all documents?')) return;
  const btn = document.querySelector('[data-action="rebuild"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading-spinner"></span> Rebuilding...'; }
  try {
    const data = await Utils.api('/admin/rebuild-vector', { method: 'POST' });
    Utils.showToast(`Vector DB rebuilt: ${data.chunks} chunks processed`, 'success');
    loadVectorStats();
    loadAdminDashboard();
  } catch (err) {
    Utils.showToast(err.message || 'Failed to rebuild', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Rebuild Vector DB'; }
  }
}

async function loadVectorStats() {
  const container = document.getElementById('vectorStatsContent');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:1rem;"><div class="loading-spinner" style="margin:0 auto;"></div></div>';
  try {
    const data = await Utils.api('/admin/datasets');
    const vs = data.vectorStats;
    container.innerHTML = `
      <div class="admin-stats" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:1rem;">
        <div class="admin-stat"><div class="admin-stat-value">${vs.totalChunks}</div><div class="admin-stat-label">Total Chunks</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${vs.totalFiles}</div><div class="admin-stat-label">Files Indexed</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${data.datasets.length}</div><div class="admin-stat-label">Files in Data Dir</div></div>
      </div>
      <table class="admin-chunk-table">
        <thead><tr><th>File</th><th>Type</th><th>Chunks</th><th>Status</th></tr></thead>
        <tbody>${vs.files.map(f => `
          <tr>
            <td>${Utils.escapeHtml(f.fileName)}</td>
            <td>${f.fileType}</td>
            <td>${f.chunks}</td>
            <td><span class="admin-dataset-badge indexed">✓ Indexed</span></td>
          </tr>`).join('') || '<tr><td colspan="4">No files indexed</td></tr>'}
        </tbody>
      </table>`;
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('📊', 'Failed to load stats', err.message);
  }
}

async function loadConfidenceDashboard() {
  const container = document.getElementById('confidenceContent');
  if (!container) return;
  try {
    const data = await Utils.api('/admin/metrics');
    const m = data.metrics;
    const confLevel = m.vectorStoreSize > 500 ? 85 : m.vectorStoreSize > 100 ? 65 : 40;
    const confColor = confLevel >= 80 ? 'var(--success)' : confLevel >= 50 ? 'var(--warning)' : 'var(--error)';
    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1rem;">
        <div class="admin-confidence-card">
          <div class="admin-confidence-value" style="color:${confColor};">${confLevel}%</div>
          <div class="admin-confidence-label">Data Confidence Score</div>
          <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:0.5rem;">
            Based on ${m.vectorStoreSize} vector chunks across multiple legal sources
          </div>
        </div>
        <div class="admin-confidence-card">
          <div class="admin-confidence-value" style="color:var(--accent-primary);">${m.activeUsers}</div>
          <div class="admin-confidence-label">Active Users</div>
        </div>
        <div class="admin-confidence-card">
          <div class="admin-confidence-value" style="color:var(--success);">${m.totalConversations}</div>
          <div class="admin-confidence-label">AI Conversations</div>
        </div>
        <div class="admin-confidence-card">
          <div class="admin-confidence-value" style="color:var(--warning);">${m.totalRequests}</div>
          <div class="admin-confidence-label">Total API Requests</div>
        </div>
      </div>
      <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:1rem;">
        <h4 style="margin-bottom:0.75rem;">📋 Source Quality Assessment</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.5rem;">
          <div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-md);">
            <div style="font-size:0.8rem;color:var(--text-tertiary);">🟢 Constitution of India</div>
            <div style="font-weight:600;">Primary Source — High Trust</div>
          </div>
          <div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-md);">
            <div style="font-size:0.8rem;color:var(--text-tertiary);">🟢 IPC, CrPC, Evidence Act</div>
            <div style="font-weight:600;">Statutory Codes — High Trust</div>
          </div>
          <div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-md);">
            <div style="font-size:0.8rem;color:var(--text-tertiary);">🟢 Landmark Cases</div>
            <div style="font-weight:600;">Supreme Court Precedents — High Trust</div>
          </div>
          <div style="padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-md);">
            <div style="font-size:0.8rem;color:var(--text-tertiary);">🟢 Legal Maxims</div>
            <div style="font-weight:600;">Established Legal Principles — Medium Trust</div>
          </div>
        </div>
      </div>`;
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('📊', 'Confidence data unavailable', err.message);
  }
}

async function loadLogs() {
  const container = document.getElementById('logsViewer');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="loading-spinner" style="margin:0 auto;"></div></div>';
  try {
    const data = await Utils.api('/admin/logs');
    container.innerHTML = data.logs.map(log =>
      `<div class="log-viewer">${Utils.escapeHtml(log.content)}</div>`
    ).join('');
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('📋', 'No logs available', err.message);
  }
}

async function loadMetrics() {
  const container = document.getElementById('metricsContent');
  if (!container) return;
  try {
    const data = await Utils.api('/admin/metrics');
    const m = data.metrics;
    container.innerHTML = `
      <div class="admin-stats" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));">
        <div class="admin-stat"><div class="admin-stat-value">${m.totalRequests}</div><div class="admin-stat-label">Total Requests</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${m.activeUsers}</div><div class="admin-stat-label">Active Users</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${m.totalConversations}</div><div class="admin-stat-label">Conversations</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${m.vectorStoreSize}</div><div class="admin-stat-label">Vector Store Chunks</div></div>
      </div>`;
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('📊', 'Metrics unavailable', err.message);
  }
}

function initPromptEditor() {
  const editor = document.getElementById('promptEditor');
  const saveBtn = document.getElementById('savePrompt');
  const resetBtn = document.getElementById('resetPrompt');
  if (editor) loadPrompt();
  if (saveBtn && editor) {
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
      try {
        await Utils.api('/admin/prompt', { method: 'PUT', body: { prompt: editor.value } });
        Utils.showToast('Prompt updated', 'success');
      } catch (err) {
        Utils.showToast(err.message || 'Failed to save prompt', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Prompt';
      }
    });
  }
  if (resetBtn && editor) {
    resetBtn.addEventListener('click', async () => {
      if (!confirm('Reset to default prompt?')) return;
      try {
        const data = await Utils.api('/admin/prompt/reset', { method: 'POST' });
        editor.value = data.prompt;
        Utils.showToast('Prompt reset to default', 'success');
      } catch (err) {
        Utils.showToast(err.message || 'Failed to reset prompt', 'error');
      }
    });
  }
}

async function loadPrompt() {
  const editor = document.getElementById('promptEditor');
  if (!editor) return;
  try {
    const data = await Utils.api('/admin/prompt');
    editor.value = data.prompt;
  } catch (err) {
    editor.value = 'Failed to load prompt.';
  }
}

function initDatasetUpload() {
  const form = document.getElementById('datasetUploadForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('datasetFile');
    const btn = form.querySelector('button[type="submit"]');
    if (!fileInput || !fileInput.files[0]) { Utils.showToast('Please select a file', 'error'); return; }
    const formData = new FormData();
    formData.append('dataset', fileInput.files[0]);
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Uploading...';
    try {
      const data = await Utils.api('/admin/upload-dataset', { method: 'POST', body: formData, formData: true });
      Utils.showToast(`Dataset uploaded: ${data.chunks} chunks processed`, 'success');
      fileInput.value = '';
      loadAdminDashboard();
      loadDatasets();
    } catch (err) {
      Utils.showToast(err.message || 'Upload failed', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Upload Dataset';
    }
  });
}

async function loadDatasets() {
  const container = document.getElementById('datasets');
  if (!container) return;
  const body = container.querySelector('.admin-section-body');
  if (!body) return;
  body.innerHTML = '<div style="text-align:center;padding:1rem;"><div class="loading-spinner" style="margin:0 auto;"></div></div>';
  try {
    const data = await Utils.api('/admin/datasets');
    body.innerHTML = data.datasets.map(d => `
      <div class="admin-dataset-item">
        <div class="admin-dataset-info">
          <div class="admin-dataset-name">${Utils.escapeHtml(d.name)}</div>
          <div class="admin-dataset-meta">${d.sizeFormatted} — ${d.chunks} chunks — ${new Date(d.lastModified).toLocaleDateString()}</div>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <span class="admin-dataset-badge ${d.indexed ? 'indexed' : 'not-indexed'}">${d.indexed ? '✓ Indexed' : '✗ Not Indexed'}</span>
          <div class="admin-dataset-actions">
            <button class="btn btn-sm btn-secondary" onclick="previewDataset('${Utils.escapeHtml(d.name)}')" title="Preview">👁</button>
            <button class="btn btn-sm btn-danger" onclick="deleteDataset('${Utils.escapeHtml(d.name)}')" title="Delete">🗑</button>
          </div>
        </div>
      </div>
    `).join('') || Utils.renderEmptyState('📁', 'No datasets', 'Upload a file to get started');
  } catch (err) {
    body.innerHTML = Utils.renderEmptyState('⚠', 'Failed to load datasets', err.message);
  }
}

async function previewDataset(fileName) {
  try {
    const data = await Utils.api(`/admin/datasets/${encodeURIComponent(fileName)}/preview`);
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    previewWindow.document.write(`
      <html><head><title>Preview: ${Utils.escapeHtml(fileName)}</title>
      <style>body{font-family:monospace;padding:20px;line-height:1.6;background:#1a1a2e;color:#e0e0e0;}pre{white-space:pre-wrap;font-size:13px;}</style>
      </head><body>
      <h2>${Utils.escapeHtml(fileName)}</h2>
      <pre>${Utils.escapeHtml(data.preview)}</pre>
      </body></html>
    `);
    previewWindow.document.close();
  } catch (err) {
    Utils.showToast('Failed to preview dataset', 'error');
  }
}

async function deleteDataset(fileName) {
  if (!confirm(`Delete ${fileName}? This will remove it from the data directory and vector index.`)) return;
  try {
    await Utils.api(`/admin/datasets/${encodeURIComponent(fileName)}`, { method: 'DELETE' });
    Utils.showToast('Dataset deleted', 'success');
    loadDatasets();
    loadVectorStats();
    loadAdminDashboard();
  } catch (err) {
    Utils.showToast(err.message || 'Failed to delete', 'error');
  }
}

window.deleteUser = deleteUser;
window.rebuildVectorDB = rebuildVectorDB;
window.previewDataset = previewDataset;
window.deleteDataset = deleteDataset;
