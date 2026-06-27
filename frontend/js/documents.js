let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.docs-page')) return;

  initUpload();
  loadLibrary();
  initFilters();
});

function initUpload() {
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('docFileInput');

  if (zone) {
    zone.addEventListener('click', () => fileInput?.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files[0]);
    });
  }
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) handleUpload(fileInput.files[0]);
    });
  }
}

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadLibrary();
    });
  });
}

async function handleUpload(file) {
  const allowedTypes = ['.pdf', '.docx', '.txt', '.md', '.json'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedTypes.includes(ext)) {
    Utils.showToast('Unsupported file type. Use PDF, DOCX, TXT, MD, or JSON.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    Utils.showToast('File too large (max 10MB)', 'error');
    return;
  }

  const progressEl = document.getElementById('uploadProgress');
  const resultEl = document.getElementById('uploadResult');
  const zone = document.getElementById('uploadZone');

  zone.style.display = 'none';
  progressEl.style.display = 'block';
  resultEl.style.display = 'none';

  // Animate steps
  const steps = ['step-upload', 'step-read', 'step-chunk', 'step-index', 'step-ready'];
  for (let i = 0; i < steps.length; i++) {
    document.getElementById(steps[i]).className = 'progress-step active';
    if (i > 0) document.getElementById(steps[i - 1]).className = 'progress-step done';
    await new Promise(r => setTimeout(r, 300));
  }

  try {
    const formData = new FormData();
    formData.append('document', file);

    const token = Utils.getToken();
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');

    document.getElementById('step-ready').className = 'progress-step done';

    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--success);border-radius:var(--radius-lg);padding:1.5rem;">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
          <span style="font-size:1.5rem;">✅</span>
          <div>
            <h3 style="margin:0;color:var(--success);">Document Uploaded Successfully!</h3>
            <p style="font-size:0.85rem;color:var(--text-tertiary);margin:0.25rem 0 0;">${data.document.originalName} — ${data.document.chunkCount} chunks indexed</p>
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <a href="./chat.html" class="btn btn-primary btn-sm" onclick="localStorage.setItem('lawlense_active_doc','${data.document.fileId}');localStorage.setItem('lawlense_active_doc_name','${data.document.originalName.replace(/'/g, "\\'")}')">💬 Ask AI about this document</a>
          <button class="btn btn-ghost btn-sm" onclick="uploadAnother()">📤 Upload Another</button>
        </div>
      </div>
    `;

    Utils.showToast('Document indexed and ready!', 'success');
    loadLibrary();
  } catch (err) {
    resultEl.style.display = 'block';
    resultEl.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--error);">Upload failed: ${err.message}</div>`;
  }
}

function uploadAnother() {
  document.getElementById('uploadZone').style.display = '';
  document.getElementById('uploadProgress').style.display = 'none';
  document.getElementById('uploadResult').style.display = 'none';
  document.getElementById('docFileInput').value = '';
  ['step-upload', 'step-read', 'step-chunk', 'step-index', 'step-ready'].forEach(id => {
    document.getElementById(id).className = 'progress-step';
  });
}

async function loadLibrary() {
  const container = document.getElementById('docLibrary');
  container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-tertiary);">Loading documents...</div>';

  try {
    const data = await Utils.api('/upload/library');
    let docs = data.documents || [];

    if (currentFilter !== 'all') {
      docs = docs.filter(d => d.fileType === currentFilter);
    }

    if (docs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📂</div>
          <h3>No documents yet</h3>
          <p>Upload your first legal document to get started.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `<div class="doc-grid">${docs.map(d => `
      <div class="doc-card" onclick="activateDocument('${d.fileId}', '${d.originalName.replace(/'/g, "\\'")}')">
        <div class="doc-card-header">
          <div class="doc-icon">${getFileIcon(d.fileType)}</div>
          <div class="doc-info">
            <div class="doc-name" title="${Utils.escapeHtml(d.originalName)}">${Utils.escapeHtml(d.originalName)}</div>
            <div class="doc-meta">${d.chunkCount} chunks · ${formatSize(d.fileSize)} · ${d.fileType.toUpperCase()}</div>
          </div>
        </div>
        ${d.tags && d.tags.length ? `<div class="doc-tags">${d.tags.map(t => `<span class="doc-tag">${t}</span>`).join('')}</div>` : ''}
        <div class="doc-actions">
          <a href="./chat.html" class="btn btn-ghost btn-sm" onclick="event.stopPropagation();activateDocument('${d.fileId}','${d.originalName.replace(/'/g, "\\'")}')">💬 Chat</a>
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();searchInDoc('${d.fileId}','${d.originalName.replace(/'/g, "\\'")}')">🔍 Search</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--error);" onclick="event.stopPropagation();deleteDoc('${d.id}','${d.originalName.replace(/'/g, "\\'")}')">🗑️</button>
        </div>
      </div>
    `).join('')}</div>`;
  } catch (err) {
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--error);">Failed to load documents.</div>';
  }
}

function activateDocument(fileId, name) {
  localStorage.setItem('lawlense_active_doc', fileId);
  localStorage.setItem('lawlense_active_doc_name', name);
  Utils.showToast(`Active document set: ${name}`, 'success');
  window.location.href = './chat.html';
}

function searchInDoc(fileId, name) {
  const query = prompt(`Search in "${name}":`);
  if (query) {
    window.location.href = `./chat.html?doc=${fileId}&q=${encodeURIComponent(query)}`;
  }
}

async function deleteDoc(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await Utils.api(`/upload/${id}`, { method: 'DELETE' });
    Utils.showToast('Document deleted', 'success');
    loadLibrary();
  } catch (err) {
    Utils.showToast('Failed to delete', 'error');
  }
}

function getFileIcon(type) {
  const icons = { pdf: '📄', docx: '📝', txt: '📃', md: '📋', json: '🔗' };
  return icons[type] || '📄';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
