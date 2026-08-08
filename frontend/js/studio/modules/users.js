/**
 * LawLens Studio — Users & Roles Module
 */

Studio.Modules.register('users', () => {
  let _users = [];
  let _searchQuery = '';

  async function loadUsers() {
    try {
      const res = await Studio.api('/admin/users');
      _users = res.users || [];
    } catch (err) {
      _users = [];
    }
  }

  function getFilteredUsers() {
    if (!_searchQuery) return _users;
    const q = _searchQuery.toLowerCase();
    return _users.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  }

  function getRoleBadge(role) {
    const map = { admin: 'error', editor: 'primary', researcher: 'info', moderator: 'warning', viewer: 'neutral' };
    return Studio.UI.badge(role || 'unknown', map[role] || 'neutral');
  }

  return {
    async render() {
      await loadUsers();
      const users = getFilteredUsers();

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Users & Roles</h1>
            <p class="studio-module-subtitle">${_users.length} registered user${_users.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div class="studio-stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));margin-bottom:20px;">
          ${Studio.UI.statCard('users', _users.length, 'Total Users')}
          ${Studio.UI.statCard('shield', _users.filter(u => u.role === 'admin').length, 'Admins', { iconClass: 'error' })}
          ${Studio.UI.statCard('pencil', _users.filter(u => u.role === 'editor').length, 'Editors', { iconClass: 'info' })}
          ${Studio.UI.statCard('eye', _users.filter(u => u.role === 'viewer').length, 'Viewers', { iconClass: 'neutral' })}
        </div>

        <div class="studio-section">
          <div class="studio-section-header">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="studio-section-title">All Users</span>
            </div>
            <div style="position:relative;">
              <i data-lucide="search" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--text-tertiary);"></i>
              <input class="studio-form-input" id="userSearch" placeholder="Search users..." style="padding:6px 10px 6px 28px;width:200px;font-size:0.82rem;">
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table class="studio-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th style="width:80px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${users.length === 0 ? `<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-tertiary);">No users found</td></tr>` :
                  users.map(u => `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:10px;">
                          <div style="width:32px;height:32px;border-radius:8px;background:var(--gradient-primary);color:white;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;">${(u.name || 'U')[0].toUpperCase()}</div>
                          <span style="font-weight:600;color:var(--text-primary);font-size:0.85rem;">${u.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td style="font-size:0.82rem;">${u.email || '—'}</td>
                      <td>${getRoleBadge(u.role)}</td>
                      <td style="font-size:0.78rem;color:var(--text-tertiary);">${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                      <td>
                        ${u.role !== 'admin' ?
                          `<button class="studio-btn studio-btn-danger studio-btn-sm delete-user" data-id="${u.id}" title="Delete"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>` :
                          '<span style="font-size:0.72rem;color:var(--text-tertiary);">Protected</span>'}
                      </td>
                    </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    },

    mount() {
      document.getElementById('userSearch')?.addEventListener('input', (e) => {
        _searchQuery = e.target.value;
        // Re-render table body
        const tbody = document.querySelector('.studio-table tbody');
        if (tbody) {
          const users = getFilteredUsers();
          tbody.innerHTML = users.length === 0 ? `<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-tertiary);">No users found</td></tr>` :
            users.map(u => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;border-radius:8px;background:var(--gradient-primary);color:white;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;">${(u.name || 'U')[0].toUpperCase()}</div>
                    <span style="font-weight:600;color:var(--text-primary);font-size:0.85rem;">${u.name || 'Unknown'}</span>
                  </div>
                </td>
                <td style="font-size:0.82rem;">${u.email || '—'}</td>
                <td>${getRoleBadge(u.role)}</td>
                <td style="font-size:0.78rem;color:var(--text-tertiary);">${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                <td>${u.role !== 'admin' ? `<button class="studio-btn studio-btn-danger studio-btn-sm delete-user" data-id="${u.id}"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>` : '<span style="font-size:0.72rem;color:var(--text-tertiary);">Protected</span>'}</td>
              </tr>`).join('');
          if (window.lucide) lucide.createIcons();
          this._bindDelete();
        }
      });
      this._bindDelete();
    },

    _bindDelete() {
      document.querySelectorAll('.delete-user').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const user = _users.find(u => u.id === id);
          Studio.Modal.confirm('Delete User', `Delete user "${user?.name || id}"?`, async () => {
            try {
              await Studio.api(`/admin/users/${id}`, { method: 'DELETE' });
              Studio.Toast.success('User deleted');
              _users = _users.filter(u => u.id !== id);
              Studio.Router.handleRoute();
            } catch (err) {
              Studio.Toast.error(err.message);
            }
          });
        });
      });
    },

    unmount() { _users = []; _searchQuery = ''; }
  };
});
