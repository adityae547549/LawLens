/**
 * LawLens Studio — Settings Module
 */

Studio.Modules.register('settings', () => {
  let _theme = null;

  async function loadTheme() {
    try {
      const res = await Studio.api('/studio/theme');
      _theme = res.data || {};
    } catch (err) {
      _theme = {};
    }
  }

  return {
    async render() {
      await loadTheme();

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Settings</h1>
            <p class="studio-module-subtitle">Platform configuration and theme customization</p>
          </div>
        </div>

        <div class="studio-grid-2">
          ${Studio.UI.section('Theme Builder', `
            <div class="studio-form-group">
              <label class="studio-form-label">Primary Color</label>
              <div style="display:flex;gap:8px;align-items:center;">
                <input type="color" id="themePrimary" value="${_theme.primaryColor || '#6366f1'}" style="width:40px;height:32px;border:none;cursor:pointer;">
                <input class="studio-form-input" id="themePrimaryHex" value="${_theme.primaryColor || '#6366f1'}" style="width:100px;">
              </div>
            </div>
            <div class="studio-form-group">
              <label class="studio-form-label">Accent Color</label>
              <div style="display:flex;gap:8px;align-items:center;">
                <input type="color" id="themeAccent" value="${_theme.accentColor || '#8b5cf6'}" style="width:40px;height:32px;border:none;cursor:pointer;">
                <input class="studio-form-input" id="themeAccentHex" value="${_theme.accentColor || '#8b5cf6'}" style="width:100px;">
              </div>
            </div>
            <div class="studio-form-group">
              <label class="studio-form-label">Font Family</label>
              <select class="studio-form-input studio-form-select" id="themeFont">
                <option value="Inter" ${_theme.fontFamily === 'Inter' ? 'selected' : ''}>Inter</option>
                <option value="System" ${_theme.fontFamily === 'System' ? 'selected' : ''}>System Default</option>
              </select>
            </div>
            <div class="studio-form-group">
              <label class="studio-form-label">Border Radius: ${_theme.borderRadius || 10}px</label>
              <input type="range" id="themeRadius" min="0" max="24" value="${_theme.borderRadius || 10}" style="width:100%;">
            </div>
            <div style="display:flex;gap:8px;margin-top:12px;">
              ${Studio.UI.btn('Apply Theme', { icon: 'palette', variant: 'primary', id: 'applyThemeBtn' })}
              ${Studio.UI.btn('Reset', { icon: 'rotate-ccw', id: 'resetThemeBtn' })}
            </div>
          `)}

          ${Studio.UI.section('Platform Settings', `
            <div class="studio-form-group">
              <label class="studio-form-label">Platform Name</label>
              <input class="studio-form-input" value="LawLens" disabled style="opacity:0.6;">
            </div>
            <div class="studio-form-group">
              <label class="studio-form-label">Default Language</label>
              <select class="studio-form-input studio-form-select" disabled>
                <option>English</option>
              </select>
            </div>
            <div class="studio-form-group">
              <label class="studio-form-label">Timezone</label>
              <select class="studio-form-input studio-form-select" disabled>
                <option>Asia/Kolkata (IST)</option>
              </select>
            </div>
          `)}
        </div>`;
    },

    mount() {
      // Sync color pickers
      const primaryPicker = document.getElementById('themePrimary');
      const primaryHex = document.getElementById('themePrimaryHex');
      primaryPicker?.addEventListener('input', () => { if (primaryHex) primaryHex.value = primaryPicker.value; });
      primaryHex?.addEventListener('input', () => { if (primaryPicker) primaryPicker.value = primaryHex.value; });

      const accentPicker = document.getElementById('themeAccent');
      const accentHex = document.getElementById('themeAccentHex');
      accentPicker?.addEventListener('input', () => { if (accentHex) accentHex.value = accentPicker.value; });
      accentHex?.addEventListener('input', () => { if (accentPicker) accentPicker.value = accentHex.value; });

      // Radius slider
      const radiusSlider = document.getElementById('themeRadius');
      radiusSlider?.addEventListener('input', () => {
        const label = radiusSlider.previousElementSibling;
        if (label) label.textContent = `Border Radius: ${radiusSlider.value}px`;
      });

      // Apply theme
      document.getElementById('applyThemeBtn')?.addEventListener('click', async () => {
        try {
          const themeData = {
            primaryColor: document.getElementById('themePrimaryHex')?.value || '#6366f1',
            accentColor: document.getElementById('themeAccentHex')?.value || '#8b5cf6',
            fontFamily: document.getElementById('themeFont')?.value || 'Inter',
            borderRadius: parseInt(document.getElementById('themeRadius')?.value || 10)
          };
          await Studio.api('/studio/theme', { method: 'PUT', body: themeData });

          // Apply live
          document.documentElement.style.setProperty('--accent-primary', themeData.primaryColor);
          document.documentElement.style.setProperty('--accent-secondary', themeData.accentColor);

          Studio.Toast.success('Theme applied');
        } catch (err) {
          Studio.Toast.error(err.message);
        }
      });

      // Reset theme
      document.getElementById('resetThemeBtn')?.addEventListener('click', async () => {
        Studio.Modal.confirm('Reset Theme', 'Reset theme to defaults?', async () => {
          try {
            await Studio.api('/studio/theme', { method: 'PUT', body: { primaryColor: '#6366f1', accentColor: '#8b5cf6', fontFamily: 'Inter', borderRadius: 10 } });
            document.documentElement.style.removeProperty('--accent-primary');
            document.documentElement.style.removeProperty('--accent-secondary');
            Studio.Toast.success('Theme reset');
            Studio.Router.handleRoute();
          } catch (err) {
            Studio.Toast.error(err.message);
          }
        });
      });
    },

    unmount() { _theme = null; }
  };
});
