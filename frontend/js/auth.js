let firebaseConfig = {};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const API_BASE = window.location.port === '3000' ? `http://localhost:3000` : '';
    const res = await fetch(`${API_BASE}/api/config/firebase`);
    if (res.ok) firebaseConfig = await res.json();
  } catch (e) {}

  if (firebaseConfig.apiKey && typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const googleRegisterBtn = document.getElementById('googleRegisterBtn');

  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
  if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleSignIn);
  if (googleRegisterBtn) googleRegisterBtn.addEventListener('click', handleGoogleSignIn);

  initPasswordToggles();
  initPasswordStrength();
});

async function handleGoogleSignIn() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    Utils.showToast('Firebase is not loaded. Please refresh.', 'error');
    return;
  }

  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  try {
    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;
    const idToken = await user.getIdToken();

    const data = await Utils.api('/auth/google', {
      method: 'POST',
      body: { idToken }
    });

    Utils.setToken(data.token);
    Utils.setUser(data.user);
    Utils.showToast('Welcome, ' + data.user.name + '!', 'success');
    window.location.href = './dashboard.html';
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user') return;
    if (err.code === 'auth/cancelled-popup-request') return;
    console.error('Google sign-in error:', err);
    Utils.showToast(err.message || 'Google sign-in failed', 'error');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = e.target.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('loginError');

  hideError(errorEl);
  clearFieldErrors();

  if (!email) {
    showFieldError('loginEmailError', 'Email is required');
    document.getElementById('loginEmail').focus();
    return;
  }
  if (!password) {
    showFieldError('loginPasswordError', 'Password is required');
    document.getElementById('loginPassword').focus();
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError('loginEmailError', 'Please enter a valid email');
    document.getElementById('loginEmail').focus();
    return;
  }

  setLoading(btn, true);

  try {
    const data = await Utils.api('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    Utils.setToken(data.token);
    Utils.setUser(data.user);
    Utils.showToast('Welcome back!', 'success');
    window.location.href = './dashboard.html';
  } catch (err) {
    showError(errorEl, err.message || 'Login failed');
  } finally {
    setLoading(btn, false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirm = document.getElementById('registerConfirm').value;
  const btn = e.target.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('registerError');

  hideError(errorEl);
  clearFieldErrors();

  if (!name) {
    showFieldError('registerNameError', 'Name is required');
    document.getElementById('registerName').focus();
    return;
  }
  if (!email) {
    showFieldError('registerEmailError', 'Email is required');
    document.getElementById('registerEmail').focus();
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError('registerEmailError', 'Please enter a valid email');
    document.getElementById('registerEmail').focus();
    return;
  }
  if (!password) {
    showFieldError('registerPasswordError', 'Password is required');
    document.getElementById('registerPassword').focus();
    return;
  }
  if (password.length < 6) {
    showFieldError('registerPasswordError', 'Must be at least 6 characters');
    document.getElementById('registerPassword').focus();
    return;
  }
  if (password !== confirm) {
    showFieldError('registerConfirmError', 'Passwords do not match');
    document.getElementById('registerConfirm').focus();
    return;
  }

  setLoading(btn, true);

  try {
    const data = await Utils.api('/auth/register', {
      method: 'POST',
      body: { name, email, password }
    });
    Utils.setToken(data.token);
    Utils.setUser(data.user);
    Utils.showToast('Account created!', 'success');
    window.location.href = './dashboard.html';
  } catch (err) {
    showError(errorEl, err.message || 'Registration failed');
  } finally {
    setLoading(btn, false);
  }
}

function clearFieldErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function updatePasswordStrength(password) {
  const bar = document.getElementById('passwordStrengthBar');
  if (!bar) return;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const pct = (score / 5) * 100;
  bar.style.width = pct + '%';
  bar.style.background = score <= 1 ? 'var(--error)' : score <= 3 ? 'var(--warning)' : 'var(--success)';
}

function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      if (!input) return;
      const type = input.type === 'password' ? 'text' : 'password';
      input.type = type;
      btn.innerHTML = type === 'password'
        ? '<i data-lucide="eye" style="width:18px;height:18px;"></i>'
        : '<i data-lucide="eye-off" style="width:18px;height:18px;"></i>';
      if (window.lucide) lucide.createIcons();
    });
  });
}

function showError(el, msg) {
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function hideError(el) {
  if (el) {
    el.style.display = 'none';
    el.textContent = '';
  }
}

function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = '<span class="loading-spinner" style="width:16px;height:16px;border-width:2px;"></span> Processing...';
  } else {
    btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
  }
}

function initPasswordStrength() {
  const pwInput = document.getElementById('registerPassword');
  if (!pwInput) return;
  pwInput.addEventListener('input', () => updatePasswordStrength(pwInput.value));
}
