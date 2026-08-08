/**
 * LawLens Studio — AI Configuration Module
 */

Studio.Modules.register('ai-config', () => {
  let _config = null;
  let _prompt = null;

  async function loadConfig() {
    try {
      const [config, prompt] = await Promise.allSettled([
        Studio.api('/studio/ai/config'),
        Studio.api('/admin/prompt')
      ]);
      _config = config.status === 'fulfilled' ? config.value?.data : null;
      _prompt = prompt.status === 'fulfilled' ? prompt.value : null;
    } catch (err) {
      console.error('Failed to load AI config:', err);
    }
  }

  return {
    async render() {
      await loadConfig();

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">AI Configuration</h1>
            <p class="studio-module-subtitle">Configure AI models, prompts, and retrieval settings</p>
          </div>
          <div class="studio-module-actions">
            ${Studio.UI.btn('Save Changes', { icon: 'save', variant: 'primary', id: 'saveAiConfigBtn' })}
          </div>
        </div>

        <div class="studio-grid-2">
          ${Studio.UI.section('Model Settings', `
            <div class="studio-form-group">
              <label class="studio-form-label">Provider</label>
              <select class="studio-form-input studio-form-select" id="aiProvider">
                <option value="groq" ${_config?.provider === 'groq' ? 'selected' : ''}>Groq</option>
                <option value="openai" ${_config?.provider === 'openai' ? 'selected' : ''}>OpenAI</option>
                <option value="anthropic" ${_config?.provider === 'anthropic' ? 'selected' : ''}>Anthropic</option>
              </select>
            </div>
            <div class="studio-form-group">
              <label class="studio-form-label">Model</label>
              <select class="studio-form-input studio-form-select" id="aiModel">
                <option value="llama-3.3-70b-versatile" ${_config?.model === 'llama-3.3-70b-versatile' ? 'selected' : ''}>Llama 3.3 70B</option>
                <option value="llama-3.1-8b-instant" ${_config?.model === 'llama-3.1-8b-instant' ? 'selected' : ''}>Llama 3.1 8B</option>
                <option value="mixtral-8x7b-32768" ${_config?.model === 'mixtral-8x7b-32768' ? 'selected' : ''}>Mixtral 8x7B</option>
              </select>
            </div>
            <div class="studio-form-group">
              <label class="studio-form-label">Temperature: <span id="tempValue">${_config?.temperature || 0.3}</span></label>
              <input type="range" id="aiTemp" min="0" max="2" step="0.1" value="${_config?.temperature || 0.3}" style="width:100%;">
            </div>
            <div class="studio-form-group">
              <label class="studio-form-label">Max Tokens</label>
              <input class="studio-form-input" id="aiMaxTokens" type="number" value="${_config?.maxTokens || 4096}">
            </div>
            <div class="studio-form-group" style="display:flex;align-items:center;gap:12px;">
              <label class="studio-form-label" style="margin:0;">Streaming</label>
              <input type="checkbox" id="aiStreaming" ${_config?.streaming !== false ? 'checked' : ''} style="width:auto;">
            </div>
            <div class="studio-form-group" style="display:flex;align-items:center;gap:12px;">
              <label class="studio-form-label" style="margin:0;">Reranking</label>
              <input type="checkbox" id="aiReranking" ${_config?.reranking !== false ? 'checked' : ''} style="width:auto;">
            </div>
          `)}

          ${Studio.UI.section('System Prompt', `
            <div class="studio-form-group">
              <textarea class="studio-form-input studio-form-textarea" id="aiSystemPrompt" style="min-height:200px;font-family:var(--font-mono);font-size:0.8rem;line-height:1.6;">${_prompt?.prompt || _prompt?.systemPrompt || 'You are a helpful legal research assistant.'}</textarea>
            </div>
            <div style="display:flex;gap:8px;">
              ${Studio.UI.btn('Reset to Default', { icon: 'rotate-ccw', id: 'resetPromptBtn' })}
            </div>
          `)}
        </div>`;
    },

    mount() {
      // Temperature slider
      const slider = document.getElementById('aiTemp');
      const tempVal = document.getElementById('tempValue');
      slider?.addEventListener('input', () => {
        if (tempVal) tempVal.textContent = slider.value;
      });

      // Save
      document.getElementById('saveAiConfigBtn')?.addEventListener('click', async () => {
        try {
          await Studio.api('/studio/ai/config', {
            method: 'PUT',
            body: {
              provider: document.getElementById('aiProvider')?.value,
              model: document.getElementById('aiModel')?.value,
              temperature: parseFloat(document.getElementById('aiTemp')?.value || 0.3),
              maxTokens: parseInt(document.getElementById('aiMaxTokens')?.value || 4096),
              streaming: document.getElementById('aiStreaming')?.checked,
              reranking: document.getElementById('aiReranking')?.checked
            }
          });

          // Save prompt
          const newPrompt = document.getElementById('aiSystemPrompt')?.value;
          if (newPrompt) {
            await Studio.api('/admin/prompt', {
              method: 'PUT',
              body: { prompt: newPrompt }
            });
          }

          Studio.Toast.success('AI configuration saved');
        } catch (err) {
          Studio.Toast.error(err.message || 'Failed to save');
        }
      });

      // Reset prompt
      document.getElementById('resetPromptBtn')?.addEventListener('click', async () => {
        Studio.Modal.confirm('Reset Prompt', 'Reset the system prompt to default?', async () => {
          try {
            await Studio.api('/admin/prompt/reset', { method: 'POST' });
            Studio.Toast.success('Prompt reset to default');
            Studio.Router.handleRoute();
          } catch (err) {
            Studio.Toast.error(err.message);
          }
        });
      });
    },

    unmount() { _config = null; _prompt = null; }
  };
});
