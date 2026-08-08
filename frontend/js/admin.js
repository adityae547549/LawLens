document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('adminPage')) return;
  if (!Utils.isAuthenticated()) { window.location.href = './login.html'; return; }

  const user = Utils.getUser();
  if (!user || user.role !== 'admin') {
    Utils.showToast('Admin access required', 'error');
    window.location.href = './dashboard.html';
    return;
  }

  loadAdminDashboard();
  initAdminTabs();
  initPromptEditor();
  initDatasetUpload();
  initKnowledgeManager();
  initAIConfig();
  initBenchmarks();
  initImports();
  initSources();
  initJobs();
});

/* ═══ Tab Navigation ═══ */
function initAdminTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => { c.classList.remove('active'); c.style.display = 'none'; });
      tab.classList.add('active');
      const content = document.getElementById(tab.dataset.tab);
      if (content) { content.classList.add('active'); content.style.display = 'block'; }
      loadTabData(tab.dataset.tab);
    });
  });
}

function loadTabData(tab) {
  const loaders = {
    'overview': loadOverview,
    'users': loadUsers,
    'datasets': loadDatasets,
    'vector': loadVectorStats,
    'knowledge': loadKnowledge,
    'prompt': loadPrompt,
    'ai-config': loadAIConfig,
    'analytics': loadAnalytics,
    'benchmarks': loadBenchmarks,
    'imports': loadImports,
    'sources': loadSources,
    'jobs': loadJobs,
    'audit': loadAuditLogs,
    'graph': loadGraph,
    'settings': loadSystemSettings,
    'logs': loadLogs
  };
  if (loaders[tab]) loaders[tab]();
}

