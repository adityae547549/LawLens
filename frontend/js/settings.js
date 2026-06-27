document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('settingsPage')) return;

  loadSettings();
  loadLearningStats();

  const themeSelect = document.getElementById('settingsTheme');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      Utils.setTheme(e.target.value);
      Utils.showToast(`Theme changed to ${e.target.value} mode`, 'success');
    });
  }

  const fontSizeSelect = document.getElementById('settingsFontSize');
  if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', (e) => {
      localStorage.setItem('lawlense_font_size', e.target.value);
      applyFontSize(e.target.value);
    });
  }

  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) settingsForm.addEventListener('submit', handleSaveSettings);
});

function applyFontSize(size) {
  const sizes = { small: '14px', medium: '16px', large: '18px' };
  document.documentElement.style.fontSize = sizes[size] || '16px';
}

function loadSettings() {
  const theme = Utils.getTheme();
  const themeSelect = document.getElementById('settingsTheme');
  if (themeSelect) themeSelect.value = theme;

  const fontSize = localStorage.getItem('lawlense_font_size') || 'medium';
  const fontSizeSelect = document.getElementById('settingsFontSize');
  if (fontSizeSelect) { fontSizeSelect.value = fontSize; applyFontSize(fontSize); }

  const uiLang = localStorage.getItem('lawlense_ui_language') || 'en';
  const langSelect = document.getElementById('settingsLanguage');
  if (langSelect) langSelect.value = uiLang;

  const user = Utils.getUser();
  if (user && user.preferences) {
    const notifToggle = document.getElementById('settingsNotifications');
    if (notifToggle) notifToggle.checked = user.preferences.notifications !== false;
  }

  const studyReminders = localStorage.getItem('lawlense_study_reminders') === 'true';
  const remindersToggle = document.getElementById('settingsStudyReminders');
  if (remindersToggle) remindersToggle.checked = studyReminders;

  const autoSave = localStorage.getItem('lawlense_auto_save') !== 'false';
  const autoSaveToggle = document.getElementById('settingsAutoSave');
  if (autoSaveToggle) autoSaveToggle.checked = autoSave;
}

function loadLearningStats() {
  const info = Utils.getLevelInfo();
  const streak = Utils.getStreak();
  const xpEl = document.getElementById('setXP');
  const levelEl = document.getElementById('setLevel');
  const streakEl = document.getElementById('setStreak');
  const achieveEl = document.getElementById('setAchieve');
  const barEl = document.getElementById('setXPBar');
  if (xpEl) xpEl.textContent = info.totalXP;
  if (levelEl) levelEl.textContent = info.level;
  if (streakEl) streakEl.textContent = `${streak.current}d`;
  if (achieveEl) achieveEl.textContent = getAchievementCount();
  if (barEl) barEl.style.width = `${info.progress}%`;
}

function getAchievementCount() {
  const xp = Utils.getXP();
  const streak = Utils.getStreak();
  const weaknesses = Utils.getWeaknesses();
  const checks = [
    xp.total >= 50, xp.total >= 500, xp.total >= 2000, xp.total >= 5000,
    streak.longest >= 3, streak.longest >= 7, streak.longest >= 30,
    xp.history.filter(h => h.reason === 'quiz').length >= 5,
    xp.history.filter(h => h.reason === 'flashcard').length >= 5,
    weaknesses.length === 0 && xp.total > 100
  ];
  return checks.filter(Boolean).length;
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const theme = document.getElementById('settingsTheme').value;
  const notifications = document.getElementById('settingsNotifications')?.checked ?? true;
  const fontSize = document.getElementById('settingsFontSize')?.value || 'medium';
  const uiLang = document.getElementById('settingsLanguage')?.value || 'en';
  const studyReminders = document.getElementById('settingsStudyReminders')?.checked ?? false;
  const autoSave = document.getElementById('settingsAutoSave')?.checked ?? true;
  const btn = e.target.querySelector('button[type="submit"]');

  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Saving...';

  try {
    Utils.setTheme(theme);
    localStorage.setItem('lawlense_font_size', fontSize);
    localStorage.setItem('lawlense_ui_language', uiLang);
    localStorage.setItem('lawlense_study_reminders', studyReminders);
    localStorage.setItem('lawlense_auto_save', autoSave);
    applyFontSize(fontSize);
    await Utils.api('/auth/profile', {
      method: 'PUT',
      body: { preferences: { theme, notifications, fontSize, uiLang, autoSave } }
    });
    Utils.showToast('Settings saved', 'success');
  } catch (err) {
    Utils.showToast(err.message || 'Failed to save settings', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Settings';
  }
}

function resetLearning() {
  if (!confirm('Reset all learning progress (XP, streaks, achievements, weaknesses)? This cannot be undone.')) return;
  localStorage.removeItem('lawlense_xp');
  localStorage.removeItem('lawlense_streak');
  localStorage.removeItem('lawlense_daily');
  localStorage.removeItem('lawlense_weaknesses');
  Utils.showToast('Learning progress reset', 'success');
  loadLearningStats();
}

window.resetLearning = resetLearning;

async function clearAllHistory() {
  if (!confirm('Clear all chat and search history? This cannot be undone.')) return;
  try {
    await Utils.api('/history/clear', { method: 'DELETE' });
    Utils.showToast('All history cleared', 'success');
  } catch (err) {
    Utils.showToast('Failed to clear history', 'error');
  }
}

async function exportData() {
  try {
    const history = await Utils.api('/history');
    const bookmarks = await Utils.api('/bookmarks');
    const data = { history, bookmarks, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lawlense-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Utils.showToast('Data exported', 'success');
  } catch (err) {
    Utils.showToast('Failed to export data', 'error');
  }
}

window.clearAllHistory = clearAllHistory;
window.exportData = exportData;
