/**
 * LawLens Studio — Analytics Module
 */

Studio.Modules.register('analytics', () => {
  let _data = null;

  async function loadData() {
    try {
      const [analytics, dashboard] = await Promise.allSettled([
        Studio.api('/analytics'),
        Studio.api('/admin/dashboard')
      ]);
      _data = {
        analytics: analytics.status === 'fulfilled' ? analytics.value : null,
        dashboard: dashboard.status === 'fulfilled' ? dashboard.value : null
      };
    } catch (err) {
      _data = null;
    }
  }

  function renderBarChart(data, maxVal) {
    if (!data || data.length === 0) return '<div style="text-align:center;padding:16px;color:var(--text-tertiary);">No data</div>';
    const max = maxVal || Math.max(...data.map(d => d.value));
    return `
      <div style="display:flex;align-items:flex-end;gap:6px;height:120px;padding:8px 0;">
        ${data.map(d => {
          const height = max > 0 ? (d.value / max) * 100 : 0;
          return `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
              <span style="font-size:0.65rem;color:var(--text-tertiary);">${d.value}</span>
              <div style="width:100%;height:${Math.max(4, height)}%;background:var(--gradient-primary);border-radius:4px 4px 0 0;transition:height 0.5s;"></div>
              <span style="font-size:0.6rem;color:var(--text-tertiary);white-space:nowrap;">${d.label}</span>
            </div>`;
        }).join('')}
      </div>`;
  }

  return {
    async render() {
      await loadData();
      const stats = _data?.dashboard?.stats || {};

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Analytics</h1>
            <p class="studio-module-subtitle">Usage metrics and platform insights</p>
          </div>
        </div>

        <div class="studio-stats-grid" style="margin-bottom:24px;">
          ${Studio.UI.statCard('users', stats.users || 0, 'Total Users')}
          ${Studio.UI.statCard('message-square', stats.conversations || 0, 'Conversations')}
          ${Studio.UI.statCard('search', stats.searches || 0, 'Searches')}
          ${Studio.UI.statCard('bookmark', stats.bookmarks || 0, 'Bookmarks')}
          ${Studio.UI.statCard('database', stats.documents || 0, 'Indexed Chunks')}
        </div>

        <div class="studio-grid-2">
          ${Studio.UI.section('Platform Usage', renderBarChart([
            { label: 'Users', value: stats.users || 0 },
            { label: 'Convos', value: stats.conversations || 0 },
            { label: 'Searches', value: stats.searches || 0 },
            { label: 'Bookmarks', value: stats.bookmarks || 0 },
            { label: 'Docs', value: stats.documents || 0 }
          ]))}

          ${Studio.UI.section('Knowledge Coverage', `
            <div style="display:grid;gap:12px;padding:8px 0;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:0.85rem;color:var(--text-secondary);">Indexed Documents</span>
                <span style="font-size:1rem;font-weight:700;color:var(--text-primary);">${stats.documents || 0}</span>
              </div>
              <div style="height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${Math.min(100, (stats.documents || 0) / 10)}%;background:var(--accent-primary);border-radius:3px;"></div>
              </div>
            </div>
          `)}
        </div>`;
    },

    mount() {},
    unmount() { _data = null; }
  };
});
