const FB_CATEGORIES = [
  {
    id: 'understanding', icon: '🤔', title: 'Understanding the User',
    questions: [
      'Why would I use this app?',
      'What problem does it solve?',
      'Would I recommend it to a friend?',
      'Would I pay for it?',
      'What makes it different from ChatGPT?',
      'Why should I trust it?',
      'Does it save me time?',
      'Does it save me money?',
      'Does it reduce confusion?',
      'Would I use it every day?'
    ]
  },
  {
    id: 'ux', icon: '🎨', title: 'User Experience',
    questions: [
      'Is the interface simple?',
      'Can I learn it in under a minute?',
      'Can I search naturally?',
      'Is it fast?',
      'Does dark mode exist?',
      'Is mobile first?',
      'Can I bookmark answers?',
      'Can I share answers?',
      'Can I download answers as PDF?',
      'Can I copy citations easily?'
    ]
  },
  {
    id: 'ai_quality', icon: '🧠', title: 'AI Quality',
    questions: [
      'Does AI explain simply?',
      'Does AI avoid hallucinations?',
      'Does every answer have citations?',
      'Can AI admit when it doesn\'t know?',
      'Can AI explain for beginners?',
      'Can AI explain for lawyers?',
      'Can AI explain in Hindi?',
      'Can AI explain in other Indian languages?',
      'Can AI compare two articles?',
      'Can AI summarize long documents?'
    ]
  },
  {
    id: 'constitution', icon: '📜', title: 'Constitution AI',
    questions: [
      'Can I search by article number?',
      'Can I search by topic?',
      'Can I compare constitutions?',
      'Can I view amendments?',
      'Can I view the original text?',
      'Can I see related articles?',
      'Can I ask follow-up questions?',
      'Can AI explain landmark cases?',
      'Can I learn constitutional history?',
      'Can I quiz myself?'
    ]
  },
  {
    id: 'legal_research', icon: '⚖️', title: 'Legal Research',
    questions: [
      'Can AI find relevant judgments?',
      'Can AI summarize judgments?',
      'Can AI compare judgments?',
      'Can AI search Acts?',
      'Can AI search sections?',
      'Can AI explain legal terms?',
      'Can AI cite every source?',
      'Can I search by keyword?',
      'Can I search by case number?',
      'Can I filter results?'
    ]
  },
  {
    id: 'contracts', icon: '📝', title: 'Contracts',
    questions: [
      'Can I upload contracts?',
      'Can AI detect risky clauses?',
      'Can AI explain each clause?',
      'Can AI compare two contracts?',
      'Can AI summarize contracts?',
      'Can AI suggest missing clauses?',
      'Can AI detect unusual terms?',
      'Can AI highlight obligations?',
      'Can AI find deadlines?',
      'Can AI generate a checklist?'
    ]
  },
  {
    id: 'documents', icon: '📄', title: 'Documents',
    questions: [
      'Can AI generate legal notices?',
      'Can AI draft affidavits?',
      'Can AI generate NDAs?',
      'Can AI generate agreements?',
      'Can AI create templates?',
      'Can I edit generated documents?',
      'Can I export to Word/PDF?',
      'Can AI translate documents?',
      'Can AI simplify legal language?',
      'Can AI review my draft?'
    ]
  },
  {
    id: 'case_management', icon: '📁', title: 'Case Management',
    questions: [
      'Can I upload case files?',
      'Can AI organize them?',
      'Can AI create timelines?',
      'Can AI identify key dates?',
      'Can AI extract names?',
      'Can AI summarize evidence?',
      'Can I search within case files?',
      'Can AI generate hearing notes?',
      'Can AI remind me of deadlines?',
      'Can multiple lawyers collaborate?'
    ]
  },
  {
    id: 'trust_security', icon: '🔒', title: 'Trust & Security',
    questions: [
      'Is my data encrypted?',
      'Can I delete my data?',
      'Is my information private?',
      'Can I use offline mode?',
      'Does AI explain its sources?',
      'Is there version history?',
      'Can I verify every citation?',
      'Does the app warn that it\'s not legal advice?',
      'Can I report incorrect answers?',
      'Is the app transparent about AI limitations?'
    ]
  },
  {
    id: 'growth_future', icon: '🚀', title: 'Growth & Future',
    questions: [
      'What would make me subscribe?',
      'What would make me uninstall?',
      'What feature would make me recommend it?',
      'What feature is missing?',
      'Would I trust it in court preparation?',
      'Would law students love it?',
      'Would businesses use it?',
      'What would delight me?',
      'If this app disappeared tomorrow, would I miss it?',
      'What one feature would make this the best legal AI platform in India?'
    ]
  },
  {
    id: 'user_needs', icon: '💭', title: 'User Needs',
    questions: [
      'What is the first thing users want after opening the app?',
      'What frustrates users about current legal research?',
      'What task takes users the longest today?',
      'What task do users hate doing?',
      'What would make users smile?',
      'What would surprise users?',
      'Why would users come back tomorrow?',
      'What habit could this app create?',
      'How can we reduce the number of clicks?',
      'What makes the app feel premium?'
    ]
  },
  {
    id: 'ai_features', icon: '🤖', title: 'AI Features',
    questions: [
      'Can AI explain using real-life examples?',
      'Can AI answer follow-up questions?',
      'Can AI remember the conversation?',
      'Can AI explain using analogies?',
      'Can AI create mind maps?',
      'Can AI generate flashcards?',
      'Can AI create quizzes?',
      'Can AI explain in bullet points?',
      'Can AI explain in one sentence?',
      'Can AI explain in great detail?'
    ]
  },
  {
    id: 'search', icon: '🔍', title: 'Search',
    questions: [
      'Can search understand spelling mistakes?',
      'Can search understand Hindi?',
      'Can search understand voice?',
      'Can search recommend related topics?',
      'Can search autocomplete?',
      'Can search filter by date?',
      'Can search filter by court?',
      'Can search filter by law?',
      'Can search show trending legal topics?',
      'Can search save history?'
    ]
  },
  {
    id: 'personalization', icon: '🎯', title: 'Personalization',
    questions: [
      'Can users choose beginner mode?',
      'Can users choose lawyer mode?',
      'Can users pin favorite laws?',
      'Can AI remember favorite topics?',
      'Can users customize the homepage?',
      'Can users choose themes?',
      'Can users change fonts?',
      'Can users save notes?',
      'Can users highlight text?',
      'Can users organize folders?'
    ]
  },
  {
    id: 'collaboration', icon: '👥', title: 'Collaboration',
    questions: [
      'Can lawyers share research?',
      'Can students study together?',
      'Can teachers create classrooms?',
      'Can teams comment on documents?',
      'Can users tag others?',
      'Can users collaborate live?',
      'Can users leave annotations?',
      'Can users review AI responses?',
      'Can teams assign work?',
      'Can admins manage teams?'
    ]
  },
  {
    id: 'notifications', icon: '🔔', title: 'Notifications',
    questions: [
      'Can users receive amendment alerts?',
      'Can users follow cases?',
      'Can users receive hearing reminders?',
      'Can users receive AI summaries?',
      'Can users receive daily legal news?',
      'Can users choose notification types?',
      'Can notifications be smart?',
      'Can AI remind unfinished work?',
      'Can users mute notifications?',
      'Can notifications sync across devices?'
    ]
  },
  {
    id: 'mobile', icon: '📱', title: 'Mobile Experience',
    questions: [
      'Does it work offline?',
      'Does it load quickly?',
      'Does it support tablets?',
      'Does it work on slow internet?',
      'Can users scan documents?',
      'Can users upload photos?',
      'Can users search from the camera?',
      'Does it support voice input?',
      'Can users read hands-free?',
      'Can users zoom legal documents?'
    ]
  },
  {
    id: 'accessibility', icon: '♿', title: 'Accessibility',
    questions: [
      'Can visually impaired users use it?',
      'Does it support screen readers?',
      'Can text size increase?',
      'Can colors be adjusted?',
      'Is voice navigation available?',
      'Can users change language?',
      'Is reading easy for beginners?',
      'Are buttons large enough?',
      'Does it work for elderly users?',
      'Is the UI distraction-free?'
    ]
  },
  {
    id: 'premium', icon: '⭐', title: 'Premium Features',
    questions: [
      'What makes Premium worth paying for?',
      'Should Premium remove limits?',
      'Should Premium unlock advanced AI?',
      'Should Premium include unlimited uploads?',
      'Should Premium include team workspaces?',
      'Should Premium include API access?',
      'Should Premium include advanced analytics?',
      'Should Premium include export options?',
      'Should Premium include faster AI?',
      'Should Premium include priority support?'
    ]
  },
  {
    id: 'growth', icon: '📈', title: 'Growth',
    questions: [
      'What feature makes users invite friends?',
      'What feature makes users share screenshots?',
      'What feature goes viral?',
      'What makes YouTubers review it?',
      'What makes lawyers recommend it?',
      'What makes colleges adopt it?',
      'What makes businesses subscribe?',
      'What makes governments notice it?',
      'If users could add one feature, what would it be?',
      'If this became the #1 legal AI platform in India, what would people say was the main reason?'
    ]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('feedbackPage')) return;
  generateAccordion();
  initOverallStars();
  initSectionStars();
  initForm();

  const container = document.getElementById('fbAccordion');
  const expandAllBtn = document.getElementById('expandAllBtn');
  const collapseAllBtn = document.getElementById('collapseAllBtn');
  if (expandAllBtn && container) {
    expandAllBtn.addEventListener('click', () => {
      container.querySelectorAll('.fb-accordion-content').forEach(c => c.classList.add('open'));
      container.querySelectorAll('.fb-accordion-header').forEach(h => h.setAttribute('aria-expanded', 'true'));
    });
  }
  if (collapseAllBtn && container) {
    collapseAllBtn.addEventListener('click', () => {
      container.querySelectorAll('.fb-accordion-content').forEach(c => c.classList.remove('open'));
      container.querySelectorAll('.fb-accordion-header').forEach(h => h.setAttribute('aria-expanded', 'false'));
    });
  }
});

