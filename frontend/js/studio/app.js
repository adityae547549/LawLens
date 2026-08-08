/**
 * LawLens Studio — App Entry Point
 * Initializes all routes, modules, and the SPA
 */

// ── Register All Routes ──────────────────────────────────────
Studio.Router.defineAll({
  'dashboard':       { title: 'Dashboard',       icon: 'layout-dashboard', category: 'Overview', description: 'Platform overview and metrics' },
  'knowledge-os':    { title: 'Knowledge OS',    icon: 'database',         category: 'Content',  description: 'Full hierarchy management with versioning' },
  'knowledge':       { title: 'Source Registry',  icon: 'layers',           category: 'Content',  description: 'Manage legal source registry' },
  'cases':           { title: 'Cases',           icon: 'briefcase',        category: 'Content',  description: 'Legal cases and judgments' },
  'acts':            { title: 'Acts',            icon: 'book-open',        category: 'Content',  description: 'Statutory acts and laws' },
  'rules':           { title: 'Rules',           icon: 'scroll-text',      category: 'Content',  description: 'Rules and regulations' },
  'gazette':         { title: 'Gazette',         icon: 'newspaper',        category: 'Content',  description: 'Gazette publications' },
  'graph':           { title: 'Knowledge Graph', icon: 'git-branch',       category: 'Graph & Data', description: 'Visual knowledge graph editor' },
  'source-tracker':  { title: 'Source Tracker',  icon: 'radio',            category: 'Graph & Data', description: 'Monitor official legal sources' },
  'imports':         { title: 'Import Center',   icon: 'download',         category: 'Graph & Data', description: 'Import legal documents' },
  'search-builder':  { title: 'Search Builder',  icon: 'search-code',      category: 'Graph & Data', description: 'Configure search behavior' },
  'ai-config':       { title: 'AI Config',       icon: 'cpu',              category: 'AI & Config', description: 'AI model and settings' },
  'prompts':         { title: 'Prompt Manager',  icon: 'message-square',   category: 'AI & Config', description: 'Manage AI prompts' },
  'workspaces':      { title: 'Workspaces',      icon: 'briefcase',        category: 'AI & Config', description: 'Collaborative workspaces' },
  'media':           { title: 'Media Library',    icon: 'image',            category: 'Media',    description: 'File and media management' },
  'analytics':       { title: 'Analytics',       icon: 'bar-chart-3',      category: 'Insights', description: 'Usage analytics and metrics' },
  'benchmarks':      { title: 'Benchmarks',      icon: 'gauge',            category: 'Insights', description: 'AI benchmark testing' },
  'users':           { title: 'Users & Roles',   icon: 'users',            category: 'Admin',    description: 'User and role management' },
  'page-builder':    { title: 'Page Builder',    icon: 'layout',           category: 'Admin',    description: 'Visual page builder' },
  'settings':        { title: 'Settings',        icon: 'settings',         category: 'Admin',    description: 'Platform settings' },
  'audit-logs':      { title: 'Audit Logs',      icon: 'scroll-text',      category: 'System',   description: 'Audit trail of all actions' },
  'background-jobs': { title: 'Background Jobs',  icon: 'layers',           category: 'System',   description: 'Background task queue' },
  'developer':       { title: 'Developer',       icon: 'terminal',         category: 'System',   description: 'Developer tools and logs' },
  'health':          { title: 'System Health',   icon: 'activity',         category: 'System',   description: 'System health monitoring' }
});

// ── All modules are now loaded via script tags in studio.html ──

// ── Initialize ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Studio.init();
  StudioShortcuts.init();
});
