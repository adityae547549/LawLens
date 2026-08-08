/**
 * LawLens Studio — Search Builder Module
 */

Studio.Modules.register('search-builder', () => {
  let _config = null;

  async function loadConfig() {
    try {
      const res = await Studio.api('/studio/search/config');
      _config = res.data || { mode: 'hybrid', weights: { vector: 0.6, keyword: 0.3, graph: 0.1 }, maxResults: 10 };
    } catch (err) {
      _config = { mode: 'hybrid', weights: { vector: 0.6, keyword: 0.3, graph: 0.1 }, maxResults: 10 };
    }
  }

  return {
    async render() {
      await loadConfig();

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Search Builder</h1>
            <p class="studio-module-subtitle">Configure search behavior and ranking</p>
          </div>
          <div class="studio-module-actions">
            ${Studio.UI.btn('Save Config', { icon: 'save', variant: 'primary', id: 'saveSearchConfig' })}
          </div>
        </div>

        <div class="studio-grid-2">
          ${Studio.UI.section('Search Mode', `
            <div class="studio-form-group">
              <label class="studio-form-label">Default Mode</label>
              <select class="studio-form-input studio-form-select" id="searchMode">
                <option value="hybrid" ${_config.mode === 'hybrid' ? 'selected' : ''}>Hybrid (Vector + Keyword)</option>
                <option value="vector" ${_config.mode === 'vector' ? 'selected' : ''}>Semantic (Vector Only)</option>
                <option value="keyword" ${_config.mode === 'keyword' ? 'selected' : ''}>Keyword Only</option>
              </select>
            </div>
            <div class="studio-form-group">
              <label class="studio-form-label">Max Results</label>
              <input class="studio-form-input" id="searchMaxResults" type="number" value="${_config.maxResults || 10}" min="1" max="50">
            </div>
          `)}

          ${Studio.UI.section('Ranking Weights', `
            <div class="studio-form-group">
              <label class="studio-form-label">Vector Similarity: <span id="vectorWeight">${(_config.weights?.vector || 0.6) * 100}%</span></label>
              <input type="range" id="searchVectorWeight" min="0" max="100" value="${(_config.weights?.vector || 0.6) * 100}" style="width:100%;">
            </div>
            <div class="studio-form-group">
              <label class="studio-form-label">Keyword Match: <span id="keywordWeight">${(_config.weights?.keyword || 0.3) * 100}%</span></label>
              <input type="range" id="searchKeywordWeight" min="0" max="100" value="${(_config.weights?.keyword || 0.3) * 100}" style="width:100%;">
            </div>
            <div class="studio-form-group">
              <label class="studio-form-label">Graph Boost: <span id="graphWeight">${(_config.weights?.graph || 0.1) * 100}%</span></label>
              <input type="range" id="searchGraphWeight" min="0" max="100" value="${(_config.weights?.graph || 0.1) * 100}" style="width:100%;">
            </div>
          `)}
        </div>

        ${Studio.UI.section('Test Search', `
          <div style="display:flex;gap:8px;margin-bottom:16px;">
            <input class="studio-form-input" id="searchTestQuery" placeholder="Enter a search query to test..." style="flex:1;">
            ${Studio.UI.btn('Test', { icon: 'search', variant: 'primary', id: 'searchTestBtn' })}
          </div>
          <div id="searchTestResults" style="min-height:60px;"></div>
        `)}
      `;
    },

    mount() {
      // Weight sliders
      ['vector', 'keyword', 'graph'].forEach(type => {
        const slider = document.getElementById(`search${type.charAt(0).toUpperCase() + type.slice(1)}Weight`);
        const label = document.getElementById(`${type}Weight`);
        slider?.addEventListener('input', () => {
          if (label) label.textContent = slider.value + '%';
        });
      });

      // Save
      document.getElementById('saveSearchConfig')?.addEventListener('click', async () => {
        try {
          await Studio.api('/studio/search/config', {
            method: 'PUT',
            body: {
              mode: document.getElementById('searchMode')?.value,
              maxResults: parseInt(document.getElementById('searchMaxResults')?.value || 10),
              weights: {
                vector: parseInt(document.getElementById('searchVectorWeight')?.value || 60) / 100,
                keyword: parseInt(document.getElementById('searchKeywordWeight')?.value || 30) / 100,
                graph: parseInt(document.getElementById('searchGraphWeight')?.value || 10) / 100
              }
            }
          });
          Studio.Toast.success('Search config saved');
        } catch (err) {
          Studio.Toast.error(err.message);
        }
      });

      // Test search
      document.getElementById('searchTestBtn')?.addEventListener('click', async () => {
        const query = document.getElementById('searchTestQuery')?.value;
        if (!query) return;
        const resultsDiv = document.getElementById('searchTestResults');
        resultsDiv.innerHTML = Studio.UI.loading();
        try {
          const res = await Studio.api('/search', { method: 'POST', body: { query } });
          const results = res.results || res.data?.results || [];
          if (results.length === 0) {
            resultsDiv.innerHTML = '<div style="color:var(--text-tertiary);font-size:0.85rem;">No results found</div>';
          } else {
            resultsDiv.innerHTML = results.slice(0, 5).map(r => `
              <div style="padding:10px;border:1px solid var(--border-color);border-radius:8px;margin-bottom:8px;">
                <div style="font-weight:600;font-size:0.85rem;color:var(--text-primary);">${r.title || r.metadata?.title || 'Untitled'}</div>
                <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;">${(r.text || '').substring(0, 120)}...</div>
                ${r.score ? `<div style="font-size:0.7rem;color:var(--text-tertiary);margin-top:4px;">Score: ${r.score.toFixed(3)}</div>` : ''}
              </div>`).join('');
          }
        } catch (err) {
          resultsDiv.innerHTML = `<div style="color:var(--error);font-size:0.85rem;">Search failed: ${err.message}</div>`;
        }
      });
    },

    unmount() { _config = null; }
  };
});