function generateAccordion() {
  const container = document.getElementById('fbAccordion');
  container.innerHTML = FB_CATEGORIES.map((cat, idx) => `
    <div class="fb-accordion-section">
      <button type="button" class="fb-accordion-header" data-section="${cat.id}" aria-expanded="false">
        <span class="fb-section-icon">${cat.icon}</span>
        <span class="fb-section-title">${cat.title}</span>
        <span class="fb-section-rating-badge" id="badge-${cat.id}">—</span>
        <span class="fb-accordion-arrow">▾</span>
      </button>
      <div class="fb-accordion-content" id="content-${cat.id}">
        <div class="fb-section-body">
          <div class="fb-section-stars">
            <span class="fb-section-label">Rate this area:</span>
            <div class="fb-stars fb-section-stars-row" data-section="${cat.id}">
              ${[1,2,3,4,5].map(v => `<button type="button" class="fb-star fb-section-star" data-value="${v}" aria-label="${v} star">★</button>`).join('')}
            </div>
            <input type="hidden" class="fb-section-rating-input" id="rating-${cat.id}" value="0" data-section="${cat.id}">
          </div>
          <div class="fb-section-questions">
            <div class="fb-section-questions-title">How well does LawLens address these?</div>
            <ul class="fb-question-list">
              ${cat.questions.map(q => `<li>${q}</li>`).join('')}
            </ul>
          </div>
          <div class="fb-section-comment-group">
            <label class="fb-section-comment-label" for="comment-${cat.id}">Your thoughts on ${cat.title.toLowerCase()} (optional):</label>
            <textarea id="comment-${cat.id}" class="fb-section-textarea" placeholder="What works well? What could be improved?" rows="3" maxlength="5000"></textarea>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Auto-open first section so user sees what to do
  const firstHeader = container.querySelector('.fb-accordion-header');
  if (firstHeader) {
    const firstContent = document.getElementById(`content-${firstHeader.dataset.section}`);
    firstHeader.setAttribute('aria-expanded', 'true');
    firstContent.classList.add('open');
  }

  container.addEventListener('click', (e) => {
    const header = e.target.closest('.fb-accordion-header');
    if (header) {
      const content = document.getElementById(`content-${header.dataset.section}`);
      const isOpen = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', !isOpen);
      content.classList.toggle('open');
    }
  });

  updateProgress();
}

function initOverallStars() {
  const container = document.getElementById('overallStars');
  const input = document.getElementById('fbOverallRating');
  const stars = container.querySelectorAll('.fb-star');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.value);
      input.value = val;
      highlightStars(stars, val);
    });
    star.addEventListener('mouseenter', () => highlightStars(stars, parseInt(star.dataset.value)));
    star.addEventListener('mouseleave', () => highlightStars(stars, parseInt(input.value)));
  });
}

function initSectionStars() {
  document.querySelectorAll('.fb-section-stars-row').forEach(row => {
    const section = row.dataset.section;
    const input = document.getElementById(`rating-${section}`);
    const badge = document.getElementById(`badge-${section}`);
    const stars = row.querySelectorAll('.fb-star');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.value);
        input.value = val;
        badge.textContent = val > 0 ? `${val}/5` : '—';
        badge.classList.toggle('has-rating', val > 0);
        highlightStars(stars, val);
        updateProgress();
      });
      star.addEventListener('mouseenter', () => highlightStars(stars, parseInt(star.dataset.value)));
      star.addEventListener('mouseleave', () => highlightStars(stars, parseInt(input.value)));
    });
  });
}

function highlightStars(stars, val) {
  stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.value) <= val));
}

function updateProgress() {
  const inputs = document.querySelectorAll('.fb-section-rating-input');
  const rated = Array.from(inputs).filter(inp => parseInt(inp.value) > 0).length;
  const el = document.getElementById('fbProgressCount');
  if (el) el.textContent = rated;
}

function initForm() {
  const form = document.getElementById('feedbackForm');
  const submitBtn = document.getElementById('fbSubmitBtn');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const overallRating = parseInt(document.getElementById('fbOverallRating').value);
    if (!overallRating) {
      Utils.showToast('Please rate your overall experience', 'warning');
      document.querySelector('#overallStars .fb-star').focus();
      return;
    }
    const categories = FB_CATEGORIES.map(cat => ({
      id: cat.id,
      rating: parseInt(document.getElementById(`rating-${cat.id}`).value) || 0,
      comment: document.getElementById(`comment-${cat.id}`).value.trim()
    })).filter(c => c.rating > 0);
    if (categories.length === 0) {
      Utils.showToast('Please rate at least one area below', 'warning');
      return;
    }
    const overallComment = document.getElementById('fbOverallComment').value.trim();
    const email = document.getElementById('fbEmail').value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Utils.showToast('Please enter a valid email or leave it blank', 'warning');
      return;
    }
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Sending...';
    try {
      await Utils.api('/feedback', {
        method: 'POST',
        body: { overallRating, overallComment, categories, email }
      });
      form.style.display = 'none';
      document.getElementById('feedbackSuccess').style.display = 'block';
      Utils.addXP(50, 'feedback');
    } catch (err) {
      Utils.showToast(err.message || 'Failed to send feedback', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Comprehensive Feedback';
    }
  });
}

function resetFeedback() {
  document.getElementById('feedbackSuccess').style.display = 'none';
  document.getElementById('feedbackForm').style.display = 'block';
  document.getElementById('feedbackForm').reset();
  document.getElementById('fbOverallRating').value = '0';
  document.querySelectorAll('.fb-star').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.fb-section-rating-input').forEach(inp => inp.value = '0');
  document.querySelectorAll('.fb-section-rating-badge').forEach(b => {
    b.textContent = '—';
    b.classList.remove('has-rating');
  });
  document.querySelectorAll('.fb-accordion-content').forEach(c => c.classList.remove('open'));
  document.querySelectorAll('.fb-accordion-header').forEach(h => h.setAttribute('aria-expanded', 'false'));
  updateProgress();
}
