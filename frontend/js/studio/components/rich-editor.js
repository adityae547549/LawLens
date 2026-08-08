/**
 * LawLens Studio — Rich Text Editor Component
 * Professional contenteditable editor for legal documents
 */

window.StudioRichEditor = (() => {
  let _editor = null;
  let _toolbar = null;
  let _onChange = null;
  let _unsaved = false;

  const TOOLBAR_ITEMS = [
    { group: 'format', items: [
      { cmd: 'bold', icon: 'bold', title: 'Bold (Ctrl+B)' },
      { cmd: 'italic', icon: 'italic', title: 'Italic (Ctrl+I)' },
      { cmd: 'underline', icon: 'underline', title: 'Underline (Ctrl+U)' },
      { cmd: 'strikeThrough', icon: 'strikethrough', title: 'Strikethrough' }
    ]},
    { group: 'heading', items: [
      { cmd: 'formatBlock', value: 'H1', icon: 'heading-1', title: 'Heading 1' },
      { cmd: 'formatBlock', value: 'H2', icon: 'heading-2', title: 'Heading 2' },
      { cmd: 'formatBlock', value: 'H3', icon: 'heading-3', title: 'Heading 3' },
      { cmd: 'formatBlock', value: 'P', icon: 'paragraph', title: 'Paragraph' }
    ]},
    { group: 'list', items: [
      { cmd: 'insertUnorderedList', icon: 'list', title: 'Bullet List' },
      { cmd: 'insertOrderedList', icon: 'list-ordered', title: 'Numbered List' },
      { cmd: 'formatBlock', value: 'BLOCKQUOTE', icon: 'quote', title: 'Blockquote' }
    ]},
    { group: 'insert', items: [
      { cmd: 'createLink', icon: 'link', title: 'Insert Link', prompt: 'Enter URL:' },
      { cmd: 'insertHTML', value: '<hr>', icon: 'minus', title: 'Horizontal Rule' },
      { cmd: 'insertHTML', value: '<pre><code></code></pre>', icon: 'code', title: 'Code Block' }
    ]},
    { group: 'table', items: [
      { cmd: 'insertTable', icon: 'table', title: 'Insert Table' }
    ]},
    { group: 'citation', items: [
      { cmd: 'insertCitation', icon: 'book-open', title: 'Legal Citation' }
    ]},
    { group: 'history', items: [
      { cmd: 'undo', icon: 'undo-2', title: 'Undo' },
      { cmd: 'redo', icon: 'redo-2', title: 'Redo' }
    ]}
  ];

  function createToolbar() {
    const groups = TOOLBAR_ITEMS.map(group => {
      const buttons = group.items.map(item => `
        <button class="rich-editor-btn" data-cmd="${item.cmd}" data-value="${item.value || ''}"
                data-prompt="${item.prompt || ''}" title="${item.title}">
          <i data-lucide="${item.icon}"></i>
        </button>`).join('');
      return `<div class="rich-editor-toolbar-group">${buttons}</div>`;
    }).join('<div class="rich-editor-toolbar-sep"></div>');

    return `
      <div class="rich-editor-toolbar" id="richEditorToolbar">
        ${groups}
        <div style="flex:1;"></div>
        <div class="rich-editor-status" id="richEditorStatus">
          <span class="rich-editor-status-dot"></span>
          <span>Saved</span>
        </div>
      </div>`;
  }

  function execCommand(cmd, value) {
    if (cmd === 'createLink') {
      const url = prompt('Enter URL:');
      if (url) document.execCommand('createLink', false, url);
    } else if (cmd === 'insertTable') {
      const rows = prompt('Number of rows:', '3') || 3;
      const cols = prompt('Number of columns:', '3') || 3;
      let table = '<table style="width:100%;border-collapse:collapse;margin:12px 0;">';
      for (let i = 0; i < rows; i++) {
        table += '<tr>';
        for (let j = 0; j < cols; j++) {
          const tag = i === 0 ? 'th' : 'td';
          table += `<${tag} style="border:1px solid var(--border-color);padding:8px;${i === 0 ? 'background:var(--bg-tertiary);font-weight:600;' : ''}">&nbsp;</${tag}>`;
        }
        table += '</tr>';
      }
      table += '</table>';
      document.execCommand('insertHTML', false, table);
    } else if (cmd === 'insertCitation') {
      const citation = prompt('Enter citation (e.g., AIR 2017 SC 4161):');
      if (citation) {
        const html = `<span class="legal-citation" style="background:rgba(99,102,241,0.12);color:var(--accent-primary);padding:2px 6px;border-radius:4px;font-style:italic;cursor:help;" title="Legal Citation">[${citation}]</span>&nbsp;`;
        document.execCommand('insertHTML', false, html);
      }
    } else if (cmd === 'formatBlock') {
      document.execCommand('formatBlock', false, `<${value}>`);
    } else {
      document.execCommand(cmd, false, value || null);
    }
    markUnsaved();
  }

  function markUnsaved() {
    _unsaved = true;
    const status = document.getElementById('richEditorStatus');
    if (status) {
      status.innerHTML = '<span class="rich-editor-status-dot unsaved"></span><span>Unsaved</span>';
    }
  }

  function markSaved() {
    _unsaved = false;
    const status = document.getElementById('richEditorStatus');
    if (status) {
      status.innerHTML = '<span class="rich-editor-status-dot"></span><span>Saved</span>';
    }
  }

  /**
   * Create a rich editor instance
   * @param {HTMLElement} container - Container element
   * @param {Object} opts - Options: { content, onChange, placeholder }
   * @returns {Object} Editor API
   */
  function create(container, opts = {}) {
    _onChange = opts.onChange || null;

    container.innerHTML = `
      <div class="rich-editor" id="richEditorWrap">
        ${createToolbar()}
        <div class="rich-editor-content" id="richEditorContent" contenteditable="true"
             style="min-height:300px;padding:20px;font-size:0.9rem;line-height:1.7;color:var(--text-primary);outline:none;"
             data-placeholder="${opts.placeholder || 'Start typing...'}">${opts.content || ''}</div>
      </div>`;

    _editor = document.getElementById('richEditorContent');
    _toolbar = document.getElementById('richEditorToolbar');

    // Toolbar events
    _toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.rich-editor-btn');
      if (!btn) return;
      e.preventDefault();
      execCommand(btn.dataset.cmd, btn.dataset.value);
    });

    // Editor events
    _editor.addEventListener('input', () => {
      markUnsaved();
      if (_onChange) _onChange(_editor.innerHTML);
    });

    _editor.addEventListener('keydown', (e) => {
      // Tab for indentation
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
      }
    });

    // Keyboard shortcuts
    _editor.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b': e.preventDefault(); execCommand('bold'); break;
          case 'i': e.preventDefault(); execCommand('italic'); break;
          case 'u': e.preventDefault(); execCommand('underline'); break;
        }
      }
    });

    // Placeholder
    _editor.addEventListener('focus', () => {
      if (_editor.textContent.trim() === '') {
        _editor.innerHTML = '';
      }
    });

    _editor.addEventListener('blur', () => {
      if (_editor.textContent.trim() === '') {
        _editor.innerHTML = '';
      }
    });

    return {
      getContent: () => _editor.innerHTML,
      setContent: (html) => { _editor.innerHTML = html; markSaved(); },
      getText: () => _editor.textContent,
      isUnsaved: () => _unsaved,
      markSaved,
      focus: () => _editor.focus(),
      destroy: () => { _editor = null; _toolbar = null; }
    };
  }

  return { create };
})();
