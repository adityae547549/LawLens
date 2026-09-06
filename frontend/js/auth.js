let firebaseAuth = null;
let firebaseApp = null;
let appCheckInitialized = false;

async function initFirebase() {
  try {
    const res = await fetch(`${API_BASE}/config/firebase`);
    const config = await res.json();
    if (!config.apiKey) {
      console.warn('[Auth] Firebase config not available');
      return false;
    }
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(config);
    }
    firebaseAuth = firebase.auth();

    if (config.appCheckSiteKey && firebase.appCheck) {
      try {
        if (!appCheckInitialized) {
          firebase.appCheck().initializeAppCheck(firebaseApp, {
            provider: new firebase.appCheck.ReCaptchaEnterpriseProvider(config.appCheckSiteKey),
            isTokenAutoRefreshEnabled: true,
          });
          appCheckInitialized = true;
        }
        refreshAppCheckToken();
        setInterval(refreshAppCheckToken, 15 * 60 * 1000);
      } catch (e) {
        console.warn('[AppCheck] init failed:', e);
      }
    }
    return true;
  } catch (err) {
    console.warn('[Auth] Failed to initialize Firebase:', err);
    return false;
  }
}

async function refreshAppCheckToken() {
  try {
    const tokenResult = await firebase.appCheck().getToken(false);
    if (tokenResult && tokenResult.token) {
      Utils.setAppCheckToken(tokenResult.token);
    }
  } catch (e) {
    console.warn('[AppCheck] token unavailable:', e.message);
  }
}

function appCheckHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const ac = Utils.getAppCheckToken();
  if (ac) headers['X-Firebase-AppCheck'] = ac;
  return headers;
}

async function syncUserWithBackend(idToken) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: appCheckHeaders(),
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to sync with server');
  }
  return await res.json();
}

async function registerWithBackend(idToken) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: appCheckHeaders(),
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to register');
  }
  return await res.json();
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const googleRegisterBtn = document.getElementById('googleRegisterBtn');

  const firebaseReady = await initFirebase();

  if (!firebaseReady) {
    [googleLoginBtn, googleRegisterBtn].forEach(btn => {
      if (btn) {
        btn.style.display = 'none';
        const divider = btn.previousElementSibling;
        if (divider && divider.classList.contains('auth-divider')) divider.style.display = 'none';
      }
    });
  }

  if (Utils.isAuthenticated()) {
    const user = Utils.getUser();
    window.location.href = (user && user.role === 'admin') ? './studio.html' : './dashboard.html';
    return;
  }

  if (firebaseReady) {
    const setupGoogleButton = (btn) => {
      btn.addEventListener('click', async () => {
        try {
          const provider = new firebase.auth.GoogleAuthProvider();
          const result = await firebaseAuth.signInWithPopup(provider);
          const idToken = await result.user.getIdToken();
          const data = await syncUserWithBackend(idToken);
          Utils.setToken(idToken);
          Utils.setUser(data.user);
          const target = (data.user.role === 'admin') ? './studio.html' : './dashboard.html';
          window.location.href = target;
        } catch (err) {
          if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
          console.error('Google sign-in error:', err);
          Utils.showToast(err.message || 'Google sign-in failed', 'error');
        }
      });
    };
    if (googleLoginBtn) setupGoogleButton(googleLoginBtn);
    if (googleRegisterBtn) setupGoogleButton(googleRegisterBtn);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!firebaseReady) {
        Utils.showToast('Authentication is not configured', 'error');
        return;
      }
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      try {
        await firebaseAuth.signInWithEmailAndPassword(email, password);
        const user = firebaseAuth.currentUser;
        if (!user) throw new Error('Sign in failed');
        const idToken = await user.getIdToken();
        const data = await syncUserWithBackend(idToken);
        Utils.setToken(idToken);
        Utils.setUser(data.user);
        const target = (data.user.role === 'admin') ? './studio.html' : './dashboard.html';
        window.location.href = target;
      } catch (err) {
        let msg = 'Login failed';
        if (err.code === 'auth/user-not-found') msg = 'No account found with this email';
        else if (err.code === 'auth/wrong-password') msg = 'Incorrect password';
        else if (err.code === 'auth/invalid-credential') msg = 'Invalid email or password';
        else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later';
        else if (err.code === 'auth/invalid-email') msg = 'Invalid email address';
        else msg = err.message || msg;
        Utils.showToast(msg, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!firebaseReady) {
        Utils.showToast('Authentication is not configured', 'error');
        return;
      }
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

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      try {
        const cred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });
        const idToken = await cred.user.getIdToken();
        const data = await registerWithBackend(idToken);
        Utils.setToken(idToken);
        Utils.setUser(data.user);
        window.location.href = './dashboard.html';
      } catch (err) {
        let msg = 'Registration failed';
        if (err.code === 'auth/email-already-in-use') msg = 'Email already registered';
        else if (err.code === 'auth/weak-password') msg = 'Password is too weak';
        else if (err.code === 'auth/invalid-email') msg = 'Invalid email address';
        else msg = err.message || msg;
        Utils.showToast(msg, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
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
