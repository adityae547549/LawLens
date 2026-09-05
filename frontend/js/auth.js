let firebaseAuth = null;
let firebaseApp = null;

async function initFirebase() {
  try {
    const res = await fetch(`${API_BASE}/config/firebase`);
    const config = await res.json();
    if (!config.apiKey) {
      console.warn('[Auth] Firebase config not available on server');
      return false;
    }
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(config);
    }
    firebaseAuth = firebase.auth();
    return true;
  } catch (err) {
    console.warn('[Auth] Failed to load Firebase config:', err);
    return false;
  }
}

async function signInWithGoogle() {
  if (!firebaseAuth) {
    Utils.showToast('Google sign-in is not configured', 'error');
    return;
  }
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebaseAuth.signInWithPopup(provider);
    const idToken = await result.user.getIdToken();
    const data = await Utils.api('/auth/google', {
      method: 'POST',
      body: { idToken }
    });
    if (data.token && data.user) {
      Utils.setToken(data.token);
      Utils.setUser(data.user);
      const target = (data.user.role === 'admin') ? './studio.html' : './dashboard.html';
      window.location.href = target;
    }
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user') return;
    if (err.code === 'auth/cancelled-popup-request') return;
    console.error('Google sign-in error:', err);
    Utils.showToast(err.message || 'Google sign-in failed', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const googleRegisterBtn = document.getElementById('googleRegisterBtn');

  if (Utils.isAuthenticated()) {
    const user = Utils.getUser();
    window.location.href = (user && user.role === 'admin') ? './studio.html' : './dashboard.html';
    return;
  }

  const firebaseReady = await initFirebase();

  if (firebaseReady) {
    if (googleLoginBtn) {
      googleLoginBtn.addEventListener('click', signInWithGoogle);
    }
    if (googleRegisterBtn) {
      googleRegisterBtn.addEventListener('click', signInWithGoogle);
    }
  } else {
    if (googleLoginBtn) {
      googleLoginBtn.style.display = 'none';
      const divider = googleLoginBtn.previousElementSibling;
      if (divider && divider.classList.contains('auth-divider')) divider.style.display = 'none';
    }
    if (googleRegisterBtn) {
      googleRegisterBtn.style.display = 'none';
      const divider = googleRegisterBtn.previousElementSibling;
      if (divider && divider.classList.contains('auth-divider')) divider.style.display = 'none';
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      try {
        const data = await Utils.api('/auth/login', {
          method: 'POST',
          body: { email, password }
        });
        if (data.token && data.user) {
          Utils.setToken(data.token);
          Utils.setUser(data.user);
          const target = (data.user.role === 'admin') ? './studio.html' : './dashboard.html';
          window.location.href = target;
        }
      } catch (err) {
        Utils.showToast(err.message || 'Login failed', 'error');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;
      const confirm = document.getElementById('registerConfirm').value;

      if (password !== confirm) {
        Utils.showToast('Passwords do not match', 'error');
        return;
      }
      if (password.length < 6) {
        Utils.showToast('Password must be at least 6 characters', 'error');
        return;
      }

      try {
        const data = await Utils.api('/auth/register', {
          method: 'POST',
          body: { name, email, password }
        });
        if (data.token && data.user) {
          Utils.setToken(data.token);
          Utils.setUser(data.user);
          window.location.href = './dashboard.html';
        }
      } catch (err) {
        Utils.showToast(err.message || 'Registration failed', 'error');
      }
    });
  }

  const pwInput = document.getElementById('registerPassword');
  const strengthBar = document.getElementById('passwordStrengthBar');
  if (pwInput && strengthBar) {
    pwInput.addEventListener('input', () => {
      const v = pwInput.value;
      let s = 0;
      if (v.length >= 6) s++;
      if (v.length >= 10) s++;
      if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
      if (/[0-9]/.test(v)) s++;
      if (/[^A-Za-z0-9]/.test(v)) s++;
      const pct = Math.min(100, s * 20);
      strengthBar.style.width = pct + '%';
      strengthBar.style.background = pct < 40 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#22c55e';
    });
  }
});
