/**
 * LawLens Studio — Rules Module
 */

Studio.Modules.register('rules', () => {
  let _rules = [];

  async function loadRules() {
    try {
      const res = await Studio.api('/knowledge/sources');
      const sources = res.data?.sources || [];
      _rules = sources.filter(s => s.documentType === 'rule');
    } catch (err) {
      _rules = [];
    }
  }

  return {
    async render() {
      await loadRules();

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Rules</h1>
            <p class="studio-module-subtitle">${_rules.length} rule${_rules.length !== 1 ? 's' : ''} registered</p>
          </div>
        </div>

        ${_rules.length === 0 ?
          Studio.UI.emptyState('scroll-text', 'No Rules', 'Rules and regulations will appear here') :
          `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;">
            ${_rules.map(r => `
              <div class="studio-section">
                <div class="studio-section-body">
                  <div style="display:flex;align-items:start;gap:12px;">
                    <div style="width:36px;height:36px;border-radius:8px;background:rgba(59,130,246,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <i data-lucide="scroll-text" style="width:18px;height:18px;color:var(--info);"></i>
                    </div>
                    <div>
                      <div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);">${r.name}</div>
                      <div style="font-size:0.78rem;color:var(--text-tertiary);">${r.authority || 'Unknown authority'}</div>
                    </div>
                  </div>
                </div>
              </div>`).join('')}
          </div>`}
      `;
    },

    mount() {},
    unmount() { _rules = []; }
  };
});
