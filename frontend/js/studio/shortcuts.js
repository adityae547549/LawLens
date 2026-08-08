/**
 * LawLens Studio — Keyboard Shortcuts Manager
 */

window.StudioShortcuts = (() => {
  const _shortcuts = [];
  let _initialized = false;

  function init() {
    if (_initialized) return;
    _initialized = true;

    document.addEventListener('keydown', (e) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K — Command Palette
      if (isMeta && e.key === 'k') {
        e.preventDefault();
        Studio.CommandPalette.toggle();
        return;
      }

      // Cmd/Ctrl + S — Save
      if (isMeta && e.key === 's') {
        e.preventDefault();
        Studio.Events.emit('save');
        return;
      }

      // Cmd/Ctrl + Z — Undo
      if (isMeta && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        Studio.Undo.undo();
        return;
      }

      // Cmd/Ctrl + Shift + Z — Redo
      if (isMeta && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        Studio.Undo.redo();
        return;
      }

      // Escape — Close overlays
      if (e.key === 'Escape') {
        Studio.CommandPalette.close();
        Studio.Modal.hide();
        return;
      }

      // Custom shortcuts
      _shortcuts.forEach(shortcut => {
        const metaMatch = shortcut.meta ? isMeta : !isMeta;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        if (metaMatch && shiftMatch && e.key.toLowerCase() === shortcut.key.toLowerCase()) {
          e.preventDefault();
          shortcut.handler();
        }
      });
    });
  }

  function register(key, handler, opts = {}) {
    _shortcuts.push({
      key,
      handler,
      meta: opts.meta || false,
      shift: opts.shift || false,
      description: opts.description || ''
    });
  }

  return { init, register };
})();
