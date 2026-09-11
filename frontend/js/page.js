/* ═══════════════════════════════════════════════════════════════
   LAWLENS PAGE TEMPLATE
   Page initialization and structure
   ═══════════════════════════════════════════════════════════════ */

function initPage(options = {}) {
  const {
    title = 'LawLens',
    currentPage = '',
    showSidebar = true,
    showTopbar = true,
    showMobileNav = true,
    topbarOptions = {},
    onInit = null
  } = options;
  
  // Set page title
  document.title = `${title} — LawLens`;
  
  // Get main content area
  const app = document.querySelector('.app');
  if (!app) return;
  
  // Generate sidebar
  if (showSidebar) {
    const sidebarHTML = LawLensNav.generate(currentPage);
    const sidebarOverlay = '<div class="sidebar-overlay" id="sidebarOverlay"></div>';
    app.insertAdjacentHTML('afterbegin', sidebarOverlay + sidebarHTML);
  }
  
  // Generate topbar
  if (showTopbar) {
    const topbarHTML = LawLensNav.generateTopbar(title, topbarOptions);
    const pageContent = app.querySelector('.page') || app.querySelector('.main-content');
    if (pageContent) {
      pageContent.insertAdjacentHTML('beforebegin', topbarHTML);
    }
  }
  
  // Generate mobile bottom nav
  if (showMobileNav && window.innerWidth <= 768) {
    const mobileNavHTML = LawLensNav.generateMobileNavHTML(currentPage);
    document.body.insertAdjacentHTML('beforeend', mobileNavHTML);
  }
  
  // Initialize navigation
  LawLensNav.init();
  
  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
  
  // Run custom initialization
  if (onInit && typeof onInit === 'function') {
    onInit();
  }
}

// Page-specific initialization helpers
const PageInit = {
  // Landing page (no sidebar)
  landing() {
    initPage({
      title: 'AI Legal Research for Indian Law',
      showSidebar: false,
      showTopbar: false,
      showMobileNav: false
    });
  },
  
  // Auth pages (no sidebar)
  auth(pageTitle) {
    initPage({
      title: pageTitle,
      showSidebar: false,
      showTopbar: false,
      showMobileNav: false
    });
  },
  
  // Dashboard
  dashboard(userName) {
    initPage({
      title: 'Dashboard',
      currentPage: 'dashboard',
      topbarOptions: {
        showSearch: true,
        actions: [
          { icon: 'bell', label: 'Notifications', onclick: '' }
        ]
      }
    });
    
    // Update user avatar
    const avatar = document.getElementById('userAvatar');
    if (avatar && userName) {
      avatar.textContent = userName.charAt(0).toUpperCase();
    }
  },
  
  // AI Chat
  chat() {
    initPage({
      title: 'AI Chat',
      currentPage: 'chat',
      topbarOptions: {
        actions: [
          { icon: 'plus', label: 'New Chat', onclick: 'newChat()' }
        ]
      }
    });
  },
  
  // Search
  search() {
    initPage({
      title: 'Legal Search',
      currentPage: 'search',
      topbarOptions: {
        showSearch: true
      }
    });
  },
  
  // Constitution
  constitution() {
    initPage({
      title: 'Constitution',
      currentPage: 'constitution',
      topbarOptions: {
        showSearch: true
      }
    });
  },
  
  // Generic page
  generic(title, currentPage) {
    initPage({
      title,
      currentPage
    });
  }
};

// Export
window.PageInit = PageInit;
