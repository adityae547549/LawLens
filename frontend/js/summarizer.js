document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('summarizerPage')) return;
if (!Utils.isAuthenticated()) { window.location.href = './login.html'; return; }
  initSummarizerTabs();
  initTextSummarizer();
  loadDocLibrary();
  loadCompareDocs();
  initCompare();
});

function initSummarizerTabs() {
  document.querySelectorAll('.summarizer-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.summarizer-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.summarizer-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const content = document.getElementById(tab.dataset.tab + 'Tab');
      if (content) content.classList.add('active');
    });
  });

  let selectedMode = 'concise';
  document.querySelectorAll('.summarizer-mode').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.summarizer-mode').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMode = btn.dataset.mode;
    });
  });

  document.getElementById('copySummary')?.addEventListener('click', () => {
    const text = document.getElementById('summaryOutput')?.textContent;
    if (text) Utils.copyToClipboard(text);
  });
}

async function initTextSummarizer() {
  const btn = document.getElementById('summarizeBtn');
  const input = document.getElementById('summarizeInput');
  if (!btn || !input) return;

  btn.addEventListener('click', async () => {
    const text = input.value.trim();
    if (text.length < 50) { Utils.showToast('Please enter at least 50 characters', 'error'); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Summarizing...';
    const mode = document.querySelector('.summarizer-mode.active')?.dataset.mode || 'concise';

    try {
      const data = await Utils.api('/summarizer/summarize', {
        method: 'POST',
        body: { text, mode }
      });
      document.getElementById('textResult').style.display = 'block';
      document.getElementById('summaryOutput').textContent = data.summary;
      Utils.showToast('Summary generated', 'success');
    } catch (err) {
      Utils.showToast(err.message || 'Failed to summarize', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🚀 Summarize';
    }
  });
}

async function loadDocLibrary() {
  try {
    const data = await Utils.api('/upload/library');
    const container = document.getElementById('docLibraryList');
    if (!container) return;
    const docs = data.documents || [];
    container.innerHTML = docs.map(d => `
      <label class="doc-item" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-md);margin-bottom:0.5rem;cursor:pointer;transition:border-color 0.2s;" data-fileid="${d.id}" onclick="summarizeDocument('${d.id}')">
        <span style="font-size:1.2rem;">📄</span>
        <div><div style="font-weight:500;font-size:0.9rem;">${Utils.escapeHtml(d.name || d.fileName || 'Document')}</div><div style="font-size:0.8rem;color:var(--text-tertiary);">${d.fileType || ''} ${d.size ? '— ' + (d.size / 1024).toFixed(0) + ' KB' : ''}</div></div>
      </label>
    `).join('') || '<p style="color:var(--text-tertiary);">No documents uploaded yet.</p>';
  } catch (err) {
    const container = document.getElementById('docLibraryList');
    if (container) container.innerHTML = '<p style="color:var(--text-tertiary);">Failed to load documents.</p>';
  }
}

async function summarizeDocument(fileId) {
  const btn = event?.target?.closest?.('.doc-item');
  if (btn) btn.style.borderColor = 'var(--accent-primary)';

  Utils.showToast('Generating document summary...', 'info');
  try {
    const data = await Utils.api('/summarizer/document', {
      method: 'POST',
      body: { fileId, mode: 'concise' }
    });
    document.getElementById('docSummaryResult').style.display = 'block';
    document.getElementById('docSummaryOutput').innerHTML = `
      <div style="margin-bottom:0.75rem;font-size:0.85rem;color:var(--text-tertiary);">
        📄 ${Utils.escapeHtml(data.fileName)} — ${data.totalChunks} chunks
      </div>
      <div>${data.summary}</div>
    `;
    document.querySelector('[data-tab="document"]')?.click();
  } catch (err) {
    Utils.showToast(err.message || 'Failed to summarize document', 'error');
  }
}

async function loadCompareDocs() {
  try {
    const data = await Utils.api('/upload/library');
    const container = document.getElementById('compareDocList');
    if (!container) return;
    const docs = data.documents || [];
    container.innerHTML = docs.map((d, i) => `
      <label class="compare-doc-item" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border:1px solid var(--border-light);border-radius:var(--radius-md);margin-bottom:0.5rem;cursor:pointer;">
        <input type="checkbox" class="compare-checkbox" value="${d.id}" data-name="${Utils.escapeHtml(d.name || d.fileName || 'Document')}" style="width:18px;height:18px;">
        <span style="font-size:1.2rem;">📄</span>
        <div><div style="font-weight:500;font-size:0.9rem;">${Utils.escapeHtml(d.name || d.fileName || 'Document')}</div></div>
      </label>
    `).join('') || '<p style="color:var(--text-tertiary);">No documents available.</p>';
  } catch (err) {
    const container = document.getElementById('compareDocList');
    if (container) container.innerHTML = '<p style="color:var(--text-tertiary);">Failed to load documents.</p>';
  }
}

async function initCompare() {
  const btn = document.getElementById('compareBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const checked = document.querySelectorAll('.compare-checkbox:checked');
    if (checked.length < 2) { Utils.showToast('Select at least 2 documents to compare', 'error'); return; }

    const fileIds = Array.from(checked).map(cb => cb.value);
    const query = document.getElementById('compareQuery')?.value || '';

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Comparing...';
    try {
      const data = await Utils.api('/summarizer/compare', {
        method: 'POST',
        body: { fileIds, query }
      });
      document.getElementById('compareResult').style.display = 'block';
      const docList = data.documents.map(d => `• ${d.fileName}`).join('\n');
      document.getElementById('compareOutput').innerHTML = `
        <div style="margin-bottom:0.75rem;font-size:0.85rem;color:var(--text-tertiary);white-space:pre-wrap;">
          Comparing ${data.documents.length} documents:\n${docList}
        </div>
        <div>${data.comparison}</div>
      `;
      Utils.showToast('Comparison generated', 'success');
    } catch (err) {
      Utils.showToast(err.message || 'Failed to compare', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '⚖️ Compare';
    }
  });
}
