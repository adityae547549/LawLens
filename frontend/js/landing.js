document.addEventListener('DOMContentLoaded', () => {
  initLoading();
  initNav();
  initMockup();
  initFAQ();
  initDemoChips();
  initReveal();
  initCounters();
  initBackToTop();
  initFeatureCards();
});

/* ── Loading Screen ── */
function initLoading() {
  const loader = document.getElementById('loadingScreen');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 600);
  });
  setTimeout(() => loader.classList.add('hidden'), 3000);
}

/* ── Sticky Nav ── */
function initNav() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  let last = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 50);
    last = y;
  }, { passive: true });

  const toggle = document.getElementById('mobileToggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.style.display === 'flex';
      links.style.display = open ? 'none' : 'flex';
      links.style.flexDirection = 'column';
      links.style.position = 'absolute';
      links.style.top = '100%';
      links.style.left = '0';
      links.style.right = '0';
      links.style.background = 'var(--bg-secondary)';
      links.style.backdropFilter = 'blur(20px)';
      links.style.padding = '1rem';
      links.style.borderRadius = '0 0 16px 16px';
      links.style.borderBottom = '1px solid var(--border-color)';
      if (open) links.removeAttribute('style');
    });
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ── Typing Mockup ── */
function initMockup() {
  const text = "Article 21 guarantees the Right to Life and Personal Liberty. No person shall be deprived of their life or personal liberty except according to procedure established by law.";
  const el = document.getElementById('mockupText');
  const source = document.getElementById('mockupSource');
  const cursor = document.getElementById('mockupCursor');
  if (!el) return;

  let i = 0;
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      startTyping();
      observer.disconnect();
    }
  });
  observer.observe(el);

  function startTyping() {
    setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          el.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(interval);
          if (cursor) cursor.style.display = 'none';
          if (source) { source.style.display = 'block'; source.style.animation = 'msgAppear 0.4s ease forwards'; }
        }
      }, 25);
    }, 1500);
  }
}

/* ── FAQ Accordion ── */
function initFAQ() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

/* ── Demo Chips ── */
function initDemoChips() {
  const input = document.getElementById('demoInput');
  const btn = document.getElementById('demoBtn');
  document.querySelectorAll('.demo-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.q;
      if (input) { input.value = q; input.focus(); input.style.borderColor = 'rgba(99,102,241,0.5)'; }
    });
  });
  if (btn) btn.addEventListener('click', () => {
    const q = input?.value.trim();
    if (q) {
      if (window.Utils && window.Utils.showToast) {
        Utils.showToast('Redirecting to AI Chat...', 'success');
      }
      setTimeout(() => { window.location.href = `./chat.html?q=${encodeURIComponent(q)}`; }, 800);
    }
  });
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn?.click();
    });
  }
}

/* ── Scroll Reveal ── */
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ── Animated Counters ── */
function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = prefix + current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ── Back to Top ── */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── Feature Card Mouse Glow ── */
function initFeatureCards() {
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
    });
  });
}
