/**
 * LawLens Studio — Gazette Module
 */

Studio.Modules.register('gazette', () => {
  return {
    async render() {
      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Gazette</h1>
            <p class="studio-module-subtitle">Gazette publications and notifications</p>
          </div>
        </div>

        ${Studio.UI.emptyState('newspaper', 'No Gazette Publications', 'Gazette notifications and publications will appear here as they are imported')}
      `;
    },

    mount() {},
    unmount() {}
  };
});
