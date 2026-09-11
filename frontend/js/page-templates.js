/* ═══════════════════════════════════════════════════════════════
   LAWLENS PAGE GENERATOR
   Utility for creating consistent page layouts
   ═══════════════════════════════════════════════════════════════ */

function generatePageHTML(options) {
  const {
    title = 'LawLens',
    description = '',
    currentPage = '',
    showSidebar = true,
    content = '',
    scripts = [],
    styles = []
  } = options;
  
  const stylesheets = [
    './css/design-system.css',
    './css/shell.css',
    './css/pages-v3.css',
    ...styles
  ].map(s => `  <link rel="stylesheet" href="${s}">`).join('\n');
  
  const scriptTags = [
    './js/utils.js',
    './js/app.js',
    './js/nav.js',
    ...scripts
  ].map(s => `  <script src="${s}"></script>`).join('\n');
  
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/png" href="./favicon-128.png">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — LawLens</title>
  ${description ? `<meta name="description" content="${description}">` : ''}
  <meta name="robots" content="noindex, nofollow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
${stylesheets}
</head>
<body>
  <div class="app">
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    
    <main class="main">
      <header class="topbar">
        <button class="hamburger" id="hamburger" aria-label="Toggle navigation">
          <i data-lucide="menu" style="width:20px;height:20px;"></i>
        </button>
        <div class="topbar-left">
          <h1 class="topbar-title">${title}</h1>
        </div>
        <div class="topbar-right">
          <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
            <i data-lucide="moon" style="width:18px;height:18px;"></i>
          </button>
        </div>
      </header>

      <div class="page">
        <div class="page-container">
${content}
        </div>
      </div>
    </main>

    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <img src="./logo.png" alt="LawLens" class="sidebar-logo">
        <div class="sidebar-brand">
          <span class="sidebar-brand-name">LawLens</span>
          <span class="sidebar-brand-tagline">Legal Research</span>
        </div>
      </div>
      <nav class="sidebar-nav" id="sidebarNav"></nav>
      <div class="sidebar-footer">
        <a href="#" class="nav-item" id="sidebarLogoutBtn">
          <i data-lucide="log-out" class="nav-item-icon"></i>
          <span class="nav-item-label">Logout</span>
        </a>
      </div>
    </aside>
  </div>

${scriptTags}
</body>
</html>`;
}

// Page templates
const PageTemplates = {
  documents: () => generatePageHTML({
    title: 'Documents',
    currentPage: 'documents',
    content: `
          <div class="page-header">
            <h1 class="page-title">Your Documents</h1>
            <p class="page-subtitle">Upload and manage legal documents for AI analysis</p>
          </div>

          <div class="upload-zone" id="uploadZone">
            <div class="upload-zone-icon">
              <i data-lucide="upload-cloud" style="width:32px;height:32px;"></i>
            </div>
            <div class="upload-zone-title">Upload documents</div>
            <div class="upload-zone-description">Drag and drop files or click to browse</div>
            <div class="upload-zone-formats">Supported: PDF, DOCX, TXT, JSON, Markdown</div>
            <input type="file" id="fileInput" multiple accept=".pdf,.docx,.txt,.json,.md" style="display:none;">
          </div>

          <div style="margin-top:var(--space-8);">
            <div class="content-card-header">
              <h2 class="content-card-title">Recent Documents</h2>
            </div>
            <div class="document-list" id="documentList">
              <div class="empty-state">
                <div class="empty-state-icon">
                  <i data-lucide="file" style="width:32px;height:32px;"></i>
                </div>
                <div class="empty-state-title">No documents yet</div>
                <div class="empty-state-description">Upload your first document to get started</div>
              </div>
            </div>
          </div>
    `,
    scripts: ['./js/documents.js']
  }),

  summarizer: () => generatePageHTML({
    title: 'Summarizer',
    currentPage: 'summarizer',
    content: `
          <div class="page-header">
            <h1 class="page-title">Summarize</h1>
            <p class="page-subtitle">Get AI-powered summaries of legal documents</p>
          </div>

          <div class="content-card" style="margin-bottom:var(--space-6);">
            <div class="content-card-header">
              <h3 class="content-card-title">Input</h3>
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--space-4);">
              <div style="display:flex;gap:var(--space-2);">
                <button class="search-mode-btn active" data-input="text">Paste Text</button>
                <button class="search-mode-btn" data-input="file">Upload File</button>
              </div>
              <textarea class="input textarea" id="summaryInput" placeholder="Paste your legal text here..." rows="6"></textarea>
              <div style="display:flex;gap:var(--space-4);">
                <div class="form-group" style="flex:1;">
                  <label class="form-label">Summary Length</label>
                  <select class="input" id="summaryLength">
                    <option value="brief">Brief</option>
                    <option value="standard" selected>Standard</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
                <div class="form-group" style="flex:1;">
                  <label class="form-label">Audience</label>
                  <select class="input" id="summaryAudience">
                    <option value="general" selected>General</option>
                    <option value="legal">Legal Professional</option>
                    <option value="student">Student</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-primary" id="summarizeBtn">
                <i data-lucide="sparkles" style="width:16px;height:16px;"></i>
                Generate Summary
              </button>
            </div>
          </div>

          <div id="summaryResult" style="display:none;">
            <div class="summary-result">
              <div class="summary-header">
                <h3 class="summary-title">Summary</h3>
                <div style="display:flex;gap:var(--space-2);">
                  <button class="btn btn-ghost btn-sm" id="copySummary">
                    <i data-lucide="copy" style="width:14px;height:14px;"></i>
                    Copy
                  </button>
                  <button class="btn btn-ghost btn-sm" id="saveSummary">
                    <i data-lucide="bookmark" style="width:14px;height:14px;"></i>
                    Save
                  </button>
                </div>
              </div>
              <div class="summary-content">
                <div class="summary-text" id="summaryText"></div>
                <div class="summary-sections" id="summarySections"></div>
              </div>
            </div>
          </div>
    `,
    scripts: ['./js/summarizer.js']
  }),

  study: () => generatePageHTML({
    title: 'Study Hub',
    currentPage: 'study',
    content: `
          <div class="study-hero">
            <h1 class="study-hero-title">Learn Indian Law</h1>
            <p class="study-hero-subtitle">Build your legal knowledge with AI-powered learning</p>
            <div class="study-stats">
              <div class="study-stat">
                <div class="study-stat-value" id="xpValue">0</div>
                <div class="study-stat-label">XP Earned</div>
              </div>
              <div class="study-stat">
                <div class="study-stat-value" id="levelValue">Lv.1</div>
                <div class="study-stat-label">Level</div>
              </div>
              <div class="study-stat">
                <div class="study-stat-value" id="streakValue">0d</div>
                <div class="study-stat-label">Streak</div>
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(min(250px, 100%), 1fr));gap:var(--space-6);">
            <a href="./quiz.html" class="content-card" style="text-decoration:none;">
              <div class="content-card-icon">
                <i data-lucide="brain" style="width:24px;height:24px;"></i>
              </div>
              <h3 class="content-card-title" style="margin-top:var(--space-4);">AI Quiz</h3>
              <p style="font-size:var(--text-sm);color:var(--text-tertiary);margin-top:var(--space-2);">Test your knowledge with adaptive questions</p>
            </a>
            <a href="./flashcards.html" class="content-card" style="text-decoration:none;">
              <div class="content-card-icon">
                <i data-lucide="layers" style="width:24px;height:24px;"></i>
              </div>
              <h3 class="content-card-title" style="margin-top:var(--space-4);">Flashcards</h3>
              <p style="font-size:var(--text-sm);color:var(--text-tertiary);margin-top:var(--space-2);">Review key concepts with spaced repetition</p>
            </a>
            <a href="./constitution.html" class="content-card" style="text-decoration:none;">
              <div class="content-card-icon">
                <i data-lucide="book-open" style="width:24px;height:24px;"></i>
              </div>
              <h3 class="content-card-title" style="margin-top:var(--space-4);">Constitution</h3>
              <p style="font-size:var(--text-sm);color:var(--text-tertiary);margin-top:var(--space-2);">Explore articles with AI explanations</p>
            </a>
          </div>
    `,
    scripts: ['./js/study.js']
  }),

  profile: () => generatePageHTML({
    title: 'Profile',
    currentPage: 'profile',
    content: `
          <div class="page-header">
            <h1 class="page-title">Profile</h1>
            <p class="page-subtitle">Manage your account information</p>
          </div>

          <div class="content-card" style="max-width:600px;">
            <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-6);">
              <div class="avatar avatar-xl" id="profileAvatar">U</div>
              <div>
                <div style="font-size:var(--text-xl);font-weight:var(--weight-semibold);color:var(--text-primary);" id="profileName">User</div>
                <div style="font-size:var(--text-sm);color:var(--text-tertiary);" id="profileEmail">user@example.com</div>
              </div>
            </div>

            <form id="profileForm">
              <div class="form-group" style="margin-bottom:var(--space-4);">
                <label class="form-label">Name</label>
                <input type="text" class="input" id="nameInput" placeholder="Your name">
              </div>
              <div class="form-group" style="margin-bottom:var(--space-6);">
                <label class="form-label">Email</label>
                <input type="email" class="input" id="emailInput" placeholder="Your email" disabled>
              </div>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
          </div>
    `,
    scripts: ['./js/profile.js']
  }),

  settings: () => generatePageHTML({
    title: 'Settings',
    currentPage: 'settings',
    content: `
          <div class="page-header">
            <h1 class="page-title">Settings</h1>
            <p class="page-subtitle">Customize your LawLens experience</p>
          </div>

          <div style="max-width:600px;display:flex;flex-direction:column;gap:var(--space-6);">
            <div class="content-card">
              <h3 class="content-card-title" style="margin-bottom:var(--space-4);">Appearance</h3>
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <div>
                  <div style="font-size:var(--text-sm);font-weight:var(--weight-medium);color:var(--text-primary);">Theme</div>
                  <div style="font-size:var(--text-xs);color:var(--text-tertiary);">Choose dark or light mode</div>
                </div>
                <div style="display:flex;gap:var(--space-2);">
                  <button class="search-mode-btn active" data-theme="dark">Dark</button>
                  <button class="search-mode-btn" data-theme="light">Light</button>
                </div>
              </div>
            </div>

            <div class="content-card">
              <h3 class="content-card-title" style="margin-bottom:var(--space-4);">AI Preferences</h3>
              <div class="form-group" style="margin-bottom:var(--space-4);">
                <label class="form-label">Default Explain Level</label>
                <select class="input" id="explainLevel">
                  <option value="simple">Simple</option>
                  <option value="standard" selected>Standard</option>
                  <option value="detailed">Detailed</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Search Mode</label>
                <select class="input" id="searchMode">
                  <option value="legal" selected>Legal Database</option>
                  <option value="web">Web Search</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div class="content-card">
              <h3 class="content-card-title" style="margin-bottom:var(--space-4);">Account</h3>
              <div style="display:flex;flex-direction:column;gap:var(--space-3);">
                <a href="./profile.html" class="btn btn-secondary" style="justify-content:flex-start;">
                  <i data-lucide="user" style="width:16px;height:16px;"></i>
                  Edit Profile
                </a>
                <button class="btn btn-danger" id="deleteAccountBtn" style="justify-content:flex-start;">
                  <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
    `,
    scripts: ['./js/settings.js']
  })
};

// Export
window.PageTemplates = PageTemplates;
window.generatePageHTML = generatePageHTML;
