/**
 * LawLens Studio — Prompt Manager Module
 */

Studio.Modules.register('prompts', () => {
  let _prompt = null;

  async function loadPrompt() {
    try {
      const res = await Studio.api('/admin/prompt');
      _prompt = res;
    } catch (err) {
      _prompt = null;
    }
  }

  return {
    async render() {
      await loadPrompt();

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Prompt Manager</h1>
            <p class="studio-module-subtitle">Manage AI system prompts and templates</p>
          </div>
          <div class="studio-module-actions">
            ${Studio.UI.btn('Save', { icon: 'save', variant: 'primary', id: 'savePromptBtn' })}
          </div>
        </div>

        ${Studio.UI.section('System Prompt', `
          <div class="studio-form-group">
            <textarea class="studio-form-input studio-form-textarea" id="promptEditor" style="min-height:400px;font-family:var(--font-mono);font-size:0.82rem;line-height:1.7;">${_prompt?.prompt || _prompt?.systemPrompt || ''}</textarea>
          </div>
          <div style="display:flex;gap:8px;">
            ${Studio.UI.btn('Reset to Default', { icon: 'rotate-ccw', id: 'resetPromptBtn' })}
          </div>
        `)}
      `;
    },

    mount() {
      document.getElementById('savePromptBtn')?.addEventListener('click', async () => {
        const prompt = document.getElementById('promptEditor')?.value;
        try {
          await Studio.api('/admin/prompt', { method: 'PUT', body: { prompt } });
          Studio.Toast.success('Prompt saved');
        } catch (err) {
          Studio.Toast.error(err.message);
        }
      });

      document.getElementById('resetPromptBtn')?.addEventListener('click', async () => {
        Studio.Modal.confirm('Reset Prompt', 'Reset to default prompt?', async () => {
          try {
            await Studio.api('/admin/prompt/reset', { method: 'POST' });
            Studio.Toast.success('Prompt reset');
            Studio.Router.handleRoute();
          } catch (err) {
            Studio.Toast.error(err.message);
          }
        });
      });
    },

    unmount() { _prompt = null; }
  };
});
