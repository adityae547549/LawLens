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

async function signInWithEmail(email, password) {
  const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
  const idToken = await cred.user.getIdToken();
  const data = await Utils.api('/auth/login', {
    method: 'POST',
    body: { idToken }
  });
  Utils.setUser(data.user);
  return data;
}

async function signUpWithEmail(name, email, password) {
  const cred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName: name });
  const idToken = await cred.user.getIdToken();
  const data = await Utils.api('/auth/register', {
    method: 'POST',
    body: { idToken, name, email, password }
  });
  Utils.setUser(data.user);
  return data;
}

async function signInWithGoogle() {
  if (!firebaseAuth) {
    Utils.showToast('Google sign-in is not configured', 'error');
    return;
  }
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await firebaseAuth.signInWithPopup(provider);
  const idToken = await result.user.getIdToken();
  const data = await Utils.api('/auth/google', {
    method: 'POST',
    body: { idToken }
  });
  Utils.setUser(data.user);
  return data;
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const googleRegisterBtn = document.getElementById('googleRegisterBtn');

  const firebaseReady = await initFirebase();

  if (firebaseReady) {
    firebaseAuth.onAuthStateChanged(async (fbUser) => {
      if (fbUser && !Utils.getUser()) {
        try {
          const idToken = await fbUser.getIdToken();
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });
          if (res.ok) {
            const data = await res.json();
            Utils.setToken(idToken);
            Utils.setUser(data.user);
            const target = (data.user.role === 'admin') ? './studio.html' : './dashboard.html';
            if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
              window.location.href = target;
            }
          }
        } catch {}
      }
    });
  }

  if (Utils.isAuthenticated()) {
    const user = Utils.getUser();
    window.location.href = (user && user.role === 'admin') ? './studio.html' : './dashboard.html';
    return;
  }

  if (firebaseReady) {
    if (googleLoginBtn) {
      googleLoginBtn.addEventListener('click', async () => {
        try {
          const data = await signInWithGoogle();
          if (data && data.user) {
            Utils.setToken(await firebaseAuth.currentUser.getIdToken());
            const target = (data.user.role === 'admin') ? './studio.html' : './dashboard.html';
            window.location.href = target;
          }
        } catch (err) {
          if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
          console.error('Google sign-in error:', err);
          Utils.showToast(err.message || 'Google sign-in failed', 'error');
        }
      });
    }
    if (googleRegisterBtn) {
      googleRegisterBtn.addEventListener('click', async () => {
        try {
          const data = await signInWithGoogle();
          if (data && data.user) {
            Utils.setToken(await firebaseAuth.currentUser.getIdToken());
            const target = (data.user.role === 'admin') ? './studio.html' : './dashboard.html';
            window.location.href = target;
          }
        } catch (err) {
          if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
          console.error('Google sign-in error:', err);
          Utils.showToast(err.message || 'Google sign-in failed', 'error');
        }
      });
    }
  } else {
    [googleLoginBtn, googleRegisterBtn].forEach(btn => {
      if (btn) {
        btn.style.display = 'none';
        const divider = btn.previousElementSibling;
        if (divider && divider.classList.contains('auth-divider')) divider.style.display = 'none';
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      if (!firebaseReady) {
        Utils.showToast('Authentication is not configured', 'error');
        return;
      }
      try {
        const data = await signInWithEmail(email, password);
        if (data && data.user) {
          Utils.setToken(await firebaseAuth.currentUser.getIdToken());
          const target = (data.user.role === 'admin') ? './studio.html' : './dashboard.html';
          window.location.href = target;
        }
      } catch (err) {
        let msg = 'Login failed';
        if (err.code === 'auth/user-not-found') msg = 'No account found with this email';
        else if (err.code === 'auth/wrong-password') msg = 'Incorrect password';
        else if (err.code === 'auth/invalid-credential') msg = 'Invalid email or password';
        else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later';
        else msg = err.message || msg;
        Utils.showToast(msg, 'error');
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
      if (!firebaseReady) {
        Utils.showToast('Authentication is not configured', 'error');
        return;
      }
      if (password !== confirm) {
        Utils.showToast('Passwords do not match', 'error');
        return;
      }
      if (password.length < 6) {
        Utils.showToast('Password must be at least 6 characters', 'error');
        return;
      }
      try {
        const data = await signUpWithEmail(name, email, password);
        if (data && data.user) {
          Utils.setToken(await firebaseAuth.currentUser.getIdToken());
          window.location.href = './dashboard.html';
        }
      } catch (err) {
        let msg = 'Registration failed';
        if (err.code === 'auth/email-already-in-use') msg = 'Email already registered';
        else if (err.code === 'auth/weak-password') msg = 'Password is too weak';
        else if (err.code === 'auth/invalid-email') msg = 'Invalid email address';
        else msg = err.message || msg;
        Utils.showToast(msg, 'error');
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
