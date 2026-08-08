let flashState = { cards: [], current: 0, flipped: false, known: 0, unknown: 0 };

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('flashcardsPage')) return;
if (!Utils.isAuthenticated()) { window.location.href = './login.html'; return; }

  let selectedTopic = 'all';
  let selectedCount = 10;

  document.querySelectorAll('#fcTopicOptions .fc-config-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#fcTopicOptions .fc-config-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTopic = btn.dataset.value;
    });
  });

  document.querySelectorAll('#fcCountOptions .fc-config-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#fcCountOptions .fc-config-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCount = parseInt(btn.dataset.value);
    });
  });

  const generateBtn = document.getElementById('generateCardsBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', () => generateCards(selectedTopic, selectedCount));
  }

  const prevBtn = document.getElementById('fcPrevBtn');
  if (prevBtn) prevBtn.addEventListener('click', prevCard);

  const nextBtn = document.getElementById('fcNextBtn');
  if (nextBtn) nextBtn.addEventListener('click', nextCard);

  const shuffleBtn = document.getElementById('fcShuffleBtn');
  if (shuffleBtn) shuffleBtn.addEventListener('click', shuffleCards);

  const knownBtn = document.getElementById('fcMarkKnown');
  if (knownBtn) knownBtn.addEventListener('click', () => markCard(true));

  const unknownBtn = document.getElementById('fcMarkUnknown');
  if (unknownBtn) unknownBtn.addEventListener('click', () => markCard(false));

  const flashcard = document.getElementById('flashcard');
  if (flashcard) {
    flashcard.addEventListener('click', flipCard);
  }

  const restartBtn = document.getElementById('fcRestart');
  if (restartBtn) restartBtn.addEventListener('click', () => location.reload());

  const reviewUnknownBtn = document.getElementById('fcReviewUnknown');
  if (reviewUnknownBtn) reviewUnknownBtn.addEventListener('click', () => {
    flashState.cards = flashState.cards.filter((_, i) => flashState.answers && !flashState.answers[i]?.known);
    flashState.current = 0;
    flashState.known = 0;
    flashState.unknown = 0;
    document.getElementById('fcSummary').style.display = 'none';
    document.getElementById('flashcardsDisplay').querySelector('.fc-card-area').style.display = 'block';
    document.getElementById('flashcardsDisplay').querySelector('.fc-nav').style.display = 'flex';
    renderCard();
  });
});

flashState.answers = [];

async function generateCards(topic, count) {
  const configEl = document.getElementById('flashcardsConfig');
  const displayEl = document.getElementById('flashcardsDisplay');
  const generateBtn = document.getElementById('generateCardsBtn');

  generateBtn.disabled = true;
  generateBtn.innerHTML = '<span class="loading-spinner"></span> Generating cards...';

  try {
    const data = await Utils.api('/ai/generate', {
      method: 'POST',
      body: {
        prompt: `Generate exactly ${count} flashcards about Indian law: ${topic === 'all' ? 'Fundamental Rights, Constitutional Remedies, and Directive Principles' : topic}. 

For EACH card, provide:
- FRONT: The legal term or question
- BACK: Clear explanation
- SOURCE: The Article/Section/Act it comes from
- RELATED: Related articles or concepts (comma-separated)

Format EXACTLY as:

CARD 1:
FRONT: [legal term or question]
BACK: [clear explanation]
SOURCE: [Article/Section/Act]
RELATED: [related articles]

CARD 2:
FRONT: [legal term or question]
BACK: [clear explanation]
SOURCE: [Article/Section/Act]
RELATED: [related articles]

...`,
        mode: 'flashcard-generation'
      }
    });

    flashState.cards = parseFlashcards(data.answer);
    flashState.current = 0;
    flashState.flipped = false;
    flashState.known = 0;
    flashState.unknown = 0;
    flashState.answers = [];

    configEl.style.display = 'none';
    displayEl.style.display = 'block';
    document.getElementById('fcProgressText').textContent = `Card 1 of ${flashState.cards.length}`;
    document.getElementById('fcProgressFill').style.width = `${(1 / flashState.cards.length) * 100}%`;
    renderCard();
  } catch (err) {
    Utils.showToast('Failed to generate flashcards. Make sure the server is running.', 'error');
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Cards';
  }
}

