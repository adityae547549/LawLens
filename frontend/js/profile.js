document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('profilePage')) return;

  if (!Utils.isAuthenticated()) {
    window.location.href = '/login';
    return;
  }

  loadProfile();
  const profileForm = document.getElementById('profileForm');
  if (profileForm) profileForm.addEventListener('submit', handleUpdateProfile);
});

async function loadProfile() {
  try {
    const data = await Utils.api('/auth/profile');
    const user = data.user;

    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profileRole').textContent = user.role || 'user';
    document.getElementById('profileJoined').textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
    document.getElementById('profileAvatar').textContent = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  } catch (err) {
    Utils.showToast('Failed to load profile', 'error');
  }
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const name = document.getElementById('profileName').value.trim();
  const btn = e.target.querySelector('button[type="submit"]');

  if (!name) {
    Utils.showToast('Name is required', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Saving...';

  try {
    await Utils.api('/auth/profile', {
      method: 'PUT',
      body: { name }
    });
    const user = Utils.getUser();
    user.name = name;
    Utils.setUser(user);
    Utils.showToast('Profile updated', 'success');
  } catch (err) {
    Utils.showToast(err.message || 'Failed to update profile', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
}
