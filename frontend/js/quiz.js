let quizState = { questions: [], current: 0, score: 0, answers: [], started: false };

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('quizPage')) return;

  let selectedCount = 10;
  let selectedDifficulty = 'medium';
  let selectedTopic = 'all';

  document.querySelectorAll('#questionCountOptions .quiz-config-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#questionCountOptions .quiz-config-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCount = parseInt(btn.dataset.value);
    });
  });

  document.querySelectorAll('#difficultyOptions .quiz-config-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#difficultyOptions .quiz-config-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = btn.dataset.value;
    });
  });

  document.querySelectorAll('#topicOptions .quiz-config-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#topicOptions .quiz-config-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTopic = btn.dataset.value;
    });
  });

  const startBtn = document.getElementById('startQuizBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => startQuiz(selectedCount, selectedDifficulty, selectedTopic));
  }

  const prevBtn = document.getElementById('prevQuestionBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    if (quizState.current > 0) {
      quizState.current--;
      renderQuestion();
    }
  });

  const nextBtn = document.getElementById('nextQuestionBtn');
  if (nextBtn) nextBtn.addEventListener('click', handleNextQuestion);
});

function handleNextQuestion() {
  const selected = document.querySelector('input[name="quizAnswer"]:checked');
  if (!selected) return;

  const q = quizState.questions[quizState.current];
  const isCorrect = selected.value === q.answer;
  if (isCorrect) quizState.score++;

  quizState.answers.push({
    question: q.question,
    selected: selected.value,
    correct: q.answer,
    isCorrect,
    explanation: q.explanation || '',
    source: q.source || ''
  });

  // Show explanation before moving to next
  showAnswerExplanation(q, selected.value, isCorrect);
}

function showAnswerExplanation(q, selected, isCorrect) {
  const optionsList = document.getElementById('optionsList');
  const nextBtn = document.getElementById('nextQuestionBtn');

  document.querySelectorAll('#optionsList .quiz-option').forEach(opt => {
    const letter = opt.querySelector('.quiz-option-radio')?.textContent;
    opt.classList.remove('selected');
    opt.classList.add('disabled');
    if (letter === q.answer) {
      opt.classList.add('correct');
    } else if (letter === selected && !isCorrect) {
      opt.classList.add('wrong');
    }
  });

  const explanationHtml = `
    <div class="quiz-explanation">
      <div class="quiz-explanation-header">
        <span class="quiz-explanation-icon">${isCorrect ? '✅' : '❌'}</span>
        <strong class="quiz-explanation-label" style="color:${isCorrect ? 'var(--success)' : 'var(--error)'};">${isCorrect ? 'Correct!' : 'Wrong!'}</strong>
      </div>
      <div class="quiz-explanation-text">
        ${q.explanation ? `<p style="margin:0 0 0.5rem;">${Utils.escapeHtml(q.explanation)}</p>` : ''}
      </div>
      ${q.source ? `<div class="quiz-explanation-source">📄 ${Utils.escapeHtml(q.source)}</div>` : ''}
    </div>
  `;

  const existing = document.querySelector('.quiz-explanation');
  if (existing) existing.remove();
  optionsList.insertAdjacentHTML('afterend', explanationHtml);

  nextBtn.textContent = quizState.current === quizState.questions.length - 1 ? 'Finish Quiz' : 'Next →';
  nextBtn.onclick = () => {
    quizState.current++;
    if (quizState.current >= quizState.questions.length) {
      showResults();
    } else {
      renderQuestion();
    }
  };
}

async function startQuiz(count, difficulty, topic) {
  const configEl = document.getElementById('quizConfig');
  const quizEl = document.getElementById('quizContainer');
  const startBtn = document.getElementById('startQuizBtn');

  startBtn.disabled = true;
  startBtn.innerHTML = '<span class="loading-spinner"></span> Generating questions...';

  try {
    const data = await Utils.api('/ai/generate', {
      method: 'POST',
      body: {
        prompt: `Generate exactly ${count} multiple choice quiz questions about Indian law (${topic === 'all' ? 'all topics' : topic}) at ${difficulty} difficulty.

For EACH question, provide:
- The question
- 4 options (A, B, C, D)
- The correct answer
- A brief explanation of WHY the answer is correct
- The source (Article/Section/Case name)

Format EXACTLY as:

Q1: [question]
A) [option]
B) [option]
C) [option]
D) [option]
Answer: [A/B/C/D]
Explanation: [why this answer is correct]
Source: [Article/Section/Case]

Q2: ...`,
        mode: 'quiz-generation'
      }
    });

    quizState.questions = parseQuizQuestions(data.answer);
    quizState.current = 0;
    quizState.score = 0;
    quizState.answers = [];
    quizState.started = true;

    configEl.style.display = 'none';
    quizEl.style.display = 'block';
    document.getElementById('scoreTotal').textContent = ` / ${quizState.questions.length}`;
    renderQuestion();
  } catch (err) {
    Utils.showToast('Failed to generate quiz. Make sure the server is running.', 'error');
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = 'Start Quiz';
  }
}

