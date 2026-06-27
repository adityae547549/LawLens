document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('study.html')) return;
  loadStudyHub();
});

function loadStudyHub() {
  const info = Utils.getLevelInfo();
  const streak = Utils.getStreak();
  const weaknesses = Utils.getWeaknesses();
  const daily = Utils.getDailyChallenge();
  const plan = Utils.getStudyPlan();

  document.getElementById('levelNum').textContent = info.level;
  document.getElementById('xpTotal').textContent = info.totalXP;
  document.getElementById('xpNext').textContent = info.xpToNext;
  document.getElementById('xpBarFill').style.width = `${info.progress}%`;

  document.getElementById('statLevel').textContent = info.level;
  document.getElementById('statSP').textContent = info.totalXP;
  document.getElementById('statStreak').textContent = streak.current;
  document.getElementById('statWeak').textContent = weaknesses.length;
  document.getElementById('statAchieve').textContent = getAchievementCount();

  renderDailyChallenge(daily);
  renderWeaknesses(weaknesses);
  renderAchievements();
  renderStudySuggestion(plan);
}

function renderDailyChallenge(daily) {
  document.getElementById('dailyDesc').textContent = daily.desc;
  document.getElementById('dailyProgressFill').style.width = `${Math.min(100, (daily.progress / daily.minCount) * 100)}%`;
  document.getElementById('dailyProgressText').textContent = `${daily.progress} / ${daily.minCount}`;
  document.getElementById('dailyXp').textContent = `+${daily.xp} XP`;
  const btn = document.getElementById('dailyActionBtn');
  if (daily.completed) {
    btn.textContent = '✅ Done';
    btn.disabled = true;
    btn.style.opacity = '0.6';
  } else {
    btn.textContent = 'Start';
    btn.onclick = () => {
      if (daily.type === 'quiz') window.location.href = './quiz.html';
      else if (daily.type === 'flashcards') window.location.href = './flashcards.html';
      else if (daily.type === 'chat') window.location.href = './chat.html';
      else if (daily.type === 'bookmark') window.location.href = './search.html';
    };
  }
}

function renderWeaknesses(weaknesses) {
  const list = document.getElementById('weaknessList');
  if (!weaknesses || weaknesses.length === 0) return;
  list.innerHTML = weaknesses.sort((a, b) => b.count - a.count).slice(0, 10).map(w => `
    <div class="weakness-item">
      <span style="font-size:1.1rem;">📖</span>
      <span class="weakness-topic">${Utils.escapeHtml(w.topic)}</span>
      <span class="weakness-count">${w.count}x weak</span>
      <a href="./chat.html" class="btn btn-ghost btn-sm weakness-action">Study</a>
    </div>
  `).join('');
}

function renderAchievements() {
  const list = document.getElementById('achievementList');
  const achievements = getAchievements();
  list.innerHTML = achievements.map(a => `
    <span class="achievement-badge ${a.unlocked ? 'unlocked' : ''}">
      ${a.icon} ${a.name}
    </span>
  `).join('');
}

function renderStudySuggestion(plan) {
  const section = document.getElementById('studySuggestion');
  if (!plan) { section.style.display = 'none'; return; }
  section.style.display = 'flex';
  document.getElementById('suggestionText').textContent = plan.suggestion;
  document.getElementById('suggestionBtn').onclick = () => {
    localStorage.setItem('lawlense_chat_prefill', `Explain ${plan.focusTopic} in Indian law with examples`);
    window.location.href = './chat.html';
  };
}

function getAchievements() {
  const xp = Utils.getXP();
  const streak = Utils.getStreak();
  const weaknesses = Utils.getWeaknesses();

  return [
    { name: 'First Steps', icon: '🌱', unlocked: xp.total >= 50 },
    { name: 'Scholar', icon: '📚', unlocked: xp.total >= 500 },
    { name: 'Legal Expert', icon: '⚖️', unlocked: xp.total >= 2000 },
    { name: 'Master Jurist', icon: '👨‍⚖️', unlocked: xp.total >= 5000 },
    { name: 'Streak Starter', icon: '🔥', unlocked: streak.longest >= 3 },
    { name: 'Week Warrior', icon: '💪', unlocked: streak.longest >= 7 },
    { name: 'Dedicated', icon: '🎯', unlocked: streak.longest >= 30 },
    { name: 'Quiz Master', icon: '🧠', unlocked: xp.history.filter(h => h.reason === 'quiz').length >= 5 },
    { name: 'Card Collector', icon: '🃏', unlocked: xp.history.filter(h => h.reason === 'flashcard').length >= 5 },
    { name: 'Overcomer', icon: '💎', unlocked: weaknesses.length === 0 && xp.total > 100 }
  ];
}

function getAchievementCount() {
  return getAchievements().filter(a => a.unlocked).length;
}
