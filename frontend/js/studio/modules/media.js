/**
 * LawLens Studio — Media Library Module
 */

Studio.Modules.register('media', () => {
  let _viewMode = 'grid';

  return {
    async render() {
      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Media Library</h1>
            <p class="studio-module-subtitle">Manage files and media assets</p>
          </div>
          <div class="studio-module-actions">
            <div style="display:flex;gap:4px;">
              <button class="studio-btn studio-btn-ghost studio-btn-sm ${_viewMode === 'grid' ? 'active' : ''}" data-view="grid"><i data-lucide="grid-3x3"></i></button>
              <button class="studio-btn studio-btn-ghost studio-btn-sm ${_viewMode === 'list' ? 'active' : ''}" data-view="list"><i data-lucide="list"></i></button>
            </div>
            ${Studio.UI.btn('Upload', { icon: 'upload', variant: 'primary', id: 'mediaUploadBtn' })}
          </div>
        </div>

        <div class="studio-section">
          <div class="studio-section-body">
            <div id="mediaDropZone" style="border:2px dashed var(--border-color);border-radius:12px;padding:40px 24px;text-align:center;cursor:pointer;transition:all 0.2s;">
              <div style="width:40px;height:40px;border-radius:10px;background:var(--accent-glow);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
                <i data-lucide="image-plus" style="width:20px;height:20px;color:var(--accent-primary);"></i>
              </div>
              <div style="font-size:0.9rem;font-weight:600;color:var(--text-primary);margin-bottom:4px;">Upload files</div>
              <div style="font-size:0.78rem;color:var(--text-tertiary);">Drag and drop or click to browse</div>
              <input type="file" id="mediaFileInput" style="display:none;" multiple>
            </div>
          </div>
        </div>

        ${Studio.UI.section('Files', `
          ${Studio.UI.emptyState('folder', 'No Files Yet', 'Upload your first file to get started')}
        `)}
      `;
    },

    mount() {
      const dropZone = document.getElementById('mediaDropZone');
      const fileInput = document.getElementById('mediaFileInput');
      dropZone?.addEventListener('click', () => fileInput?.click());

      document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
          _viewMode = btn.dataset.view;
          Studio.Router.handleRoute();
        });
      });
    },

    unmount() { _viewMode = 'grid'; }
  };
});
