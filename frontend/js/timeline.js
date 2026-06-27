let timelineEvents = [];
let currentCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('timelinePage')) return;

  loadTimeline();
  initFilters();
  initSearch();
});

async function loadTimeline() {
  const container = document.getElementById('timelineItems');
  const loading = document.getElementById('timelineLoading');
  if (loading) loading.style.display = 'block';

  try {
    const from = document.getElementById('startYear')?.value || '';
    const to = document.getElementById('endYear')?.value || '';
    let url = '/constitution/timeline?';
    if (from) url += `from=${from}&`;
    if (to) url += `to=${to}&`;
    if (currentCategory !== 'all') url += `category=${currentCategory}&`;

    const data = await Utils.api(url);
    timelineEvents = data.events || [];
    renderTimeline(container);
  } catch (err) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-tertiary);">Failed to load timeline.</div>';
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function initFilters() {
  document.querySelectorAll('.timeline-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.timeline-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      loadTimeline();
    });
  });
}

function initSearch() {
  const searchInput = document.getElementById('timelineSearch');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(() => {
      const query = searchInput.value.toLowerCase();
      const container = document.getElementById('timelineItems');
      if (!query) {
        renderTimeline(container);
        return;
      }
      const filtered = timelineEvents.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.summary.toLowerCase().includes(query) ||
        String(e.year).includes(query) ||
        String(e.num).includes(query)
      );
      renderTimeline(container, filtered);
    }, 300));
  }

  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', loadTimeline);
  }
}

function renderTimeline(container, events = null) {
  const items = events || timelineEvents;
  if (!items.length) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-tertiary);">No events found.</div>';
    return;
  }

  // Group by year
  const byYear = {};
  items.forEach(e => {
    if (!byYear[e.year]) byYear[e.year] = [];
    byYear[e.year].push(e);
  });

  const sortedYears = Object.keys(byYear).sort((a, b) => a - b);

  const categoryColors = {
    amendment: { color: 'var(--success)', icon: '🟢', label: 'Amendment' },
    judgment: { color: 'var(--accent-primary)', icon: '🔵', label: 'Judgment' },
    act: { color: 'var(--warning)', icon: '🟠', label: 'Act' },
    emergency: { color: 'var(--error)', icon: '🔴', label: 'Emergency' }
  };

  let html = '<div class="timeline-vertical">';

  for (const year of sortedYears) {
    const eventsInYear = byYear[year];
    html += `<div class="timeline-year-group">
      <div class="timeline-year-marker">
        <div class="timeline-year-dot"></div>
        <div class="timeline-year-label">${year}</div>
      </div>
      <div class="timeline-year-events">`;

    for (const event of eventsInYear) {
      const cat = categoryColors[event.category] || categoryColors.amendment;
      html += `<div class="timeline-event" onclick="showEventDetail(${event.num}, '${event.title.replace(/'/g, "\\'")}', ${event.year}, '${(event.summary || '').replace(/'/g, "\\'")}', '${event.category}', '${(event.articles_affected || []).join(',')}')">
        <div class="event-badge" style="background:${cat.color};">${cat.icon}</div>
        <div class="event-content">
          <div class="event-title">${event.num ? event.num + 'th — ' : ''}${event.title}</div>
          <div class="event-summary">${event.summary || ''}</div>
        </div>
      </div>`;
    }

    html += '</div></div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

function showEventDetail(num, title, year, summary, category, articlesAffected) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;padding:2rem;';

  const catColors = { amendment: 'var(--success)', judgment: 'var(--accent-primary)', act: 'var(--warning)', emergency: 'var(--error)' };
  const articles = articlesAffected ? articlesAffected.split(',').filter(a => a) : [];

  modal.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-xl);padding:2rem;max-width:600px;width:100%;max-height:80vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;">
        <div>
          <div style="display:inline-block;padding:0.3rem 0.75rem;background:${catColors[category] || 'var(--accent-primary)'}20;color:${catColors[category] || 'var(--accent-primary)'};border-radius:999px;font-size:0.75rem;font-weight:600;margin-bottom:0.5rem;">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
          <h2 style="margin:0;font-size:1.3rem;">${num}th — ${title}</h2>
          <div style="color:var(--text-tertiary);font-size:0.9rem;margin-top:0.25rem;">${year}</div>
        </div>
        <button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-tertiary);">&times;</button>
      </div>
      <div style="line-height:1.8;color:var(--text-secondary);margin-bottom:1.5rem;">${summary}</div>
      ${articles.length ? `
        <div style="margin-bottom:1rem;">
          <h4 style="font-size:0.85rem;color:var(--text-tertiary);margin-bottom:0.5rem;">Articles Affected</h4>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
            ${articles.map(a => `<a href="./constitution.html" onclick="localStorage.setItem('lawlense_chat_prefill','Explain Article ${a} of the Indian Constitution');window.location.href='./chat.html'" style="padding:0.3rem 0.6rem;background:var(--accent-glow);color:var(--accent-primary);border-radius:999px;font-size:0.8rem;text-decoration:none;">Art. ${a}</a>`).join('')}
          </div>
        </div>
      ` : ''}
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
        <button onclick="localStorage.setItem('lawlense_chat_prefill','Explain the ${title} (${year})');window.location.href='./chat.html'" class="btn btn-primary btn-sm">💬 Ask AI</button>
        <button onclick="Utils.copyToClipboard('${summary.replace(/'/g, "\\'").replace(/\n/g, " ")}')" class="btn btn-ghost btn-sm">📋 Copy</button>
        <button onclick="Utils.downloadBrandedPDF('${summary.replace(/'/g, "\\'").replace(/\n/g, " ")}', '${title}')" class="btn btn-ghost btn-sm">📄 PDF</button>
      </div>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}

window.showEventDetail = showEventDetail;
