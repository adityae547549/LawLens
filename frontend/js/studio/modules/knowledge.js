/**
 * LawLens Studio — Knowledge Manager Module
 * Visual CRUD for legal knowledge with hierarchy, search, bulk operations
 */

Studio.Modules.register('knowledge', () => {
  let _sources = [];
  let _selectedItem = null;
  let _searchQuery = '';
  let _filterType = 'all';
  let _viewMode = 'list';

  async function loadSources() {
    try {
      const res = await Studio.api('/knowledge/sources');
      _sources = res.data?.sources || [];
    } catch (err) {
      _sources = [];
      Studio.Toast.error('Failed to load knowledge sources');
    }
  }

  function getFilteredSources() {
    let filtered = [..._sources];
    if (_searchQuery) {
      const q = _searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.authority || '').toLowerCase().includes(q) ||
        (s.documentType || '').toLowerCase().includes(q) ||
        (s.id || '').toLowerCase().includes(q)
      );
    }
    if (_filterType !== 'all') {
      filtered = filtered.filter(s => (s.documentType || '').toLowerCase() === _filterType);
    }
    return filtered;
  }

  function renderToolbar() {
    const types = ['all', 'constitutional', 'statute', 'case', 'rule', 'notification'];
    const typeBtns = types.map(t =>
      `<button class="studio-tab ${_filterType === t ? 'active' : ''}" data-filter="${t}">${t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}</button>`
    ).join('');

    return `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;position:relative;">
          <i data-lucide="search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--text-tertiary);"></i>
          <input type="text" class="studio-form-input" id="knowledgeSearch" placeholder="Search sources..." value="${_searchQuery}" style="padding-left:32px;">
        </div>
        <div class="studio-tabs" style="margin-bottom:0;">
          ${typeBtns}
        </div>
        <div style="display:flex;gap:4px;">
          <button class="studio-btn studio-btn-ghost studio-btn-sm" data-view="list" title="List view"><i data-lucide="list"></i></button>
          <button class="studio-btn studio-btn-ghost studio-btn-sm" data-view="grid" title="Grid view"><i data-lucide="grid-3x3"></i></button>
        </div>
        ${Studio.UI.btn('Add Source', { icon: 'plus', variant: 'primary', id: 'addSourceBtn' })}
      </div>`;
  }

  function renderSourceList() {
    const sources = getFilteredSources();

    if (sources.length === 0) {
      return Studio.UI.emptyState('database', 'No Sources Found',
        _searchQuery ? 'Try a different search query' : 'Add your first legal source to get started',
        Studio.UI.btn('Add Source', { icon: 'plus', variant: 'primary', id: 'addSourceBtnEmpty' }));
    }

    const rows = sources.map(s => {
      const typeBadge = s.documentType ?
        Studio.UI.badge(s.documentType, s.documentType === 'constitutional' ? 'primary' : s.documentType === 'case' ? 'warning' : 'neutral') : '';
      const statusBadge = s.isActive !== false ?
        Studio.UI.badge('Active', 'success') :
        Studio.UI.badge('Inactive', 'neutral');
      const lastChecked = s.lastChecked ? new Date(s.lastChecked).toLocaleDateString() : 'Never';

      return `
        <tr data-id="${s.id}" class="knowledge-row" style="cursor:pointer;">
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:32px;height:32px;border-radius:8px;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;">
                <i data-lucide="${s.documentType === 'constitutional' ? 'book-open' : s.documentType === 'case' ? 'briefcase' : 'file-text'}" style="width:16px;height:16px;color:var(--text-secondary);"></i>
              </div>
              <div>
                <div style="font-weight:600;color:var(--text-primary);font-size:0.85rem;">${s.name || s.id}</div>
                <div style="font-size:0.72rem;color:var(--text-tertiary);">${s.authority || 'No authority set'}</div>
              </div>
            </div>
          </td>
          <td>${typeBadge}</td>
          <td>${statusBadge}</td>
          <td style="font-size:0.78rem;color:var(--text-tertiary);">${lastChecked}</td>
          <td>
            <div style="display:flex;gap:4px;">
              <button class="studio-btn studio-btn-ghost studio-btn-sm knowledge-edit" data-id="${s.id}" title="Edit"><i data-lucide="pencil" style="width:12px;height:12px;"></i></button>
              <button class="studio-btn studio-btn-ghost studio-btn-sm knowledge-delete" data-id="${s.id}" title="Delete"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
            </div>
          </td>
        </tr>`;
    }).join('');

    return `
      <div style="overflow-x:auto;">
        <table class="studio-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Type</th>
              <th>Status</th>
              <th>Last Checked</th>
              <th style="width:80px;">Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderSourceDetail() {
    if (!_selectedItem) return '';

    const s = _selectedItem;
    return `
      <div class="studio-section" style="margin-top:20px;">
        <div class="studio-section-header">
          <span class="studio-section-title">Source Details</span>
          <div style="display:flex;gap:6px;">
            ${Studio.UI.btn('Edit', { icon: 'pencil', size: 'sm', id: 'editDetailBtn' })}
            ${Studio.UI.btn('Close', { icon: 'x', size: 'sm', id: 'closeDetailBtn' })}
          </div>
        </div>
        <div class="studio-section-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
              <div class="studio-form-label">Name</div>
              <div style="font-size:0.9rem;color:var(--text-primary);">${s.name || '—'}</div>
            </div>
            <div>
              <div class="studio-form-label">ID</div>
              <div style="font-size:0.9rem;color:var(--text-primary);font-family:var(--font-mono);">${s.id || '—'}</div>
            </div>
            <div>
              <div class="studio-form-label">Authority</div>
              <div style="font-size:0.9rem;color:var(--text-primary);">${s.authority || '—'}</div>
            </div>
            <div>
              <div class="studio-form-label">Document Type</div>
              <div style="font-size:0.9rem;color:var(--text-primary);">${s.documentType || '—'}</div>
            </div>
            <div>
              <div class="studio-form-label">Source URL</div>
              <div style="font-size:0.9rem;color:var(--text-primary);">${s.sourceUrl ? `<a href="${s.sourceUrl}" target="_blank" style="color:var(--accent-primary);">${s.sourceUrl}</a>` : '—'}</div>
            </div>
            <div>
              <div class="studio-form-label">Effective Date</div>
              <div style="font-size:0.9rem;color:var(--text-primary);">${s.effectiveDate || '—'}</div>
            </div>
            <div>
              <div class="studio-form-label">Integrity</div>
              <div style="font-size:0.9rem;color:var(--text-primary);">${Studio.UI.badge(s.integrityStatus || 'unknown', s.integrityStatus === 'verified' ? 'success' : 'warning')}</div>
            </div>
            <div>
              <div class="studio-form-label">Active</div>
              <div style="font-size:0.9rem;color:var(--text-primary);">${s.isActive !== false ? Studio.UI.badge('Yes', 'success') : Studio.UI.badge('No', 'neutral')}</div>
            </div>
          </div>
          ${s.tags && s.tags.length > 0 ? `
            <div style="margin-top:16px;">
              <div class="studio-form-label">Tags</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                ${s.tags.map(t => Studio.UI.badge(t, 'info')).join('')}
              </div>
            </div>` : ''}
        </div>
      </div>`;
  }

  function renderStats() {
    const total = _sources.length;
    const active = _sources.filter(s => s.isActive !== false).length;
    const verified = _sources.filter(s => s.integrityStatus === 'verified').length;
    const types = {};
    _sources.forEach(s => {
      const t = s.documentType || 'unknown';
      types[t] = (types[t] || 0) + 1;
    });

    return `
      <div class="studio-stats-grid" style="margin-bottom:20px;">
        ${Studio.UI.statCard('database', total, 'Total Sources')}
        ${Studio.UI.statCard('check-circle', active, 'Active', { iconClass: 'success' })}
        ${Studio.UI.statCard('shield-check', verified, 'Verified', { iconClass: 'info' })}
        ${Studio.UI.statCard('layers', Object.keys(types).length, 'Document Types', { iconClass: 'warning' })}
      </div>`;
  }

  function showCreateModal() {
    Studio.Modal.show({
      title: 'Add New Source',
      body: `
        <div class="studio-form-group">
          <label class="studio-form-label">Name *</label>
          <input class="studio-form-input" id="modalSourceName" placeholder="e.g., Bharatiya Nyaya Sanhita 2023">
        </div>
        <div class="studio-form-group">
          <label class="studio-form-label">Authority</label>
          <input class="studio-form-input" id="modalSourceAuthority" placeholder="e.g., Legislative Department">
        </div>
        <div class="studio-form-group">
          <label class="studio-form-label">Document Type</label>
          <select class="studio-form-input studio-form-select" id="modalSourceType">
            <option value="statute">Statute</option>
            <option value="constitutional">Constitutional</option>
            <option value="case">Case</option>
            <option value="rule">Rule</option>
            <option value="notification">Notification</option>
          </select>
        </div>
        <div class="studio-form-group">
          <label class="studio-form-label">Source URL</label>
          <input class="studio-form-input" id="modalSourceUrl" placeholder="https://...">
        </div>
        <div class="studio-form-group">
          <label class="studio-form-label">Tags (comma separated)</label>
          <input class="studio-form-input" id="modalSourceTags" placeholder="criminal, procedural, 2023">
        </div>`,
      footer: `
        <button class="studio-btn studio-btn-secondary" onclick="Studio.Modal.hide()">Cancel</button>
        <button class="studio-btn studio-btn-primary" id="modalSaveBtn">Add Source</button>`
    });

    document.getElementById('modalSaveBtn')?.addEventListener('click', async () => {
      const name = document.getElementById('modalSourceName')?.value;
      if (!name) { Studio.Toast.error('Name is required'); return; }

      const tags = (document.getElementById('modalSourceTags')?.value || '').split(',').map(t => t.trim()).filter(Boolean);

      try {
        await Studio.api('/studio/knowledge/items', {
          method: 'POST',
          body: {
            name,
            authority: document.getElementById('modalSourceAuthority')?.value || '',
            documentType: document.getElementById('modalSourceType')?.value || 'statute',
            sourceUrl: document.getElementById('modalSourceUrl')?.value || '',
            tags
          }
        });
        Studio.Toast.success('Source added successfully');
        Studio.Modal.hide();
        await loadSources();
        Studio.Events.emit('knowledge:updated');
        Studio.Router.handleRoute();
      } catch (err) {
        Studio.Toast.error(err.message || 'Failed to add source');
      }
    });
  }

  function showEditModal(source) {
    Studio.Modal.show({
      title: `Edit: ${source.name}`,
      body: `
        <div class="studio-form-group">
          <label class="studio-form-label">Name</label>
          <input class="studio-form-input" id="modalEditName" value="${source.name || ''}">
        </div>
        <div class="studio-form-group">
          <label class="studio-form-label">Authority</label>
          <input class="studio-form-input" id="modalEditAuthority" value="${source.authority || ''}">
        </div>
        <div class="studio-form-group">
          <label class="studio-form-label">Document Type</label>
          <select class="studio-form-input studio-form-select" id="modalEditType">
            <option value="statute" ${source.documentType === 'statute' ? 'selected' : ''}>Statute</option>
            <option value="constitutional" ${source.documentType === 'constitutional' ? 'selected' : ''}>Constitutional</option>
            <option value="case" ${source.documentType === 'case' ? 'selected' : ''}>Case</option>
            <option value="rule" ${source.documentType === 'rule' ? 'selected' : ''}>Rule</option>
            <option value="notification" ${source.documentType === 'notification' ? 'selected' : ''}>Notification</option>
          </select>
        </div>
        <div class="studio-form-group">
          <label class="studio-form-label">Source URL</label>
          <input class="studio-form-input" id="modalEditUrl" value="${source.sourceUrl || ''}">
        </div>
        <div class="studio-form-group">
          <label class="studio-form-label">Active</label>
          <select class="studio-form-input studio-form-select" id="modalEditActive">
            <option value="true" ${source.isActive !== false ? 'selected' : ''}>Yes</option>
            <option value="false" ${source.isActive === false ? 'selected' : ''}>No</option>
          </select>
        </div>`,
      footer: `
        <button class="studio-btn studio-btn-secondary" onclick="Studio.Modal.hide()">Cancel</button>
        <button class="studio-btn studio-btn-primary" id="modalUpdateBtn">Update</button>`
    });

    document.getElementById('modalUpdateBtn')?.addEventListener('click', async () => {
      try {
        await Studio.api(`/studio/knowledge/items/${source.id}`, {
          method: 'PUT',
          body: {
            name: document.getElementById('modalEditName')?.value,
            authority: document.getElementById('modalEditAuthority')?.value,
            documentType: document.getElementById('modalEditType')?.value,
            sourceUrl: document.getElementById('modalEditUrl')?.value,
            isActive: document.getElementById('modalEditActive')?.value === 'true'
          }
        });
        Studio.Toast.success('Source updated');
        Studio.Modal.hide();
        await loadSources();
        Studio.Events.emit('knowledge:updated');
        Studio.Router.handleRoute();
      } catch (err) {
        Studio.Toast.error(err.message || 'Failed to update');
      }
    });
  }

  return {
    async render() {
      await loadSources();

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Knowledge Manager</h1>
            <p class="studio-module-subtitle">${_sources.length} source${_sources.length !== 1 ? 's' : ''} in your knowledge base</p>
          </div>
          <div class="studio-module-actions">
            ${Studio.UI.btn('Sync All', { icon: 'refresh-cw', id: 'syncAllBtn' })}
          </div>
        </div>
        ${renderStats()}
        <div class="studio-section">
          <div class="studio-section-body" style="padding:16px 20px;">
            ${renderToolbar()}
          </div>
          <div style="overflow:auto;">
            ${renderSourceList()}
          </div>
        </div>
        ${renderSourceDetail()}`;
    },

    mount() {
      // Search
      document.getElementById('knowledgeSearch')?.addEventListener('input', (e) => {
        _searchQuery = e.target.value;
        this._refreshList();
      });

      // Filter tabs
      document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
          _filterType = btn.dataset.filter;
          Studio.Router.handleRoute();
        });
      });

      // View toggle
      document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
          _viewMode = btn.dataset.view;
        });
      });

      // Add source
      document.getElementById('addSourceBtn')?.addEventListener('click', showCreateModal);
      document.getElementById('addSourceBtnEmpty')?.addEventListener('click', showCreateModal);

      // Sync all
      document.getElementById('syncAllBtn')?.addEventListener('click', async () => {
        if (!confirm('Trigger a full knowledge sync?')) return;
        try {
          Studio.Toast.info('Sync started...');
          await Studio.api('/knowledge/sync', { method: 'POST', body: { force: true } });
          Studio.Toast.success('Sync completed');
          await loadSources();
          Studio.Router.handleRoute();
        } catch (err) {
          Studio.Toast.error('Sync failed: ' + (err.message || 'Unknown error'));
        }
      });

      // Row clicks
      document.querySelectorAll('.knowledge-row').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.knowledge-edit') || e.target.closest('.knowledge-delete')) return;
          const id = row.dataset.id;
          _selectedItem = _sources.find(s => s.id === id);
          this._refreshDetail();
        });
      });

      // Edit buttons
      document.querySelectorAll('.knowledge-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const source = _sources.find(s => s.id === id);
          if (source) showEditModal(source);
        });
      });

      // Delete buttons
      document.querySelectorAll('.knowledge-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const source = _sources.find(s => s.id === id);
          if (!source) return;
          Studio.Modal.confirm('Delete Source', `Are you sure you want to delete "${source.name}"?`, async () => {
            try {
              await Studio.api(`/studio/knowledge/items/${id}`, { method: 'DELETE' });
              Studio.Toast.success('Source deleted');
              _selectedItem = null;
              await loadSources();
              Studio.Events.emit('knowledge:updated');
              Studio.Router.handleRoute();
            } catch (err) {
              Studio.Toast.error(err.message || 'Failed to delete');
            }
          });
        });
      });

      // Detail buttons
      document.getElementById('editDetailBtn')?.addEventListener('click', () => {
        if (_selectedItem) showEditModal(_selectedItem);
      });
      document.getElementById('closeDetailBtn')?.addEventListener('click', () => {
        _selectedItem = null;
        this._refreshDetail();
      });
    },

    unmount() {
      _selectedItem = null;
      _searchQuery = '';
      _filterType = 'all';
    },

    _refreshList() {
      const section = document.querySelector('.studio-section');
      if (section) {
        const body = section.querySelector('.studio-section-body');
        if (body) body.outerHTML = `<div style="overflow:auto;">${renderSourceList()}</div>`;
        if (window.lucide) lucide.createIcons();
        this.mount();
      }
    },

    _refreshDetail() {
      const existing = document.querySelector('[style*="margin-top:20px"]');
      if (existing) existing.remove();
      if (_selectedItem) {
        const content = document.getElementById('module-knowledge');
        if (content) {
          content.insertAdjacentHTML('beforeend', renderSourceDetail());
          if (window.lucide) lucide.createIcons();
          document.getElementById('editDetailBtn')?.addEventListener('click', () => {
            if (_selectedItem) showEditModal(_selectedItem);
          });
          document.getElementById('closeDetailBtn')?.addEventListener('click', () => {
            _selectedItem = null;
            this._refreshDetail();
          });
        }
      }
    }
  };
});
