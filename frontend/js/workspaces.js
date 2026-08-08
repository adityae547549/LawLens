document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('workspacesPage')) return;
  if (!Utils.isAuthenticated()) { window.location.href = './login.html'; return; }
  initWorkspaceUI();
  loadWorkspaces();
});

function initWorkspaceUI() {
  const createBtn = document.getElementById('createWorkspaceBtn');
  const createSection = document.getElementById('createWorkspaceSection');
  const saveBtn = document.getElementById('saveWorkspaceBtn');

  if (createBtn && createSection) {
    createBtn.addEventListener('click', () => {
      createSection.style.display = createSection.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const name = document.getElementById('wsName')?.value.trim();
      const desc = document.getElementById('wsDesc')?.value.trim();
      if (!name) { Utils.showToast('Workspace name is required', 'error'); return; }
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="loading-spinner"></span> Creating...';
      try {
        await Utils.api('/workspaces', { method: 'POST', body: { name, description: desc } });
        Utils.showToast('Workspace created!', 'success');
        document.getElementById('wsName').value = '';
        document.getElementById('wsDesc').value = '';
        document.getElementById('createWorkspaceSection').style.display = 'none';
        loadWorkspaces();
      } catch (err) {
        Utils.showToast(err.message || 'Failed to create workspace', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Create Workspace';
      }
    });
  }
}

async function loadWorkspaces() {
  const container = document.getElementById('workspacesList');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="loading-spinner" style="margin:0 auto;"></div></div>';
  try {
    const data = await Utils.api('/workspaces');
    const workspaces = data.workspaces || [];
    container.innerHTML = workspaces.length === 0
      ? Utils.renderEmptyState('📁', 'No workspaces yet', 'Create your first workspace to organize your legal research projects.')
      : `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem;">
        ${workspaces.map(ws => {
          const docCount = (ws.documents || []).length;
          const memberCount = (ws.members || []).length;
          const annotationCount = (ws.annotations || []).length;
          return `
          <div class="workspace-card" onclick="openWorkspace('${ws.id}')" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:1.25rem;cursor:pointer;transition:all 0.2s;hover:border-color:var(--accent-glow);">
            <div style="font-size:1.8rem;margin-bottom:0.5rem;">📁</div>
            <h3 style="font-size:1.05rem;font-weight:600;margin-bottom:0.25rem;">${Utils.escapeHtml(ws.name)}</h3>
            ${ws.description ? `<p style="font-size:0.85rem;color:var(--text-tertiary);margin-bottom:0.75rem;">${Utils.escapeHtml(ws.description.slice(0, 80))}</p>` : ''}
            <div style="display:flex;gap:0.75rem;font-size:0.8rem;color:var(--text-tertiary);">
              <span>📄 ${docCount} docs</span>
              <span>👥 ${memberCount} members</span>
              <span>💬 ${annotationCount} annotations</span>
            </div>
            <div style="margin-top:0.75rem;font-size:0.75rem;color:var(--text-tertiary);">
              Updated ${Utils.formatDate(ws.updatedAt || ws.createdAt)}
            </div>
          </div>`;
        }).join('')}
      </div>`;
  } catch (err) {
    container.innerHTML = Utils.renderEmptyState('⚠', 'Failed to load workspaces', err.message);
  }
}

async function openWorkspace(id) {
  try {
    const data = await Utils.api(`/workspaces/${id}`);
    const ws = data.workspace;
    const previewWindow = window.open('', '_blank', 'width=900,height=700');
    previewWindow.document.write(`
      <html><head><title>${Utils.escapeHtml(ws.name)} — LawLens</title>
      <style>
        body{font-family:'Inter',sans-serif;padding:30px;line-height:1.6;background:#1a1a2e;color:#e0e0e0;max-width:800px;margin:0 auto;}
        h1{color:#0d9488;}
        .section{margin:1.5rem 0;padding:1rem;background:#16213e;border-radius:12px;border:1px solid #0f3460;}
        .section h3{color:#0d9488;margin:0 0 0.75rem;}
        .item{display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #0f3460;font-size:0.9rem;}
        .badge{display:inline-flex;padding:2px 8px;border-radius:999px;font-size:0.75rem;background:rgba(13,148,136,0.15);color:#0d9488;}
        </style></head><body>
        <h1>📁 ${Utils.escapeHtml(ws.name)}</h1>
        ${ws.description ? `<p style="color:#888;">${Utils.escapeHtml(ws.description)}</p>` : ''}
        <div style="display:flex;gap:1rem;font-size:0.85rem;color:#888;margin-bottom:1.5rem;">
          <span>Owner: ${Utils.escapeHtml(ws.ownerId)}</span>
          <span>Members: ${(ws.members || []).length}</span>
        </div>
        <div class="section">
          <h3>📄 Documents (${(ws.documents || []).length})</h3>
          ${(ws.documents || []).map(d => `<div class="item"><span>${Utils.escapeHtml(d.name || d.id)}</span><span class="badge">Added ${Utils.formatDate(d.addedAt)}</span></div>`).join('') || '<p style="color:#666;font-size:0.85rem;">No documents added yet.</p>'}
        </div>
        <div class="section">
          <h3>💬 Annotations (${(ws.annotations || []).length})</h3>
          ${(ws.annotations || []).map(a => `
            <div style="padding:0.75rem;background:rgba(13,148,136,0.05);border-radius:8px;margin-bottom:0.5rem;">
              <div style="font-size:0.8rem;color:#888;margin-bottom:0.25rem;">${Utils.escapeHtml(a.userName)} — ${Utils.formatDate(a.createdAt)}</div>
              <div style="font-size:0.9rem;">${Utils.escapeHtml(a.text)}</div>
            </div>
          `).join('') || '<p style="color:#666;font-size:0.85rem;">No annotations yet.</p>'}
        </div>
        <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #0f3460;font-size:0.8rem;color:#666;">
          Created ${Utils.formatDate(ws.createdAt)} · Updated ${Utils.formatDate(ws.updatedAt)}
        </div>
      </body></html>
    `);
    previewWindow.document.close();
  } catch (err) {
    Utils.showToast('Failed to open workspace', 'error');
  }
}
