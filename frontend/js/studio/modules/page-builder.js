/**
 * LawLens Studio — Page Builder Module
 * Visual drag-and-drop page builder with blocks
 */

Studio.Modules.register('page-builder', () => {
  let _pages = [];
  let _currentPage = null;
  let _blocks = [];
  let _selectedBlock = null;
  let _previewMode = 'desktop';

  const BLOCK_TYPES = [
    { type: 'hero', label: 'Hero', icon: 'layout', desc: 'Full-width hero section' },
    { type: 'cards', label: 'Cards Grid', icon: 'grid-3x3', desc: 'Grid of content cards' },
    { type: 'search', label: 'Search Bar', icon: 'search', desc: 'Search component' },
    { type: 'stats', label: 'Statistics', icon: 'bar-chart-3', desc: 'Stats with numbers' },
    { type: 'knowledge', label: 'Knowledge Cards', icon: 'database', desc: 'Featured knowledge items' },
    { type: 'timeline', label: 'Timeline', icon: 'clock', desc: 'Timeline view' },
    { type: 'faq', label: 'FAQ', icon: 'help-circle', desc: 'Frequently asked questions' },
    { type: 'text', label: 'Text Block', icon: 'type', desc: 'Rich text content' },
    { type: 'image', label: 'Image', icon: 'image', desc: 'Image with caption' },
    { type: 'divider', label: 'Divider', icon: 'minus', desc: 'Horizontal divider' },
    { type: 'cta', label: 'Call to Action', icon: 'mouse-pointer-click', desc: 'CTA button section' },
    { type: 'footer', label: 'Footer', icon: 'layout-template', desc: 'Page footer' }
  ];

  async function loadPages() {
    try {
      const res = await Studio.api('/studio/pages');
      _pages = res.data || [];
    } catch (err) {
      _pages = [];
    }
  }

  function renderBlockPalette() {
    return `
      <div style="width:200px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:12px;flex-shrink:0;">
        <div style="font-size:0.78rem;font-weight:600;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Blocks</div>
        ${BLOCK_TYPES.map(bt => `
          <div class="block-palette-item" data-type="${bt.type}" draggable="true"
               style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;cursor:grab;transition:background 0.15s;margin-bottom:2px;">
            <i data-lucide="${bt.icon}" style="width:14px;height:14px;color:var(--text-tertiary);"></i>
            <span style="font-size:0.78rem;color:var(--text-secondary);">${bt.label}</span>
          </div>`).join('')}
      </div>`;
  }

  function renderBlockCanvas() {
    if (_blocks.length === 0) {
      return `
        <div id="blockCanvas" style="flex:1;min-height:400px;border:2px dashed var(--border-color);border-radius:12px;display:flex;align-items:center;justify-content:center;transition:border-color 0.2s;">
          <div style="text-align:center;color:var(--text-tertiary);">
            <i data-lucide="mouse-pointer-click" style="width:32px;height:32px;margin-bottom:8px;"></i>
            <div style="font-size:0.9rem;">Drag blocks here to build your page</div>
            <div style="font-size:0.78rem;margin-top:4px;">Or click a block from the palette</div>
          </div>
        </div>`;
    }

    return `
      <div id="blockCanvas" style="flex:1;min-height:400px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:16px;">
        ${_blocks.map((block, i) => renderBlock(block, i)).join('')}
      </div>`;
  }

  function renderBlock(block, index) {
    const bt = BLOCK_TYPES.find(b => b.type === block.type) || { label: block.type, icon: 'square' };
    const isSelected = _selectedBlock === index;

    return `
      <div class="builder-block ${isSelected ? 'selected' : ''}" data-index="${index}" draggable="true"
           style="border:1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'};border-radius:8px;padding:12px;margin-bottom:8px;background:var(--bg-secondary);cursor:grab;transition:border-color 0.15s;position:relative;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:8px;">
            <i data-lucide="grip-vertical" style="width:14px;height:14px;color:var(--text-tertiary);"></i>
            <i data-lucide="${bt.icon}" style="width:14px;height:14px;color:var(--accent-primary);"></i>
            <span style="font-size:0.82rem;font-weight:500;color:var(--text-primary);">${bt.label}</span>
            ${block.config?.title ? `<span style="font-size:0.72rem;color:var(--text-tertiary);">— ${block.config.title}</span>` : ''}
          </div>
          <div style="display:flex;gap:2px;">
            <button class="studio-btn studio-btn-ghost studio-btn-sm block-up" data-index="${index}" title="Move up"><i data-lucide="chevron-up" style="width:12px;height:12px;"></i></button>
            <button class="studio-btn studio-btn-ghost studio-btn-sm block-down" data-index="${index}" title="Move down"><i data-lucide="chevron-down" style="width:12px;height:12px;"></i></button>
            <button class="studio-btn studio-btn-danger studio-btn-sm block-delete" data-index="${index}" title="Delete"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
          </div>
        </div>
        <div style="margin-top:8px;padding:8px;background:var(--bg-tertiary);border-radius:6px;font-size:0.75rem;color:var(--text-tertiary);">
          ${renderBlockPreview(block)}
        </div>
      </div>`;
  }

  function renderBlockPreview(block) {
    const c = block.config || {};
    switch (block.type) {
      case 'hero': return `Hero: ${c.title || 'Untitled'} — ${c.subtitle || ''}`;
      case 'cards': return `Cards Grid — ${c.columns || 3} columns`;
      case 'search': return `Search Bar — ${c.placeholder || 'Search...'}`;
      case 'stats': return `Statistics — ${c.items?.length || 0} items`;
      case 'knowledge': return `Knowledge Cards — ${c.limit || 6} items`;
      case 'text': return `Text: ${(c.content || 'Empty').substring(0, 80)}...`;
      case 'faq': return `FAQ — ${c.items?.length || 0} questions`;
      case 'divider': return `Divider — ${c.style || 'solid'}`;
      case 'cta': return `CTA: ${c.buttonText || 'Click Here'}`;
      default: return block.type;
    }
  }

  function renderProperties() {
    if (_selectedBlock === null || !_blocks[_selectedBlock]) {
      return `
        <div style="width:260px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:16px;flex-shrink:0;">
          <div style="font-size:0.78rem;font-weight:600;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Properties</div>
          <div style="text-align:center;padding:24px;color:var(--text-tertiary);font-size:0.82rem;">Select a block to edit</div>
        </div>`;
    }

    const block = _blocks[_selectedBlock];
    const bt = BLOCK_TYPES.find(b => b.type === block.type);

    return `
      <div style="width:260px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:16px;flex-shrink:0;">
        <div style="font-size:0.78rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">Properties</div>
        <div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);margin-bottom:12px;">${bt?.label || block.type}</div>
        <div class="studio-form-group">
          <label class="studio-form-label">Title</label>
          <input class="studio-form-input" id="blockTitle" value="${block.config?.title || ''}" placeholder="Block title">
        </div>
        <div class="studio-form-group">
          <label class="studio-form-label">Subtitle</label>
          <input class="studio-form-input" id="blockSubtitle" value="${block.config?.subtitle || ''}" placeholder="Subtitle">
        </div>
        ${block.type === 'text' ? `
          <div class="studio-form-group">
            <label class="studio-form-label">Content</label>
            <textarea class="studio-form-input studio-form-textarea" id="blockContent" style="min-height:100px;">${block.config?.content || ''}</textarea>
          </div>` : ''}
        ${block.type === 'hero' ? `
          <div class="studio-form-group">
            <label class="studio-form-label">Background</label>
            <input class="studio-form-input" id="blockBg" value="${block.config?.background || ''}" placeholder="URL or color">
          </div>` : ''}
        ${block.type === 'stats' ? `
          <div class="studio-form-group">
            <label class="studio-form-label">Items (JSON)</label>
            <textarea class="studio-form-input studio-form-textarea" id="blockItems" style="min-height:80px;font-family:var(--font-mono);font-size:0.75rem;">${JSON.stringify(block.config?.items || [], null, 2)}</textarea>
          </div>` : ''}
        <div style="margin-top:12px;">
          ${Studio.UI.btn('Apply', { icon: 'check', variant: 'primary', size: 'sm', id: 'applyBlockProps' })}
        </div>
      </div>`;
  }

  function addBlock(type) {
    const block = { type, config: { title: '', subtitle: '', content: '' }, id: `block-${Date.now()}` };
    _blocks.push(block);
    _selectedBlock = _blocks.length - 1;
    refreshCanvas();
  }

  function refreshCanvas() {
    const canvas = document.getElementById('blockCanvas');
    const props = document.getElementById('blockProperties');
    if (canvas) {
      canvas.outerHTML = renderBlockCanvas();
      if (window.lucide) lucide.createIcons();
      bindBlockEvents();
    }
    if (props) {
      props.innerHTML = renderProperties();
      bindPropertyEvents();
    }
  }

  function bindBlockEvents() {
    document.querySelectorAll('.builder-block').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.block-up') || e.target.closest('.block-down') || e.target.closest('.block-delete')) return;
        _selectedBlock = parseInt(el.dataset.index);
        refreshCanvas();
      });
    });

    document.querySelectorAll('.block-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = parseInt(btn.dataset.index);
        if (i > 0) { [_blocks[i - 1], _blocks[i]] = [_blocks[i], _blocks[i - 1]]; _selectedBlock = i - 1; refreshCanvas(); }
      });
    });

    document.querySelectorAll('.block-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = parseInt(btn.dataset.index);
        if (i < _blocks.length - 1) { [_blocks[i], _blocks[i + 1]] = [_blocks[i + 1], _blocks[i]]; _selectedBlock = i + 1; refreshCanvas(); }
      });
    });

    document.querySelectorAll('.block-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = parseInt(btn.dataset.index);
        _blocks.splice(i, 1);
        _selectedBlock = null;
        refreshCanvas();
      });
    });

    // Palette click to add
    document.querySelectorAll('.block-palette-item').forEach(el => {
      el.addEventListener('click', () => addBlock(el.dataset.type));
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', el.dataset.type);
      });
    });

    // Drop zone
    const canvas = document.getElementById('blockCanvas');
    if (canvas) {
      canvas.addEventListener('dragover', (e) => { e.preventDefault(); canvas.style.borderColor = 'var(--accent-primary)'; });
      canvas.addEventListener('dragleave', () => { canvas.style.borderColor = ''; });
      canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        canvas.style.borderColor = '';
        const type = e.dataTransfer.getData('text/plain');
        if (type) addBlock(type);
      });
    }
  }

  function bindPropertyEvents() {
    document.getElementById('applyBlockProps')?.addEventListener('click', () => {
      if (_selectedBlock === null || !_blocks[_selectedBlock]) return;
      const block = _blocks[_selectedBlock];
      block.config = block.config || {};
      block.config.title = document.getElementById('blockTitle')?.value || '';
      block.config.subtitle = document.getElementById('blockSubtitle')?.value || '';
      const content = document.getElementById('blockContent');
      if (content) block.config.content = content.value;
      const bg = document.getElementById('blockBg');
      if (bg) block.config.background = bg.value;
      const items = document.getElementById('blockItems');
      if (items) {
        try { block.config.items = JSON.parse(items.value); } catch {}
      }
      Studio.Toast.success('Block updated');
      refreshCanvas();
    });
  }

  return {
    async render() {
      await loadPages();

      if (_currentPage) {
        return `
          <div class="studio-module-header">
            <div>
              <h1 class="studio-module-title">Page Builder</h1>
              <p class="studio-module-subtitle">Editing: ${_currentPage.name}</p>
            </div>
            <div class="studio-module-actions">
              <div style="display:flex;gap:4px;">
                <button class="studio-btn studio-btn-ghost studio-btn-sm ${_previewMode === 'desktop' ? 'active' : ''}" data-preview="desktop"><i data-lucide="monitor" style="width:14px;height:14px;"></i></button>
                <button class="studio-btn studio-btn-ghost studio-btn-sm ${_previewMode === 'tablet' ? 'active' : ''}" data-preview="tablet"><i data-lucide="tablet" style="width:14px;height:14px;"></i></button>
                <button class="studio-btn studio-btn-ghost studio-btn-sm ${_previewMode === 'mobile' ? 'active' : ''}" data-preview="mobile"><i data-lucide="smartphone" style="width:14px;height:14px;"></i></button>
              </div>
              ${Studio.UI.btn('Back to Pages', { icon: 'arrow-left', size: 'sm', id: 'backToPages' })}
              ${Studio.UI.btn('Save', { icon: 'save', variant: 'primary', size: 'sm', id: 'savePageBtn' })}
            </div>
          </div>
          <div style="display:flex;gap:16px;">
            ${renderBlockPalette()}
            <div style="flex:1;min-width:0;">
              ${renderBlockCanvas()}
            </div>
            <div id="blockProperties">
              ${renderProperties()}
            </div>
          </div>`;
      }

      // Page list view
      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Page Builder</h1>
            <p class="studio-module-subtitle">${_pages.length} page${_pages.length !== 1 ? 's' : ''}</p>
          </div>
          <div class="studio-module-actions">
            ${Studio.UI.btn('New Page', { icon: 'plus', variant: 'primary', id: 'newPageBtn' })}
          </div>
        </div>

        ${_pages.length === 0 ?
          Studio.UI.emptyState('layout', 'No Pages', 'Create your first page to start building') :
          `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
            ${_pages.map(p => `
              <div class="studio-section" style="cursor:pointer;" data-page-id="${p.id}">
                <div class="studio-section-body">
                  <div style="display:flex;align-items:start;justify-content:space-between;">
                    <div>
                      <div style="font-weight:600;color:var(--text-primary);">${p.name}</div>
                      <div style="font-size:0.78rem;color:var(--text-tertiary);">${p.blocks?.length || 0} blocks</div>
                    </div>
                    <button class="studio-btn studio-btn-danger studio-btn-sm delete-page" data-id="${p.id}"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                  </div>
                  <div style="font-size:0.72rem;color:var(--text-tertiary);margin-top:8px;">
                    Updated: ${p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              </div>`).join('')}
          </div>`}`;
    },

    mount() {
      // Page list events
      document.querySelectorAll('[data-page-id]').forEach(el => {
        el.addEventListener('click', (e) => {
          if (e.target.closest('.delete-page')) return;
          const id = el.dataset.pageId;
          _currentPage = _pages.find(p => p.id === id);
          _blocks = _currentPage?.blocks || [];
          _selectedBlock = null;
          Studio.Router.handleRoute();
        });
      });

      document.querySelectorAll('.delete-page').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          Studio.Modal.confirm('Delete Page', 'Delete this page?', async () => {
            try {
              await Studio.api(`/studio/pages/${btn.dataset.id}`, { method: 'DELETE' });
              Studio.Toast.success('Page deleted');
              await loadPages();
              Studio.Router.handleRoute();
            } catch (err) { Studio.Toast.error(err.message); }
          });
        });
      });

      document.getElementById('newPageBtn')?.addEventListener('click', async () => {
        try {
          const res = await Studio.api('/studio/pages', {
            method: 'POST',
            body: { name: 'New Page', slug: 'new-page', blocks: [] }
          });
          _currentPage = res.data;
          _blocks = [];
          _selectedBlock = null;
          Studio.Router.handleRoute();
        } catch (err) { Studio.Toast.error(err.message); }
      });

      // Editor events
      document.getElementById('backToPages')?.addEventListener('click', () => {
        _currentPage = null;
        _blocks = [];
        _selectedBlock = null;
        Studio.Router.handleRoute();
      });

      document.getElementById('savePageBtn')?.addEventListener('click', async () => {
        if (!_currentPage) return;
        try {
          await Studio.api('/studio/pages', {
            method: 'POST',
            body: { ..._currentPage, blocks: _blocks }
          });
          Studio.Toast.success('Page saved');
        } catch (err) { Studio.Toast.error(err.message); }
      });

      document.querySelectorAll('[data-preview]').forEach(btn => {
        btn.addEventListener('click', () => {
          _previewMode = btn.dataset.preview;
          Studio.Router.handleRoute();
        });
      });

      bindBlockEvents();
      bindPropertyEvents();
    },

    unmount() { _currentPage = null; _blocks = []; _selectedBlock = null; _previewMode = 'desktop'; }
  };
});
