/**
 * LawLens Studio — Developer Tools Module
 */

Studio.Modules.register('developer', () => {
  let _logs = [];
  let _metrics = null;
  let _systemInfo = null;

  async function loadData() {
    try {
      const [logs, metrics, sysInfo] = await Promise.allSettled([
        Studio.api('/admin/logs'),
        Studio.api('/admin/metrics'),
        Studio.api('/studio/system/info')
      ]);
      _logs = logs.status === 'fulfilled' ? (logs.value?.logs || []) : [];
      _metrics = metrics.status === 'fulfilled' ? metrics.value : null;
      _systemInfo = sysInfo.status === 'fulfilled' ? sysInfo.value?.data : null;
    } catch (err) {
      console.error('Failed to load developer data:', err);
    }
  }

  return {
    async render() {
      await loadData();

      const sysInfo = _systemInfo || {};

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Developer Tools</h1>
            <p class="studio-module-subtitle">System information, logs, and API explorer</p>
          </div>
        </div>

        <div class="studio-stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));margin-bottom:20px;">
          ${Studio.UI.statCard('cpu', sysInfo.nodeVersion || 'N/A', 'Node.js Version')}
          ${Studio.UI.statCard('server', sysInfo.platform || 'N/A', 'Platform')}
          ${Studio.UI.statCard('hash', sysInfo.arch || 'N/A', 'Architecture')}
          ${Studio.UI.statCard('hard-drive', sysInfo.cpuCount || 0, 'CPU Cores')}
        </div>

        <div class="studio-grid-2">
          ${Studio.UI.section('System Information', `
            <div style="display:grid;gap:8px;">
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem;">
                <span style="color:var(--text-secondary);">Hostname</span>
                <span style="color:var(--text-primary);font-family:var(--font-mono);font-size:0.8rem;">${sysInfo.hostname || 'N/A'}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem;">
                <span style="color:var(--text-secondary);">Uptime</span>
                <span style="color:var(--text-primary);">${sysInfo.uptime ? Math.floor(sysInfo.uptime / 3600) + 'h ' + Math.floor((sysInfo.uptime % 3600) / 60) + 'm' : 'N/A'}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem;">
                <span style="color:var(--text-secondary);">Total Memory</span>
                <span style="color:var(--text-primary);">${sysInfo.totalMemory ? (sysInfo.totalMemory / 1024 / 1024 / 1024).toFixed(1) + ' GB' : 'N/A'}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem;">
                <span style="color:var(--text-secondary);">Free Memory</span>
                <span style="color:var(--text-primary);">${sysInfo.freeMemory ? (sysInfo.freeMemory / 1024 / 1024 / 1024).toFixed(1) + ' GB' : 'N/A'}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:0.85rem;">
                <span style="color:var(--text-secondary);">Load Average</span>
                <span style="color:var(--text-primary);font-family:var(--font-mono);font-size:0.8rem;">${sysInfo.loadAvg ? sysInfo.loadAvg.map(l => l.toFixed(2)).join(', ') : 'N/A'}</span>
              </div>
            </div>
          `)}

          ${Studio.UI.section('API Metrics', `
            <div style="display:grid;gap:8px;">
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem;">
                <span style="color:var(--text-secondary);">Total Requests</span>
                <span style="color:var(--text-primary);font-weight:600;">${_metrics?.metrics?.totalRequests || 0}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem;">
                <span style="color:var(--text-secondary);">Active Users</span>
                <span style="color:var(--text-primary);font-weight:600;">${_metrics?.metrics?.activeUsers || 0}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:0.85rem;">
                <span style="color:var(--text-secondary);">Error Rate</span>
                <span style="color:var(--text-primary);font-weight:600;">${_metrics?.metrics?.errorRate || '0%'}</span>
              </div>
            </div>
          `)}
        </div>

        ${Studio.UI.section('Server Logs', `
          <div style="max-height:400px;overflow-y:auto;">
            ${_logs.length === 0 ?
              '<div style="padding:24px;text-align:center;color:var(--text-tertiary);">No log files available</div>' :
              _logs.map(log => `
                <div style="margin-bottom:16px;">
                  <div style="font-size:0.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px;font-family:var(--font-mono);">${log.file}</div>
                  <pre style="background:var(--bg-tertiary);padding:12px;border-radius:8px;font-size:0.75rem;line-height:1.6;overflow-x:auto;max-height:200px;color:var(--text-secondary);font-family:var(--font-mono);margin:0;">${_escapeHtml(log.content || '')}</pre>
                </div>`).join('')}
          </div>`)}
        `;
    },

    mount() {},
    unmount() { _logs = []; _metrics = null; _systemInfo = null; }
  };
});

function _escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
