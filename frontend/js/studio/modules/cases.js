/**
 * LawLens Studio — Cases Module
 */

Studio.Modules.register('cases', () => {
  let _cases = [];
  let _searchQuery = '';

  async function loadCases() {
    try {
      const res = await Studio.api('/knowledge/graph');
      const nodes = res.data?.nodes || [];
      _cases = nodes.filter(n => n.type === 'landmark_case' || n.type === 'case');
    } catch (err) {
      _cases = [];
    }
  }

  return {
    async render() {
      await loadCases();
      const filtered = _searchQuery ? _cases.filter(c => (c.title || '').toLowerCase().includes(_searchQuery.toLowerCase())) : _cases;

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Cases</h1>
            <p class="studio-module-subtitle">${_cases.length} case${_cases.length !== 1 ? 's' : ''} in knowledge base</p>
          </div>
          <div class="studio-module-actions">
            <div style="position:relative;">
              <i data-lucide="search" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--text-tertiary);"></i>
              <input class="studio-form-input" id="caseSearch" placeholder="Search cases..." value="${_searchQuery}" style="padding-left:28px;width:220px;padding:6px 10px 6px 28px;font-size:0.82rem;">
            </div>
          </div>
        </div>

        ${filtered.length === 0 ?
          Studio.UI.emptyState('briefcase', 'No Cases Found', _searchQuery ? 'Try a different search' : 'Cases will appear here from the knowledge graph') :
          `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px;">
            ${filtered.map(c => `
              <div class="studio-section" style="cursor:pointer;">
                <div class="studio-section-body">
                  <div style="display:flex;align-items:start;gap:12px;">
                    <div style="width:36px;height:36px;border-radius:8px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <i data-lucide="scale" style="width:18px;height:18px;color:var(--warning);"></i>
                    </div>
                    <div style="min-width:0;">
                      <div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);margin-bottom:2px;">${c.title || c.id}</div>
                      <div style="font-size:0.78rem;color:var(--text-tertiary);">${c.citation || c.type || 'Case'}</div>
                      ${c.keywords?.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">${c.keywords.slice(0, 3).map(k => Studio.UI.badge(k, 'neutral')).join('')}</div>` : ''}
                    </div>
                  </div>
                </div>
              </div>`).join('')}
          </div>`}
      `;
    },

    mount() {
      document.getElementById('caseSearch')?.addEventListener('input', (e) => {
        _searchQuery = e.target.value;
        Studio.Router.handleRoute();
      });
    },

    unmount() { _cases = []; _searchQuery = ''; }
  };
});
