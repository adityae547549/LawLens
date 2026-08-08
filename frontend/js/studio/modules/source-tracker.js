/**
 * LawLens Studio — Source Tracker Module
 * Visual monitoring of official Indian legal sources
 */

Studio.Modules.register('source-tracker', () => {
  let _sources = [];
  let _stats = null;
  let _filter = { category: '', trustLevel: '' };
  let _checking = {};

  async function loadData() {
    try {
      const params = new URLSearchParams();
      if (_filter.category) params.set('category', _filter.category);
      if (_filter.trustLevel) params.set('trustLevel', _filter.trustLevel);

      const [sourcesRes, statsRes] = await Promise.allSettled([
        Studio.api(`/studio/sources/tracker?${params}`),
        Studio.api('/studio/sources/tracker/stats')
      ]);

      _sources = sourcesRes.status === 'fulfilled' ? (sourcesRes.value?.data || []) : [];
      _stats = statsRes.status === 'fulfilled' ? statsRes.value?.data : null;
    } catch (err) { _sources = []; }
  }

  function getStatusBadge(status) {
    const map = {
      idle: 'neutral', checking: 'info', downloading: 'info',
      parsing: 'info', pending_review: 'warning', active: 'success', error: 'error'
    };
    return Studio.UI.badge(status || 'unknown', map[status] || 'neutral');
  }

  function getTrustBadge(level) {
    const map = {
      official: 'success', verified: 'info', unverified: 'warning', third_party: 'neutral'
    };
    return Studio.UI.badge(level || 'unknown', map[level] || 'neutral');
  }

  function getCategoryIcon(category) {
    const map = {
      statute: 'book-open', judiciary: 'scale', gazette: 'newspaper',
      regulator: 'shield', tax: 'calculator', tribunal: 'building-2',
      constitutional: 'landmark', advisory: 'users', legislature: 'landmark',
      aggregator: 'database', custom: 'folder'
    };
    return map[category] || 'file';
  }

  function renderStats() {
    if (!_stats) return '';
    return `
      <div class="studio-stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr));margin-bottom:20px;">
        ${Studio.UI.statCard('database', _stats.total, 'Total Sources')}
        ${Studio.UI.statCard('check-circle', _stats.active, 'Active', { iconClass: 'success' })}
        ${Studio.UI.statCard('clock', _stats.dueForCheck, 'Due for Check', { iconClass: 'warning' })}
        ${Studio.UI.statCard('alert-triangle', _stats.pending, 'Pending Review', { iconClass: 'warning' })}
        ${Studio.UI.statCard('x-circle', _stats.errors, 'Errors', { iconClass: 'error' })}
      </div>`;
  }

  function renderSourceCard(source) {
    const isChecking = _checking[source.id];
    const lastChecked = source.lastChecked ? new Date(source.lastChecked).toLocaleString() : 'Never';
    const hasChanges = source.pendingDiffs?.length > 0;

    return `
      <div class="studio-section source-card" data-source-id="${source.id}" style="position:relative;${hasChanges ? 'border-color:var(--warning);' : ''}">
        ${hasChanges ? '<div style="position:absolute;top:8px;right:8px;width:8px;height:8px;border-radius:50%;background:var(--warning);animation:pulse-dot 2s infinite;"></div>' : ''}
        <div class="studio-section-body">
          <div style="display:flex;align-items:start;gap:12px;">
            <div style="width:40px;height:40px;border-radius:10px;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <i data-lucide="${getCategoryIcon(source.category)}" style="width:20px;height:20px;color:var(--text-secondary);"></i>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <span style="font-weight:600;font-size:0.9rem;color:var(--text-primary);">${source.name}</span>
                ${getStatusBadge(source.status)}
                ${getTrustBadge(source.trustLevel)}
              </div>
              <div style="font-size:0.78rem;color:var(--text-tertiary);margin-bottom:6px;">${source.authority}</div>
              <div style="display:flex;gap:12px;font-size:0.72rem;color:var(--text-tertiary);flex-wrap:wrap;">
                <span>Category: ${source.category}</span>
                <span>Frequency: ${source.updateFrequency}</span>
                <span>Checked: ${lastChecked}</span>
                <span>v${source.version || 1}</span>
                ${source.changeCount ? `<span style="color:var(--warning);">${source.changeCount} changes</span>` : ''}
              </div>
              ${source.tags?.length ? `
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">
                  ${source.tags.slice(0, 4).map(t => Studio.UI.badge(t, 'neutral')).join('')}
                </div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">
              <button class="studio-btn studio-btn-secondary studio-btn-sm check-source" data-id="${source.id}" ${isChecking ? 'disabled' : ''}>
                ${isChecking ? '<div class="studio-loading-spinner" style="width:12px;height:12px;border-width:2px;"></div>' : '<i data-lucide="refresh-cw" style="width:12px;height:12px;"></i>'}
                ${isChecking ? 'Checking...' : 'Check'}
              </button>
              ${hasChanges ? `
                <button class="studio-btn studio-btn-primary studio-btn-sm approve-source" data-id="${source.id}">
                  <i data-lucide="check" style="width:12px;height:12px;"></i> Approve
                </button>
                <button class="studio-btn studio-btn-danger studio-btn-sm reject-source" data-id="${source.id}">
                  <i data-lucide="x" style="width:12px;height:12px;"></i> Reject
                </button>` : ''}
              <button class="studio-btn studio-btn-ghost studio-btn-sm toggle-source" data-id="${source.id}" title="${source.isActive ? 'Disable' : 'Enable'}">
                <i data-lucide="${source.isActive ? 'pause' : 'play'}" style="width:12px;height:12px;"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  return {
    async render() {
      await loadData();

      const categories = [...new Set(_sources.map(s => s.category))].sort();
      const trustLevels = [...new Set(_sources.map(s => s.trustLevel))].sort();

      // Pre-compute complex content to avoid deeply-nested template literals
      const catOptions = categories.map(c =>
        '<option value="' + c + '"' + (_filter.category === c ? ' selected' : '') + '>' +
        c.charAt(0).toUpperCase() + c.slice(1) + '</option>'
      ).join('');
      const trustOptions = trustLevels.map(t =>
        '<option value="' + t + '"' + (_filter.trustLevel === t ? ' selected' : '') + '>' +
        t.charAt(0).toUpperCase() + t.slice(1) + '</option>'
      ).join('');

      const pending = _sources.filter(s => s.pendingDiffs && s.pendingDiffs.length > 0);
      let pendingHtml;
      if (pending.length === 0) {
        pendingHtml = '<div style="padding:12px;text-align:center;color:var(--text-tertiary);font-size:0.82rem;">No pending changes</div>';
      } else {
        pendingHtml = '<div style="padding:12px;">' + pending.map(s =>
          '<div style="display:flex;align-items:center;gap:8px;padding:8px;background:rgba(245,158,11,0.08);border-radius:8px;margin-bottom:6px;">' +
          '<i data-lucide="alert-triangle" style="width:14px;height:14px;color:var(--warning);"></i>' +
          '<span style="font-size:0.82rem;color:var(--text-primary);flex:1;">' + s.name + '</span>' +
          Studio.UI.btn('Approve', { icon: 'check', variant: 'primary', size: 'sm', id: 'approve-' + s.id }) +
          Studio.UI.btn('Reject', { icon: 'x', variant: 'danger', size: 'sm', id: 'reject-' + s.id }) +
          '</div>'
        ).join('') + '</div>';
      }

      const sourceCards = _sources.length === 0
        ? Studio.UI.emptyState('database', 'No Sources', 'No sources match your filters')
        : _sources.map(s => renderSourceCard(s)).join('');

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Source Tracker</h1>
            <p class="studio-module-subtitle">Monitor ${_sources.length} official Indian legal sources</p>
          </div>
          <div class="studio-module-actions">
            <select class="studio-form-input studio-form-select" id="trackerCategory" style="width:130px;padding:6px 8px;font-size:0.82rem;">
              <option value="">All Categories</option>
              ${catOptions}
            </select>
            <select class="studio-form-input studio-form-select" id="trackerTrust" style="width:130px;padding:6px 8px;font-size:0.82rem;">
              <option value="">All Trust Levels</option>
              ${trustOptions}
            </select>
            ${Studio.UI.btn('Check All Due', { icon: 'refresh-cw', variant: 'primary', id: 'checkAllBtn' })}
          </div>
        </div>

        ${renderStats()}

        ${Studio.UI.section('Pending Changes', pendingHtml)}

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(480px,1fr));gap:12px;">
          ${sourceCards}
        </div>`;
    },

    mount() {
      // Filters
      document.getElementById('trackerCategory')?.addEventListener('change', (e) => {
        _filter.category = e.target.value;
        Studio.Router.handleRoute();
      });
      document.getElementById('trackerTrust')?.addEventListener('change', (e) => {
        _filter.trustLevel = e.target.value;
        Studio.Router.handleRoute();
      });

      // Check all
      document.getElementById('checkAllBtn')?.addEventListener('click', async () => {
        try {
          Studio.Toast.info('Checking all due sources...');
          const res = await Studio.api('/studio/sources/tracker/check-all', { method: 'POST' });
          Studio.Toast.success(`Check complete: ${res.data?.changed || 0} changes found`);
          Studio.Router.handleRoute();
        } catch (err) { Studio.Toast.error(err.message); }
      });

      // Individual check
      document.querySelectorAll('.check-source').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          _checking[id] = true;
          Studio.Router.handleRoute();
          try {
            const res = await Studio.api(`/studio/sources/tracker/${id}/check`, { method: 'POST' });
            if (res.data?.changed) {
              Studio.Toast.warning(`Changes detected in ${_sources.find(s => s.id === id)?.name || id}`);
            } else {
              Studio.Toast.success('No changes detected');
            }
          } catch (err) { Studio.Toast.error(err.message); }
          delete _checking[id];
          Studio.Router.handleRoute();
        });
      });

      // Approve/Reject
      document.querySelectorAll('.approve-source').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await Studio.api(`/studio/sources/tracker/${btn.dataset.id}/approve`, { method: 'POST' });
            Studio.Toast.success('Changes approved');
            Studio.Router.handleRoute();
          } catch (err) { Studio.Toast.error(err.message); }
        });
      });

      document.querySelectorAll('.reject-source').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await Studio.api(`/studio/sources/tracker/${btn.dataset.id}/reject`, { method: 'POST' });
            Studio.Toast.success('Changes rejected');
            Studio.Router.handleRoute();
          } catch (err) { Studio.Toast.error(err.message); }
        });
      });

      // Toggle
      document.querySelectorAll('.toggle-source').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await Studio.api(`/studio/sources/tracker/${btn.dataset.id}/toggle`, { method: 'POST' });
            Studio.Toast.success('Source toggled');
            Studio.Router.handleRoute();
          } catch (err) { Studio.Toast.error(err.message); }
        });
      });

      // Pending approve/reject buttons
      _sources.filter(s => s.pendingDiffs?.length > 0).forEach(s => {
        document.getElementById(`approve-${s.id}`)?.addEventListener('click', async () => {
          try {
            await Studio.api(`/studio/sources/tracker/${s.id}/approve`, { method: 'POST' });
            Studio.Toast.success('Changes approved');
            Studio.Router.handleRoute();
          } catch (err) { Studio.Toast.error(err.message); }
        });
        document.getElementById(`reject-${s.id}`)?.addEventListener('click', async () => {
          try {
            await Studio.api(`/studio/sources/tracker/${s.id}/reject`, { method: 'POST' });
            Studio.Toast.success('Changes rejected');
            Studio.Router.handleRoute();
          } catch (err) { Studio.Toast.error(err.message); }
        });
      });
    },

    unmount() { _sources = []; _stats = null; _checking = {}; }
  };
});
