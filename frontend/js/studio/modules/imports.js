/**
 * LawLens Studio — Import Center Module
 */

Studio.Modules.register('imports', () => {
  let _step = 'upload';
  let _selectedFile = null;
  let _importHistory = [];

  return {
    async render() {
      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Import Center</h1>
            <p class="studio-module-subtitle">Import legal documents into the knowledge base</p>
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:24px;">
          ${Studio.UI.badge('1. Upload', _step === 'upload' ? 'primary' : 'neutral')}
          ${Studio.UI.badge('2. Preview', _step === 'preview' ? 'primary' : 'neutral')}
          ${Studio.UI.badge('3. Approve', _step === 'approve' ? 'primary' : 'neutral')}
        </div>

        ${_step === 'upload' ? `
          <div class="studio-section">
            <div class="studio-section-body">
              <div id="importDropZone" style="border:2px dashed var(--border-color);border-radius:12px;padding:48px 24px;text-align:center;cursor:pointer;transition:all 0.2s;">
                <div style="width:48px;height:48px;border-radius:12px;background:var(--accent-glow);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                  <i data-lucide="upload-cloud" style="width:24px;height:24px;color:var(--accent-primary);"></i>
                </div>
                <div style="font-size:1rem;font-weight:600;color:var(--text-primary);margin-bottom:4px;">Drop files here or click to browse</div>
                <div style="font-size:0.82rem;color:var(--text-tertiary);">Supports JSON, PDF, TXT, MD, DOCX</div>
                <input type="file" id="importFileInput" accept=".json,.pdf,.txt,.md,.docx" style="display:none;" multiple>
              </div>
            </div>
          </div>
        ` : _step === 'preview' ? `
          <div class="studio-section">
            <div class="studio-section-header">
              <span class="studio-section-title">File Preview</span>
              <div style="display:flex;gap:6px;">
                ${Studio.UI.btn('Back', { icon: 'arrow-left', size: 'sm', id: 'previewBackBtn' })}
                ${Studio.UI.btn('Import', { icon: 'check', variant: 'primary', size: 'sm', id: 'previewImportBtn' })}
              </div>
            </div>
            <div class="studio-section-body">
              <div style="padding:24px;text-align:center;color:var(--text-secondary);">
                <p>File: <strong>${_selectedFile?.name || 'Unknown'}</strong></p>
                <p style="font-size:0.82rem;color:var(--text-tertiary);margin-top:8px;">Preview will be available after processing</p>
              </div>
            </div>
          </div>
        ` : `
          <div class="studio-section">
            <div class="studio-section-body">
              ${Studio.UI.emptyState('check-circle', 'Import Complete', 'Your document has been imported successfully')}
            </div>
          </div>
        `}

        ${Studio.UI.section('Recent Imports', `
          <div style="text-align:center;padding:24px;color:var(--text-tertiary);font-size:0.85rem;">
            No recent imports
          </div>
        `)}
      `;
    },

    mount() {
      const dropZone = document.getElementById('importDropZone');
      const fileInput = document.getElementById('importFileInput');

      dropZone?.addEventListener('click', () => fileInput?.click());
      dropZone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--accent-primary)';
        dropZone.style.background = 'var(--accent-glow)';
      });
      dropZone?.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '';
        dropZone.style.background = '';
      });
      dropZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '';
        dropZone.style.background = '';
        if (e.dataTransfer.files.length > 0) {
          _selectedFile = e.dataTransfer.files[0];
          _step = 'preview';
          Studio.Router.handleRoute();
        }
      });

      fileInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          _selectedFile = e.target.files[0];
          _step = 'preview';
          Studio.Router.handleRoute();
        }
      });

      document.getElementById('previewBackBtn')?.addEventListener('click', () => {
        _step = 'upload';
        _selectedFile = null;
        Studio.Router.handleRoute();
      });

      document.getElementById('previewImportBtn')?.addEventListener('click', () => {
        _step = 'approve';
        Studio.Toast.success('File imported successfully');
        Studio.Router.handleRoute();
      });
    },

    unmount() { _step = 'upload'; _selectedFile = null; }
  };
});
