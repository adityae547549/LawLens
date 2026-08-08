let selectedCaseTool = 'summarize';
let caseFileText = '';
let currentSearchMode = 'strict';

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.case-page')) return;
if (!Utils.isAuthenticated()) { window.location.href = './login.html'; return; }
  initCaseUpload();
});

function selectCaseTool(tool) {
  selectedCaseTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');

  const searchRow = document.getElementById('searchInCase');
  if (searchRow) searchRow.style.display = tool === 'search' ? 'block' : 'none';
}

function initCaseUpload() {
  const zone = document.getElementById('caseUploadZone');
  const fileInput = document.getElementById('caseFile');

  if (zone) {
    zone.addEventListener('click', () => fileInput?.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor = 'var(--accent-primary)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.borderColor = '';
      if (e.dataTransfer.files.length) handleCaseFile(e.dataTransfer.files[0]);
    });
  }
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) handleCaseFile(fileInput.files[0]);
    });
  }
}

function handleCaseFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    Utils.showToast('File too large (max 10MB)', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    caseFileText = e.target.result;
    const zone = document.getElementById('caseUploadZone');
    zone.innerHTML = `<div style="font-size:1.5rem;margin-bottom:0.5rem;">✅</div>
      <div style="color:var(--text-tertiary);font-size:0.9rem;"><strong style="color:var(--accent-primary);">${Utils.escapeHtml(file.name)}</strong></div>
      <div style="font-size:0.8rem;color:var(--text-tertiary);margin-top:0.25rem;">${(file.size / 1024).toFixed(1)} KB — Ready</div>
      <input type="file" id="caseFile" accept=".pdf,.docx,.txt">`;
    initCaseUpload();
    Utils.showToast('File loaded', 'success');
  };
  reader.readAsText(file);
}

async function analyzeCase() {
  const text = caseFileText || document.getElementById('caseText')?.value.trim();
  if (!text) {
    Utils.showToast('Please upload a file or paste case text', 'error');
    return;
  }

  const resultsEl = document.getElementById('caseResults');
  resultsEl.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="loading-spinner" style="margin:0 auto;"></div><p style="margin-top:1rem;color:var(--text-tertiary);">AI is analyzing the case...</p></div>';

  const prompts = {
    summarize: `Summarize this case file. Include: 1) Case type and jurisdiction, 2) Parties involved (plaintiff vs defendant), 3) Key facts, 4) Legal issues, 5) Current status, 6) Next steps. Be thorough but concise.`,
    timeline: `Create a chronological timeline of events from this case file. For each event include: date (if available), event description, and significance. Format as a visual timeline with year badges.`,
    dates: `Extract ALL important dates and deadlines from this case file. For each date include: the date, what it relates to, whether it's a deadline or hearing date, and urgency level (urgent/upcoming/future).`,
    names: `Extract ALL names mentioned in this case file. Categorize them as: Judges, Lawyers/Advocates, Parties (plaintiff/defendant), Witnesses, Other persons. For each name, note their role in the case.`,
    evidence: `Analyze the evidence mentioned in this case file. For each piece of evidence: 1) What it is, 2) Who presented it, 3) What it proves, 4) Strength (strong/weak/contested), 5) Any counter-arguments.`,
    search: `Search through this case file for information about: "${document.getElementById('caseSearchQuery')?.value || 'all key points'}". Extract all relevant sections, quotes, and context.`,
    hearing: `Generate hearing notes for this case. Include: 1) Summary of arguments, 2) Key observations by court, 3) Orders/directions, 4) Adjournment details, 5) Next hearing preparation points.`,
    deadlines: `Find all deadlines, limitation periods, and time-bound requirements in this case. For each: 1) Deadline date, 2) What must be done, 3) Consequences of missing it, 4) Whether it can be extended. Flag any urgent deadlines.`
  };

  try {
    const data = await Utils.api('/ai/generate', {
      method: 'POST',
      body: {
        prompt: prompts[selectedCaseTool] + '\n\nCASE FILE:\n' + text.slice(0, 8000),
        mode: 'case-analysis',
        useWebSearch: true,
        searchMode: currentSearchMode
      }
    });

    renderCaseResults(data, resultsEl);
  } catch (err) {
    resultsEl.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--error);">Analysis failed. Make sure the server is running.</div>';
  }
}

function renderCaseResults(data, container) {
  const toolNames = {
    summarize: 'Case Summary', timeline: 'Case Timeline', dates: 'Key Dates',
    names: 'Persons Involved', evidence: 'Evidence Analysis', search: 'Search Results',
    hearing: 'Hearing Notes', deadlines: 'Deadlines'
  };

  let html = '';

  if (data.searchStrategy) {
    html += Utils.renderSearchStrategy(data.searchStrategy);
  }

  html += `<div class="result-card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
      <h3 style="margin:0;">🤖 ${toolNames[selectedCaseTool] || 'Case Analysis'}</h3>
      <div style="display:flex;gap:0.4rem;">
        <button class="btn btn-ghost btn-sm" onclick="Utils.copyToClipboard(this.closest('.result-card').dataset.content)">📋 Copy</button>
        <button class="btn btn-ghost btn-sm" onclick="Utils.downloadBrandedPDF(this.closest('.result-card').dataset.content, '${toolNames[selectedCaseTool]}')">📄 PDF</button>
      </div>
    </div>
    <pre style="font-family:inherit;white-space:pre-wrap;margin:0;">${Utils.escapeHtml(data.answer || 'No analysis generated.')}</pre>
  </div>`;

  if (data.citations && data.citations.length > 0) {
    html += Utils.renderCitations(data.citations);
  }

  if (data.confidence) {
    const capped = Math.min(data.confidence, 100);
    const color = capped >= 70 ? 'var(--success)' : capped >= 40 ? 'var(--warning)' : 'var(--error)';
    html += `<div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;">
      <div style="height:4px;width:80px;background:var(--bg-tertiary);border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${capped}%;background:${color};border-radius:2px;"></div>
      </div>
      <span style="font-size:0.75rem;color:var(--text-tertiary);">Confidence: ${capped}%</span>
    </div>`;
  }

  html += `<div style="margin-top:1rem;padding:0.75rem;background:var(--bg-secondary);border-radius:var(--radius-md);font-size:0.8rem;color:var(--text-tertiary);">
    ⚠️ AI-generated analysis. Not legal advice. Please verify with a qualified legal professional.
  </div>`;

  container.innerHTML = html;

  const card = container.querySelector('.result-card');
  if (card && data.answer) card.dataset.content = data.answer;
}

function clearCase() {
  caseFileText = '';
  const textEl = document.getElementById('caseText');
  const fileEl = document.getElementById('caseFile');
  const zone = document.getElementById('caseUploadZone');
  if (textEl) textEl.value = '';
  if (zone) {
    zone.innerHTML = `<div style="font-size:1.5rem;margin-bottom:0.5rem;">📁</div>
      <div style="color:var(--text-tertiary);font-size:0.9rem;"><strong style="color:var(--accent-primary);">Click to upload</strong> case files or drag & drop</div>
      <div style="font-size:0.8rem;color:var(--text-tertiary);margin-top:0.25rem;">PDF, DOCX, TXT (max 10MB)</div>
      <input type="file" id="caseFile" accept=".pdf,.docx,.txt">`;
    initCaseUpload();
  }
  document.getElementById('caseResults').innerHTML = '';
  document.getElementById('searchInCase').style.display = 'none';
}

window.selectCaseTool = selectCaseTool;
window.analyzeCase = analyzeCase;
window.clearCase = clearCase;
