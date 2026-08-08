/**
 * LawLens Studio — Workspaces Module
 */

Studio.Modules.register('workspaces', () => {
  let _workspaces = [];

  async function loadWorkspaces() {
    try {
      const res = await Studio.api('/workspaces');
      _workspaces = res.workspaces || res.data?.workspaces || [];
    } catch (err) {
      _workspaces = [];
    }
  }

  return {
    async render() {
      await loadWorkspaces();

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Workspaces</h1>
            <p class="studio-module-subtitle">${_workspaces.length} workspace${_workspaces.length !== 1 ? 's' : ''}</p>
          </div>
          <div class="studio-module-actions">
            ${Studio.UI.btn('Create Workspace', { icon: 'plus', variant: 'primary', id: 'createWorkspaceBtn' })}
          </div>
        </div>

        ${_workspaces.length === 0 ?
          Studio.UI.emptyState('briefcase', 'No Workspaces', 'Create your first workspace to organize research') :
          `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
            ${_workspaces.map(w => `
              <div class="studio-section" style="cursor:pointer;" onclick="window.location.href='./workspaces.html'">
                <div class="studio-section-body">
                  <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:12px;">
                    <div>
                      <h3 style="font-size:1rem;font-weight:600;color:var(--text-primary);margin-bottom:4px;">${w.name || 'Untitled'}</h3>
                      <p style="font-size:0.82rem;color:var(--text-tertiary);margin:0;">${w.description || 'No description'}</p>
                    </div>
                  </div>
                  <div style="display:flex;gap:12px;font-size:0.75rem;color:var(--text-tertiary);">
                    <span>${w.members?.length || 0} members</span>
                    <span>${w.documents?.length || 0} documents</span>
                  </div>
                </div>
              </div>`).join('')}
          </div>`}
      `;
    },

    mount() {
      document.getElementById('createWorkspaceBtn')?.addEventListener('click', () => {
        Studio.Toast.info('Redirecting to workspace manager...');
        window.location.href = './workspaces.html';
      });
    },

    unmount() { _workspaces = []; }
  };
});
