/**
 * LawLens Studio — Background Jobs Module
 * Visual job queue with progress, logs, and controls
 */

Studio.Modules.register('background-jobs', () => {
  let _jobs = [];
  let _stats = null;
  let _filter = { status: '', type: '' };

  async function loadJobs() {
    try {
      const params = new URLSearchParams();
      if (_filter.status) params.set('status', _filter.status);
      if (_filter.type) params.set('type', _filter.type);

      const [jobsRes, statsRes] = await Promise.allSettled([
        Studio.api(`/studio/jobs?${params}`),
        Studio.api('/studio/jobs/stats')
      ]);

      _jobs = jobsRes.status === 'fulfilled' ? (jobsRes.value?.data?.items || []) : [];
      _stats = statsRes.status === 'fulfilled' ? statsRes.value?.data : null;
    } catch (err) {
      _jobs = [];
    }
  }

  function getStatusBadge(status) {
    const map = {
      queued: 'neutral', running: 'info', completed: 'success',
      failed: 'error', cancelled: 'warning'
    };
    return Studio.UI.badge(status, map[status] || 'neutral');
  }

  function getTypeIcon(type) {
    const map = {
      import: 'upload', sync: 'refresh-cw', benchmark: 'gauge',
      index: 'database', rebuild: 'hard-drive', heal: 'heart-pulse'
    };
    return map[type] || 'layers';
  }

  function renderProgressBar(progress, status) {
    const color = status === 'failed' ? 'var(--error)' : status === 'completed' ? 'var(--success)' : 'var(--accent-primary)';
    return `
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="flex:1;height:4px;background:var(--bg-tertiary);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${progress}%;background:${color};border-radius:2px;transition:width 0.3s;"></div>
        </div>
        <span style="font-size:0.72rem;color:var(--text-tertiary);min-width:30px;text-align:right;">${Math.round(progress)}%</span>
      </div>`;
  }

  return {
    async render() {
      await loadJobs();

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Background Jobs</h1>
            <p class="studio-module-subtitle">Monitor and manage background tasks</p>
          </div>
          <div class="studio-module-actions">
            ${Studio.UI.btn('Refresh', { icon: 'refresh-cw', onclick: 'Studio.Router.handleRoute()' })}
          </div>
        </div>

        ${_stats ? `
          <div class="studio-stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr));margin-bottom:20px;">
            ${Studio.UI.statCard('layers', _stats.total, 'Total Jobs')}
            ${Studio.UI.badge(_stats.queued + ' queued', 'neutral')}
            ${Studio.UI.badge(_stats.running + ' running', 'info')}
            ${Studio.UI.badge(_stats.completed + ' completed', 'success')}
            ${Studio.UI.badge(_stats.failed + ' failed', 'error')}
          </div>
        ` : ''}

        <div class="studio-section">
          <div class="studio-section-header">
            <span class="studio-section-title">Job Queue</span>
            <div style="display:flex;gap:8px;">
              <select class="studio-form-input studio-form-select" id="jobStatusFilter" style="width:130px;padding:5px 8px;font-size:0.78rem;">
                <option value="">All Status</option>
                <option value="queued" ${_filter.status === 'queued' ? 'selected' : ''}>Queued</option>
                <option value="running" ${_filter.status === 'running' ? 'selected' : ''}>Running</option>
                <option value="completed" ${_filter.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="failed" ${_filter.status === 'failed' ? 'selected' : ''}>Failed</option>
              </select>
              <select class="studio-form-input studio-form-select" id="jobTypeFilter" style="width:130px;padding:5px 8px;font-size:0.78rem;">
                <option value="">All Types</option>
                <option value="import" ${_filter.type === 'import' ? 'selected' : ''}>Import</option>
                <option value="sync" ${_filter.type === 'sync' ? 'selected' : ''}>Sync</option>
                <option value="benchmark" ${_filter.type === 'benchmark' ? 'selected' : ''}>Benchmark</option>
                <option value="index" ${_filter.type === 'index' ? 'selected' : ''}>Index</option>
                <option value="rebuild" ${_filter.type === 'rebuild' ? 'selected' : ''}>Rebuild</option>
              </select>
            </div>
          </div>
          <div style="overflow-x:auto;">
            ${_jobs.length === 0 ?
              Studio.UI.emptyState('layers', 'No Jobs', 'Background jobs will appear here when tasks are running') :
              `<table class="studio-table">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${_jobs.map(job => `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                          <i data-lucide="${getTypeIcon(job.type)}" style="width:16px;height:16px;color:var(--text-tertiary);"></i>
                          <div>
                            <div style="font-weight:500;font-size:0.85rem;color:var(--text-primary);">${job.name}</div>
                            <div style="font-size:0.7rem;color:var(--text-tertiary);">${job.description || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>${Studio.UI.badge(job.type, 'neutral')}</td>
                      <td>${getStatusBadge(job.status)}</td>
                      <td style="min-width:120px;">${renderProgressBar(job.progress || 0, job.status)}</td>
                      <td style="font-size:0.78rem;color:var(--text-tertiary);white-space:nowrap;">
                        ${new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div style="display:flex;gap:4px;">
                          ${job.status === 'running' || job.status === 'queued' ?
                            `<button class="studio-btn studio-btn-danger studio-btn-sm job-cancel" data-id="${job.id}" title="Cancel"><i data-lucide="x" style="width:12px;height:12px;"></i></button>` : ''}
                          ${job.status === 'failed' ?
                            `<button class="studio-btn studio-btn-secondary studio-btn-sm job-retry" data-id="${job.id}" title="Retry"><i data-lucide="rotate-ccw" style="width:12px;height:12px;"></i></button>` : ''}
                        </div>
                      </td>
                    </tr>
                    ${job.logs && job.logs.length > 0 ? `
                      <tr>
                        <td colspan="6" style="padding:0 16px 12px;">
                          <div style="background:var(--bg-tertiary);border-radius:6px;padding:8px 12px;max-height:80px;overflow-y:auto;">
                            ${job.logs.slice(-3).map(log => `
                              <div style="font-size:0.7rem;color:var(--text-tertiary);font-family:var(--font-mono);">
                                ${new Date(log.timestamp).toLocaleTimeString()} — ${log.message}
                              </div>`).join('')}
                          </div>
                        </td>
                      </tr>` : ''}
                  `).join('')}
                </tbody>
              </table>`}
          </div>
        </div>`;
    },

    mount() {
      document.getElementById('jobStatusFilter')?.addEventListener('change', (e) => {
        _filter.status = e.target.value;
        Studio.Router.handleRoute();
      });
      document.getElementById('jobTypeFilter')?.addEventListener('change', (e) => {
        _filter.type = e.target.value;
        Studio.Router.handleRoute();
      });

      document.querySelectorAll('.job-cancel').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await Studio.api(`/studio/jobs/${btn.dataset.id}/cancel`, { method: 'POST' });
            Studio.Toast.success('Job cancelled');
            Studio.Router.handleRoute();
          } catch (err) { Studio.Toast.error(err.message); }
        });
      });

      document.querySelectorAll('.job-retry').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await Studio.api(`/studio/jobs/${btn.dataset.id}/retry`, { method: 'POST' });
            Studio.Toast.success('Job queued for retry');
            Studio.Router.handleRoute();
          } catch (err) { Studio.Toast.error(err.message); }
        });
      });
    },

    unmount() { _jobs = []; _stats = null; }
  };
});