function parseQuizQuestions(text) {
  const questions = [];
  const blocks = text.split(/Q\d+:/i).slice(1);
  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(l => l.trim());
    if (lines.length < 6) continue;
    const question = lines[0].trim();
    const options = [];
    for (let i = 1; i <= 4; i++) {
      const match = lines[i]?.match(/^[A-D]\)\s*(.+)/i);
      if (match) options.push(match[1].trim());
    }
    const answerLine = lines.find(l => l.toLowerCase().startsWith('answer:'));
    const answer = answerLine ? answerLine.split(':')[1].trim().toUpperCase().charAt(0) : 'A';
    const explanationLine = lines.find(l => l.toLowerCase().startsWith('explanation:'));
    const explanation = explanationLine ? explanationLine.split(':').slice(1).join(':').trim() : '';
    const sourceLine = lines.find(l => l.toLowerCase().startsWith('source:'));
    const source = sourceLine ? sourceLine.split(':').slice(1).join(':').trim() : '';

    if (question && options.length === 4) {
      questions.push({ question, options, answer, explanation, source });
    }
  }
  return questions;
}

function renderQuestion() {
  const q = quizState.questions[quizState.current];
  if (!q) return showResults();

  const progress = ((quizState.current) / quizState.questions.length) * 100;
  document.getElementById('questionCounter').textContent = `Question ${quizState.current + 1} of ${quizState.questions.length}`;
  document.getElementById('currentScore').textContent = quizState.score;
  document.getElementById('progressFill').style.width = `${progress}%`;
  document.getElementById('questionText').textContent = q.question;

  const optionsList = document.getElementById('optionsList');
  const letter = (i) => String.fromCharCode(65 + i);
  optionsList.innerHTML = q.options.map((opt, i) => `
    <label class="quiz-option" data-index="${i}">
      <span class="quiz-option-radio">${letter(i)}</span>
      <span class="quiz-option-text">${Utils.escapeHtml(opt)}</span>
    </label>
  `).join('');

  document.querySelectorAll('#optionsList .quiz-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('#optionsList .quiz-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  document.getElementById('prevQuestionBtn').disabled = quizState.current === 0;
  document.getElementById('nextQuestionBtn').textContent = quizState.current === quizState.questions.length - 1 ? 'Finish' : 'Next →';

  const existing = document.querySelector('.quiz-explanation');
  if (existing) existing.remove();
}

function trackQuizResults() {
  const correct = quizState.answers.filter(a => a.isCorrect).length;
  const total = quizState.answers.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  Utils.addXP(total * 5 + (pct >= 80 ? 50 : pct >= 50 ? 20 : 0), 'quiz');
  quizState.answers.forEach(a => {
    if (!a.isCorrect) {
      const topic = a.question.split(' ').slice(0, 4).join(' ');
      Utils.recordWeakness(topic, false);
    }
  });
  Utils.updateDailyChallenge(1);
}

function showResults() {
  const configEl = document.getElementById('quizConfig');
  const quizEl = document.getElementById('quizContainer');
  const resultsEl = document.getElementById('quizResults');

  trackQuizResults();
  configEl.style.display = 'none';
  quizEl.style.display = 'none';
  resultsEl.style.display = 'block';

  const total = quizState.answers.length || 1;
  const correct = quizState.answers.filter(a => a.isCorrect).length;
  const wrong = quizState.answers.filter(a => !a.isCorrect).length;
  const skipped = quizState.questions.length - quizState.answers.length;
  const pct = Math.round((quizState.score / Math.max(quizState.questions.length, 1)) * 100);

  document.getElementById('finalScore').textContent = `${quizState.score}/${quizState.questions.length}`;
  document.getElementById('scoreTotal').textContent = ` / ${quizState.questions.length}`;
  document.getElementById('correctCount').textContent = correct;
  document.getElementById('wrongCount').textContent = wrong;
  document.getElementById('skippedCount').textContent = skipped;
  document.getElementById('resultsMessage').textContent = pct >= 80 ? '🌟 Excellent work!' : pct >= 50 ? '📚 Good effort — keep studying!' : '💪 Keep practicing — you\'ll improve!';

  document.getElementById('retakeQuizBtn').addEventListener('click', () => location.reload());

  const reviewBtn = document.getElementById('reviewAnswersBtn');
  const reviewSection = document.getElementById('reviewSection');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', () => {
      reviewSection.style.display = reviewSection.style.display === 'none' ? 'block' : 'none';
      if (reviewSection.style.display === 'block') {
        reviewSection.innerHTML = quizState.answers.map((a, i) => `
          <div class="quiz-review-item" style="border-color:${a.isCorrect ? 'var(--success)' : 'var(--error)'};">
            <div class="quiz-review-header">
              <span class="quiz-review-icon">${a.isCorrect ? '✅' : '❌'}</span>
              <div class="quiz-review-body">
                <p class="quiz-review-question">Q${i + 1}: ${Utils.escapeHtml(a.question)}</p>
                <p class="quiz-review-answer">Your answer: ${a.selected} ${a.isCorrect ? '' : `| Correct: ${a.correct}`}</p>
                ${a.explanation ? `<p class="quiz-review-explanation"><strong>Explanation:</strong> ${Utils.escapeHtml(a.explanation)}</p>` : ''}
                ${a.source ? `<p class="quiz-review-source">📄 ${Utils.escapeHtml(a.source)}</p>` : ''}
              </div>
            </div>
          </div>
        `).join('');
      }
    });
  }
}
