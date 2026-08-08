document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('comparePage')) return;
if (!Utils.isAuthenticated()) { window.location.href = './login.html'; return; }

  const compareBtn = document.getElementById('compareBtn');
  if (compareBtn) {
    compareBtn.addEventListener('click', handleCompare);
  }
});

async function handleCompare() {
  const articleA = document.getElementById('articleA')?.value.trim();
  const articleB = document.getElementById('articleB')?.value.trim();
  const resultsEl = document.getElementById('compareResults');
  const loadingEl = document.getElementById('compareLoading');
  const compareBtn = document.getElementById('compareBtn');

  if (!articleA || !articleB) {
    Utils.showToast('Please enter both articles to compare', 'error');
    return;
  }

  compareBtn.disabled = true;
  compareBtn.innerHTML = '<span class="loading-spinner"></span> Comparing...';
  loadingEl.style.display = 'block';
  resultsEl.style.display = 'none';

  try {
    const data = await Utils.api('/chat', {
      method: 'POST',
      body: {
        message: `Compare and contrast these two legal concepts/articles: "${articleA}" vs "${articleB}". 

Format your response EXACTLY as:

## Comparison Table
| Feature | ${articleA} | ${articleB} |
|---------|----------|----------|
| [Feature 1] | [Details] | [Details] |
| [Feature 2] | [Details] | [Details] |
| [Feature 3] | [Details] | [Details] |
| [Feature 4] | [Details] | [Details] |
| [Feature 5] | [Details] | [Details] |

## Key Differences
[List key differences]

## Landmark Cases
[List important cases for each]

## Conclusion
[Smart conclusion]

Provide the most important comparison features in the table. Be concise but thorough.`,
        level: 'student'
      }
    });

    renderComparison(data.answer, articleA, articleB, resultsEl);
    loadingEl.style.display = 'none';
    resultsEl.style.display = 'block';
  } catch (err) {
    loadingEl.style.display = 'none';
    resultsEl.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-tertiary);">Comparison failed. Make sure the server is running.</div>';
    resultsEl.style.display = 'block';
  } finally {
    compareBtn.disabled = false;
    compareBtn.innerHTML = '<span class="compare-btn-icon">⚖️</span> Compare';
  }
}

function renderComparison(text, titleA, titleB, container) {
  let html = `<div style="text-align:center;margin-bottom:2rem;">
    <span style="display:inline-block;padding:0.3rem 0.8rem;background:var(--accent-glow);color:var(--accent-primary);border-radius:999px;font-size:0.85rem;font-weight:600;">${Utils.escapeHtml(titleA)}</span>
    <span style="margin:0 1rem;font-size:1.5rem;color:var(--accent-primary);">vs</span>
    <span style="display:inline-block;padding:0.3rem 0.8rem;background:var(--accent-glow);color:var(--accent-primary);border-radius:999px;font-size:0.85rem;font-weight:600;">${Utils.escapeHtml(titleB)}</span>
  </div>`;

  // Try to extract table from the response
  const tableMatch = text.match(/\|[\s\S]*?\n\|[-|\s]*\n[\s\S]*?(?=\n##|\n\n##|$)/);
  if (tableMatch) {
    const tableRows = tableMatch[0].split('\n').filter(r => r.trim().startsWith('|'));
    if (tableRows.length > 2) {
      html += '<div class="compare-table-container">';
      html += '<table class="compare-table">';
      tableRows.forEach((row, i) => {
        if (row.includes('---')) return; // skip separator
        const cells = row.split('|').filter(c => c.trim()).map(c => c.trim());
        if (i === 0) {
          html += '<thead><tr>';
          cells.forEach(c => html += `<th>${Utils.escapeHtml(c)}</th>`);
          html += '</tr></thead><tbody>';
        } else {
          html += '<tr>';
          cells.forEach((c, ci) => {
            const isSame = c.toLowerCase().includes('same') || c.toLowerCase().includes('both') || c.toLowerCase().includes('similar');
            const isDiff = c.toLowerCase().includes('different') || c.toLowerCase().includes('not') || c.toLowerCase().includes('only');
            let cls = '';
            if (ci > 0) cls = isSame ? 'cell-same' : isDiff ? 'cell-diff' : '';
            html += `<td class="${cls}">${Utils.escapeHtml(c)}</td>`;
          });
          html += '</tr>';
        }
      });
      html += '</tbody></table></div>';
    }
  }

  // Extract sections (Key Differences, Landmark Cases, Conclusion)
  const sections = text.split(/##\s+/).filter(s => s.trim());
  for (const section of sections) {
    const lines = section.split('\n').filter(l => l.trim());
    const heading = lines[0] || 'Section';
    const body = lines.slice(1).join('\n');

    if (heading.includes('Comparison Table') || heading.includes('Table')) continue; // already rendered

    html += `
      <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:1.25rem;margin-bottom:1rem;">
        <h3 style="margin-bottom:0.75rem;font-size:1.05rem;color:var(--accent-primary);">${Utils.escapeHtml(heading)}</h3>
        <div style="line-height:1.7;font-size:0.95rem;color:var(--text-secondary);">${Utils.escapeHtml(body).replace(/\n/g, '<br>')}</div>
      </div>
    `;
  }

  container.querySelector('#compareGrid').innerHTML = html;
}
