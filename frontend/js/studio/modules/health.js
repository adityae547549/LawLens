/**
 * LawLens Studio — System Health Module
 */

Studio.Modules.register('health', () => {
  let _healthData = null;

  async function loadHealth() {
    try {
      const [health, storage, process] = await Promise.allSettled([
        Studio.api('/studio/system/health'),
        Studio.api('/studio/system/storage'),
        Studio.api('/studio/system/process')
      ]);
      _healthData = {
        health: health.status === 'fulfilled' ? health.value?.data : null,
        storage: storage.status === 'fulfilled' ? storage.value?.data : null,
        process: process.status === 'fulfilled' ? process.value?.data : null
      };
    } catch (err) {
      _healthData = null;
    }
  }

  function renderGauge(label, value, max, color) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    return `
      <div style="text-align:center;">
        <div style="position:relative;width:80px;height:80px;margin:0 auto;">
          <svg viewBox="0 0 36 36" style="transform:rotate(-90deg);">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg-tertiary)" stroke-width="3"></circle>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="${pct} 100" stroke-linecap="round"></circle>
          </svg>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.9rem;font-weight:700;color:var(--text-primary);">${pct}%</div>
        </div>
        <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:8px;">${label}</div>
        <div style="font-size:0.7rem;color:var(--text-tertiary);">${formatBytes(value)} / ${formatBytes(max)}</div>
      </div>`;
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatUptime(seconds) {
    if (!seconds) return 'N/A';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  return {
    async render() {
      await loadHealth();
      const h = _healthData?.health || {};
      const s = _healthData?.storage || {};
      const p = _healthData?.process || {};

      const memPct = h.memory?.percentage || 0;
      const memColor = memPct > 80 ? 'var(--error)' : memPct > 60 ? 'var(--warning)' : 'var(--success)';
      const cpuPct = h.cpu?.loadAvg ? Math.min(100, Math.round((h.cpu.loadAvg[0] / h.cpu.cores) * 100)) : 0;
      const cpuColor = cpuPct > 80 ? 'var(--error)' : cpuPct > 60 ? 'var(--warning)' : 'var(--success)';

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">System Health</h1>
            <p class="studio-module-subtitle">Real-time system monitoring</p>
          </div>
          <div class="studio-module-actions">
            ${Studio.UI.btn('Refresh', { icon: 'refresh-cw', onclick: 'Studio.Router.handleRoute()' })}
          </div>
        </div>

        <div class="studio-stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));">
          ${Studio.UI.statCard('activity', h.status === 'ok' ? 'Operational' : 'Issues', 'Server Status', { iconClass: h.status === 'ok' ? 'success' : 'error' })}
          ${Studio.UI.statCard('clock', formatUptime(h.uptime), 'Uptime', { iconClass: 'info' })}
          ${Studio.UI.statCard('server', p.nodeVersion || 'N/A', 'Node.js', {})}
          ${Studio.UI.statCard('cpu', cpuPct + '%', 'CPU Load', { iconClass: cpuPct > 60 ? 'warning' : 'success' })}
        </div>

        <div class="studio-grid-3" style="margin-bottom:20px;">
          ${Studio.UI.section('Memory', renderGauge('Heap Memory', h.memory?.used || 0, h.memory?.total || 1, memColor))}
          ${Studio.UI.section('CPU', renderGauge('Load Average', h.cpu?.loadAvg?.[0] || 0, (h.cpu?.cores || 1) * 2, cpuColor))}
          ${Studio.UI.section('Storage', renderGauge('Data Directory', s.data?.size || 0, 1024 * 1024 * 1024, 'var(--accent-primary)'))}
        </div>

        <div class="studio-grid-2">
          ${Studio.UI.section('Database', `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;text-align:center;">
                <div style="font-size:1.3rem;font-weight:700;color:var(--text-primary);">${s.database?.dbCollections || 0}</div>
                <div style="font-size:0.75rem;color:var(--text-tertiary);">Collections</div>
              </div>
              <div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;text-align:center;">
                <div style="font-size:1.3rem;font-weight:700;color:var(--text-primary);">${s.database?.dbRecords || 0}</div>
                <div style="font-size:0.75rem;color:var(--text-tertiary);">Records</div>
              </div>
            </div>
          `)}
          ${Studio.UI.section('Process', `
            <div style="display:grid;gap:8px;">
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem;">
                <span style="color:var(--text-secondary);">PID</span>
                <span style="color:var(--text-primary);font-family:var(--font-mono);">${p.pid || 'N/A'}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem;">
                <span style="color:var(--text-secondary);">Platform</span>
                <span style="color:var(--text-primary);">${p.platform || 'N/A'}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem;">
                <span style="color:var(--text-secondary);">CPU Cores</span>
                <span style="color:var(--text-primary);">${h.cpu?.cores || 'N/A'}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:0.85rem;">
                <span style="color:var(--text-secondary);">RSS Memory</span>
                <span style="color:var(--text-primary);">${formatBytes(h.memory?.rss)}</span>
              </div>
            </div>
          `)}
        </div>`;
    },

    mount() {},
    unmount() { _healthData = null; }
  };
});
