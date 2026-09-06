/**
 * LawLens Studio — Page Builder Module
 * Shows page inventory; Edit opens standalone visual editor (editor.html)
 */

Studio.Modules.register('page-builder', () => {
  let _pages = [], _filterCategory = '';

  async function loadPages() { try { _pages = (await Studio.api('/studio/pages')).data || []; } catch { _pages = []; } }

  function openEditor(page) {
    window.open('/editor.html?page=' + encodeURIComponent(page.id), '_blank');
  }

  function renderList() {
    const cats = [...new Set(_pages.map(p => p.category || 'Other'))].sort();
    const filtered = _filterCategory ? _pages.filter(p => p.category === _filterCategory) : _pages;
    return `
      <div class="studio-module-header">
        <div><h1 class="studio-module-title">Page Builder</h1><p class="studio-module-subtitle">${_pages.length} pages — click Edit to open the visual editor</p></div>
        <div class="studio-module-actions">
          <select class="studio-form-input studio-form-select" id="pageCategoryFilter" style="width:140px;padding:6px 8px;font-size:0.82rem;">
            <option value="">All Categories</option>${cats.map(c=>`<option value="${c}" ${_filterCategory===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;">
        ${filtered.map(p=>{
          const badge = p.type==='system'?'<span class="studio-badge studio-badge-neutral" style="font-size:0.65rem;">System</span>':p.type==='application'?'<span class="studio-badge studio-badge-success" style="font-size:0.65rem;">App</span>':'<span class="studio-badge studio-badge-warning" style="font-size:0.65rem;">CMS</span>';
          return `<div class="studio-section page-card" data-page-id="${p.id}" style="cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;">
            <div class="studio-section-body">
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:44px;height:44px;border-radius:10px;background:var(--accent-primary-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <i data-lucide="${p.icon||'file'}" style="width:20px;height:20px;color:var(--accent-primary);"></i>
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                    <span style="font-weight:600;color:var(--text-primary);font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</span>${badge}
                  </div>
                  <div style="font-size:0.75rem;color:var(--text-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.description||p.sourceFile||''}</div>
                </div>
                <div style="flex-shrink:0;display:flex;gap:4px;">
                  <button class="studio-btn studio-btn-primary studio-btn-sm edit-page" data-page-id="${p.id}" style="font-size:0.72rem;">Edit</button>
                </div>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  function bindEvents() {
    document.getElementById('pageCategoryFilter')?.addEventListener('change', e => { _filterCategory = e.target.value; rerender(); });
    document.querySelectorAll('.page-card').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset?.pageId;
        const page = _pages.find(p => p.id === id);
        if (page) openEditor(page);
      });
    });
    document.querySelectorAll('.edit-page').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset?.pageId;
        const page = _pages.find(p => p.id === id);
        if (page) openEditor(page);
      });
    });
  }

  function rerender() {
    const el = document.getElementById('studioContent');
    if (!el) return;
    el.innerHTML = renderList();
    if (window.lucide) lucide.createIcons({ nodes: [el] });
    bindEvents();
  }

  return {
    async render() { await loadPages(); return renderList(); },
    mount() { bindEvents(); },
    unmount() { _pages = []; _filterCategory = ''; }
  };
});
