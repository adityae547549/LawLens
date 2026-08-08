document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (Utils.isAuthenticated()) {
    const user = Utils.getUser();
    window.location.href = (user && user.role === 'admin') ? './studio.html' : './dashboard.html';
    return;
  }
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
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
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
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
});