let selectedTool = 'summarize';
let uploadedFileText = '';
let currentSearchMode = 'strict';

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.contracts-page')) return;
  initUpload();
});

function selectTool(tool) {
  selectedTool = tool;
  document.querySelectorAll('.tool-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');

  const inputSection = document.getElementById('inputSection');
  const compareSection = document.getElementById('compareSection');
  if (tool === 'compare') {
    inputSection.style.display = 'none';
    compareSection.style.display = 'block';
  } else {
    inputSection.style.display = 'block';
    compareSection.style.display = 'none';
  }
}

function initUpload() {
  const area = document.getElementById('uploadArea');
  const fileInput = document.getElementById('contractFile');

  if (area) {
    area.addEventListener('click', () => fileInput?.click());
    area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('dragover'); });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.classList.remove('dragover');
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
  }
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) handleFile(fileInput.files[0]);
    });
  }
}

function handleFile(file) {
  const area = document.getElementById('uploadArea');
  if (file.size > 10 * 1024 * 1024) {
    Utils.showToast('File too large (max 10MB)', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedFileText = e.target.result;
    area.innerHTML = `<div class="upload-icon">✅</div>
      <div class="upload-text"><strong>${Utils.escapeHtml(file.name)}</strong><br>
      <span style="font-size:0.8rem;">${(file.size / 1024).toFixed(1)} KB — Ready to analyze</span></div>`;
    Utils.showToast('File loaded successfully', 'success');
  };
  reader.readAsText(file);
}

async function analyzeContract() {
  let contractText = '';

  if (selectedTool === 'compare') {
    const a = document.getElementById('contractA')?.value.trim();
    const b = document.getElementById('contractB')?.value.trim();
    if (!a || !b) {
      Utils.showToast('Please paste both contracts to compare', 'error');
      return;
    }
    contractText = 'CONTRACT A:\n' + a + '\n\nCONTRACT B:\n' + b;
  } else {
    contractText = uploadedFileText || document.getElementById('contractText')?.value.trim();
    if (!contractText) {
      Utils.showToast('Please upload a file or paste contract text', 'error');
      return;
    }
  }

  const resultsEl = document.getElementById('analysisResults');
  resultsEl.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="loading-spinner" style="margin:0 auto;"></div><p style="margin-top:1rem;color:var(--text-tertiary);">AI is analyzing the contract...</p></div>';

  const prompts = {
    summarize: `Summarize this contract. Include: 1) Type of contract, 2) Parties involved, 3) Key terms and conditions, 4) Payment terms, 5) Duration, 6) Termination clauses, 7) Governing law. Be concise but thorough.`,
    risk: `Analyze this contract for risky clauses. For each risk found, explain: 1) Which clause, 2) What the risk is, 3) Why it's risky, 4) Suggested modification. Rate overall risk as Low/Medium/High.`,
    explain: `Explain each clause of this contract in plain language. For each clause, provide: 1) Clause reference, 2) Plain English explanation, 3) What it means practically, 4) Any concerns.`,
    obligations: `Extract all obligations and duties from this contract. Organize by party (Party A, Party B, etc.). Include: 1) What each party must do, 2) What each party must NOT do, 3) Penalties for breach.`,
    deadlines: `Find all dates, deadlines, and time-bound provisions in this contract. List each with: 1) Date/deadline, 2) What must happen, 3) Consequences of missing the deadline, 4) Which party is responsible.`,
    checklist: `Generate an action checklist from this contract. Include: 1) Pre-signing checks, 2) Post-signing obligations, 3) Ongoing compliance requirements, 4) Key dates to track, 5) Documents to retain.`,
    missing: `Review this contract and identify what important clauses might be missing. Consider: 1) Dispute resolution, 2) Force majeure, 3) Confidentiality, 4) Intellectual property, 5) Limitation of liability, 6) Indemnification, 7) Non-compete, 8) Data protection.`,
    unusual: `Identify any unusual, non-standard, or potentially problematic terms in this contract. Compare against standard industry practices. Flag anything that seems one-sided or surprising.`,
    compare: `Compare these two contracts. Identify: 1) Key differences in terms, 2) Which contract is more favorable to each party, 3) Missing provisions in either, 4) Risk comparison, 5) Recommendation.`
  };

  try {
    const data = await Utils.api('/ai/generate', {
      method: 'POST',
      body: {
        prompt: prompts[selectedTool] + '\n\nCONTRACT TEXT:\n' + contractText.slice(0, 8000),
        mode: 'contract-analysis',
        useWebSearch: true,
        searchMode: currentSearchMode
      }
    });

    renderAnalysis(data, resultsEl);
  } catch (err) {
    resultsEl.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--error);">Analysis failed. Make sure the server is running.</div>';
  }
}

function renderAnalysis(data, container) {
  let html = '';

  if (data.searchStrategy) {
    html += Utils.renderSearchStrategy(data.searchStrategy);
  }

  html += `<div class="analysis-result">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
      <h3 style="margin:0;">🤖 AI Contract Analysis — ${selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}</h3>
      <div style="display:flex;gap:0.4rem;">
        <button class="btn btn-ghost btn-sm" onclick="Utils.copyToClipboard(this.closest('.analysis-result').dataset.content)">📋 Copy</button>
        <button class="btn btn-ghost btn-sm" onclick="Utils.downloadBrandedPDF(this.closest('.analysis-result').dataset.content, 'Contract Analysis')">📄 PDF</button>
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
    ⚠️ This is AI-generated analysis. It is not legal advice. Please consult a qualified legal professional before making any decisions based on this analysis.
  </div>`;

  container.innerHTML = html;

  const result = container.querySelector('.analysis-result');
  if (result && data.answer) result.dataset.content = data.answer;
}

function clearContract() {
  uploadedFileText = '';
  const textEl = document.getElementById('contractText');
  const fileEl = document.getElementById('contractFile');
  const area = document.getElementById('uploadArea');
  if (textEl) textEl.value = '';
  if (fileEl) fileEl.value = '';
  if (area) {
    area.innerHTML = `<div class="upload-icon">📁</div>
      <div class="upload-text"><strong>Click to upload</strong> or drag and drop<br>
      <span style="font-size:0.8rem;">PDF, DOCX, or TXT (max 10MB)</span></div>
      <input type="file" id="contractFile" accept=".pdf,.docx,.txt">`;
    initUpload();
  }
  document.getElementById('analysisResults').innerHTML = '';
}

window.selectTool = selectTool;
window.analyzeContract = analyzeContract;
window.clearContract = clearContract;