/* ═══ Dashboard Stats ═══ */
async function loadAdminDashboard() {
  try {
    const data = await Utils.api('/admin/dashboard');
    const stats = [
      { value: data.stats.users, label: 'Users', icon: 'users' },
      { value: data.stats.documents, label: 'Chunks', icon: 'database' },
      { value: data.stats.conversations, label: 'Conversations', icon: 'message-square' },
      { value: data.stats.bookmarks, label: 'Bookmarks', icon: 'bookmark' },
      { value: data.stats.searches, label: 'Searches', icon: 'search' }
    ];
    const container = document.getElementById('adminStats');
    if (container) {
      container.innerHTML = stats.map(s => `
        <div class="admin-stat">
          <div class="admin-stat-value">${s.value}</div>
          <div class="admin-stat-label">${s.label}</div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Admin dashboard error:', err);
  }
}

/* ═══ Overview ═══ */
async function loadOverview() {
  const container = document.getElementById('overviewContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';

  try {
    const [dashData, metricsData] = await Promise.all([
      Utils.api('/admin/dashboard').catch(() => null),
      Utils.api('/admin/metrics').catch(() => null),
    ]);

    const stats = dashData?.stats || {};
    const metrics = metricsData?.metrics || {};

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem;">
        <div class="admin-stat"><div class="admin-stat-value">${stats.users || 0}</div><div class="admin-stat-label">Total Users</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${stats.conversations || 0}</div><div class="admin-stat-label">Conversations</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${stats.documents || 0}</div><div class="admin-stat-label">Vector Chunks</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${stats.bookmarks || 0}</div><div class="admin-stat-label">Bookmarks</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${stats.searches || 0}</div><div class="admin-stat-label">Searches</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${metrics.activeUsers || 0}</div><div class="admin-stat-label">Active Users</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${metrics.totalRequests || 0}</div><div class="admin-stat-label">API Requests</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${metrics.vectorStoreSize || 0}</div><div class="admin-stat-label">Vector Store Size</div></div>
      </div>
      <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:1rem;">
        <h4 style="margin-bottom:0.5rem;">Quick Actions</h4>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="rebuildVectorDB()">Rebuild Vector DB</button>
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('[data-tab=\\'knowledge\\']').click()">Manage Knowledge</button>
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('[data-tab=\\'audit\\']').click()">View Audit Log</button>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('⚠', 'Failed to load overview', err.message);
  }
}

/* ═══ Users ═══ */
async function loadUsers() {
  const container = document.getElementById('usersList');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';
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
    loadAdminDashboard();
    Utils.showToast('User deleted', 'success');
  } catch (err) {
    Utils.showToast(err.message || 'Failed to delete user', 'error');
  }
}

/* ═══ Datasets ═══ */
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
      btn.textContent = 'Upload';
    }
  });
}

async function loadDatasets() {
  const container = document.getElementById('datasetsList');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';
  try {
    const data = await Utils.api('/admin/datasets');
    container.innerHTML = data.datasets.map(d => `
      <div class="admin-dataset-item">
        <div class="admin-dataset-info">
          <div class="admin-dataset-name">${Utils.escapeHtml(d.name)}</div>
          <div class="admin-dataset-meta">${d.sizeFormatted} — ${d.chunks} chunks — ${new Date(d.lastModified).toLocaleDateString()}</div>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <span class="admin-dataset-badge ${d.indexed ? 'indexed' : 'not-indexed'}">${d.indexed ? '✓ Indexed' : '✗ Not Indexed'}</span>
          <button class="btn btn-sm btn-secondary" onclick="previewDataset('${Utils.escapeHtml(d.name)}')" title="Preview">Preview</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDataset('${Utils.escapeHtml(d.name)}')" title="Delete">Delete</button>
        </div>
      </div>
    `).join('') || Utils.renderEmptyState('📁', 'No datasets', 'Upload a file to get started');
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('⚠', 'Failed to load datasets', err.message);
  }
}

async function previewDataset(fileName) {
  try {
    const data = await Utils.api(`/admin/datasets/${encodeURIComponent(fileName)}/preview`);
    const w = window.open('', '_blank', 'width=800,height=600');
    w.document.write(`<html><head><title>Preview: ${Utils.escapeHtml(fileName)}</title>
      <style>body{font-family:monospace;padding:20px;line-height:1.6;background:#1a1a2e;color:#e0e0e0;}pre{white-space:pre-wrap;font-size:13px;}</style>
      </head><body><h2>${Utils.escapeHtml(fileName)}</h2><pre>${Utils.escapeHtml(data.preview)}</pre></body></html>`);
    w.document.close();
  } catch (err) {
    Utils.showToast('Failed to preview dataset', 'error');
  }
}

async function deleteDataset(fileName) {
  if (!confirm(`Delete ${fileName}?`)) return;
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

/* ═══ Vector DB ═══ */
async function rebuildVectorDB() {
  if (!confirm('Rebuild the vector database from all documents?')) return;
  try {
    const data = await Utils.api('/admin/rebuild-vector', { method: 'POST' });
    Utils.showToast(`Vector DB rebuilt: ${data.chunks} chunks processed`, 'success');
    loadVectorStats();
    loadAdminDashboard();
  } catch (err) {
    Utils.showToast(err.message || 'Failed to rebuild', 'error');
  }
}

async function loadVectorStats() {
  const container = document.getElementById('vectorStatsContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';
  try {
    const data = await Utils.api('/admin/datasets');
    const vs = data.vectorStats;
    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-bottom:1rem;">
        <div class="admin-stat"><div class="admin-stat-value">${vs.totalChunks}</div><div class="admin-stat-label">Total Chunks</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${vs.totalFiles}</div><div class="admin-stat-label">Files Indexed</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${data.datasets.length}</div><div class="admin-stat-label">Data Files</div></div>
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

/* ═══ Knowledge Management ═══ */
function initKnowledgeManager() {
  const addBtn = document.getElementById('addKnowledgeBtn');
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const name = prompt('Enter knowledge item name:');
      if (!name) return;
      const type = prompt('Enter type (act/section/case/definition):', 'act') || 'act';
      try {
        await Utils.api('/studio/knowledge/items', { method: 'POST', body: { name, documentType: type } });
        Utils.showToast('Knowledge item created', 'success');
        loadKnowledge();
      } catch (err) {
        Utils.showToast(err.message || 'Failed to create item', 'error');
      }
    });
  }
}

async function loadKnowledge() {
  const listContainer = document.getElementById('knowledgeList');
  const statsContainer = document.getElementById('knowledgeStats');
  if (listContainer) listContainer.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';

  try {
    const [itemsData, statsData] = await Promise.all([
      Utils.api('/studio/knowledge/items').catch(() => ({ data: { sources: [] } })),
      Utils.api('/knowledge/status').catch(() => ({ data: {} }))
    ]);

    // Backend returns {success, data: {sources: [...]}}
    const items = itemsData.data?.sources || itemsData.sources || itemsData.items || [];
    if (listContainer) {
      listContainer.innerHTML = items.length > 0 ? `
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Type</th><th>Authority</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>${items.map(item => `
            <tr>
              <td><strong>${Utils.escapeHtml(item.name)}</strong></td>
              <td><span class="badge">${item.documentType || item.type || 'unknown'}</span></td>
              <td>${Utils.escapeHtml(item.authority || '—')}</td>
              <td>${Utils.formatDate(item.createdAt)}</td>
              <td><button class="btn btn-danger btn-sm" onclick="deleteKnowledgeItem('${item.id}')">Delete</button></td>
            </tr>`).join('')}
          </tbody>
        </table>` : Utils.renderEmptyState('📚', 'No knowledge items', 'Add items to build the knowledge base');
    }

    if (statsContainer) {
      const stats = statsData.data || statsData;
      statsContainer.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;">
          <div class="admin-stat"><div class="admin-stat-value">${stats.totalNodes || stats.nodes || 0}</div><div class="admin-stat-label">Total Nodes</div></div>
          <div class="admin-stat"><div class="admin-stat-value">${stats.totalEdges || stats.edges || 0}</div><div class="admin-stat-label">Total Edges</div></div>
          <div class="admin-stat"><div class="admin-stat-value">${stats.totalSynonyms || stats.synonyms || 0}</div><div class="admin-stat-label">Synonyms</div></div>
        </div>`;
    }
  } catch (err) {
    if (listContainer) listContainer.innerHTML = Utils.renderEmptyState('⚠', 'Failed to load knowledge', err.message);
  }
}

async function deleteKnowledgeItem(id) {
  if (!confirm('Delete this knowledge item?')) return;
  try {
    await Utils.api(`/studio/knowledge/items/${id}`, { method: 'DELETE' });
    Utils.showToast('Item deleted', 'success');
    loadKnowledge();
  } catch (err) {
    Utils.showToast(err.message || 'Failed to delete', 'error');
  }
}

/* ═══ Prompt Editor ═══ */
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

/* ═══ AI Configuration ═══ */
async function loadAIConfig() {
  const container = document.getElementById('aiConfigContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';
  try {
    const data = await Utils.api('/studio/ai/config');
    const config = data.data || data;
    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem;margin-bottom:1.5rem;">
        <div class="admin-confidence-card">
          <div class="admin-confidence-label">Provider</div>
          <div class="admin-confidence-value" style="font-size:1.5rem;">${config.provider || 'Groq'}</div>
        </div>
        <div class="admin-confidence-card">
          <div class="admin-confidence-label">Model</div>
          <div class="admin-confidence-value" style="font-size:1.5rem;">${config.model || 'Default'}</div>
        </div>
        <div class="admin-confidence-card">
          <div class="admin-confidence-label">Temperature</div>
          <div class="admin-confidence-value" style="font-size:1.5rem;">${config.temperature || 0.7}</div>
        </div>
        <div class="admin-confidence-card">
          <div class="admin-confidence-label">Max Tokens</div>
          <div class="admin-confidence-value" style="font-size:1.5rem;">${config.maxTokens || 4096}</div>
        </div>
      </div>

      <div class="admin-section" style="margin-top:1.5rem;">
        <div class="admin-section-header"><h3>Edit AI Configuration</h3></div>
        <div class="admin-section-body">
          <form id="aiConfigForm">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">Provider</label>
                <select id="aiProvider" class="form-input">
                  <option value="groq" ${config.provider === 'groq' ? 'selected' : ''}>Groq</option>
                  <option value="openai" ${config.provider === 'openai' ? 'selected' : ''}>OpenAI</option>
                  <option value="anthropic" ${config.provider === 'anthropic' ? 'selected' : ''}>Anthropic</option>
                  <option value="google" ${config.provider === 'google' ? 'selected' : ''}>Google</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Model</label>
                <input type="text" id="aiModel" class="form-input" value="${Utils.escapeHtml(config.model || '')}">
              </div>
              <div class="form-group">
                <label class="form-label">Temperature (0.0 - 2.0)</label>
                <input type="number" id="aiTemperature" class="form-input" value="${config.temperature || 0.3}" min="0" max="2" step="0.1">
              </div>
              <div class="form-group">
                <label class="form-label">Max Tokens</label>
                <input type="number" id="aiMaxTokens" class="form-input" value="${config.maxTokens || 4096}" min="256" max="128000">
              </div>
              <div class="form-group">
                <label class="form-label">Top K</label>
                <input type="number" id="aiTopK" class="form-input" value="${config.topK || 5}" min="1" max="50">
              </div>
              <div class="form-group">
                <label class="form-label" style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;margin-top:1.5rem;">
                  <input type="checkbox" id="aiReranking" ${config.reranking !== false ? 'checked' : ''}>
                  <span>Enable Reranking</span>
                </label>
                <label class="form-label" style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
                  <input type="checkbox" id="aiStreaming" ${config.streaming !== false ? 'checked' : ''}>
                  <span>Enable Streaming</span>
                </label>
              </div>
            </div>
            <div style="margin-top:var(--spacing-md);">
              <button type="submit" class="btn btn-primary" id="saveAIConfigBtn">Save Configuration</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Attach save handler
    document.getElementById('aiConfigForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('saveAIConfigBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="loading-spinner"></span> Saving...';
      try {
        const updatedConfig = {
          provider: document.getElementById('aiProvider').value,
          model: document.getElementById('aiModel').value.trim(),
          temperature: parseFloat(document.getElementById('aiTemperature').value) || 0.3,
          maxTokens: parseInt(document.getElementById('aiMaxTokens').value) || 4096,
          topK: parseInt(document.getElementById('aiTopK').value) || 5,
          reranking: document.getElementById('aiReranking').checked,
          streaming: document.getElementById('aiStreaming').checked
        };
        await Utils.api('/studio/ai/config', { method: 'PUT', body: updatedConfig });
        Utils.showToast('AI configuration saved', 'success');
        loadAIConfig(); // Reload to show updated values
      } catch (err) {
        Utils.showToast(err.message || 'Failed to save config', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Configuration';
      }
    });
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('🤖', 'AI configuration unavailable', err.message);
  }
}

/* ═══ Analytics ═══ */
async function loadAnalytics() {
  const container = document.getElementById('analyticsContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';
  try {
    const data = await Utils.api('/analytics');
    const a = data.analytics || data;

    // Build top queries table
    const topQueries = a.topQueries || [];
    const dailyActivity = a.dailyActivity || {};

    // Build daily activity chart as a simple bar visualization
    let dailyHtml = '';
    const days = Object.entries(dailyActivity);
    if (days.length > 0) {
      const maxVal = Math.max(1, ...days.map(([, v]) => v.chats + v.searches));
      dailyHtml = `
        <h4 style="margin:1.5rem 0 0.75rem;">Daily Activity (Last 7 Days)</h4>
        <div style="display:flex;gap:4px;align-items:flex-end;height:120px;padding:0.5rem 0;">
          ${days.map(([date, v]) => {
            const total = v.chats + v.searches;
            const pct = Math.round((total / maxVal) * 100);
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
              <div style="font-size:0.65rem;color:var(--text-tertiary);">${total}</div>
              <div style="width:100%;height:${Math.max(4, pct)}%;background:var(--gradient-primary);border-radius:4px 4px 0 0;min-height:4px;" title="Chats: ${v.chats}, Searches: ${v.searches}"></div>
              <div style="font-size:0.6rem;color:var(--text-tertiary);writing-mode:vertical-lr;transform:rotate(180deg);max-height:50px;overflow:hidden;">${date.slice(5)}</div>
            </div>`;
          }).join('')}
        </div>`;
    }

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem;">
        <div class="admin-stat"><div class="admin-stat-value">${a.totalChats || 0}</div><div class="admin-stat-label">Total Chats</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${a.totalSearches || 0}</div><div class="admin-stat-label">Searches</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${a.totalDocuments || 0}</div><div class="admin-stat-label">Documents</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${a.avgConfidence || 0}%</div><div class="admin-stat-label">Avg Confidence</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${a.failedSearches || 0}</div><div class="admin-stat-label">Failed Searches</div></div>
      </div>

      ${dailyHtml}

      ${topQueries.length > 0 ? `
        <h4 style="margin:1.5rem 0 0.75rem;">Top Queries</h4>
        <table class="admin-table">
          <thead><tr><th>Query</th><th>Count</th></tr></thead>
          <tbody>${topQueries.map(q => `
            <tr>
              <td>${Utils.escapeHtml(q.query)}</td>
              <td><span class="badge badge-primary">${q.count}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>` : ''}
    `;
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('📊', 'Analytics unavailable', err.message);
  }
}

/* ═══ Benchmarks ═══ */
function initBenchmarks() {
  const runBtn = document.getElementById('runBenchmarkBtn');
  if (runBtn) {
    runBtn.addEventListener('click', async () => {
      runBtn.disabled = true;
      runBtn.innerHTML = '<span class="loading-spinner"></span> Running...';
      try {
        await Utils.api('/knowledge/benchmark/run', { method: 'POST' });
        Utils.showToast('Benchmark completed', 'success');
        loadBenchmarks();
      } catch (err) {
        Utils.showToast(err.message || 'Benchmark failed', 'error');
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = 'Run Benchmark';
      }
    });
  }
}

async function loadBenchmarks() {
  const container = document.getElementById('benchmarkContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';
  try {
    const data = await Utils.api('/knowledge/benchmark');
    const bd = data.data || data;
    const latest = bd.latest;
    const history = bd.history || [];

    let html = '';
    if (latest) {
      html += `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem;">
          <div class="admin-confidence-card">
            <div class="admin-confidence-value" style="color:var(--success);">${latest.score || latest.accuracy || 'N/A'}%</div>
            <div class="admin-confidence-label">Latest Score</div>
          </div>
          <div class="admin-confidence-card">
            <div class="admin-confidence-value">${latest.totalTests || latest.tests || 0}</div>
            <div class="admin-confidence-label">Total Tests</div>
          </div>
          <div class="admin-confidence-card">
            <div class="admin-confidence-value">${latest.passed || 0}</div>
            <div class="admin-confidence-label">Passed</div>
          </div>
          <div class="admin-confidence-card">
            <div class="admin-confidence-value">${latest.failed || 0}</div>
            <div class="admin-confidence-label">Failed</div>
          </div>
        </div>`;
    }

    if (history.length > 0) {
      html += `<h4 style="margin-bottom:0.75rem;">Benchmark History</h4>
        <table class="admin-table">
          <thead><tr><th>Date</th><th>Score</th><th>Tests</th><th>Passed</th><th>Failed</th></tr></thead>
          <tbody>${history.map(h => `
            <tr>
              <td>${Utils.formatDate(h.date || h.timestamp)}</td>
              <td>${h.score || h.accuracy || 'N/A'}%</td>
              <td>${h.totalTests || h.tests || 0}</td>
              <td style="color:var(--success);">${h.passed || 0}</td>
              <td style="color:var(--error);">${h.failed || 0}</td>
            </tr>`).join('')}
          </tbody>
        </table>`;
    }

    container.innerHTML = html || Utils.renderEmptyState('🏆', 'No benchmarks yet', 'Run a benchmark to see results');
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('⚠', 'Benchmarks unavailable', err.message);
  }
}

/* ═══ Import Center ═══ */
function initImports() {
  const addBtn = document.getElementById('addActBtn');
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const name = prompt('Enter act name:');
      if (!name) return;
      try {
        await Utils.api('/studio/lkos/acts', { method: 'POST', body: { name, status: 'draft' } });
        Utils.showToast('Act created', 'success');
        loadImports();
      } catch (err) {
        Utils.showToast(err.message || 'Failed to create act', 'error');
      }
    });
  }
}

async function loadImports() {
  const container = document.getElementById('importsContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';
  try {
    const data = await Utils.api('/studio/lkos/acts');
    // Studio returns {success, data: [...acts]} where data is directly the array
    const acts = Array.isArray(data.data) ? data.data : (data.acts || data.data?.acts || []);
    container.innerHTML = acts.length > 0 ? `
      <table class="admin-table">
        <thead><tr><th>Act Name</th><th>Status</th><th>Sections</th><th>Actions</th></tr></thead>
        <tbody>${acts.map(act => `
          <tr>
            <td><strong>${Utils.escapeHtml(act.name)}</strong></td>
            <td><span class="badge ${act.status === 'published' ? 'badge-success' : act.status === 'archived' ? 'badge-warning' : ''}">${act.status || 'draft'}</span></td>
            <td>${(act.sections || []).length}</td>
            <td>
              ${act.status !== 'published' ? `<button class="btn btn-sm btn-success" onclick="publishAct('${act.id}')">Publish</button>` : ''}
              <button class="btn btn-sm btn-danger" onclick="deleteAct('${act.id}')">Delete</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>` : Utils.renderEmptyState('📜', 'No acts imported', 'Add acts to the knowledge base');
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('⚠', 'Failed to load imports', err.message);
  }
}

async function publishAct(id) {
  try {
    await Utils.api(`/studio/lkos/acts/${id}/publish`, { method: 'POST' });
    Utils.showToast('Act published', 'success');
    loadImports();
  } catch (err) {
    Utils.showToast(err.message || 'Failed to publish', 'error');
  }
}

async function deleteAct(id) {
  if (!confirm('Delete this act?')) return;
  try {
    await Utils.api(`/studio/lkos/acts/${id}`, { method: 'DELETE' });
    Utils.showToast('Act deleted', 'success');
    loadImports();
  } catch (err) {
    Utils.showToast(err.message || 'Failed to delete', 'error');
  }
}

/* ═══ Source Registry ═══ */
function initSources() {
  const checkAllBtn = document.getElementById('checkAllSourcesBtn');
  const addBtn = document.getElementById('addSourceBtn');

  if (checkAllBtn) {
    checkAllBtn.addEventListener('click', async () => {
      checkAllBtn.disabled = true;
      checkAllBtn.innerHTML = '<span class="loading-spinner"></span> Checking...';
      try {
        await Utils.api('/studio/sources/tracker/check-all', { method: 'POST' });
        Utils.showToast('All sources checked', 'success');
        loadSources();
      } catch (err) {
        Utils.showToast(err.message || 'Check failed', 'error');
      } finally {
        checkAllBtn.disabled = false;
        checkAllBtn.textContent = 'Check All';
      }
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const name = prompt('Source name:');
      if (!name) return;
      const url = prompt('Source URL (optional):', 'https://');
      try {
        await Utils.api('/studio/sources/tracker', { method: 'POST', body: { name, url } });
        Utils.showToast('Source added', 'success');
        loadSources();
      } catch (err) {
        Utils.showToast(err.message || 'Failed to add source', 'error');
      }
    });
  }
}

async function loadSources() {
  const container = document.getElementById('sourcesContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';
  try {
    const [trackerData, registryData] = await Promise.all([
      Utils.api('/studio/sources/tracker').catch(() => ({ data: [] })),
      Utils.api('/knowledge/sources').catch(() => ({ data: { sources: [], stats: {} } }))
    ]);

    // Studio returns {success, data: [...sources]}
    const trackerSources = trackerData.data || trackerData.sources || [];
    // Knowledge routes return {success, data: {sources: [...], stats: {...}}}
    const registrySources = registryData.data?.sources || registryData.sources || [];
    const registryStats = registryData.data?.stats || {};

    container.innerHTML = `
      ${trackerSources.length > 0 ? `
        <h4 style="margin-bottom:0.75rem;">Source Tracker</h4>
        <table class="admin-table" style="margin-bottom:1.5rem;">
          <thead><tr><th>Name</th><th>Status</th><th>Last Checked</th><th>Actions</th></tr></thead>
          <tbody>${trackerSources.map(s => `
            <tr>
              <td><strong>${Utils.escapeHtml(s.name)}</strong></td>
              <td><span class="badge ${s.status === 'active' ? 'badge-success' : s.status === 'error' ? 'badge-error' : 'badge-warning'}">${s.status || 'unknown'}</span></td>
              <td>${s.lastChecked ? Utils.formatDate(s.lastChecked) : 'Never'}</td>
              <td>
                <button class="btn btn-sm btn-secondary" onclick="checkSource('${s.id}')">Check</button>
                <button class="btn btn-sm btn-danger" onclick="removeSource('${s.id}')">Remove</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>` : ''}

      ${registrySources.length > 0 ? `
        <h4 style="margin-bottom:0.75rem;">Registered Sources</h4>
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Type</th><th>Status</th></tr></thead>
          <tbody>${registrySources.map(s => `
            <tr>
              <td>${Utils.escapeHtml(s.name || s.id)}</td>
              <td><span class="badge">${s.type || 'unknown'}</span></td>
              <td><span class="badge ${s.active !== false ? 'badge-success' : 'badge-error'}">${s.active !== false ? 'Active' : 'Inactive'}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>` : ''}

      ${trackerSources.length === 0 && registrySources.length === 0 ? Utils.renderEmptyState('📡', 'No sources registered', 'Add sources to track legal document updates') : ''}
    `;
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('⚠', 'Failed to load sources', err.message);
  }
}

async function checkSource(id) {
  try {
    await Utils.api(`/studio/sources/tracker/${id}/check`, { method: 'POST' });
    Utils.showToast('Source checked', 'success');
    loadSources();
  } catch (err) {
    Utils.showToast(err.message || 'Check failed', 'error');
  }
}

async function removeSource(id) {
  if (!confirm('Remove this source?')) return;
  try {
    await Utils.api(`/studio/sources/tracker/${id}`, { method: 'DELETE' });
    Utils.showToast('Source removed', 'success');
    loadSources();
  } catch (err) {
    Utils.showToast(err.message || 'Failed to remove', 'error');
  }
}

/* ═══ Background Jobs ═══ */
function initJobs() {
  const createBtn = document.getElementById('createJobBtn');
  if (createBtn) {
    createBtn.addEventListener('click', async () => {
      const type = prompt('Job type (rebuild-index/sync-sources/cleanup):', 'rebuild-index');
      if (!type) return;
      try {
        await Utils.api('/studio/jobs', { method: 'POST', body: { type, params: {} } });
        Utils.showToast('Job created', 'success');
        loadJobs();
      } catch (err) {
        Utils.showToast(err.message || 'Failed to create job', 'error');
      }
    });
  }
}

async function loadJobs() {
  const container = document.getElementById('jobsContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';
  try {
    const [jobsData, statsData] = await Promise.all([
      Utils.api('/studio/jobs').catch(() => ({ data: { jobs: [] } })),
      Utils.api('/studio/jobs/stats').catch(() => ({ data: {} }))
    ]);

    // Studio returns {success, data: {jobs: [...], total, offset, limit}}
    const jobs = jobsData.data?.jobs || jobsData.jobs || [];
    // Studio returns {success, data: {total, pending, running, completed, failed}}
    const stats = statsData.data || statsData.stats || {};

    let html = '';
    if (stats.total !== undefined) {
      html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1rem;margin-bottom:1.5rem;">
        <div class="admin-stat"><div class="admin-stat-value">${stats.total || 0}</div><div class="admin-stat-label">Total</div></div>
        <div class="admin-stat"><div class="admin-stat-value" style="color:var(--warning);">${stats.running || stats.active || 0}</div><div class="admin-stat-label">Running</div></div>
        <div class="admin-stat"><div class="admin-stat-value" style="color:var(--success);">${stats.completed || 0}</div><div class="admin-stat-label">Completed</div></div>
        <div class="admin-stat"><div class="admin-stat-value" style="color:var(--error);">${stats.failed || 0}</div><div class="admin-stat-label">Failed</div></div>
      </div>`;
    }

    if (jobs.length > 0) {
      html += `<table class="admin-table">
        <thead><tr><th>Type</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
        <tbody>${jobs.map(j => `
          <tr>
            <td><strong>${Utils.escapeHtml(j.type)}</strong></td>
            <td><span class="badge ${j.status === 'completed' ? 'badge-success' : j.status === 'running' ? 'badge-warning' : j.status === 'failed' ? 'badge-error' : ''}">${j.status || 'pending'}</span></td>
            <td>${Utils.formatDate(j.createdAt)}</td>
            <td>
              ${j.status === 'running' || j.status === 'pending' ? `<button class="btn btn-sm btn-danger" onclick="cancelJob('${j.id}')">Cancel</button>` : ''}
              ${j.status === 'failed' ? `<button class="btn btn-sm btn-secondary" onclick="retryJob('${j.id}')">Retry</button>` : ''}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    }

    container.innerHTML = html || Utils.renderEmptyState('⚙️', 'No jobs', 'Create a background job to get started');
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('⚠', 'Failed to load jobs', err.message);
  }
}

async function cancelJob(id) {
  try {
    await Utils.api(`/studio/jobs/${id}/cancel`, { method: 'POST' });
    Utils.showToast('Job cancelled', 'success');
    loadJobs();
  } catch (err) {
    Utils.showToast(err.message || 'Failed to cancel', 'error');
  }
}

async function retryJob(id) {
  try {
    await Utils.api(`/studio/jobs/${id}/retry`, { method: 'POST' });
    Utils.showToast('Job retried', 'success');
    loadJobs();
  } catch (err) {
    Utils.showToast(err.message || 'Failed to retry', 'error');
  }
}

/* ═══ Audit Log ═══ */
async function loadAuditLogs() {
  const container = document.getElementById('auditContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';
  try {
    const [logsData, statsData] = await Promise.all([
      Utils.api('/studio/audit').catch(() => ({ data: { logs: [] } })),
      Utils.api('/studio/audit/stats').catch(() => ({ data: {} }))
    ]);

    // Studio returns {success, data: {logs: [...], total, offset, limit}}
    const logs = logsData.data?.logs || logsData.logs || [];
    // Studio returns {success, data: {total, today, byAction, byEntity, ...}}
    const stats = statsData.data || statsData.stats || {};

    let html = '';
    if (stats.total !== undefined) {
      html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1rem;margin-bottom:1.5rem;">
        <div class="admin-stat"><div class="admin-stat-value">${stats.total || 0}</div><div class="admin-stat-label">Total Events</div></div>
        <div class="admin-stat"><div class="admin-stat-value">${stats.today || 0}</div><div class="admin-stat-label">Today</div></div>
      </div>`;
    }

    if (logs.length > 0) {
      html += `<div style="max-height:500px;overflow-y:auto;">
        ${logs.map(log => `
          <div style="display:flex;gap:1rem;padding:0.75rem;border-bottom:1px solid var(--border-light);font-size:0.85rem;">
            <span style="color:var(--text-tertiary);flex-shrink:0;min-width:120px;">${Utils.formatDate(log.timestamp || log.createdAt)}</span>
            <span class="badge badge-${log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'primary'}" style="flex-shrink:0;">${log.level || 'info'}</span>
            <span style="color:var(--text-secondary);">${Utils.escapeHtml(log.action || log.message || log.event || JSON.stringify(log))}</span>
          </div>`).join('')}
      </div>`;
    }

    container.innerHTML = html || Utils.renderEmptyState('📋', 'No audit logs', 'System events will appear here');
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('⚠', 'Failed to load audit logs', err.message);
  }
}

/* ═══ Graph Explorer ═══ */
async function loadGraph() {
  const container = document.getElementById('graphContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';

  const refreshBtn = document.getElementById('refreshGraphBtn');
  if (refreshBtn) refreshBtn.onclick = loadGraph;

  try {
    const [graphData, studioGraph] = await Promise.all([
      Utils.api('/knowledge/graph').catch(() => ({ data: {} })),
      Utils.api('/studio/graph').catch(() => ({ data: { nodes: [], edges: [] } }))
    ]);

    // Knowledge routes return {success, data: {totalNodes, totalEdges, nodeTypes, edgeTypes, ...}}
    const stats = graphData.data || graphData;
    // Studio returns {success, data: {nodes: [...], edges: [...], ...}}
    const studioStats = studioGraph.data || studioGraph;

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem;">
        <div class="admin-confidence-card">
          <div class="admin-confidence-value" style="color:var(--accent-primary);">${stats.totalNodes || studioStats.totalNodes || 0}</div>
          <div class="admin-confidence-label">Total Nodes</div>
        </div>
        <div class="admin-confidence-card">
          <div class="admin-confidence-value" style="color:var(--success);">${stats.totalEdges || studioStats.totalEdges || 0}</div>
          <div class="admin-confidence-label">Total Edges</div>
        </div>
        <div class="admin-confidence-card">
          <div class="admin-confidence-value" style="color:var(--warning);">${stats.nodeTypes ? Object.keys(stats.nodeTypes).length : 0}</div>
          <div class="admin-confidence-label">Node Types</div>
        </div>
        <div class="admin-confidence-card">
          <div class="admin-confidence-value" style="color:var(--info);">${stats.edgeTypes ? Object.keys(stats.edgeTypes).length : 0}</div>
          <div class="admin-confidence-label">Edge Types</div>
        </div>
      </div>

      <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:1rem;margin-bottom:1rem;">
        <h4 style="margin-bottom:0.75rem;">Graph Search</h4>
        <div style="display:flex;gap:0.5rem;">
          <input type="text" id="graphSearchInput" placeholder="Search the knowledge graph..." style="flex:1;">
          <button class="btn btn-primary btn-sm" id="graphSearchBtn">Search</button>
        </div>
        <div id="graphSearchResults" style="margin-top:1rem;"></div>
      </div>

      <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:1rem;">
        <h4 style="margin-bottom:0.75rem;">Raw Graph Data</h4>
        <pre style="background:var(--bg-tertiary);padding:1rem;border-radius:var(--radius-md);font-size:0.75rem;overflow-x:auto;max-height:300px;overflow-y:auto;">${JSON.stringify(stats, null, 2)}</pre>
      </div>
    `;

    const searchBtn = document.getElementById('graphSearchBtn');
    const searchInput = document.getElementById('graphSearchInput');
    if (searchBtn && searchInput) {
      const doSearch = async () => {
        const q = searchInput.value.trim();
        if (!q) return;
        const resultsDiv = document.getElementById('graphSearchResults');
        resultsDiv.innerHTML = '<div class="loading-spinner" style="margin:0.5rem auto;"></div>';
        try {
          const data = await Utils.api(`/knowledge/graph/query?q=${encodeURIComponent(q)}`);
          const results = data.data || data;
          const nodes = results.nodes || results.results || [];
          resultsDiv.innerHTML = nodes.length > 0 ? nodes.map(n => `
            <div style="padding:0.5rem;border-bottom:1px solid var(--border-light);font-size:0.85rem;">
              <strong>${Utils.escapeHtml(n.name || n.label || n.id)}</strong>
              <span class="badge" style="margin-left:0.5rem;">${n.type || 'node'}</span>
            </div>`).join('') : '<p style="color:var(--text-tertiary);font-size:0.85rem;">No results found</p>';
        } catch (err) {
          resultsDiv.innerHTML = `<p style="color:var(--error);font-size:0.85rem;">Search failed: ${err.message}</p>`;
        }
      };
      searchBtn.onclick = doSearch;
      searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
    }
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('🕸️', 'Graph unavailable', err.message);
  }
}

/* ═══ System Settings ═══ */
async function loadSystemSettings() {
  const container = document.getElementById('settingsContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';
  try {
    const [sysInfo, healthData] = await Promise.all([
      Utils.api('/studio/system/info').catch(() => ({ data: {} })),
      Utils.api('/studio/system/health').catch(() => ({ data: {} }))
    ]);

    const info = sysInfo.data || sysInfo;
    const health = healthData.data || healthData;

    const formatBytes = (bytes) => {
      if (!bytes) return '0 B';
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    };

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem;margin-bottom:1.5rem;">
        <div class="admin-confidence-card">
          <div class="admin-confidence-label">Node.js Version</div>
          <div class="admin-confidence-value" style="font-size:1.3rem;">${info.nodeVersion || 'N/A'}</div>
        </div>
        <div class="admin-confidence-card">
          <div class="admin-confidence-label">Platform</div>
          <div class="admin-confidence-value" style="font-size:1.3rem;">${info.platform || 'N/A'}</div>
        </div>
        <div class="admin-confidence-card">
          <div class="admin-confidence-label">Uptime</div>
          <div class="admin-confidence-value" style="font-size:1.3rem;">${info.uptime ? Math.floor(info.uptime / 3600) + 'h ' + Math.floor((info.uptime % 3600) / 60) + 'm' : 'N/A'}</div>
        </div>
        <div class="admin-confidence-card">
          <div class="admin-confidence-label">CPU Cores</div>
          <div class="admin-confidence-value" style="font-size:1.3rem;">${info.cpuCount || 'N/A'}</div>
        </div>
      </div>

      ${info.memory ? `
        <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:1rem;margin-bottom:1rem;">
          <h4 style="margin-bottom:0.75rem;">Memory Usage</h4>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0.75rem;">
            <div><span style="color:var(--text-tertiary);font-size:0.8rem;">RSS:</span> <strong>${formatBytes(info.memory.rss)}</strong></div>
            <div><span style="color:var(--text-tertiary);font-size:0.8rem;">Heap Used:</span> <strong>${formatBytes(info.memory.heapUsed)}</strong></div>
            <div><span style="color:var(--text-tertiary);font-size:0.8rem;">Heap Total:</span> <strong>${formatBytes(info.memory.heapTotal)}</strong></div>
            <div><span style="color:var(--text-tertiary);font-size:0.8rem;">External:</span> <strong>${formatBytes(info.memory.external)}</strong></div>
          </div>
        </div>` : ''}

      ${health.status ? `
        <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:1rem;">
          <h4 style="margin-bottom:0.75rem;">Health Status</h4>
          <pre style="background:var(--bg-tertiary);padding:1rem;border-radius:var(--radius-md);font-size:0.8rem;overflow-x:auto;max-height:300px;overflow-y:auto;">${JSON.stringify(health, null, 2)}</pre>
        </div>` : ''}
    `;
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('⚙️', 'Settings unavailable', err.message);
  }
}

/* ═══ Logs ═══ */
async function loadLogs() {
  const container = document.getElementById('logsViewer');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner" style="margin:1rem auto;"></div>';
  try {
    const data = await Utils.api('/admin/logs');
    container.innerHTML = data.logs.map(log =>
      `<div class="log-viewer">${Utils.escapeHtml(log.content)}</div>`
    ).join('');
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('📋', 'No logs available', err.message);
  }
}

/* ═══ Expose globals ═══ */
window.deleteUser = deleteUser;
window.rebuildVectorDB = rebuildVectorDB;
window.previewDataset = previewDataset;
window.deleteDataset = deleteDataset;
window.deleteKnowledgeItem = deleteKnowledgeItem;
window.publishAct = publishAct;
window.deleteAct = deleteAct;
window.checkSource = checkSource;
window.removeSource = removeSource;
window.cancelJob = cancelJob;
window.retryJob = retryJob;
