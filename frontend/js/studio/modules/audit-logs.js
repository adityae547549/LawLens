/**
 * LawLens Studio — Audit Logs Module
 * Professional audit trail with search, filters, and diff view
 */

Studio.Modules.register('audit-logs', () => {
  let _logs = [];
  let _stats = null;
  let _filter = { entity: '', action: '' };
  let _page = 0;
  const _limit = 20;

  async function loadLogs() {
    try {
      const params = new URLSearchParams();
      if (_filter.entity) params.set('entity', _filter.entity);
      if (_filter.action) params.set('action', _filter.action);
      params.set('limit', _limit);
      params.set('offset', _page * _limit);

      const [logsRes, statsRes] = await Promise.allSettled([
        Studio.api(`/studio/audit?${params}`),
        Studio.api('/studio/audit/stats')
      ]);

      _logs = logsRes.status === 'fulfilled' ? (logsRes.value?.data?.items || []) : [];
      _stats = statsRes.status === 'fulfilled' ? statsRes.value?.data : null;
    } catch (err) {
      _logs = [];
    }
  }

  function getActionBadge(action) {
    const map = {
      create: 'success', update: 'primary', delete: 'error',
      publish: 'success', archive: 'warning', job_created: 'info',
      page_created: 'success', page_updated: 'primary', page_deleted: 'error'
    };
    return Studio.UI.badge(action.replace(/_/g, ' '), map[action] || 'neutral');
  }

  function renderDiff(before, after) {
    if (!before && !after) return '';
    if (!before) return `<div style="font-size:0.78rem;color:var(--success);">Created: ${JSON.stringify(after).substring(0, 200)}...</div>`;
    if (!after) return `<div style="font-size:0.78rem;color:var(--error);">Deleted</div>`;

    const changes = [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    allKeys.forEach(key => {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes.push(key);
      }
    });

    if (changes.length === 0) return '<div style="font-size:0.78rem;color:var(--text-tertiary);">No visible changes</div>';

    return changes.slice(0, 5).map(key => `
      <div style="display:flex;gap:8px;font-size:0.75rem;margin-bottom:4px;">
        <span style="color:var(--text-tertiary);min-width:80px;">${key}:</span>
        <span style="color:var(--error);text-decoration:line-through;">${String(before[key]).substring(0, 60)}</span>
        <span style="color:var(--text-tertiary);">→</span>
        <span style="color:var(--success);">${String(after[key]).substring(0, 60)}</span>
      </div>`).join('');
  }

  return {
    async render() {
      await loadLogs();
      const total = _stats?.total || 0;

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Audit Logs</h1>
            <p class="studio-module-subtitle">${total} recorded action${total !== 1 ? 's' : ''}</p>
          </div>
        </div>

        ${_stats ? `
          <div class="studio-stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr));margin-bottom:20px;">
            ${Studio.UI.statCard('scroll-text', _stats.total, 'Total Events')}
            ${Studio.UI.statCard('calendar', _stats.today, 'Today', { iconClass: 'info' })}
            ${Studio.UI.statCard('database', Object.keys(_stats.byEntity || {}).length, 'Entity Types', { iconClass: 'warning' })}
            ${Studio.UI.statCard('activity', Object.keys(_stats.byAction || {}).length, 'Action Types', { iconClass: 'success' })}
          </div>
        ` : ''}

        <div class="studio-section">
          <div class="studio-section-header">
            <span class="studio-section-title">Activity Trail</span>
            <div style="display:flex;gap:8px;">
              <select class="studio-form-input studio-form-select" id="auditEntityFilter" style="width:140px;padding:5px 8px;font-size:0.78rem;">
                <option value="">All Entities</option>
                <option value="knowledge" ${_filter.entity === 'knowledge' ? 'selected' : ''}>Knowledge</option>
                <option value="graph" ${_filter.entity === 'graph' ? 'selected' : ''}>Graph</option>
                <option value="user" ${_filter.entity === 'user' ? 'selected' : ''}>User</option>
                <option value="job" ${_filter.entity === 'job' ? 'selected' : ''}>Job</option>
                <option value="page" ${_filter.entity === 'page' ? 'selected' : ''}>Page</option>
                <option value="settings" ${_filter.entity === 'settings' ? 'selected' : ''}>Settings</option>
              </select>
              <select class="studio-form-input studio-form-select" id="auditActionFilter" style="width:140px;padding:5px 8px;font-size:0.78rem;">
                <option value="">All Actions</option>
                <option value="create" ${_filter.action === 'create' ? 'selected' : ''}>Create</option>
                <option value="update" ${_filter.action === 'update' ? 'selected' : ''}>Update</option>
                <option value="delete" ${_filter.action === 'delete' ? 'selected' : ''}>Delete</option>
                <option value="publish" ${_filter.action === 'publish' ? 'selected' : ''}>Publish</option>
              </select>
            </div>
          </div>
          <div style="overflow-x:auto;">
            ${_logs.length === 0 ?
              Studio.UI.emptyState('scroll-text', 'No Audit Logs', 'Admin actions will be recorded here automatically') :
              `<table class="studio-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>User</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  ${_logs.map(log => `
                    <tr>
                      <td style="white-space:nowrap;font-size:0.78rem;color:var(--text-tertiary);">
                        ${new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>${getActionBadge(log.action)}</td>
                      <td>
                        <div style="font-size:0.82rem;color:var(--text-primary);">${log.entity || '—'}</div>
                        <div style="font-size:0.7rem;color:var(--text-tertiary);font-family:var(--font-mono);">${log.entityId ? log.entityId.substring(0, 12) + '...' : ''}</div>
                      </td>
                      <td style="font-size:0.82rem;">${log.userName || log.userId || 'System'}</td>
                      <td style="max-width:300px;">
                        ${renderDiff(log.before, log.after)}
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>`}
          </div>
          ${total > _limit ? `
            <div style="display:flex;justify-content:center;gap:8px;padding:16px;">
              ${Studio.UI.btn('Previous', { icon: 'chevron-left', size: 'sm', id: 'auditPrev', disabled: _page === 0 })}
              <span style="font-size:0.82rem;color:var(--text-tertiary);padding:4px 12px;">Page ${_page + 1} of ${Math.ceil(total / _limit)}</span>
              ${Studio.UI.btn('Next', { icon: 'chevron-right', size: 'sm', id: 'auditNext', disabled: (_page + 1) * _limit >= total })}
            </div>` : ''}
        </div>`;
    },

    mount() {
      document.getElementById('auditEntityFilter')?.addEventListener('change', (e) => {
        _filter.entity = e.target.value;
        _page = 0;
        Studio.Router.handleRoute();
      });
      document.getElementById('auditActionFilter')?.addEventListener('change', (e) => {
        _filter.action = e.target.value;
        _page = 0;
        Studio.Router.handleRoute();
      });
      document.getElementById('auditPrev')?.addEventListener('click', () => { _page = Math.max(0, _page - 1); Studio.Router.handleRoute(); });
      document.getElementById('auditNext')?.addEventListener('click', () => { _page++; Studio.Router.handleRoute(); });
    },

    unmount() { _logs = []; _stats = null; _page = 0; }
  };
});
