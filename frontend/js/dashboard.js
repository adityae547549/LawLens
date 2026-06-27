document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('dashboardPage')) return;

  if (!Utils.isAuthenticated()) {
    window.location.href = './login.html';
    return;
  }

  setGreeting();
  initHeroSearch();
  generateQuickActions();
  loadContinueWorking();
  loadProgress();
  loadRecommended();
  loadRecentActivity();
});

/* ─── Greeting ─── */
function setGreeting() {
  const hour = new Date().getHours();
  let greeting;
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  const el = document.getElementById('dhGreetingText');
  if (el) el.textContent = greeting;

  const user = Utils.getUser();
  const nameEl = document.getElementById('dhGreetingName');
  if (nameEl && user && user.name) {
    nameEl.textContent = user.name;
  }
}

/* ─── Hero Search ─── */
function initHeroSearch() {
  const input = document.getElementById('dhSearchInput');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = input.value.trim();
      if (query) {
        window.location.href = `./chat.html?q=${encodeURIComponent(query)}`;
      }
    }
  });
}

/* ─── Continue Working ─── */
async function loadContinueWorking() {
  const section = document.getElementById('dhContinueSection');
  const card = document.getElementById('dhContinueCard');
  const titleEl = document.getElementById('dhContinueTitle');
  if (!card) return;

  try {
    const data = await Utils.api('/chat/conversations');
    const convs = data.conversations || [];
    if (convs.length === 0) return;

    const last = convs[0];
    titleEl.textContent = last.title || 'Untitled conversation';
    document.getElementById('dhContinueMeta').textContent =
      `Last message: ${Utils.formatDate(last.lastMessage || last.createdAt)}`;
    card.href = `./chat.html?conv=${last.id}`;
    card.target = '_self';
    section.style.display = '';
  } catch {
    // fallback: hide section
  }
}

/* ─── Quick Actions ─── */
const DH_ACTIONS = [
  { icon: 'message-square', label: 'AI Chat', href: './chat.html' },
  { icon: 'book-open', label: 'Constitution', href: './constitution.html' },
  { icon: 'search', label: 'Search', href: './search.html' },
  { icon: 'brain', label: 'Quiz', href: './quiz.html' },
  { icon: 'graduation-cap', label: 'Study Hub', href: './study.html' },
  { icon: 'layers', label: 'Flashcards', href: './flashcards.html' },
  { icon: 'columns-2', label: 'Compare', href: './compare.html' },
  { icon: 'calendar', label: 'Timeline', href: './timeline.html' },
  { icon: 'scale', label: 'Legal Research', href: './legal-research.html' },
  { icon: 'file-text', label: 'Summarizer', href: './summarizer.html' },
  { icon: 'scroll-text', label: 'Contracts', href: './contracts.html' },
  { icon: 'file', label: 'Documents', href: './documents.html' },
  { icon: 'folder-open', label: 'Case Mgmt', href: './case-management.html' },
  { icon: 'bookmark', label: 'Bookmarks', href: './bookmarks.html' },
  { icon: 'clock', label: 'History', href: './history.html' },
  { icon: 'briefcase', label: 'Workspaces', href: './workspaces.html' },
  { icon: 'shield', label: 'Trust & Safety', href: './trust.html' },
  { icon: 'file-text', label: 'Article Viewer', href: './article.html' },
  { icon: 'user', label: 'Profile', href: './profile.html' },
  { icon: 'settings', label: 'Settings', href: './settings.html' },
];

function generateQuickActions() {
  const grid = document.getElementById('dhActionsGrid');
  if (!grid) return;

  const user = Utils.getUser();
  const isAdmin = user && user.role === 'admin';

  const visible = DH_ACTIONS.filter(a => {
    if (a.href === './admin.html' && !isAdmin) return false;
    return true;
  });

  grid.innerHTML = visible.map(a => `
    <a href="${a.href}" class="dh-action-card">
      <div class="dh-action-icon"><i data-lucide="${a.icon}" style="width:22px;height:22px;"></i></div>
      <div class="dh-action-label">${a.label}</div>
    </a>
  `).join('');

  refreshIcons();
}

