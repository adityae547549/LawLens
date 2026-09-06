const API_BASE = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://lawlens-backend-bqjm.onrender.com/api';

const Utils = {
  getToken() {
    return localStorage.getItem('lawlense_token');
  },

  setToken(token) {
    localStorage.setItem('lawlense_token', token);
  },

  removeToken() {
    localStorage.removeItem('lawlense_token');
  },

  getAppCheckToken() {
    return localStorage.getItem('lawlens_appcheck');
  },

  setAppCheckToken(token) {
    localStorage.setItem('lawlens_appcheck', token);
  },

  removeAppCheckToken() {
    localStorage.removeItem('lawlens_appcheck');
  },

  getUser() {
    const data = localStorage.getItem('lawlense_user');
    return data ? JSON.parse(data) : null;
  },

  setUser(user) {
    localStorage.setItem('lawlense_user', JSON.stringify(user));
  },

  removeUser() {
    localStorage.removeItem('lawlense_user');
  },

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payloadB64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(payloadB64));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  /* Phase 6: XP, Streaks & Achievements */
  getXP() {
    const data = localStorage.getItem('lawlense_xp');
    return data ? JSON.parse(data) : { total: 0, level: 1, history: [] };
  },

  addXP(amount, reason = 'activity') {
    const xp = this.getXP();
    xp.total += amount;
    xp.history.push({ amount, reason, date: new Date().toISOString() });
    const prevLevel = xp.level;
    xp.level = Math.floor(xp.total / 500) + 1;
    localStorage.setItem('lawlense_xp', JSON.stringify(xp));
    this.updateStreak();
    if (xp.level > prevLevel) {
      this.showToast(`🎉 Level Up! You're now level ${xp.level}!`, 'success');
    }
    return xp;
  },

  getStreak() {
    const data = localStorage.getItem('lawlense_streak');
    return data ? JSON.parse(data) : { current: 0, longest: 0, lastActive: null };
  },

  updateStreak() {
    const streak = this.getStreak();
    const today = new Date().toDateString();
    if (streak.lastActive === today) return streak;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (streak.lastActive === yesterday) {
      streak.current++;
    } else if (streak.lastActive !== today) {
      streak.current = 1;
    }
    streak.longest = Math.max(streak.longest, streak.current);
    streak.lastActive = today;
    localStorage.setItem('lawlense_streak', JSON.stringify(streak));
    if (streak.current === 7) this.showToast('🔥 7-day streak! Keep it up!', 'success');
    return streak;
  },

  getLevelInfo() {
    const xp = this.getXP();
    const currentLevelXP = (xp.level - 1) * 500;
    const nextLevelXP = xp.level * 500;
    const progress = Math.min(100, ((xp.total - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);
    return { level: xp.level, totalXP: xp.total, progress: Math.round(progress), xpToNext: nextLevelXP - xp.total };
  },

  getDailyChallenge() {
    const data = localStorage.getItem('lawlense_daily');
    const today = new Date().toDateString();
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.date === today) return parsed;
    }
    const challenges = [
      { type: 'quiz', desc: 'Complete a 10-question quiz', xp: 100, minCount: 10 },
      { type: 'flashcards', desc: 'Study 15 flashcards', xp: 75, minCount: 15 },
      { type: 'chat', desc: 'Ask 5 legal questions in chat', xp: 50, minCount: 5 },
      { type: 'bookmark', desc: 'Bookmark 3 legal sources', xp: 30, minCount: 3 }
    ];
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    const daily = { date: today, ...challenge, progress: 0, completed: false };
    localStorage.setItem('lawlense_daily', JSON.stringify(daily));
    return daily;
  },

  updateDailyChallenge(increment = 1) {
    const daily = this.getDailyChallenge();
    if (daily.completed) return daily;
    daily.progress += increment;
    if (daily.progress >= daily.minCount) {
      daily.completed = true;
      this.addXP(daily.xp, `daily-${daily.type}`);
      this.showToast(`🎯 Daily challenge complete! +${daily.xp} XP`, 'success');
    }
    localStorage.setItem('lawlense_daily', JSON.stringify(daily));
    return daily;
  },

  getWeaknesses() {
    const data = localStorage.getItem('lawlense_weaknesses');
    return data ? JSON.parse(data) : [];
  },

  recordWeakness(topic, isCorrect) {
    let weaknesses = this.getWeaknesses();
    if (isCorrect) {
      weaknesses = weaknesses.filter(w => w.topic !== topic);
    } else {
      const existing = weaknesses.find(w => w.topic === topic);
      if (existing) {
        existing.count = (existing.count || 1) + 1;
        existing.lastSeen = new Date().toISOString();
      } else {
        weaknesses.push({ topic, count: 1, lastSeen: new Date().toISOString() });
      }
    }
    localStorage.setItem('lawlense_weaknesses', JSON.stringify(weaknesses));
    return weaknesses;
  },

  getStudyPlan() {
    const weaknesses = this.getWeaknesses();
    if (weaknesses.length === 0) return null;
    const topWeakness = weaknesses.sort((a, b) => b.count - a.count)[0];
    return {
      focusTopic: topWeakness.topic,
      suggestion: `Focus on ${topWeakness.topic} — you've struggled with this ${topWeakness.count} times`,
      xpReward: topWeakness.count * 25
    };
  },

  /* Phase 7: Performance */
  lazyLoadImages() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
            observer.unobserve(img);
          }
        });
      });
      document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
    }
  },

  async api(path, options = {}) {
    const { method = 'GET', body, headers = {}, formData = false } = options;
    let token = this.getToken();
    const config = { method, headers: { ...headers } };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const appCheckToken = this.getAppCheckToken();
    if (appCheckToken) {
      config.headers['X-Firebase-AppCheck'] = appCheckToken;
    }

    if (body && !formData) {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    } else if (body && formData) {
      config.body = body;
    }

    try {
      let res = await fetch(`${API_BASE}${path}`, config);

      if (res.status === 401 && token && typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        try {
          const freshToken = await firebase.auth().currentUser.getIdToken(true);
          this.setToken(freshToken);
          config.headers['Authorization'] = `Bearer ${freshToken}`;
          res = await fetch(`${API_BASE}${path}`, config);
        } catch {}
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('Authentication required') || err.message.includes('Invalid or expired token')) {
        this.removeToken();
        this.removeUser();
        this.removeAppCheckToken();
        try { if (typeof firebase !== 'undefined' && firebase.auth) await firebase.auth().signOut(); } catch {}
        if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
          window.location.href = './login.html';
        }
      }
      throw err;
    }
  },

  showToast(message, type = 'info', duration = 4000) {
    const container = document.querySelector('.toast-container');
    if (!container) return null;

    const icons = {
      success: '✓',
      error: '✗',
      warning: '!',
      info: 'i'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || ''}</span>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
    return toast;
  },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  truncate(text, len = 100) {
    if (!text) return '';
    return text.length > len ? text.slice(0, len) + '...' : text;
  },

  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  getTheme() {
    return localStorage.getItem('lawlense_theme') || 'dark';
  },

  setTheme(theme) {
    localStorage.setItem('lawlense_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    try {
      const channel = new BroadcastChannel('lawlense_theme');
      channel.postMessage({ theme });
      setTimeout(() => channel.close(), 1000);
    } catch {}
  },

  toggleTheme() {
    const current = this.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  },

  initThemeSync() {
    try {
      const channel = new BroadcastChannel('lawlense_theme');
      channel.onmessage = (event) => {
        if (event.data && event.data.theme) {
          localStorage.setItem('lawlense_theme', event.data.theme);
          document.documentElement.setAttribute('data-theme', event.data.theme);
          document.querySelectorAll('.theme-toggle').forEach(btn => {
            btn.textContent = event.data.theme === 'dark' ? '☀' : '☾';
          });
        }
      };
    } catch {}
    window.addEventListener('storage', (e) => {
      if (e.key === 'lawlense_theme' && e.newValue) {
        document.documentElement.setAttribute('data-theme', e.newValue);
        document.querySelectorAll('.theme-toggle').forEach(btn => {
          btn.textContent = e.newValue === 'dark' ? '☀' : '☾';
        });
      }
    });
  },

  renderSkeleton(type = 'card', count = 3) {
    const templates = {
      card: '<div class="skeleton skeleton-card"></div>',
      line: '<div class="skeleton skeleton-line"></div>',
      text: '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text skeleton-line-sm"></div>',
      title: '<div class="skeleton skeleton-title"></div>',
      avatar: '<div style="display:flex;align-items:center;gap:12px;"><div class="skeleton skeleton-avatar"></div><div style="flex:1;"><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line skeleton-line-xs"></div></div></div>',
      list: Array(3).fill('<div style="display:flex;align-items:center;gap:12px;padding:10px 0;"><div class="skeleton skeleton-avatar" style="width:32px;height:32px;"></div><div style="flex:1;"><div class="skeleton skeleton-line"></div></div></div>').join('')
    };
    return Array(count).fill(templates[type] || templates.card).join('');
  },

  renderEmptyState(icon, title, message) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    `;
  },

  async downloadAsPDF(content, filename = 'lawlense-document') {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; line-height: 1.6; color: #1a1a2e; }
            pre { white-space: pre-wrap; font-size: 14px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  },

  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    this.showToast('Copied to clipboard', 'success');
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : text;
    return div.innerHTML;
  },

  // Returns a navigable URL only for safe protocols, otherwise '#'.
  // Prevents javascript:/data: URLs from external/scraped sources being opened.
  safeUrl(url) {
    if (!url) return '#';
    try {
      const u = new URL(url, window.location.origin);
      return ['http:', 'https:', 'mailto:'].includes(u.protocol) ? u.href : '#';
    } catch {
      return '#';
    }
  },

  // Opens a link in a new tab safely (validates protocol, sets noopener).
  openExternal(url) {
    const safe = this.safeUrl(url);
    if (safe !== '#') window.open(safe, '_blank', 'noopener,noreferrer');
  },

  async downloadBrandedPDF(content, title, citations = []) {
    const printWindow = window.open('', '_blank');
    const citationsHtml = citations.length > 0
      ? `<div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #ddd;">
          <h3 style="font-size:14px;color:#666;">Sources &amp; Citations</h3>
          ${citations.map((c, i) => `<p style="font-size:12px;color:#888;margin:4px 0;">[${i+1}] ${this.escapeHtml(c.fileName || c.name || 'Source')}${c.trustLabel ? ' — ' + this.escapeHtml(c.trustLabel) : ''}</p>`).join('')}
        </div>`
      : '';
    printWindow.document.write(`
      <html><head><title>${this.escapeHtml(title)} — LawLens</title>
      <style>
        body{font-family:'Inter',sans-serif;padding:40px;line-height:1.7;color:#1a1a2e;max-width:800px;margin:0 auto;}
        .header{margin-bottom:2rem;padding-bottom:1rem;border-bottom:2px solid #0d9488;}
        .header h1{font-size:20px;color:#0d9488;margin:0;}
        .brand{font-size:12px;color:#888;}
        pre{white-space:pre-wrap;font-size:14px;font-family:inherit;}
        .footer{margin-top:2rem;padding-top:1rem;border-top:1px solid #ddd;font-size:11px;color:#aaa;text-align:center;}
      </style></head><body>
      <div class="header">
        <h1>⚖️ LawLens</h1>
        <div class="brand">AI-Powered Legal Research</div>
      </div>
      <h2>${this.escapeHtml(title)}</h2>
      <pre>${content}</pre>
      ${citationsHtml}
      <div class="footer">Generated by LawLens — The Perplexity for Indian Law | ${new Date().toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})} | This is not legal advice.</div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  },

  async shareContent(content, citations = [], title = 'LawLens Answer') {
    try {
      const data = await this.api('/share/generate', {
        method: 'POST',
        body: { content, citations, title }
      });
      const url = `${window.location.origin}/shared.html?token=${data.token}`;
      if (navigator.share) {
        await navigator.share({ title, text: content.slice(0, 200) + '...', url });
      } else {
        await this.copyToClipboard(url);
        this.showToast('Share link copied to clipboard!', 'success');
      }
      return url;
    } catch (err) {
      this.showToast('Failed to generate share link', 'error');
    }
  },

  copyCitation(citation) {
    let text = '';
    if (citation.fileName) text += citation.fileName;
    if (citation.trustLabel) text += ' — ' + citation.trustLabel;
    if (citation.text) text += '\n"' + citation.text.slice(0, 200) + '..."';
    if (citation.confidence) text += '\nConfidence: ' + citation.confidence + '%';
    this.copyToClipboard(text || 'No citation data');
  },

  renderSearchStrategy(strategy) {
    if (!strategy) return '';
    const excluded = (strategy.excluded || []).map(e => `<span style="color:var(--error);">✗ ${e}</span>`).join('  ');
    const allowed = (strategy.allowedDomains || []).slice(0, 6).map(d => `<span style="color:var(--success);">✓ ${d}</span>`).join('  ');

    return `<div class="search-strategy-banner">
      <div class="strategy-header">
        <span class="strategy-badge">${strategy.mode}</span>
        <span class="strategy-desc">${strategy.description}</span>
      </div>
      <div class="strategy-details">
        <div class="strategy-sources">
          <span class="strategy-label">Sources Searched:</span>
          ${allowed || '<span style="color:var(--success);">✓ All web sources</span>'}
        </div>
        ${excluded ? `<div class="strategy-excluded">
          <span class="strategy-label">Excluded:</span>
          ${excluded}
        </div>` : ''}
      </div>
      <div class="strategy-count">${strategy.sourcesUsed || 0} results found</div>
    </div>`;
  },

  renderCitations(citations) {
    if (!citations || citations.length === 0) return '';
    const chips = citations.map(c => {
      const trust = c.trust || {};
      const badge = trust.badge || '🔵';
      const level = trust.level || 'web';
      const label = trust.label || 'Web Source';
      const trustClass = level === 'official' ? 'trust-official' : level === 'trusted' ? 'trust-trusted' : 'trust-web';

      return `<span class="citation-chip ${trustClass}" data-open-url="${this.escapeHtml(c.url || '')}" role="link" tabindex="0" title="${this.escapeHtml(c.snippet || '')}">
        ${badge} ${this.escapeHtml(c.title || label)}
        <span class="citation-trust">${this.escapeHtml(label)}</span>
      </span>`;
    }).join('');

    return `<div class="citations-container">
      <div class="citations-label">📚 Sources</div>
      <div class="citations-list">${chips}</div>
    </div>`;
  }
};

window.Utils = Utils;

// Global delegated handler for elements opting into safe external navigation
// via a `data-open-url` attribute (replaces inline onclick="window.open(...)"
// which was vulnerable to attribute injection from scraped/user-supplied URLs).
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-open-url]');
  if (el) {
    e.preventDefault();
    Utils.openExternal(el.dataset.openUrl);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest('[data-open-url][role="link"]');
  if (el) {
    e.preventDefault();
    Utils.openExternal(el.dataset.openUrl);
  }
});
