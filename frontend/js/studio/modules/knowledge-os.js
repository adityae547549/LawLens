/**
 * LawLens Studio — Knowledge OS Module
 * Full hierarchy management with versioning, workflow, and rich editing
 */

Studio.Modules.register('knowledge-os', () => {
  let _acts = [];
  let _selectedAct = null;
  let _selectedSection = null;
  let _searchQuery = '';
  let _filterStatus = '';
  let _view = 'list'; // list, tree, edit
  let _versions = [];
  let _stats = null;
  let _rebuildUnsub = null;

  async function loadActs() {
    try {
      const params = new URLSearchParams();
      if (_filterStatus) params.set('status', _filterStatus);
      if (_searchQuery) params.set('search', _searchQuery);
      const [actsRes, statsRes] = await Promise.allSettled([
        Studio.api(`/studio/lkos/acts?${params}`),
        Studio.api('/studio/lkos/stats')
      ]);
      _acts = actsRes.status === 'fulfilled' ? (actsRes.value?.data || []) : [];
      _stats = statsRes.status === 'fulfilled' ? statsRes.value?.data : null;
    } catch (err) { _acts = []; }
  }

  async function loadAct(actId) {
    try {
      const res = await Studio.api(`/studio/lkos/acts/${actId}`);
      _selectedAct = res.data || null;
    } catch (err) { _selectedAct = null; }
  }

  async function loadVersions(actId) {
    try {
      const res = await Studio.api(`/studio/lkos/acts/${actId}/versions`);
      _versions = res.data || [];
    } catch (err) { _versions = []; }
  }

  function getStatusBadge(status) {
    return Studio.UI.badge(status, status === 'published' ? 'success' : status === 'draft' ? 'warning' : 'neutral');
  }

  function renderTreeNode(node, depth = 0) {
    const indent = depth * 16;
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = _selectedSection?.id === node.id;

    return `
      <div class="tree-node ${isSelected ? 'selected' : ''}" data-id="${node.id}" data-act-id="${_selectedAct?.id}"
           style="padding:6px 8px 6px ${indent + 8}px;display:flex;align-items:center;gap:6px;cursor:pointer;border-radius:6px;transition:background 0.1s;${isSelected ? 'background:var(--accent-glow);' : ''}">
        <button class="tree-toggle" data-id="${node.id}" style="width:16px;height:16px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:var(--text-tertiary);">
          ${hasChildren ? '<i data-lucide="chevron-right" style="width:12px;height:12px;"></i>' : '<span style="width:12px;"></span>'}
        </button>
        <i data-lucide="${node.type === 'part' ? 'folder' : node.type === 'chapter' ? 'file-text' : 'file'}" style="width:14px;height:14px;color:var(--text-tertiary);flex-shrink:0;"></i>
        <span style="font-size:0.82rem;color:var(--text-primary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${node.number ? `<strong>${node.number}</strong> ` : ''}${node.title || 'Untitled'}
        </span>
        <span style="font-size:0.65rem;color:var(--text-tertiary);">${(node.content || '').length > 0 ? '✓' : ''}</span>
      </div>
      ${hasChildren ? `<div class="tree-children" data-parent="${node.id}" style="display:none;">${node.children.map(c => renderTreeNode(c, depth + 1)).join('')}</div>` : ''}`;
  }

  function renderActList() {
    if (_acts.length === 0) {
      return Studio.UI.emptyState('database', 'No Acts', _searchQuery ? 'Try a different search' : 'Create your first act to get started',
        Studio.UI.btn('Create Act', { icon: 'plus', variant: 'primary', id: 'createActBtnEmpty' }));
    }

    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;">
        ${_acts.map(act => `
          <div class="studio-section act-card" data-act-id="${act.id}" style="cursor:pointer;">
            <div class="studio-section-body">
              <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:8px;">
                <div>
                  <div style="font-weight:600;font-size:0.95rem;color:var(--text-primary);">${act.title}</div>
                  <div style="font-size:0.78rem;color:var(--text-tertiary);">${act.actNumber ? `Act ${act.actNumber}` : ''} ${act.year ? `(${act.year})` : ''}</div>
                </div>
                ${getStatusBadge(act.status)}
              </div>
              <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:8px;">${act.description || 'No description'}</div>
              <div style="display:flex;gap:12px;font-size:0.72rem;color:var(--text-tertiary);">
                <span>${act.metadata?.totalSections || 0} sections</span>
                <span>v${act.version || 1}</span>
                <span>${act.updatedAt ? new Date(act.updatedAt).toLocaleDateString() : ''}</span>
              </div>
            </div>
          </div>`).join('')}
      </div>`;
  }

  function renderActEditor() {
    if (!_selectedAct) return '';
    const act = _selectedAct;

    return `
      <div class="studio-module-header">
        <div>
          <h1 class="studio-module-title">${act.title}</h1>
          <p class="studio-module-subtitle">${act.actNumber ? `Act ${act.actNumber}` : ''} ${act.year ? `(${act.year})` : ''} — Version ${act.version || 1}</p>
        </div>
        <div class="studio-module-actions">
          ${Studio.UI.btn('Back to List', { icon: 'arrow-left', size: 'sm', id: 'backToList' })}
          ${act.status === 'draft' ? Studio.UI.btn('Publish', { icon: 'check-circle', variant: 'primary', size: 'sm', id: 'publishAct' }) : ''}
          ${act.status === 'published' ? Studio.UI.btn('Archive', { icon: 'archive', size: 'sm', id: 'archiveAct' }) : ''}
          ${Studio.UI.btn('Add Section', { icon: 'plus', size: 'sm', id: 'addSectionBtn' })}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:280px 1fr 280px;gap:16px;">
        <!-- Hierarchy Tree -->
        <div class="studio-section" style="max-height:600px;overflow-y:auto;">
          <div class="studio-section-header" style="padding:10px 14px;">
            <span class="studio-section-title" style="font-size:0.82rem;">Hierarchy</span>
          </div>
          <div style="padding:8px;">
            ${(act.parts || []).map(p => renderTreeNode(p, 0)).join('')}
            ${(act.parts || []).length === 0 ? '<div style="padding:16px;text-align:center;color:var(--text-tertiary);font-size:0.78rem;">No sections yet. Click "Add Section" to start.</div>' : ''}
          </div>
        </div>

        <!-- Section Editor -->
        <div class="studio-section">
          ${_selectedSection ? `
            <div class="studio-section-header">
              <span class="studio-section-title">${_selectedSection.title || 'Edit Section'}</span>
              <div style="display:flex;gap:6px;">
                ${Studio.UI.btn('Save', { icon: 'save', variant: 'primary', size: 'sm', id: 'saveSectionBtn' })}
                ${Studio.UI.btn('Delete', { icon: 'trash-2', variant: 'danger', size: 'sm', id: 'deleteSectionBtn' })}
              </div>
            </div>
            <div class="studio-section-body">
              <div class="studio-form-group">
                <label class="studio-form-label">Section Number</label>
                <input class="studio-form-input" id="sectionNumber" value="${_selectedSection.number || ''}" placeholder="e.g., 103">
              </div>
              <div class="studio-form-group">
                <label class="studio-form-label">Title</label>
                <input class="studio-form-input" id="sectionTitle" value="${_selectedSection.title || ''}" placeholder="Section title">
              </div>
              <div class="studio-form-group">
                <label class="studio-form-label">Type</label>
                <select class="studio-form-input studio-form-select" id="sectionType">
                  ${['part', 'chapter', 'section', 'subsection', 'clause', 'explanation', 'illustration', 'exception', 'schedule'].map(t =>
                    `<option value="${t}" ${_selectedSection.type === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`
                  ).join('')}
                </select>
              </div>
              <div class="studio-form-group">
                <label class="studio-form-label">Content</label>
                <div id="sectionEditorContainer"></div>
              </div>
              <div class="studio-form-group">
                <label class="studio-form-label">Keywords (comma separated)</label>
                <input class="studio-form-input" id="sectionKeywords" value="${(_selectedSection.keywords || []).join(', ')}">
              </div>
            </div>
          ` : `
            <div class="studio-section-body">
              ${Studio.UI.emptyState('file-text', 'No Section Selected', 'Click a section in the hierarchy to edit')}
            </div>
          `}
        </div>

        <!-- Version History -->
        <div class="studio-section" style="max-height:600px;overflow-y:auto;">
          <div class="studio-section-header" style="padding:10px 14px;">
            <span class="studio-section-title" style="font-size:0.82rem;">Version History</span>
          </div>
          <div style="padding:8px;">
            ${_versions.length === 0 ?
              '<div style="padding:16px;text-align:center;color:var(--text-tertiary);font-size:0.78rem;">No version history</div>' :
              _versions.slice(0, 20).map(v => `
                <div class="version-item" data-timestamp="${v.timestamp}" style="padding:8px;border-radius:6px;margin-bottom:4px;cursor:pointer;transition:background 0.1s;">
                  <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-size:0.78rem;font-weight:500;color:var(--text-primary);">${v.action.replace(/_/g, ' ')}</span>
                    <span style="font-size:0.65rem;color:var(--text-tertiary);">v${v.version}</span>
                  </div>
                  <div style="font-size:0.7rem;color:var(--text-tertiary);margin-top:2px;">
                    ${v.userName || 'System'} — ${new Date(v.timestamp).toLocaleString()}
                  </div>
                </div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  return {
    async render() {
      if (_view === 'edit' && _selectedAct) {
        await loadAct(_selectedAct.id);
        await loadVersions(_selectedAct.id);
        return renderActEditor();
      }

      await loadActs();

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Knowledge OS</h1>
            <p class="studio-module-subtitle">${_stats ? `${_stats.totalActs} acts, ${_stats.totalSections} sections` : 'Manage legal knowledge with full hierarchy'}</p>
          </div>
          <div class="studio-module-actions">
            <div style="position:relative;">
              <i data-lucide="search" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--text-tertiary);"></i>
              <input class="studio-form-input" id="lkosSearch" placeholder="Search acts..." value="${_searchQuery}" style="padding-left:28px;width:200px;padding:6px 10px 6px 28px;font-size:0.82rem;">
            </div>
            <select class="studio-form-input studio-form-select" id="lkosStatusFilter" style="width:120px;padding:6px 8px;font-size:0.82rem;">
              <option value="">All Status</option>
              <option value="draft" ${_filterStatus === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="published" ${_filterStatus === 'published' ? 'selected' : ''}>Published</option>
              <option value="archived" ${_filterStatus === 'archived' ? 'selected' : ''}>Archived</option>
            </select>
            ${Studio.UI.btn('Create Act', { icon: 'plus', variant: 'primary', id: 'createActBtn' })}
            ${Studio.UI.btn('Reset & Rebuild', { icon: 'refresh-cw', variant: 'danger', id: 'rebuildBtn' })}
          </div>
        </div>

        ${_stats ? `
          <div class="studio-stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr));margin-bottom:20px;">
            ${Studio.UI.statCard('book-open', _stats.totalActs, 'Total Acts')}
            ${Studio.UI.statCard('check-circle', _stats.published, 'Published', { iconClass: 'success' })}
            ${Studio.UI.statCard('edit', _stats.draft, 'Drafts', { iconClass: 'warning' })}
            ${Studio.UI.statCard('archive', _stats.archived, 'Archived', { iconClass: 'neutral' })}
            ${Studio.UI.statCard('list', _stats.totalSections, 'Total Sections')}
          </div>
        ` : ''}

        <div id="rebuildProgress" style="display:none;padding:12px;background:var(--bg-secondary);border-radius:8px;margin-bottom:16px;border:1px solid var(--border);"></div>

        ${renderActList()}`;
    },

    mount() {
      // Search
      document.getElementById('lkosSearch')?.addEventListener('input', (e) => {
        _searchQuery = e.target.value;
        Studio.Router.handleRoute();
      });

      // Status filter
      document.getElementById('lkosStatusFilter')?.addEventListener('change', (e) => {
        _filterStatus = e.target.value;
        Studio.Router.handleRoute();
      });

      // Reset & Rebuild
      document.getElementById('rebuildBtn')?.addEventListener('click', () => {
        Studio.Modal.confirm(
          'Reset & Rebuild Knowledge',
          'This will reset generated Knowledge OS indexes and rebuild them from the current legal source corpus. Original source files will not be deleted.',
          async () => {
            const progressEl = document.getElementById('rebuildProgress');
            if (progressEl) {
              progressEl.style.display = 'block';
              progressEl.innerHTML = '<div class="studio-loading-spinner" style="width:20px;height:20px;"></div> <span style="margin-left:8px;">Preparing...</span>';
            }

            // Listen for SSE rebuild events
            const onRebuildEvent = (event) => {
              if (progressEl && event.stage) {
                const stageLabels = {
                  preparing: 'Preparing...',
                  discovering: 'Discovering sources...',
                  discovered: event.message || 'Sources discovered',
                  processing: event.message || 'Processing...',
                  indexing: 'Building chunks index...',
                  graphing: 'Building knowledge graph...',
                  complete: 'Rebuild complete!',
                  error: event.message || 'Error occurred'
                };
                const label = stageLabels[event.stage] || event.stage;
                const spinner = event.stage === 'complete' ? '' : '<div class="studio-loading-spinner" style="width:20px;height:20px;"></div> ';
                const color = event.stage === 'complete' ? 'color:var(--success)' : event.stage === 'error' ? 'color:var(--error)' : '';
                progressEl.innerHTML = `${spinner}<span style="margin-left:8px;${color}">${label}</span>`;
              }
            };
            _rebuildUnsub = Studio.Events.on('sse:lkos:rebuild', onRebuildEvent);

            try {
              const res = await Studio.api('/studio/lkos/rebuild', { method: 'POST' });
              Studio.Toast.success('Knowledge OS rebuilt successfully');
              // Show summary
              if (progressEl && res.data) {
                const d = res.data;
                progressEl.innerHTML = `
                  <div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;margin-top:8px;">
                    <div style="font-weight:600;margin-bottom:8px;color:var(--text-primary);">Rebuild Complete (${(d.duration / 1000).toFixed(1)}s)</div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;font-size:0.82rem;">
                      <div><span style="color:var(--text-tertiary);">Sources:</span> <strong>${d.sourcesDiscovered}</strong></div>
                      <div><span style="color:var(--text-tertiary);">Created:</span> <strong>${d.created}</strong></div>
                      <div><span style="color:var(--text-tertiary);">Acts:</span> <strong>${d.acts}</strong></div>
                      <div><span style="color:var(--text-tertiary);">Sections:</span> <strong>${d.sections}</strong></div>
                      <div><span style="color:var(--text-tertiary);">Chunks:</span> <strong>${d.chunks}</strong></div>
                      <div><span style="color:var(--text-tertiary);">Graph Nodes:</span> <strong>${d.graphNodes}</strong></div>
                      <div><span style="color:var(--text-tertiary);">Errors:</span> <strong>${d.errors}</strong></div>
                    </div>
                  </div>`;
              }
              await loadActs();
              Studio.Router.handleRoute();
            } catch (err) {
              Studio.Toast.error('Rebuild failed: ' + err.message);
              if (progressEl) progressEl.innerHTML = '<span style="color:var(--error);">Rebuild failed</span>';
            } finally {
              if (_rebuildUnsub) { _rebuildUnsub(); _rebuildUnsub = null; }
            }
          }
        );
      });

      // Create act
      const createAct = async () => {
        Studio.Modal.show({
          title: 'Create New Act',
          body: `
            <div class="studio-form-group"><label class="studio-form-label">Title *</label><input class="studio-form-input" id="newActTitle" placeholder="e.g., Bharatiya Nyaya Sanhita 2023"></div>
            <div class="studio-form-group"><label class="studio-form-label">Act Number</label><input class="studio-form-input" id="newActNumber" placeholder="e.g., 45"></div>
            <div class="studio-form-group"><label class="studio-form-label">Year</label><input class="studio-form-input" id="newActYear" type="number" placeholder="2023"></div>
            <div class="studio-form-group"><label class="studio-form-label">Authority</label><input class="studio-form-input" id="newActAuthority" placeholder="e.g., Legislative Department"></div>
            <div class="studio-form-group"><label class="studio-form-label">Description</label><textarea class="studio-form-input studio-form-textarea" id="newActDesc" style="min-height:80px;"></textarea></div>`,
          footer: `
            <button class="studio-btn studio-btn-secondary" onclick="Studio.Modal.hide()">Cancel</button>
            <button class="studio-btn studio-btn-primary" id="saveNewAct">Create</button>`
        });
        document.getElementById('saveNewAct')?.addEventListener('click', async () => {
          const title = document.getElementById('newActTitle')?.value;
          if (!title) { Studio.Toast.error('Title required'); return; }
          try {
            const res = await Studio.api('/studio/lkos/acts', {
              method: 'POST', body: {
                title, actNumber: document.getElementById('newActNumber')?.value,
                year: document.getElementById('newActYear')?.value,
                authority: document.getElementById('newActAuthority')?.value,
                description: document.getElementById('newActDesc')?.value
              }
            });
            Studio.Toast.success('Act created');
            Studio.Modal.hide();
            _selectedAct = res.data;
            _view = 'edit';
            Studio.Router.handleRoute();
          } catch (err) { Studio.Toast.error(err.message); }
        });
      };
      document.getElementById('createActBtn')?.addEventListener('click', createAct);
      document.getElementById('createActBtnEmpty')?.addEventListener('click', createAct);

      // Act card clicks
      document.querySelectorAll('.act-card').forEach(card => {
        card.addEventListener('click', async () => {
          const id = card.dataset.actId;
          _selectedAct = { id };
          _view = 'edit';
          Studio.Router.handleRoute();
        });
      });

      // Editor events
      if (_view === 'edit' && _selectedAct) {
        document.getElementById('backToList')?.addEventListener('click', () => {
          _view = 'list'; _selectedAct = null; _selectedSection = null;
          Studio.Router.handleRoute();
        });

        document.getElementById('publishAct')?.addEventListener('click', async () => {
          try {
            await Studio.api(`/studio/lkos/acts/${_selectedAct.id}/publish`, { method: 'POST' });
            Studio.Toast.success('Act published');
            await loadAct(_selectedAct.id);
            Studio.Router.handleRoute();
          } catch (err) { Studio.Toast.error(err.message); }
        });

        document.getElementById('archiveAct')?.addEventListener('click', async () => {
          try {
            await Studio.api(`/studio/lkos/acts/${_selectedAct.id}/archive`, { method: 'POST' });
            Studio.Toast.success('Act archived');
            _view = 'list'; _selectedAct = null;
            Studio.Router.handleRoute();
          } catch (err) { Studio.Toast.error(err.message); }
        });

        document.getElementById('addSectionBtn')?.addEventListener('click', async () => {
          Studio.Modal.show({
            title: 'Add Section',
            body: `
              <div class="studio-form-group"><label class="studio-form-label">Type</label>
                <select class="studio-form-input studio-form-select" id="newSecType">
                  ${['section', 'part', 'chapter', 'subsection', 'clause', 'explanation', 'illustration'].map(t =>
                    `<option value="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
                </select>
              </div>
              <div class="studio-form-group"><label class="studio-form-label">Number</label><input class="studio-form-input" id="newSecNumber" placeholder="e.g., 103"></div>
              <div class="studio-form-group"><label class="studio-form-label">Title</label><input class="studio-form-input" id="newSecTitle" placeholder="Section title"></div>
              <div class="studio-form-group"><label class="studio-form-label">Parent Section (optional)</label><input class="studio-form-input" id="newSecParent" placeholder="Leave empty for top-level"></div>`,
            footer: `
              <button class="studio-btn studio-btn-secondary" onclick="Studio.Modal.hide()">Cancel</button>
              <button class="studio-btn studio-btn-primary" id="saveNewSection">Add</button>`
          });
          document.getElementById('saveNewSection')?.addEventListener('click', async () => {
            try {
              await Studio.api(`/studio/lkos/acts/${_selectedAct.id}/sections`, {
                method: 'POST', body: {
                  type: document.getElementById('newSecType')?.value,
                  number: document.getElementById('newSecNumber')?.value,
                  title: document.getElementById('newSecTitle')?.value,
                  parentId: document.getElementById('newSecParent')?.value || null
                }
              });
              Studio.Toast.success('Section added');
              Studio.Modal.hide();
              await loadAct(_selectedAct.id);
              Studio.Router.handleRoute();
            } catch (err) { Studio.Toast.error(err.message); }
          });
        });

        // Tree node clicks
        document.querySelectorAll('.tree-node').forEach(node => {
          node.addEventListener('click', (e) => {
            if (e.target.closest('.tree-toggle')) return;
            const id = node.dataset.id;
            _selectedSection = this._findSection(_selectedAct, id);
            Studio.Router.handleRoute();
          });
        });

        // Tree toggle
        document.querySelectorAll('.tree-toggle').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const children = document.querySelector(`[data-parent="${id}"]`);
            if (children) children.style.display = children.style.display === 'none' ? 'block' : 'none';
          });
        });

        // Save section
        document.getElementById('saveSectionBtn')?.addEventListener('click', async () => {
          if (!_selectedSection) return;
          try {
            await Studio.api(`/studio/lkos/acts/${_selectedAct.id}/sections/${_selectedSection.id}`, {
              method: 'PUT', body: {
                number: document.getElementById('sectionNumber')?.value,
                title: document.getElementById('sectionTitle')?.value,
                type: document.getElementById('sectionType')?.value,
                keywords: (document.getElementById('sectionKeywords')?.value || '').split(',').map(k => k.trim()).filter(Boolean)
              }
            });
            Studio.Toast.success('Section saved');
            await loadAct(_selectedAct.id);
            Studio.Router.handleRoute();
          } catch (err) { Studio.Toast.error(err.message); }
        });

        // Delete section
        document.getElementById('deleteSectionBtn')?.addEventListener('click', async () => {
          if (!_selectedSection) return;
          Studio.Modal.confirm('Delete Section', `Delete "${_selectedSection.title || _selectedSection.number}"?`, async () => {
            try {
              await Studio.api(`/studio/lkos/acts/${_selectedAct.id}/sections/${_selectedSection.id}`, { method: 'DELETE' });
              Studio.Toast.success('Section deleted');
              _selectedSection = null;
              await loadAct(_selectedAct.id);
              Studio.Router.handleRoute();
            } catch (err) { Studio.Toast.error(err.message); }
          });
        });

        // Initialize rich editor for section content
        const editorContainer = document.getElementById('sectionEditorContainer');
        if (editorContainer && window.StudioRichEditor) {
          this._richEditor = StudioRichEditor.create(editorContainer, {
            content: _selectedSection?.content || '',
            placeholder: 'Enter section content...'
          });
        }

        // Version restore
        document.querySelectorAll('.version-item').forEach(item => {
          item.addEventListener('click', async () => {
            const timestamp = item.dataset.timestamp;
            Studio.Modal.confirm('Restore Version', 'Restore this version? Current changes will be saved as a new version.', async () => {
              try {
                await Studio.api(`/studio/lkos/acts/${_selectedAct.id}/versions/${encodeURIComponent(timestamp)}/restore`, { method: 'POST' });
                Studio.Toast.success('Version restored');
                await loadAct(_selectedAct.id);
                Studio.Router.handleRoute();
              } catch (err) { Studio.Toast.error(err.message); }
            });
          });
        });
      }
    },

    _findSection(act, id) {
      function search(node) {
        if (node.id === id) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = search(child);
            if (found) return found;
          }
        }
        if (node.parts) {
          for (const part of node.parts) {
            const found = search(part);
            if (found) return found;
          }
        }
        return null;
      }
      return search(act);
    },

    unmount() {
      if (_rebuildUnsub) { _rebuildUnsub(); _rebuildUnsub = null; }
      _selectedAct = null; _selectedSection = null; _versions = [];
      _view = 'list'; _searchQuery = ''; _filterStatus = '';
      if (this._richEditor) this._richEditor = null;
    }
  };
});
