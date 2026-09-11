/* ═══════════════════════════════════════════════════════════════
   LAWLENS SIDEBAR NAVIGATION
   Dynamic navigation generation
   ═══════════════════════════════════════════════════════════════ */

const LAWLENS_NAV = {
  sections: [
    {
      id: 'home',
      label: 'HOME',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: './dashboard.html' }
      ]
    },
    {
      id: 'research',
      label: 'RESEARCH',
      items: [
        { id: 'chat', label: 'AI Chat', icon: 'message-square', href: './chat.html' },
        { id: 'search', label: 'Legal Search', icon: 'search', href: './search.html' },
        { id: 'constitution', label: 'Constitution', icon: 'book-open', href: './constitution.html' },
        { id: 'case-research', label: 'Case Research', icon: 'scale', href: './legal-research.html' },
        { id: 'documents', label: 'Documents', icon: 'file', href: './documents.html' }
      ]
    },
    {
      id: 'understand',
      label: 'UNDERSTAND',
      items: [
        { id: 'summarizer', label: 'Summarizer', icon: 'file-text', href: './summarizer.html' },
        { id: 'compare', label: 'Compare', icon: 'columns', href: './compare.html' },
        { id: 'article', label: 'Article Viewer', icon: 'newspaper', href: './article.html' },
        { id: 'timeline', label: 'Timeline', icon: 'calendar', href: './timeline.html' }
      ]
    },
    {
      id: 'learn',
      label: 'LEARN',
      items: [
        { id: 'study', label: 'Study', icon: 'graduation-cap', href: './study.html' },
        { id: 'quiz', label: 'Quiz', icon: 'brain', href: './quiz.html' },
        { id: 'flashcards', label: 'Flashcards', icon: 'layers', href: './flashcards.html' }
      ]
    },
    {
      id: 'workspace',
      label: 'WORKSPACE',
      items: [
        { id: 'workspaces', label: 'Workspaces', icon: 'briefcase', href: './workspaces.html' },
        { id: 'bookmarks', label: 'Bookmarks', icon: 'bookmark', href: './bookmarks.html' },
        { id: 'history', label: 'History', icon: 'clock', href: './history.html' }
      ]
    }
  ],
  bottom: [
    { id: 'contracts', label: 'Contracts', icon: 'scroll-text', href: './contracts.html' },
    { id: 'case-mgmt', label: 'Case Management', icon: 'folder-open', href: './case-management.html' },
    { id: 'feedback', label: 'Feedback', icon: 'message-circle', href: './feedback.html' },
    { id: 'admin', label: 'Admin', icon: 'wrench', href: './admin.html', adminOnly: true }
  ],
  account: [
    { id: 'settings', label: 'Settings', icon: 'settings', href: './settings.html' },
    { id: 'profile', label: 'Profile', icon: 'user', href: './profile.html' },
    { id: 'trust', label: 'Trust & Safety', icon: 'shield', href: './trust.html' }
  ]
};

