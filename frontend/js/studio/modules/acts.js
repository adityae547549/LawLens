/**
 * LawLens Studio — Acts Module
 */

Studio.Modules.register('acts', () => {
  let _acts = [];

  async function loadActs() {
    try {
      const res = await Studio.api('/knowledge/sources');
      const sources = res.data?.sources || [];
      _acts = sources.filter(s => s.documentType === 'statute' || s.documentType === 'constitutional');
    } catch (err) {
      _acts = [];
    }
  }

  return {
    async render() {
      await loadActs();

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Acts</h1>
            <p class="studio-module-subtitle">${_acts.length} act${_acts.length !== 1 ? 's' : ''} registered</p>
          </div>
        </div>

        ${_acts.length === 0 ?
          Studio.UI.emptyState('book-open', 'No Acts', 'Acts from the knowledge base will appear here') :
          `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;">
            ${_acts.map(a => `
              <div class="studio-section">
                <div class="studio-section-body">
                  <div style="display:flex;align-items:start;gap:12px;">
                    <div style="width:36px;height:36px;border-radius:8px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <i data-lucide="book-open" style="width:18px;height:18px;color:var(--accent-primary);"></i>
                    </div>
                    <div>
                      <div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);">${a.name}</div>
                      <div style="font-size:0.78rem;color:var(--text-tertiary);">${a.authority || 'Unknown authority'}</div>
                      <div style="display:flex;gap:6px;margin-top:6px;">
                        ${Studio.UI.badge(a.documentType || 'statute', 'primary')}
                        ${a.isActive !== false ? Studio.UI.badge('Active', 'success') : Studio.UI.badge('Inactive', 'neutral')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>`).join('')}
          </div>`}
      `;
    },

    mount() {},
    unmount() { _acts = []; }
  };
});