function parseFlashcards(text) {
  const cards = [];
  const blocks = text.split(/CARD\s+\d+:/i).slice(1);
  for (const block of blocks) {
    const frontMatch = block.match(/FRONT:\s*(.+)/i);
    const backMatch = block.match(/BACK:\s*(.+)/i);
    const sourceMatch = block.match(/SOURCE:\s*(.+)/i);
    const relatedMatch = block.match(/RELATED:\s*(.+)/i);
    if (frontMatch && backMatch) {
      cards.push({
        front: frontMatch[1].trim(),
        back: backMatch[1].trim(),
        source: sourceMatch ? sourceMatch[1].trim() : '',
        related: relatedMatch ? relatedMatch[1].trim().split(',').map(s => s.trim()).filter(Boolean) : []
      });
    }
  }
  return cards;
}

function renderCard() {
  const card = flashState.cards[flashState.current];
  if (!card) return showSummary();

  const progress = ((flashState.current + 1) / flashState.cards.length) * 100;
  document.getElementById('fcProgressText').textContent = `Card ${flashState.current + 1} of ${flashState.cards.length}`;
  document.getElementById('fcProgressFill').style.width = `${progress}%`;
  document.getElementById('fcTerm').textContent = card.front;
  document.getElementById('fcDefinition').textContent = card.back;

  const sourceEl = document.getElementById('fcSource');
  const relatedEl = document.getElementById('fcRelated');
  if (sourceEl) sourceEl.textContent = card.source || '';
  if (relatedEl) {
    relatedEl.innerHTML = (card.related || []).map(r =>
      `<button class="fc-related-tag" onclick="localStorage.setItem('lawlense_chat_prefill','Explain ${r.replace(/'/g, "\\'")} in Indian law');window.location.href='./chat.html'">${r}</button>`
    ).join('');
  }

  resetCardFlip();
}

function flipCard() {
  const flashcard = document.getElementById('flashcard');
  if (!flashcard) return;
  flashState.flipped = !flashState.flipped;
  flashcard.classList.toggle('flipped', flashState.flipped);
}

function resetCardFlip() {
  const flashcard = document.getElementById('flashcard');
  if (flashcard) flashcard.classList.remove('flipped');
  flashState.flipped = false;
}

function markCard(known) {
  const card = flashState.cards[flashState.current];
  flashState.answers[flashState.current] = { known, front: card?.front || '', source: card?.source || '' };
  if (known) flashState.known++;
  else flashState.unknown++;
  flashState.current++;
  if (flashState.current >= flashState.cards.length) {
    showSummary();
  } else {
    renderCard();
  }
}

function nextCard() {
  if (flashState.current < flashState.cards.length - 1) {
    flashState.current++;
    renderCard();
  }
}

function prevCard() {
  if (flashState.current > 0) {
    flashState.current--;
    renderCard();
  }
}

function shuffleCards() {
  for (let i = flashState.cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flashState.cards[i], flashState.cards[j]] = [flashState.cards[j], flashState.cards[i]];
  }
  flashState.current = 0;
  renderCard();
}

function showSummary() {
  const totalCards = flashState.known + flashState.unknown;
  if (totalCards > 0) {
    Utils.addXP(totalCards * 3 + flashState.known * 2, 'flashcard');
    Utils.updateDailyChallenge(1);
    flashState.answers.forEach(a => {
      if (!a.known && a.front) {
        Utils.recordWeakness(a.front, false);
      }
    });
  }
  document.querySelector('.fc-card-area').style.display = 'none';
  document.querySelector('.fc-nav').style.display = 'none';
  document.querySelector('.fc-controls').style.display = 'none';
  document.getElementById('fcSummary').style.display = 'block';
  document.getElementById('knownCount').textContent = flashState.known;
  document.getElementById('unknownCount').textContent = flashState.unknown;
}
