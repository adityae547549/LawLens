document.addEventListener('DOMContentLoaded', () => {
  const theme = Utils.getTheme();
  document.documentElement.setAttribute('data-theme', theme);

  Utils.initThemeSync();

  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);

  loadLucideIcons();
  updateAuthUI();
  initThemeToggle();
  initSidebar();
  initAdminUI();
  initPageAnimations();
  initKeyboardShortcuts();
  initGlobalErrorHandler();
  initConversationSearch();
  initMobileDetection();
  initOnboarding();
  initStudyMode();
  loadLearningStats();
  initRippleEffect();
  addSkipToContent();
  Utils.lazyLoadImages();
});

function loadLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/lucide@0.300.0/dist/umd/lucide.min.js';
  script.onload = () => {
    if (window.lucide) window.lucide.createIcons();
  };
  script.onerror = () => {
    console.warn('Lucide icons failed to load from CDN');
  };
  document.head.appendChild(script);
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  if (window.Utils) Utils.showToast('Something went wrong. Please try again.', 'error');
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      if (typeof newChat === 'function') newChat();
      else if (window.location.pathname.includes('chat')) window.location.reload();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput') || document.getElementById('chatInput');
      if (searchInput) searchInput.focus();
    }
    if (e.key === 'Escape') {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      if (sidebar?.classList.contains('open')) {
        sidebar.classList.remove('open');
        if (overlay) overlay.style.display = 'none';
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      Utils.showToast('Shortcuts: Ctrl+N (New Chat), Ctrl+K (Search), Esc (Close sidebar)', 'info');
    }
  });
}

function initGlobalErrorHandler() {
  window.addEventListener('offline', () => {
    Utils.showToast('You are offline. Some features may not work.', 'warning');
  });
  window.addEventListener('online', () => {
    Utils.showToast('Back online!', 'success');
  });
}

function initConversationSearch() {
  const searchInput = document.getElementById('conversationSearch');
  if (!searchInput) return;
  searchInput.addEventListener('input', Utils.debounce((e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.conversation-item').forEach(item => {
      const title = item.querySelector('.conv-title')?.textContent?.toLowerCase() || '';
      item.style.display = title.includes(query) || !query ? '' : 'none';
    });
  }, 200));
}

function initMobileDetection() {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    document.documentElement.classList.add('is-mobile');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) {
      sidebar.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
          sidebar.classList.remove('open');
          if (overlay) overlay.style.display = 'none';
        });
      });
    }
  }
}

function updateAuthUI() {
  const isAuth = Utils.isAuthenticated();
  const user = Utils.getUser();
  const authElements = document.querySelectorAll('[data-auth]');
  const guestElements = document.querySelectorAll('[data-guest]');

  authElements.forEach(el => {
    el.style.display = isAuth ? '' : 'none';
  });

  guestElements.forEach(el => {
    el.style.display = isAuth ? 'none' : '';
  });

  const userBadge = document.getElementById('userBadge');
  if (userBadge && user) {
    userBadge.innerHTML = `
      <span style="width:32px;height:32px;border-radius:50%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;color:white;font-weight:600;font-size:0.85rem;">
        ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
      </span>
      <span style="font-size:0.85rem;color:var(--text-secondary);display:none;">${user.name || 'User'}</span>
    `;
  }
}

function initAdminUI() {
  const user = Utils.getUser();
  const isAdmin = user && user.role === 'admin';
  document.querySelectorAll('.nav-item[href="./admin.html"]').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
}

function initThemeToggle() {
  const toggles = document.querySelectorAll('.theme-toggle');
  toggles.forEach(btn => {
    btn.innerHTML = Utils.getTheme() === 'dark'
      ? '<i data-lucide="sun" style="width:18px;height:18px;"></i>'
      : '<i data-lucide="moon" style="width:18px;height:18px;"></i>';
    btn.addEventListener('click', () => {
      const theme = Utils.toggleTheme();
      btn.innerHTML = theme === 'dark'
        ? '<i data-lucide="sun" style="width:18px;height:18px;"></i>'
        : '<i data-lucide="moon" style="width:18px;height:18px;"></i>';
      refreshIcons();
    });
  });
  refreshIcons();
}

function initSidebar() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('visible', sidebar.classList.contains('open'));
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });
  }

  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href && currentPath.includes(href)) {
      item.classList.add('active');
    }
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Utils.removeToken();
      Utils.removeUser();
      Utils.showToast('Logged out successfully', 'success');
      setTimeout(() => { window.location.href = './login.html'; }, 300);
    });
  }
}

function initPageAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fadeIn');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('[data-animate]').forEach(el => {
    observer.observe(el);
  });
}

function initOnboarding() {
  const onboarded = localStorage.getItem('lawlense_onboarded_v2');
  if (onboarded) return;
  const isDashboard = window.location.pathname.includes('dashboard');
  if (!isDashboard) return;
  setTimeout(showOnboardingTour, 1000);
}