/* ─── Learning Progress ─── */
function loadProgress() {
  const info = Utils.getLevelInfo();
  const streak = Utils.getStreak();
  const daily = Utils.getDailyChallenge();

  const xpEl = document.getElementById('dhXpValue');
  const levelEl = document.getElementById('dhLevelValue');
  const streakEl = document.getElementById('dhStreakValue');
  const dailyEl = document.getElementById('dhDailyValue');
  const ringEl = document.getElementById('dhXpRing');

  if (xpEl) xpEl.textContent = info.totalXP;
  if (levelEl) levelEl.textContent = `Lv.${info.level}`;
  if (streakEl) streakEl.textContent = `${streak.current}d`;
  if (dailyEl) dailyEl.textContent = `${daily.progress}/${daily.minCount}`;

  if (ringEl) {
    const circumference = 263.89;
    const offset = circumference - (info.progress / 100) * circumference;
    // Animate the ring
    requestAnimationFrame(() => {
      ringEl.style.strokeDashoffset = offset;
    });
  }
}

/* ─── Recommended ─── */
async function loadRecommended() {
  const container = document.getElementById('dhRecommended');
  if (!container) return;

  try {
    const results = [];

    // Try to fetch bookmarks for article suggestions
    try {
      const bm = await Utils.api('/bookmarks');
      const articles = bm.bookmarks || [];
      if (articles.length > 0) {
        const recent = articles.slice(-2);
        recent.forEach(a => {
          results.push({
            icon: 'file-text',
            title: a.title || 'Saved article',
            desc: 'Continue reading your bookmarked article',
            href: './bookmarks.html',
            type: 'bookmark'
          });
        });
      }
    } catch {}

    // Add suggested quiz
    if (Utils.getLevelInfo) {
      const li = Utils.getLevelInfo();
      results.push({
        icon: 'brain',
        title: 'Take a Quiz',
        desc: `Level ${li.level} · Test your legal knowledge`,
        href: './quiz.html',
        type: 'quiz'
      });
    }

    // Add flashcards suggestion
    results.push({
      icon: 'layers',
      title: 'Review Flashcards',
      desc: 'Strengthen your weak topics',
      href: './flashcards.html',
      type: 'flashcards'
    });

    // Add trending constitutional topic
    results.push({
      icon: 'book-open',
      title: 'Explore Constitution',
      desc: 'Browse fundamental rights and duties',
      href: './constitution.html',
      type: 'constitution'
    });

    // Shuffle and take first 3
    const shuffled = results.sort(() => Math.random() - 0.5).slice(0, 3);

    container.innerHTML = shuffled.map(r => `
      <a href="${r.href}" class="dh-recommended-card">
        <div class="dh-rec-icon"><i data-lucide="${r.icon}" style="width:22px;height:22px;"></i></div>
        <div class="dh-rec-title">${r.title}</div>
        <div class="dh-rec-desc">${r.desc}</div>
      </a>
    `).join('');

    refreshIcons();
  } catch {
    container.innerHTML = '';
  }
}

/* ─── Recent Activity ─── */
async function loadRecentActivity() {
  const container = document.getElementById('dhActivity');
  if (!container) return;

  try {
    const data = await Utils.api('/history');
    const activities = [];

    if (data.conversations) {
      data.conversations.slice(0, 5).forEach(c => {
        activities.push({
          type: 'chat',
          text: `Chat: <strong>${Utils.escapeHtml(c.title)}</strong>`,
          time: c.createdAt
        });
      });
    }

    if (data.searches) {
      data.searches.slice(0, 5).forEach(s => {
        activities.push({
          type: 'search',
          text: `Search: <strong>${Utils.escapeHtml(s.query)}</strong>`,
          time: s.timestamp
        });
      });
    }

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    if (activities.length === 0) {
      container.innerHTML = `
        <div class="dh-activity-empty">
          <div class="dh-activity-empty-icon">
            <i data-lucide="clock" style="width:32px;height:32px;opacity:0.4;"></i>
          </div>
          <p>No activity yet. Start by asking a legal question.</p>
        </div>`;
      refreshIcons();
      return;
    }

    container.innerHTML = activities.slice(0, 10).map(a => `
      <div class="dh-activity-item">
        <div class="dh-activity-dot ${a.type}"></div>
        <div class="dh-activity-text">${a.text}</div>
        <div class="dh-activity-time">${Utils.formatDate(a.time)}</div>
      </div>
    `).join('');
  } catch {
    container.innerHTML = `
      <div class="dh-activity-empty">
        <p>Could not load recent activity.</p>
      </div>`;
  }
}
