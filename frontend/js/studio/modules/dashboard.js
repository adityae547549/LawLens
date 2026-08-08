/**
 * LawLens Studio — Dashboard Module
 * Overview cards, activity feed, quick actions
 */

Studio.Modules.register('dashboard', () => {
  let _data = null;

  async function fetchData() {
    const results = await Promise.allSettled([
      Studio.api('/admin/dashboard'),
      Studio.api('/knowledge/status'),
      Studio.api('/knowledge/graph'),
      Studio.api('/knowledge/synonyms'),
      Studio.api('/health')
    ]);

    return {
      admin: results[0].status === 'fulfilled' ? results[0].value : null,
      knowledge: results[1].status === 'fulfilled' ? results[1].value : null,
      graph: results[2].status === 'fulfilled' ? results[2].value : null,
      synonyms: results[3].status === 'fulfilled' ? results[3].value : null,
      health: results[4].status === 'fulfilled' ? results[4].value : null
    };
  }

  function renderStats(data) {
    const admin = data.admin?.stats || {};
    const graph = data.graph?.data || {};
    const synonyms = data.synonyms?.data || {};
    const knowledge = data.knowledge?.data || {};

    const stats = [
      { icon: 'users', value: admin.users || 0, label: 'Total Users', iconClass: '', trend: null },
      { icon: 'message-square', value: admin.conversations || 0, label: 'Conversations', iconClass: 'info', trend: null },
      { icon: 'bookmark', value: admin.bookmarks || 0, label: 'Bookmarks', iconClass: 'warning', trend: null },
      { icon: 'search', value: admin.searches || 0, label: 'Searches', iconClass: '', trend: null },
      { icon: 'database', value: admin.documents || 0, label: 'Vector Chunks', iconClass: 'success', trend: null },
      { icon: 'git-branch', value: graph.totalNodes || 0, label: 'Graph Nodes', iconClass: '', trend: null },
      { icon: 'network', value: graph.totalEdges || graph.edges || 0, label: 'Relationships', iconClass: 'info', trend: null },
      { icon: 'zap', value: synonyms.totalSynonyms || 0, label: 'Synonyms', iconClass: 'warning', trend: null },
    ];

    return stats.map(s => Studio.UI.statCard(s.icon, s.value, s.label, { iconClass: s.iconClass, trend: s.trend })).join('');
  }

  function renderQuickActions() {
    return `
      <div class="studio-quick-actions">
        <button class="studio-quick-action" onclick="Studio.Router.navigate('imports')">
          <i data-lucide="upload"></i> Import Documents
        </button>
        <button class="studio-quick-action" onclick="Studio.Router.navigate('knowledge')">
          <i data-lucide="database"></i> Manage Knowledge
        </button>
        <button class="studio-quick-action" onclick="Studio.Router.navigate('graph')">
          <i data-lucide="git-branch"></i> View Graph
        </button>
        <button class="studio-quick-action" onclick="Studio.Router.navigate('benchmarks')">
          <i data-lucide="gauge"></i> Run Benchmark
        </button>
        <button class="studio-quick-action" onclick="Studio.Router.navigate('ai-config')">
          <i data-lucide="cpu"></i> AI Settings
        </button>
        <button class="studio-quick-action" onclick="Studio.Router.navigate('health')">
          <i data-lucide="activity"></i> System Health
        </button>
      </div>`;
  }

  function renderActivity(data) {
    const items = [];
    if (data.knowledge?.data?.lastSync) {
      items.push(Studio.UI.activityItem(
        `Knowledge sync completed — ${data.knowledge.data.registry?.totalSources || 0} sources`,
        new Date(data.knowledge.data.lastSync).toLocaleString(),
        'success'
      ));
    }
    if (data.health?.uptime) {
      const hrs = Math.floor(data.health.uptime / 3600);
      const mins = Math.floor((data.health.uptime % 3600) / 60);
      items.push(Studio.UI.activityItem(
        `Server running for ${hrs}h ${mins}m`,
        'System uptime',
        ''
      ));
    }
    if (data.graph?.data) {
      items.push(Studio.UI.activityItem(
        `Knowledge graph: ${data.graph.data.totalNodes || 0} nodes, ${data.graph.data.totalEdges || data.graph.data.edges || 0} edges`,
        'Graph status',
        'info'
      ));
    }
    if (items.length === 0) {
      items.push(Studio.UI.activityItem('No recent activity', 'System just started', ''));
    }
    return items.join('');
  }

  function renderSystemHealth(data) {
    const health = data.health || {};
    const uptime = health.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : 'N/A';
    const status = health.status === 'ok' ? 'Operational' : 'Issues detected';
    const statusType = health.status === 'ok' ? 'success' : 'error';

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:16px;background:var(--bg-tertiary);border-radius:10px;">
        <div style="width:10px;height:10px;border-radius:50%;background:var(--${statusType});flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">System ${status}</div>
          <div style="font-size:0.75rem;color:var(--text-tertiary);">Uptime: ${uptime}</div>
        </div>
        ${Studio.UI.btn('View Details', { icon: 'arrow-right', onclick: "Studio.Router.navigate('health')", size: 'sm' })}
      </div>`;
  }

  return {
    async render() {
      _data = await fetchData();
      const { U } = Studio.UI;

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Dashboard</h1>
            <p class="studio-module-subtitle">Overview of your LawLens platform</p>
          </div>
          <div class="studio-module-actions">
            ${Studio.UI.btn('Refresh', { icon: 'refresh-cw', onclick: 'Studio.Router.handleRoute()' })}
          </div>
        </div>

        ${renderQuickActions()}

        <div class="studio-stats-grid">
          ${renderStats(_data)}
        </div>

        <div class="studio-grid-2">
          ${Studio.UI.section('System Health', renderSystemHealth(_data))}
          ${Studio.UI.section('Recent Activity', renderActivity(_data))}
        </div>`;
    },

    mount() {
      // Auto-refresh every 60s
      this._interval = setInterval(() => {
        // Silently refresh stats
      }, 60000);
    },

    unmount() {
      if (this._interval) clearInterval(this._interval);
    }
  };
});