function showOnboardingTour() {
  const steps = [
    { el: '.dh-search', msg: 'Ask AI — type any legal question and press Enter', pos: 'bottom' },
    { el: '.dh-actions-grid', msg: 'Quick tool access — chat, constitution, quiz and more', pos: 'bottom' },
    { el: '.sidebar', msg: 'Sidebar Navigation — access all tools: Chat, Quiz, Flashcards, Timeline & more', pos: 'right' },
    { el: '.theme-toggle', msg: 'Theme Toggle — switch between dark & light mode', pos: 'bottom' }
  ];
  let step = 0;
  const overlay = document.createElement('div');
  overlay.id = 'onboardingOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;';
  const tooltip = document.createElement('div');
  tooltip.id = 'onboardingTooltip';
  tooltip.style.cssText = 'background:var(--bg-card, #1a1a2e);border:1px solid var(--accent-primary, #6366f1);border-radius:16px;padding:1.5rem;max-width:400px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);color:white;';
  overlay.appendChild(tooltip);
  document.body.appendChild(overlay);
  function renderStep() {
    const s = steps[step];
    const el = document.querySelector(s.el);
    tooltip.innerHTML = `
      <div style="font-size:1rem;margin-bottom:1rem;line-height:1.6;">${s.msg}</div>
      <div style="display:flex;gap:0.5rem;justify-content:center;">
        <button class="btn btn-ghost" onclick="document.getElementById('onboardingOverlay').remove();localStorage.setItem('lawlense_onboarded_v2','1');" style="font-size:0.8rem;">Skip</button>
        <button class="btn btn-primary" onclick="document.getElementById('onboardingOverlay').querySelector('.next-btn').click();" style="font-size:0.8rem;">${step < steps.length - 1 ? 'Next →' : 'Done ✓'}</button>
      </div>
      <div style="margin-top:0.75rem;font-size:0.75rem;color:var(--text-tertiary, #666);">${step + 1} / ${steps.length}</div>
    `;
    if (el) {
      el.style.scrollMargin = '100px';
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.outline = '2px solid var(--accent-primary)';
      el.style.outlineOffset = '4px';
    }
    const btn = tooltip.querySelector('.btn-primary');
    btn.classList.add('next-btn');
    btn.onclick = () => {
      if (el) { el.style.outline = ''; }
      step++;
      if (step >= steps.length) {
        overlay.remove();
        localStorage.setItem('lawlense_onboarded_v2', '1');
        Utils.addXP(50, 'onboarding');
      } else {
        renderStep();
      }
    };
  }
  renderStep();
}

function initStudyMode() {
  const studyModeBtn = document.querySelector('.study-mode-btn');
  if (studyModeBtn) {
    studyModeBtn.addEventListener('click', () => {
      window.location.href = './study.html';
    });
  }
}

function loadLearningStats() {
  const xpDisplay = document.getElementById('xpDisplay');
  const levelDisplay = document.getElementById('levelDisplay');
  const streakDisplay = document.getElementById('streakDisplay');
  if (!xpDisplay && !levelDisplay && !streakDisplay) return;
  const info = Utils.getLevelInfo();
  const streak = Utils.getStreak();
  if (xpDisplay) {
    xpDisplay.innerHTML = `<span style="font-weight:600;color:var(--warning);"><i data-lucide="zap" style="width:14px;height:14px;vertical-align:middle;"></i> ${info.totalXP} XP</span>`;
  }
  if (levelDisplay) {
    levelDisplay.innerHTML = `<span style="background:var(--accent-glow);color:var(--accent-primary);padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:600;">Lv.${info.level}</span>`;
  }
  if (streakDisplay) {
    streakDisplay.innerHTML = `<span style="color:var(--error);"><i data-lucide="flame" style="width:14px;height:14px;vertical-align:middle;"></i> ${streak.current}d</span>`;
  }
}

function addSkipToContent() {
  if (document.getElementById('skipLink')) return;
  const skip = document.createElement('a');
  skip.href = '#mainContent';
  skip.className = 'skip-to-content';
  skip.id = 'skipLink';
  skip.textContent = 'Skip to content';
  document.body.prepend(skip);
  const main = document.querySelector('.page-content, .main-content');
  if (main && !main.id) main.id = 'mainContent';
}

function initRippleEffect() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn, .chat-send-btn, .chat-upload-btn, .theme-toggle, .quick-action, .nav-item, .config-btn, .search-mode-btn, .mode-btn, .level-btn, .citation-chip, .chat-suggestion-btn, .demo-chip');
    if (!btn) return;
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;border-radius:50%;background:rgba(255,255,255,0.15);transform:scale(0);animation:rippleAnim 0.5s ease-out forwards;pointer-events:none;`;
    btn.style.position = btn.style.position || 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  });
}

// Add ripple keyframes if not present
(function() {
  if (!document.getElementById('rippleStyles')) {
    const style = document.createElement('style');
    style.id = 'rippleStyles';
    style.textContent = `@keyframes rippleAnim { to { transform:scale(2.5);opacity:0; } }`;
    document.head.appendChild(style);
  }
})();

window.LawLens = {
  Utils,
  updateAuthUI,
  state: {
    conversations: [],
    currentConversationId: null,
    searchResults: [],
    bookmarks: []
  }
};
