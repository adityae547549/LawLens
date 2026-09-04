/**
 * LawLens Studio — Core SPA Engine
 * Router, Module System, State Management, UI Components, Event Bus
 */

window.Studio = (() => {
  // ── State Store ────────────────────────────────────────────
  const _state = {};
  const _listeners = {};

  const Store = {
    get(key) {
      return _state[key];
    },
    set(key, value) {
      _state[key] = value;
      (_listeners[key] || []).forEach(fn => fn(value));
    },
    on(key, fn) {
      if (!_listeners[key]) _listeners[key] = [];
      _listeners[key].push(fn);
      return () => { _listeners[key] = _listeners[key].filter(f => f !== fn); };
    }
  };

  // ── Undo/Redo Stack ────────────────────────────────────────
  const _undoStack = [];
  const _redoStack = [];
  const MAX_UNDO = 50;

  const Undo = {
    push(action) {
      _undoStack.push(action);
      if (_undoStack.length > MAX_UNDO) _undoStack.shift();
      _redoStack.length = 0;
      this._updateButtons();
    },
    undo() {
      if (_undoStack.length === 0) return;
      const action = _undoStack.pop();
      if (action.undo) action.undo();
      _redoStack.push(action);
      this._updateButtons();
    },
    redo() {
      if (_redoStack.length === 0) return;
      const action = _redoStack.pop();
      if (action.redo) action.redo();
      _undoStack.push(action);
      this._updateButtons();
    },
    canUndo() { return _undoStack.length > 0; },
    canRedo() { return _redoStack.length > 0; },
    _updateButtons() {
      const undoBtn = document.getElementById('undoBtn');
      const redoBtn = document.getElementById('redoBtn');
      if (undoBtn) undoBtn.disabled = !this.canUndo();
      if (redoBtn) redoBtn.disabled = !this.canRedo();
    }
  };

  // ── Event Bus ──────────────────────────────────────────────
  const _events = {};

  const Events = {
    on(name, fn) {
      if (!_events[name]) _events[name] = [];
      _events[name].push(fn);
      return () => { _events[name] = _events[name].filter(f => f !== fn); };
    },
    emit(name, data) {
      (_events[name] || []).forEach(fn => fn(data));
    }
  };

  // ── Module Registry ────────────────────────────────────────
  const _modules = {};
  let _currentModule = null;
  let _currentModuleInstance = null;

  const Modules = {
    register(name, factory) {
      _modules[name] = factory;
    },
    get(name) {
      return _modules[name];
    },
    getAll() {
      return Object.keys(_modules);
    }
  };

  // ── Router ─────────────────────────────────────────────────
  const _routes = {};
  let _defaultRoute = 'dashboard';

  const Router = {
    define(name, config) {
      _routes[name] = config;
    },
    defineAll(routes) {
      Object.assign(_routes, routes);
    },
    getDefault() { return _defaultRoute; },
    getDefaultRoute() { return _defaultRoute; },
    setDefault(route) { _defaultRoute = route; },
    getRoutes() { return _routes; },
    getCurrentRoute() {
      const hash = window.location.hash.replace('#/', '').split('?')[0];
      return hash || _defaultRoute;
    },
    navigate(route) {
      window.location.hash = '#/' + route;
    },
    async handleRoute() {
      const route = this.getCurrentRoute();
      const config = _routes[route];

      if (!config) {
        this.navigate(_defaultRoute);
        return;
      }

      // Auth guard
      if (!Utils.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
      }

      // Check admin role
      const user = Utils.getUser();
      if (!user || user.role !== 'admin') {
        document.getElementById('studioContent').innerHTML = `
          <div class="studio-empty">
            <div class="studio-empty-icon"><i data-lucide="shield-alert"></i></div>
            <div class="studio-empty-title">Access Denied</div>
            <div class="studio-empty-desc">You need administrator privileges to access LawLens Studio.</div>
            <a href="/dashboard.html" class="studio-btn studio-btn-primary">Back to Dashboard</a>
          </div>`;
        if (window.lucide) lucide.createIcons();
        return;
      }

      // Unmount current module
      if (_currentModuleInstance && _currentModuleInstance.unmount) {
        _currentModuleInstance.unmount();
      }

      // Update active nav
      document.querySelectorAll('.studio-nav-item').forEach(el => el.classList.remove('active'));
      const navItem = document.querySelector(`.studio-nav-item[data-module="${route}"]`);
      if (navItem) navItem.classList.add('active');

      // Update breadcrumb
      const breadcrumb = document.getElementById('breadcrumbCurrent');
      if (breadcrumb) breadcrumb.textContent = config.title || route;

      // Update document title
      document.title = `${config.title || route} — LawLens Studio`;

      // Render module
      const content = document.getElementById('studioContent');
      const factory = _modules[route];

      if (factory) {
        _currentModule = route;
        _currentModuleInstance = typeof factory === 'function' ? factory() : factory;
        content.innerHTML = '<div class="studio-loading"><div class="studio-loading-spinner"></div></div>';

        try {
          const html = await _currentModuleInstance.render();
          content.innerHTML = `<div class="studio-module" id="module-${route}">${html}</div>`;
          if (_currentModuleInstance.mount) _currentModuleInstance.mount();
          if (window.lucide) lucide.createIcons();
        } catch (err) {
          console.error(`Module ${route} render error:`, err);
          content.innerHTML = `
            <div class="studio-empty">
              <div class="studio-empty-icon"><i data-lucide="alert-triangle"></i></div>
              <div class="studio-empty-title">Module Error</div>
              <div class="studio-empty-desc">${err.message}</div>
              <button class="studio-btn studio-btn-secondary" onclick="Studio.Router.handleRoute()">Retry</button>
            </div>`;
          if (window.lucide) lucide.createIcons();
        }
      } else {
        // Placeholder for modules not yet implemented
        content.innerHTML = `
          <div class="studio-module">
            <div class="studio-module-header">
              <div>
                <h1 class="studio-module-title">${config.title || route}</h1>
                <p class="studio-module-subtitle">${config.description || ''}</p>
              </div>
            </div>
            <div class="studio-section">
              <div class="studio-section-body">
                <div class="studio-empty">
                  <div class="studio-empty-icon"><i data-lucide="construction"></i></div>
                  <div class="studio-empty-title">Coming Soon</div>
                  <div class="studio-empty-desc">This module is under development.</div>
                </div>
              </div>
            </div>
          </div>`;
        if (window.lucide) lucide.createIcons();
      }
    }
  };

  // ── UI Components ──────────────────────────────────────────
  const UI = {
    statCard(icon, value, label, opts = {}) {
      const iconClass = opts.iconClass || '';
      const trend = opts.trend ? `<span class="studio-stat-card-trend ${opts.trendDir || 'neutral'}">${opts.trend}</span>` : '';
      return `
        <div class="studio-stat-card">
          <div class="studio-stat-card-header">
            <div class="studio-stat-card-icon ${iconClass}"><i data-lucide="${icon}"></i></div>
            ${trend}
          </div>
          <div class="studio-stat-card-value">${value}</div>
          <div class="studio-stat-card-label">${label}</div>
        </div>`;
    },

    section(title, bodyHtml, opts = {}) {
      const actions = opts.actions ? `<div>${opts.actions}</div>` : '';
      return `
        <div class="studio-section">
          <div class="studio-section-header">
            <span class="studio-section-title">${title}</span>
            ${actions}
          </div>
          <div class="studio-section-body ${opts.noPadding ? 'no-padding' : ''}">${bodyHtml}</div>
        </div>`;
    },

    table(headers, rows, opts = {}) {
      const ths = headers.map(h => `<th>${h}</th>`).join('');
      const trs = rows.map(row => {
        const cells = row.map(cell => `<td>${cell}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `
        <table class="studio-table">
          <thead><tr>${ths}</tr></thead>
          <tbody>${trs || '<tr><td colspan="' + headers.length + '" style="text-align:center;padding:32px;color:var(--text-tertiary);">No data</td></tr>'}</tbody>
        </table>`;
    },

    emptyState(icon, title, desc, actionHtml) {
      return `
        <div class="studio-empty">
          <div class="studio-empty-icon"><i data-lucide="${icon}"></i></div>
          <div class="studio-empty-title">${title}</div>
          <div class="studio-empty-desc">${desc}</div>
          ${actionHtml || ''}
        </div>`;
    },

    loading() {
      return '<div class="studio-loading"><div class="studio-loading-spinner"></div><p>Loading...</p></div>';
    },

    skeleton(count = 3) {
      return Array(count).fill('<div class="studio-loading-skeleton" style="height:80px;margin-bottom:12px;"></div>').join('');
    },

    tabs(items, activeId) {
      const tabs = items.map(item =>
        `<button class="studio-tab ${item.id === activeId ? 'active' : ''}" data-tab="${item.id}">${item.label}</button>`
      ).join('');
      return `<div class="studio-tabs">${tabs}</div>`;
    },

    badge(text, type = 'neutral') {
      return `<span class="studio-badge studio-badge-${type}">${text}</span>`;
    },

    btn(text, opts = {}) {
      const icon = opts.icon ? `<i data-lucide="${opts.icon}"></i>` : '';
      const cls = `studio-btn studio-btn-${opts.variant || 'secondary'} ${opts.size ? 'studio-btn-' + opts.size : ''}`.trim();
      return `<button class="${cls}" ${opts.onclick ? `onclick="${opts.onclick}"` : ''} ${opts.id ? `id="${opts.id}"` : ''} ${opts.disabled ? 'disabled' : ''}>${icon}${text}</button>`;
    },

    activityItem(text, time, dotClass = '') {
      return `
        <div class="studio-activity-item">
          <div class="studio-activity-dot ${dotClass}"></div>
          <div>
            <div class="studio-activity-text">${text}</div>
            <div class="studio-activity-time">${time}</div>
          </div>
        </div>`;
    }
  };

  // ── Toast ──────────────────────────────────────────────────
  const Toast = {
    show(message, type = 'info', duration = 3000) {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },
    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); }
  };

  // ── Modal ──────────────────────────────────────────────────
  const Modal = {
    show(opts) {
      const host = document.getElementById('modalHost');
      const title = opts.title || '';
      const body = opts.body || '';
      const footer = opts.footer || '';
      const size = opts.size || '';

      host.innerHTML = `
        <div class="studio-modal-overlay" id="modalOverlay">
          <div class="studio-modal" ${size ? `style="max-width:${size}"` : ''}>
            <div class="studio-modal-header">
              <span class="studio-modal-title">${title}</span>
              <button class="studio-modal-close" id="modalClose"><i data-lucide="x"></i></button>
            </div>
            <div class="studio-modal-body">${body}</div>
            ${footer ? `<div class="studio-modal-footer">${footer}</div>` : ''}
          </div>
        </div>`;

      if (window.lucide) lucide.createIcons();

      document.getElementById('modalClose').onclick = () => this.hide();
      document.getElementById('modalOverlay').onclick = (e) => {
        if (e.target.id === 'modalOverlay') this.hide();
      };
    },
    hide() {
      document.getElementById('modalHost').innerHTML = '';
    },
    confirm(title, message, onConfirm) {
      this.show({
        title,
        body: `<p style="color:var(--text-secondary);font-size:0.9rem;">${message}</p>`,
        footer: `
          <button class="studio-btn studio-btn-secondary" onclick="Studio.Modal.hide()">Cancel</button>
          <button class="studio-btn studio-btn-primary" id="modalConfirmBtn">Confirm</button>`
      });
      document.getElementById('modalConfirmBtn').onclick = () => {
        this.hide();
        onConfirm();
      };
    }
  };

  // ── Command Palette ────────────────────────────────────────
  const CommandPalette = {
    _items: [],
    _activeIndex: 0,

    init() {
      const items = [];
      // Add all routes as searchable items
      Object.entries(_routes).forEach(([key, config]) => {
        items.push({
          id: key,
          title: config.title || key,
          desc: config.description || 'Navigate to ' + (config.title || key),
          icon: config.icon || 'circle',
          action: () => Router.navigate(key),
          category: config.category || 'Navigation'
        });
      });

      // Add actions
      items.push(
        { id: 'action-theme', title: 'Toggle Theme', desc: 'Switch between dark and light mode', icon: 'moon', action: () => { const html = document.documentElement; const current = html.getAttribute('data-theme'); html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark'); }, category: 'Actions' },
        { id: 'action-dashboard', title: 'Go to Dashboard', desc: 'Navigate to the main dashboard', icon: 'layout-dashboard', action: () => Router.navigate('dashboard'), category: 'Navigation' }
      );

      this._items = items;

      // Event listeners
      const overlay = document.getElementById('commandPaletteOverlay');
      const input = document.getElementById('commandPaletteInput');

      input.addEventListener('input', () => this._filter(input.value));
      input.addEventListener('keydown', (e) => this._handleKey(e));

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
    },

    open() {
      const overlay = document.getElementById('commandPaletteOverlay');
      const input = document.getElementById('commandPaletteInput');
      overlay.classList.add('open');
      input.value = '';
      input.focus();
      this._activeIndex = 0;
      this._filter('');
    },

    close() {
      const overlay = document.getElementById('commandPaletteOverlay');
      overlay.classList.remove('open');
    },

    toggle() {
      const overlay = document.getElementById('commandPaletteOverlay');
      if (overlay.classList.contains('open')) {
        this.close();
      } else {
        this.open();
      }
    },

    _filter(query) {
      const q = query.toLowerCase();
      const results = this._items.filter(item =>
        !q || item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
      );

      const container = document.getElementById('commandPaletteResults');
      this._activeIndex = 0;

      if (results.length === 0) {
        container.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-tertiary);font-size:0.85rem;">No results found</div>';
        return;
      }

      container.innerHTML = results.map((item, i) => `
        <div class="command-palette-result ${i === 0 ? 'active' : ''}" data-index="${i}" data-id="${item.id}">
          <div class="command-palette-result-icon"><i data-lucide="${item.icon}"></i></div>
          <div class="command-palette-result-text">
            <div class="command-palette-result-title">${item.title}</div>
            <div class="command-palette-result-desc">${item.desc}</div>
          </div>
          <span class="command-palette-result-shortcut">${item.category}</span>
        </div>`).join('');

      if (window.lucide) lucide.createIcons();

      container.querySelectorAll('.command-palette-result').forEach((el, i) => {
        el.addEventListener('click', () => {
          results[i].action();
          this.close();
        });
        el.addEventListener('mouseenter', () => {
          container.querySelectorAll('.command-palette-result').forEach(r => r.classList.remove('active'));
          el.classList.add('active');
          this._activeIndex = i;
        });
      });
    },

    _handleKey(e) {
      const container = document.getElementById('commandPaletteResults');
      const items = container.querySelectorAll('.command-palette-result');

      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this._activeIndex = Math.min(this._activeIndex + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle('active', i === this._activeIndex));
        items[this._activeIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this._activeIndex = Math.max(this._activeIndex - 1, 0);
        items.forEach((el, i) => el.classList.toggle('active', i === this._activeIndex));
        items[this._activeIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        items[this._activeIndex]?.click();
      }
    }
  };

  // ── API Helper ─────────────────────────────────────────────
  const api = async (path, options = {}) => {
    return Utils.api(path, options);
  };

  // ── SSE Connection ──────────────────────────────────────────
  const SSE = {
    _es: null,
    _retryTimer: null,
    _retryDelay: 1000,
    _maxRetry: 30000,

    connect() {
      if (this._es) this.disconnect();
      const token = Utils.getToken();
      if (!token) return;
      const url = `/api/studio/events?token=${encodeURIComponent(token)}`;
      this._es = new EventSource(url);
      this._retryDelay = 1000;

      this._es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          Events.emit('sse:' + event.type, event);
          Events.emit('sse:*', event);
        } catch {}
      };

      this._es.onerror = () => {
        this._es.close();
        this._es = null;
        this._retryTimer = setTimeout(() => this.connect(), this._retryDelay);
        this._retryDelay = Math.min(this._retryDelay * 2, this._maxRetry);
      };
    },

    disconnect() {
      if (this._retryTimer) { clearTimeout(this._retryTimer); this._retryTimer = null; }
      if (this._es) { this._es.close(); this._es = null; }
    },

    isConnected() {
      return this._es && this._es.readyState === EventSource.OPEN;
    }
  };

  // ── Initialize ─────────────────────────────────────────────
  function init() {
    // Auth guard
    if (!Utils.isAuthenticated()) {
      window.location.href = '/login.html';
      return;
    }

    const user = Utils.getUser();
    if (user) {
      const avatar = document.getElementById('userAvatar');
      const name = document.getElementById('userName');
      if (avatar) avatar.textContent = (user.name || 'A')[0].toUpperCase();
      if (name) name.textContent = user.name || 'Admin';
    }

    // Sidebar toggle
    const sidebar = document.getElementById('studioSidebar');
    const toggle = document.getElementById('sidebarToggle');
    toggle?.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });

    // Mobile menu
    const mobileBtn = document.getElementById('mobileMenuBtn');
    mobileBtn?.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close mobile sidebar on nav click
    document.querySelectorAll('.studio-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
        }
      });
    });

    // Sidebar search opens command palette
    const searchInput = document.getElementById('sidebarSearchInput');
    searchInput?.addEventListener('click', () => CommandPalette.open());
    document.getElementById('searchBtn')?.addEventListener('click', () => CommandPalette.open());

    // Undo/Redo buttons
    document.getElementById('undoBtn')?.addEventListener('click', () => Undo.undo());
    document.getElementById('redoBtn')?.addEventListener('click', () => Undo.redo());

    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('lawlense_theme', next);
      // Update icon
      const icon = document.querySelector('#themeToggle i');
      if (icon) icon.setAttribute('data-lucide', next === 'dark' ? 'moon' : 'sun');
      if (window.lucide) lucide.createIcons();
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('lawlense_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Init command palette
    CommandPalette.init();

    // Handle route
    window.addEventListener('hashchange', () => Router.handleRoute());
    Router.handleRoute();

    // Connect SSE
    SSE.connect();

    // Init Lucide icons
    if (window.lucide) lucide.createIcons();
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    Store,
    Undo,
    Events,
    Modules,
    Router,
    UI,
    Toast,
    Modal,
    CommandPalette,
    SSE,
    api,
    init
  };
})();
