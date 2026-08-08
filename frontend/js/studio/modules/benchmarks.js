/**
 * LawLens Studio — Benchmarks Module
 */

Studio.Modules.register('benchmarks', () => {
  let _benchmarkData = null;
  let _isRunning = false;

  async function loadBenchmarks() {
    try {
      const res = await Studio.api('/knowledge/benchmark');
      _benchmarkData = res.data || null;
    } catch (err) {
      _benchmarkData = null;
    }
  }

  function renderMetricBar(label, value, max, color) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    return `
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:0.8rem;color:var(--text-secondary);">${label}</span>
          <span style="font-size:0.8rem;font-weight:600;color:var(--text-primary);">${typeof value === 'number' ? value.toFixed(2) : value}</span>
        </div>
        <div style="height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:3px;transition:width 0.5s;"></div>
        </div>
      </div>`;
  }

  return {
    async render() {
      await loadBenchmarks();
      const latest = _benchmarkData?.latest;
      const history = _benchmarkData?.history || [];

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Benchmarks</h1>
            <p class="studio-module-subtitle">AI performance testing and quality metrics</p>
          </div>
          <div class="studio-module-actions">
            ${Studio.UI.btn('Run Benchmark', { icon: 'play', variant: 'primary', id: 'runBenchmarkBtn' })}
          </div>
        </div>

        ${latest ? `
          <div class="studio-stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));margin-bottom:20px;">
            ${Studio.UI.statCard('target', (latest.precision * 100).toFixed(0) + '%', 'Precision', { iconClass: 'success' })}
            ${Studio.UI.statCard('search', (latest.recall * 100).toFixed(0) + '%', 'Recall', { iconClass: 'info' })}
            ${Studio.UI.statCard('zap', (latest.latency || 0).toFixed(0) + 'ms', 'Avg Latency', { iconClass: 'warning' })}
            ${Studio.UI.statCard('shield-check', (latest.grounding * 100).toFixed(0) + '%', 'Grounding', { iconClass: 'success' })}
            ${Studio.UI.statCard('alert-triangle', (latest.hallucinationRate * 100).toFixed(0) + '%', 'Hallucination', { iconClass: 'error' })}
            ${Studio.UI.statCard('quote', (latest.citationAccuracy * 100).toFixed(0) + '%', 'Citation Accuracy', { iconClass: 'info' })}
          </div>

          <div class="studio-grid-2">
            ${Studio.UI.section('Quality Metrics', `
              ${renderMetricBar('Precision', latest.precision, 1, 'var(--success)')}
              ${renderMetricBar('Recall', latest.recall, 1, 'var(--info)')}
              ${renderMetricBar('F1 Score', latest.f1Score || ((2 * latest.precision * latest.recall) / (latest.precision + latest.recall)), 1, 'var(--accent-primary)')}
              ${renderMetricBar('Grounding', latest.grounding, 1, 'var(--success)')}
              ${renderMetricBar('Citation Accuracy', latest.citationAccuracy, 1, 'var(--info)')}
              ${renderMetricBar('Hallucination Rate', latest.hallucinationRate, 1, 'var(--error)')}
            `)}

            ${Studio.UI.section('Run History', `
              ${history.length === 0 ?
                '<div style="text-align:center;padding:24px;color:var(--text-tertiary);">No benchmark history</div>' :
                `<div style="max-height:300px;overflow-y:auto;">
                  ${history.map((run, i) => `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-light);">
                      <div>
                        <div style="font-size:0.82rem;font-weight:600;color:var(--text-primary);">Run #${history.length - i}</div>
                        <div style="font-size:0.72rem;color:var(--text-tertiary);">${run.timestamp ? new Date(run.timestamp).toLocaleString() : 'Unknown'}</div>
                      </div>
                      <div style="display:flex;gap:8px;">
                        ${Studio.UI.badge('P: ' + ((run.precision || 0) * 100).toFixed(0) + '%', 'success')}
                        ${Studio.UI.badge('R: ' + ((run.recall || 0) * 100).toFixed(0) + '%', 'info')}
                      </div>
                    </div>`).join('')}
                </div>`}
            `)}
          </div>
        ` :
          Studio.UI.emptyState('gauge', 'No Benchmark Data', 'Run your first benchmark to see quality metrics', Studio.UI.btn('Run Benchmark', { icon: 'play', variant: 'primary', id: 'runBenchmarkBtnEmpty' }))}
        `;
    },

    mount() {
      const runBenchmark = async () => {
        if (_isRunning) return;
        _isRunning = true;
        Studio.Toast.info('Benchmark started...');
        try {
          await Studio.api('/knowledge/benchmark/run', { method: 'POST' });
          Studio.Toast.success('Benchmark completed');
          await loadBenchmarks();
          Studio.Router.handleRoute();
        } catch (err) {
          Studio.Toast.error('Benchmark failed: ' + (err.message || 'Unknown'));
        } finally {
          _isRunning = false;
        }
      };

      document.getElementById('runBenchmarkBtn')?.addEventListener('click', runBenchmark);
      document.getElementById('runBenchmarkBtnEmpty')?.addEventListener('click', runBenchmark);
    },

    unmount() { _benchmarkData = null; _isRunning = false; }
  };
});