function generateSidebarHTML(currentPage) {
  const user = window.Utils ? Utils.getUser() : null;
  const isAdmin = user && user.role === 'admin';
  
  let html = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <img src="./logo.png" alt="LawLens" class="sidebar-logo">
        <div class="sidebar-brand">
          <span class="sidebar-brand-name">LawLens</span>
          <span class="sidebar-brand-tagline">Legal Research</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
  `;
  
  // Main sections
  LAWLENS_NAV.sections.forEach(section => {
    html += `
        <div class="nav-section">
          <div class="nav-section-label">${section.label}</div>
    `;
    
    section.items.forEach(item => {
      if (item.adminOnly && !isAdmin) return;
      const isActive = currentPage === item.id;
      html += `
          <a href="${item.href}" class="nav-item${isActive ? ' active' : ''}" data-page="${item.id}">
            <i data-lucide="${item.icon}" class="nav-item-icon"></i>
            <span class="nav-item-label">${item.label}</span>
          </a>
      `;
    });
    
    html += `
        </div>
    `;
  });
  
  // Bottom section
  html += `
        <div class="nav-section">
          <div class="nav-section-label">TOOLS</div>
  `;
  
  LAWLENS_NAV.bottom.forEach(item => {
    if (item.adminOnly && !isAdmin) return;
    const isActive = currentPage === item.id;
    html += `
          <a href="${item.href}" class="nav-item${isActive ? ' active' : ''}" data-page="${item.id}">
            <i data-lucide="${item.icon}" class="nav-item-icon"></i>
            <span class="nav-item-label">${item.label}</span>
          </a>
    `;
  });
  
  html += `
        </div>
  `;
  
  html += `
      </nav>
      
      <div class="sidebar-footer">
  `;
  
  // Account section
  LAWLENS_NAV.account.forEach(item => {
    const isActive = currentPage === item.id;
    html += `
        <a href="${item.href}" class="nav-item${isActive ? ' active' : ''}" data-page="${item.id}">
          <i data-lucide="${item.icon}" class="nav-item-icon"></i>
          <span class="nav-item-label">${item.label}</span>
        </a>
    `;
  });
  
  // Logout
  html += `
        <div class="divider"></div>
        <a href="#" class="nav-item" id="logoutBtn">
          <i data-lucide="log-out" class="nav-item-icon"></i>
          <span class="nav-item-label">Logout</span>
        </a>
  `;
  
  html += `
      </div>
    </aside>
  `;
  
  return html;
}

function generateTopbarHTML(title, options = {}) {
  const { showSearch = false, showBack = false, backHref = './dashboard.html', actions = [] } = options;
  
  let html = `
    <header class="topbar">
      <button class="hamburger" id="hamburger" aria-label="Toggle navigation">
        <i data-lucide="menu" style="width:20px;height:20px;"></i>
      </button>
      
      <div class="topbar-left">
  `;
  
  if (showBack) {
    html += `
        <a href="${backHref}" class="topbar-action" aria-label="Go back">
          <i data-lucide="arrow-left" style="width:18px;height:18px;"></i>
        </a>
    `;
  }
  
  html += `
        <h1 class="topbar-title">${title}</h1>
      </div>
  `;
  
  if (showSearch) {
    html += `
      <div class="topbar-center">
        <div class="topbar-search">
          <input type="text" class="input" placeholder="Search..." id="globalSearch">
        </div>
      </div>
    `;
  }
  
  html += `
      <div class="topbar-right">
  `;
  
  actions.forEach(action => {
    html += `
        <button class="topbar-action" ${action.onclick ? `onclick="${action.onclick}"` : ''} aria-label="${action.label}">
          <i data-lucide="${action.icon}" style="width:18px;height:18px;"></i>
        </button>
    `;
  });
  
  html += `
        <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
          <i data-lucide="moon" style="width:18px;height:18px;"></i>
        </button>
        
        <div class="dropdown" id="userDropdown">
          <div class="sidebar-user" onclick="document.getElementById('userDropdown').classList.toggle('open')">
            <div class="sidebar-user-avatar" id="userAvatar">U</div>
          </div>
          <div class="dropdown-menu">
            <a href="./profile.html" class="dropdown-item">
              <i data-lucide="user" style="width:14px;height:14px;"></i>
              Profile
            </a>
            <a href="./settings.html" class="dropdown-item">
              <i data-lucide="settings" style="width:14px;height:14px;"></i>
              Settings
            </a>
            <div class="divider"></div>
            <a href="#" class="dropdown-item" id="logoutBtnMobile">
              <i data-lucide="log-out" style="width:14px;height:14px;"></i>
              Logout
            </a>
          </div>
        </div>
      </div>
    </header>
  `;
  
  return html;
}

function generateMobileBottomNavHTML(currentPage) {
  const items = [
    { id: 'dashboard', label: 'Home', icon: 'layout-dashboard', href: './dashboard.html' },
    { id: 'chat', label: 'Chat', icon: 'message-square', href: './chat.html' },
    { id: 'search', label: 'Search', icon: 'search', href: './search.html' },
    { id: 'constitution', label: 'Constitution', icon: 'book-open', href: './constitution.html' },
    { id: 'study', label: 'Learn', icon: 'graduation-cap', href: './study.html' }
  ];
  
  let html = `
    <nav class="mobile-bottom-nav" aria-label="Mobile navigation">
      <div class="mobile-bottom-nav-items">
  `;
  
  items.forEach(item => {
    const isActive = currentPage === item.id;
    html += `
        <a href="${item.href}" class="mobile-bottom-nav-item${isActive ? ' active' : ''}">
          <i data-lucide="${item.icon}" class="mobile-bottom-nav-item-icon"></i>
          <span>${item.label}</span>
        </a>
    `;
  });
  
  html += `
      </div>
    </nav>
  `;
  
  return html;
}

// Initialize sidebar functionality
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
  
  // Close sidebar on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('visible');
    }
  });
  
  // Close sidebar on nav click (mobile)
  if (window.innerWidth <= 1024) {
    sidebar.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('visible');
      });
    });
  }
}

// Export for use
window.LawLensNav = {
  generate: generateSidebarHTML,
  generateTopbar: generateTopbarHTML,
  generateMobileNav: generateMobileBottomNavHTML,
  init: initSidebar,
  data: LAWLENS_NAV
};
