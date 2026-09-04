document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.chat-page')) return;

  if (!Utils.isAuthenticated()) {
    window.location.href = './login.html';
    return;
  }

  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');

  LawLens.state.currentConversationId = null;

  loadConversations();

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', handleSendMessage);
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
    });
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  }

  initSuggestionBtns();
  initExplainLevel();
  initModeToggle();
  initLanguageSelector();
  initPrefill();
  initActiveDocument();
  initMemoryToggle();
  initChatUpload();
});

function initActiveDocument() {
  const activeDocId = localStorage.getItem('lawlense_active_doc');
  const activeDocName = localStorage.getItem('lawlense_active_doc_name');
  const bar = document.getElementById('activeDocBar');
  const nameEl = document.getElementById('activeDocName');

  if (activeDocId && bar && nameEl) {
    bar.style.display = 'flex';
    nameEl.textContent = activeDocName || 'Document';
  }
}

function clearActiveDoc() {
  localStorage.removeItem('lawlense_active_doc');
  localStorage.removeItem('lawlense_active_doc_name');
  const bar = document.getElementById('activeDocBar');
  if (bar) bar.style.display = 'none';
}

function getSelectedLevel() {
  const el = document.getElementById('explainLevel');
  return el ? el.value : 'general';
}

function getSelectedMode() {
  const el = document.getElementById('searchMode');
  return el ? el.value : 'legal';
}

function getSelectedLanguage() {
  const el = document.getElementById('responseLanguage');
  return el ? el.value : 'auto';
}

function initExplainLevel() {
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.level-btn').forEach(b => {
        b.style.background = 'transparent';
        b.style.color = 'var(--text-secondary)';
        b.style.borderColor = 'var(--border-color)';
      });
      btn.style.background = 'var(--accent-glow)';
      btn.style.color = 'var(--accent-primary)';
      btn.style.borderColor = 'var(--accent-primary)';
      const levelInput = document.getElementById('explainLevel');
      if (levelInput) levelInput.value = btn.dataset.level;
    });
  });
}

function initModeToggle() {
  const modeDescriptions = {
    'legal': '🏛️ Legal — Answers from your trusted legal database only',
    'web': '🌐 Web — Searches the internet for recent updates, news, and cases',
    'hybrid': '⚖️ Hybrid — Combines your legal database with live web results',
    'general': '🧠 General — AI answers from its own knowledge (no document retrieval)'
  };

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => {
        b.style.background = 'transparent';
        b.style.color = 'var(--text-secondary)';
        b.style.borderColor = 'var(--border-color)';
      });
      btn.style.background = 'var(--accent-glow)';
      btn.style.color = 'var(--accent-primary)';
      btn.style.borderColor = 'var(--accent-primary)';
      const modeInput = document.getElementById('searchMode');
      const modeDesc = document.getElementById('modeDesc');
      if (modeInput) modeInput.value = btn.dataset.mode;
      if (modeDesc) modeDesc.textContent = modeDescriptions[btn.dataset.mode] || modeDescriptions.legal;
    });
  });
}

function initLanguageSelector() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const langInput = document.getElementById('responseLanguage');
      if (langInput) langInput.value = btn.dataset.lang;
    });
  });
}

function initMemoryToggle() {
  const btn = document.getElementById('memoryToggleBtn');
  if (!btn) return;
  const stored = localStorage.getItem('lawlense_use_memory');
  const enabled = stored !== 'false';
  btn.style.borderColor = enabled ? 'var(--accent-primary)' : 'var(--border-color)';
  btn.style.background = enabled ? 'var(--accent-glow)' : 'transparent';
  btn.style.color = enabled ? 'var(--accent-primary)' : 'var(--text-tertiary)';
  btn.title = enabled ? '🧠 Memory ON — AI remembers past conversations' : 'Memory OFF';
  btn.addEventListener('click', () => {
    const current = localStorage.getItem('lawlense_use_memory') !== 'false';
    localStorage.setItem('lawlense_use_memory', String(!current));
    btn.style.borderColor = !current ? 'var(--accent-primary)' : 'var(--border-color)';
    btn.style.background = !current ? 'var(--accent-glow)' : 'transparent';
    btn.style.color = !current ? 'var(--accent-primary)' : 'var(--text-tertiary)';
    btn.title = !current ? '🧠 Memory ON — AI remembers past conversations' : 'Memory OFF';
    Utils.showToast(!current ? '🧠 Memory enabled — AI will recall past conversations' : 'Memory disabled', 'info');
  });
}

function initChatUpload() {
  const uploadBtn = document.getElementById('chatUploadBtn');
  const fileInput = document.getElementById('chatFileInput');
  const statusEl = document.getElementById('chatUploadStatus');
  if (!uploadBtn || !fileInput) return;

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      Utils.showToast('File too large. Maximum size is 10MB.', 'error');
      fileInput.value = '';
      return;
    }

    statusEl.style.display = 'block';
    statusEl.textContent = '📤 Uploading ' + file.name + '...';
    uploadBtn.style.opacity = '0.5';

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('temporary', 'true');

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: Utils.getToken() ? { 'Authorization': 'Bearer ' + Utils.getToken() } : {},
        body: formData
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }

      const data = await response.json();

      localStorage.setItem('lawlense_active_doc', data.document.fileId);
      localStorage.setItem('lawlense_active_doc_name', data.document.originalName);

      const bar = document.getElementById('activeDocBar');
      const nameEl = document.getElementById('activeDocName');
      if (bar && nameEl) {
        bar.style.display = 'flex';
        nameEl.textContent = data.document.originalName;
      }

      statusEl.textContent = '✅ ' + data.document.originalName + ' indexed (' + data.document.chunkCount + ' chunks)';
      setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
      Utils.showToast('📄 Document uploaded and ready for chat', 'success');
    } catch (err) {
      statusEl.textContent = '❌ ' + (err.message || 'Upload failed');
      setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
      Utils.showToast(err.message || 'Failed to upload document', 'error');
    } finally {
      uploadBtn.style.opacity = '1';
      fileInput.value = '';
    }
  });
}

function initPrefill() {
  const params = new URLSearchParams(window.location.search);
  const convParam = params.get('conv');
  if (convParam) {
    setTimeout(() => loadConversation(convParam), 300);
    window.history.replaceState({}, '', window.location.pathname);
    return;
  }
  const queryParam = params.get('q');
  if (queryParam) {
    const input = document.getElementById('chatInput');
    const welcome = document.querySelector('.chat-welcome');
    if (input) {
      input.value = decodeURIComponent(queryParam);
      input.dispatchEvent(new Event('input'));
      input.focus();
    }
    if (welcome) {
      setTimeout(() => {
        const form = document.getElementById('chatForm');
        if (form) form.dispatchEvent(new Event('submit'));
      }, 800);
    }
    // Clean URL without reloading
    window.history.replaceState({}, '', window.location.pathname);
    return;
  }

  const prefill = localStorage.getItem('lawlense_chat_prefill');
  if (prefill) {
    localStorage.removeItem('lawlense_chat_prefill');
    const input = document.getElementById('chatInput');
    const welcome = document.querySelector('.chat-welcome');
    if (input) {
      input.value = prefill;
      input.dispatchEvent(new Event('input'));
      input.focus();
    }
    if (welcome) {
      setTimeout(() => {
        const form = document.getElementById('chatForm');
        if (form) form.dispatchEvent(new Event('submit'));
      }, 500);
    }
  }
}

async function handleSendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  const messages = document.getElementById('chatMessages');
  const welcome = document.querySelector('.chat-welcome');

  if (!message || input.disabled) return;

  if (welcome) welcome.style.display = 'none';

  appendMessage('user', message);
  input.value = '';
  input.style.height = 'auto';
  input.disabled = true;

  const statusEl = showStatusIndicator('Preparing search...');
  const typingEl = showTypingIndicator();

  try {
    await streamChat(message, typingEl, statusEl);
    const convList = document.getElementById('conversationList');
    if (convList) loadConversations();
  } catch (err) {
    typingEl.remove();
    statusEl.remove();
    appendMessage('assistant', 'Error: ' + (err.message || 'Failed to get response'));
  } finally {
    input.disabled = false;
    input.focus();
  }
}

async function streamChat(message, typingEl, statusEl) {
  const level = getSelectedLevel();
  const mode = getSelectedMode();
  const language = getSelectedLanguage();
  const useMemory = localStorage.getItem('lawlense_use_memory') !== 'false';

  const statusMessages = {
    'legal': '🔍 Searching legal database...',
    'web': '🌐 Searching the web...',
    'hybrid': '⚖️ Searching legal database + web...',
    'general': '🧠 Thinking from AI knowledge...'
  };
  updateStatus(statusEl, statusMessages[mode] || statusMessages.legal);

  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(Utils.getToken() ? { 'Authorization': `Bearer ${Utils.getToken()}` } : {})
    },
    body: JSON.stringify({ message, conversationId: LawLens.state.currentConversationId, level, mode, language, fileId: localStorage.getItem('lawlense_active_doc') || undefined, useMemory })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  const msgDiv = createStreamMessage();
  typingEl.remove();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') break;

      try {
        const parsed = JSON.parse(data);

        if (parsed.type === 'status') {
          updateStatus(statusEl, parsed.message);
        } else if (parsed.type === 'content') {
          fullContent += parsed.content;
          updateStreamMessage(msgDiv, fullContent);
        } else if (parsed.type === 'done') {
          statusEl.remove();
          LawLens.state.currentConversationId = parsed.conversationId;
          finalizeMessage(msgDiv, fullContent, parsed.citations || [], parsed.confidence || 0, parsed.confidenceLabel || '', parsed.memoryUsed, parsed.citationCheck);
        } else if (parsed.type === 'error') {
          statusEl.remove();
          updateStreamMessage(msgDiv, parsed.message || 'An error occurred');
        }
      } catch {}
    }
  }
}

function createStreamMessage() {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'message assistant';
  div.innerHTML = `
    <div class="message-avatar">L</div>
    <div class="message-content">
      <div class="message-bubble"></div>
      <div class="message-citations"></div>
      <div class="message-confidence"></div>
      <div class="message-actions">
        <button onclick="thumbsFeedback(this, 'up')" title="Helpful" style="font-size:1rem;opacity:0.5;">👍</button>
        <button onclick="thumbsFeedback(this, 'down')" title="Not helpful" style="font-size:1rem;opacity:0.5;">👎</button>
        <button onclick="studyThisMessage(this)" title="Study This" style="font-size:1rem;opacity:0.5;">📚</button>
        <button onclick="copyMessage(this)" title="Copy">📋 Copy</button>
        <button onclick="downloadMessage(this)" title="Download PDF">📄 PDF</button>
        <button onclick="shareMessage(this)" title="Share">🔗 Share</button>
        <button onclick="reportMessage(this)" title="Report incorrect answer" style="color:var(--text-tertiary);">⚠️ Report</button>
      </div>
    </div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function updateStreamMessage(msgDiv, content) {
  const bubble = msgDiv.querySelector('.message-bubble');
  if (bubble) bubble.innerHTML = formatMessage(content);
  const messages = document.getElementById('chatMessages');
  messages.scrollTop = messages.scrollHeight;
}

function finalizeMessage(msgDiv, content, citations, confidence, confidenceLabel, memoryUsed, citationCheck) {
  const bubble = msgDiv.querySelector('.message-bubble');
  const citationsEl = msgDiv.querySelector('.message-citations');
  const confidenceEl = msgDiv.querySelector('.message-confidence');

  if (memoryUsed) {
    msgDiv.dataset.memoryUsed = 'true';
    const actionsEl = msgDiv.querySelector('.message-actions');
    if (actionsEl) {
      const badge = document.createElement('span');
      badge.className = 'memory-badge';
      badge.textContent = '🧠 Memory';
      badge.title = 'AI used context from your past conversations';
      badge.style.cssText = 'font-size:0.65rem;padding:0.15rem 0.5rem;border-radius:999px;background:var(--accent-glow);color:var(--accent-primary);margin-left:0.5rem;';
      actionsEl.parentNode?.insertBefore(badge, actionsEl.nextSibling);
    }
  }

  if (bubble) bubble.innerHTML = formatMessage(content);

  if (citationsEl && citations.length > 0) {
    const localCitations = citations.filter(c => c.type === 'local' || !c.type);
    const webCitations = citations.filter(c => c.type === 'web');

    let html = '<div class="message-sources">';

    if (localCitations.length > 0) {
      html += '<div style="margin-bottom:0.4rem;"><span style="font-size:0.7rem;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">📚 Legal Documents</span></div>';
      html += localCitations.map(c => {
        const badge = c.badge || '📄';
        const trustLabel = c.trustLabel || 'Legal Document';
        const trustColor = c.trust === 'high' ? 'var(--success)' : c.trust === 'medium' ? 'var(--warning)' : 'var(--text-tertiary)';
        return `
        <span class="source-chip source-chip-local" data-view-source="${Utils.escapeHtml(c.articleId || c.name || '')}" title="${Utils.escapeHtml(c.text || '')}">
          ${badge} ${Utils.escapeHtml(c.fileName || 'Document')}
          <span style="font-size:0.6rem;color:${trustColor};margin-left:4px;">${Utils.escapeHtml(trustLabel)}</span>
          ${c.confidence ? `<span style="font-size:0.65rem;opacity:0.7;margin-left:4px;">${Utils.escapeHtml(String(c.confidence))}%</span>` : ''}
        </span>
      `}).join('');
    }

    if (webCitations.length > 0) {
      html += `<div style="margin:${localCitations.length > 0 ? '0.6rem 0 0.4rem' : '0 0 0.4rem'};"><span style="font-size:0.7rem;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">🌐 Web Sources</span></div>`;
      html += webCitations.map(c => {
        const badge = c.badge || '🌐';
        const trustLabel = c.trustLabel || 'Web Source';
        const trustColor = c.trust === 'high' ? 'var(--success)' : c.trust === 'medium' ? 'var(--warning)' : 'var(--text-tertiary)';
        return `
        <span class="source-chip source-chip-web" data-open-url="${Utils.escapeHtml(c.url || c.name || '')}" role="link" tabindex="0" title="${Utils.escapeHtml(c.snippet || c.text || '')}">
          ${badge} ${Utils.escapeHtml(c.title || 'Web Source')}
          <span style="font-size:0.6rem;color:${trustColor};margin-left:4px;">${Utils.escapeHtml(trustLabel)}</span>
        </span>
      `}).join('');
    }

    html += '</div>';
    citationsEl.innerHTML = html;
  }

  if (confidenceEl) {
    const cappedConfidence = Math.min(confidence, 100);
    const color = cappedConfidence >= 70 ? 'var(--success)' : cappedConfidence >= 40 ? 'var(--warning)' : 'var(--error)';
    const label = confidenceLabel || (cappedConfidence >= 70 ? '🟢 High' : cappedConfidence >= 40 ? '⚖️ Medium' : '⚠️ Low');
    const verified = citationCheck?.verified?.length || 0;
    const unverified = citationCheck?.unverified?.length || 0;
    const totalCited = citationCheck?.total || 0;
    const coverageLabel = totalCited > 0
      ? `${verified}/${totalCited} citations verified`
      : 'No citations in answer';

    confidenceEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;flex-wrap:wrap;">
        <div style="height:4px;width:80px;background:var(--bg-tertiary);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${cappedConfidence}%;background:${color};border-radius:2px;"></div>
        </div>
        <span style="font-size:0.75rem;color:var(--text-tertiary);">Confidence: ${cappedConfidence}% — ${label}</span>
        ${totalCited > 0 ? `<span style="font-size:0.7rem;color:${unverified > 0 ? 'var(--warning)' : 'var(--success)'};border-left:1px solid var(--border-color);padding-left:0.5rem;">✓ ${coverageLabel}</span>` : ''}
        <span style="font-size:0.7rem;color:var(--text-tertiary);border-left:1px solid var(--border-color);padding-left:0.5rem;">${citations.length} source${citations.length !== 1 ? 's' : ''}</span>
      </div>
    `;
  }

  // Add follow-up suggestion chips
  const suggestions = generateFollowUpSuggestions(content, citations);
  if (suggestions.length > 0) {
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'message-suggestions';
    suggestionsDiv.style.cssText = 'display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.75rem;';
    suggestions.forEach(s => {
      const chip = document.createElement('button');
      chip.className = 'followup-chip';
      chip.textContent = '💡 ' + s;
      chip.style.cssText = 'padding:0.3rem 0.7rem;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:999px;font-size:0.8rem;cursor:pointer;color:var(--text-secondary);transition:all 0.2s;';
      chip.addEventListener('mouseenter', () => { chip.style.borderColor = 'var(--accent-primary)'; chip.style.color = 'var(--accent-primary)'; });
      chip.addEventListener('mouseleave', () => { chip.style.borderColor = 'var(--border-color)'; chip.style.color = 'var(--text-secondary)'; });
      chip.addEventListener('click', () => {
        const input = document.getElementById('chatInput');
        if (input) { input.value = s; input.dispatchEvent(new Event('input')); input.focus(); }
      });
      suggestionsDiv.appendChild(chip);
    });
    msgDiv.querySelector('.message-content').appendChild(suggestionsDiv);
  }

  msgDiv.dataset.content = content;
  msgDiv.dataset.citations = JSON.stringify(citations);
}

function appendMessage(role, content, citations = [], confidence = 0) {
  const messages = document.getElementById('chatMessages');
  if (!messages) return;

  const div = document.createElement('div');
  div.className = `message ${role}`;

  const avatar = role === 'user' ? 'You' : 'L';

  const citationsHtml = citations && citations.length > 0
    ? `<div class="message-sources">
        ${citations.map(c => {
          const badge = c.badge || '📄';
          const trustLabel = c.trustLabel || '';
          const trustColor = c.trust === 'high' ? 'var(--success)' : c.trust === 'medium' ? 'var(--warning)' : 'var(--text-tertiary)';
          if (c.type === 'web') {
            return `<span class="source-chip source-chip-web" data-open-url="${Utils.escapeHtml(c.url || '')}" role="link" tabindex="0">${badge} ${Utils.escapeHtml(c.title || c.fileName || 'Web Source')} ${trustLabel ? `<span style="font-size:0.6rem;color:${trustColor};margin-left:4px;">${Utils.escapeHtml(trustLabel)}</span>` : ''}</span>`;
          }
          return `<span class="source-chip source-chip-local" data-view-source="${Utils.escapeHtml(c.articleId || c.name || '')}">${badge} ${Utils.escapeHtml(c.fileName || 'Document')} ${trustLabel ? `<span style="font-size:0.6rem;color:${trustColor};margin-left:4px;">${Utils.escapeHtml(trustLabel)}</span>` : ''}</span>`;
        }).join('')}
       </div>`
    : '';

  const confidenceHtml = role === 'assistant' && confidence > 0
    ? `<div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;">
        <div style="height:4px;width:80px;background:var(--bg-tertiary);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${Math.min(confidence, 100)}%;background:${Math.min(confidence, 100) >= 70 ? 'var(--success)' : Math.min(confidence, 100) >= 40 ? 'var(--warning)' : 'var(--error)'};border-radius:2px;"></div>
        </div>
        <span style="font-size:0.75rem;color:var(--text-tertiary);">Confidence: ${Math.min(confidence, 100)}% — ${Math.min(confidence, 100) >= 70 ? '🟢 High' : Math.min(confidence, 100) >= 40 ? '⚖️ Medium' : '⚠️ Low'}</span>
       </div>`
    : '';

  const actionsHtml = role === 'assistant'
    ? `<div class="message-actions">
        <button onclick="thumbsFeedback(this, 'up')" title="Helpful" style="font-size:1rem;opacity:0.5;">👍</button>
        <button onclick="thumbsFeedback(this, 'down')" title="Not helpful" style="font-size:1rem;opacity:0.5;">👎</button>
        <button onclick="copyMessage(this)" title="Copy">📋 Copy</button>
        <button onclick="downloadMessage(this)" title="Download PDF">📄 PDF</button>
        <button onclick="shareMessage(this)" title="Share">🔗 Share</button>
        <button onclick="reportMessage(this)" title="Report incorrect answer" style="color:var(--text-tertiary);">⚠️ Report</button>
       </div>`
    : '';

  div.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      <div class="message-bubble">${formatMessage(content)}</div>
      ${citationsHtml}
      ${confidenceHtml}
      ${actionsHtml}
    </div>
  `;

  div.dataset.content = content;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function showStatusIndicator(text) {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'status-indicator';
  div.style.cssText = 'display:flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;font-size:0.85rem;color:var(--accent-primary);animation:fadeIn 0.3s;max-width:800px;margin:0 auto;width:100%;';
  div.innerHTML = `<div class="loading-spinner" style="width:14px;height:14px;"></div> <span>${text}</span>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function updateStatus(el, text) {
  if (el) {
    const span = el.querySelector('span');
    if (span) span.textContent = text;
  }
}

function showTypingIndicator() {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'typing-indicator';
  div.innerHTML = `
    <div class="message-avatar">L</div>
    <div class="message-content">
      <div class="message-bubble"><span></span><span></span><span></span></div>
    </div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function formatMessage(text) {
  if (!text) return '';
  const escaped = Utils.escapeHtml(text);
  return escaped
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^(📖.*ORIGINAL.*)$/gm, '<div style="font-weight:700;color:var(--accent-primary);margin-top:1rem;margin-bottom:0.3rem;font-size:0.95rem;">$1</div>')
    .replace(/^(💡.*SIMPLE.*)$/gm, '<div style="font-weight:700;color:var(--accent-primary);margin-top:1rem;margin-bottom:0.3rem;font-size:0.95rem;">$1</div>')
    .replace(/^(⚖.*MATTERS.*)$/gm, '<div style="font-weight:700;color:var(--accent-primary);margin-top:1rem;margin-bottom:0.3rem;font-size:0.95rem;">$1</div>')
    .replace(/^(📚.*KEY.*)$/gm, '<div style="font-weight:700;color:var(--accent-primary);margin-top:1rem;margin-bottom:0.3rem;font-size:0.95rem;">$1</div>')
    .replace(/^(🔗.*RELATED.*)$/gm, '<div style="font-weight:700;color:var(--accent-primary);margin-top:1rem;margin-bottom:0.3rem;font-size:0.95rem;">$1</div>')
    .replace(/^(⚠.*IMPORTANT.*)$/gm, '<div style="font-weight:700;color:var(--warning);margin-top:1rem;margin-bottom:0.3rem;font-size:0.95rem;">$1</div>')
    .replace(/^(📚.*SOURCES.*)$/gm, '<div style="font-weight:700;color:var(--accent-primary);margin-top:1rem;margin-bottom:0.3rem;font-size:0.95rem;">$1</div>')
    .replace(/^(Title:.*)$/gm, '<div style="font-weight:700;font-size:1.05rem;margin-bottom:0.5rem;">$1</div>')
    .replace(/^(>-\s.*)$/gm, '<div style="border-left:3px solid var(--accent-primary);padding-left:0.75rem;margin:0.5rem 0;color:var(--text-secondary);font-style:italic;">$1</div>')
    .replace(/\[Web Source (\d+): ([^\]]+)\]/g, '<span class="source-chip source-chip-inline source-chip-web" data-source-type="web" data-source-num="$1" role="button" tabindex="0">🌐 $2</span>')
    .replace(/\[Source (\d+): ([^\]]+)\]/g, '<span class="source-chip source-chip-inline source-chip-local" data-source-type="local" data-source-num="$1" role="button" tabindex="0">📄 $2</span>')
    .replace(/\[Source (\d+)\]/g, '<span class="source-chip source-chip-inline source-chip-local" data-source-type="local" data-source-num="$1" role="button" tabindex="0">📄 Source $1</span>')
    .replace(/\[Web Source (\d+)\]/g, '<span class="source-chip source-chip-inline source-chip-web" data-source-type="web" data-source-num="$1" role="button" tabindex="0">🌐 Web Source $1</span>');
}

function initSuggestionBtns() {
  document.querySelectorAll('.chat-suggestion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById('chatInput');
      if (input) {
        input.value = btn.dataset.query || btn.textContent.trim();
        input.dispatchEvent(new Event('input'));
        input.focus();
      }
    });
  });
}

async function loadConversations() {
  const list = document.getElementById('conversationList');
  if (!list || !Utils.isAuthenticated()) {
    if (list) list.innerHTML = '<div style="padding:1rem;color:var(--text-tertiary);font-size:0.85rem;text-align:center;">Login to save conversations</div>';
    return;
  }

  try {
    const data = await Utils.api('/chat/conversations');
    LawLens.state.conversations = data.conversations || [];
    renderConversations();
  } catch (err) {
    list.innerHTML = '<div style="padding:1rem;color:var(--text-tertiary);font-size:0.85rem;text-align:center;">No conversations yet</div>';
  }
}

function renderConversations() {
  const list = document.getElementById('conversationList');
  if (!list) return;

  if (LawLens.state.conversations.length === 0) {
    list.innerHTML = '<div style="padding:1rem;color:var(--text-tertiary);font-size:0.85rem;text-align:center;">No conversations yet</div>';
    return;
  }

  list.innerHTML = LawLens.state.conversations.map(c => `
    <div class="conversation-item ${c.id === LawLens.state.currentConversationId ? 'active' : ''}"
         onclick="loadConversation('${c.id}')">
      <span class="conv-icon">💬</span>
      <span class="conv-title">${Utils.escapeHtml(c.title)}</span>
    </div>
  `).join('');
}

async function loadConversation(id) {
  try {
    const data = await Utils.api(`/chat/conversations/${id}`);
    const messages = document.getElementById('chatMessages');
    const welcome = document.querySelector('.chat-welcome');

    if (welcome) welcome.style.display = 'none';
    if (messages) messages.innerHTML = '';

    LawLens.state.currentConversationId = id;

    if (data.conversation && data.conversation.messages) {
      for (const msg of data.conversation.messages) {
        appendMessage(msg.role, msg.content, msg.sources || [], msg.confidence || 0);
      }
    }

    renderConversations();
  } catch (err) {
    Utils.showToast('Failed to load conversation', 'error');
  }
}

async function deleteConversation(id) {
  if (!confirm('Delete this conversation?')) return;
  try {
    await Utils.api(`/chat/conversations/${id}`, { method: 'DELETE' });
    if (LawLens.state.currentConversationId === id) {
      LawLens.state.currentConversationId = null;
      document.getElementById('chatMessages').innerHTML = '';
      const welcome = document.querySelector('.chat-welcome');
      if (welcome) welcome.style.display = '';
    }
    loadConversations();
    Utils.showToast('Conversation deleted', 'success');
  } catch (err) {
    Utils.showToast('Failed to delete conversation', 'error');
  }
}

function newChat() {
  LawLens.state.currentConversationId = null;
  const messages = document.getElementById('chatMessages');
  if (messages) messages.innerHTML = '';
  const welcome = document.querySelector('.chat-welcome');
  if (welcome) welcome.style.display = '';
  const input = document.getElementById('chatInput');
  if (input) { input.value = ''; input.focus(); }
  renderConversations();
}

function viewSource(id) {
  if (id) window.location.href = `./article.html?id=${encodeURIComponent(id)}`;
}

function showSourcePopover(e, msgDiv) {
  const el = e.target.closest('.source-chip-inline');
  if (!el) return;

  const sourceNum = parseInt(el.dataset.sourceNum);
  const sourceType = el.dataset.sourceType;
  const citations = msgDiv.dataset.citations ? JSON.parse(msgDiv.dataset.citations) : [];
  const source = citations.find(c => {
    if (sourceType === 'web') return c.type === 'web' && citations.filter(x => x.type === 'web').indexOf(c) === sourceNum - 1;
    return (c.type === 'local' || !c.type) && citations.filter(x => x.type !== 'web').indexOf(c) === sourceNum - 1;
  });

  if (!source) return;

  const existing = document.getElementById('sourcePopover');
  if (existing) existing.remove();

  const popover = document.createElement('div');
  popover.id = 'sourcePopover';
  popover.style.cssText = 'position:fixed;z-index:9999;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:8px;padding:0.75rem;max-width:350px;box-shadow:0 4px 20px rgba(0,0,0,0.15);font-size:0.85rem;';

  const rect = el.getBoundingClientRect();
  popover.style.left = Math.min(rect.left, window.innerWidth - 370) + 'px';
  popover.style.top = (rect.bottom + 8) + 'px';

  const trustColor = source.trust === 'high' ? 'var(--success)' : source.trust === 'medium' ? 'var(--warning)' : 'var(--text-tertiary)';
  popover.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
      <span style="font-weight:600;">${Utils.escapeHtml(source.fileName || source.name || 'Source')}</span>
      <span style="font-size:0.7rem;color:${trustColor};">${Utils.escapeHtml(source.trustLabel || source.type || '')}</span>
    </div>
    <div style="color:var(--text-secondary);line-height:1.5;margin-bottom:0.5rem;">${Utils.escapeHtml((source.text || source.snippet || 'No preview available').slice(0, 400))}</div>
    <div style="display:flex;gap:0.5rem;">
      ${sourceType === 'local' && source.id ? `<button onclick="viewSource('${Utils.escapeHtml(source.id)}');this.closest('#sourcePopover').remove();" style="padding:0.25rem 0.5rem;background:var(--accent-primary);color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.75rem;">Open Source</button>` : ''}
      ${sourceType === 'web' && source.url ? `<a href="${Utils.escapeHtml(source.url)}" target="_blank" style="padding:0.25rem 0.5rem;background:var(--accent-primary);color:white;border:none;border-radius:4px;text-decoration:none;font-size:0.75rem;">Open Link</a>` : ''}
      <button onclick="this.closest('#sourcePopover').remove();" style="padding:0.25rem 0.5rem;background:var(--bg-tertiary);color:var(--text-secondary);border:none;border-radius:4px;cursor:pointer;font-size:0.75rem;">Close</button>
    </div>
  `;

  document.body.appendChild(popover);

  const closeHandler = (ev) => {
    if (!popover.contains(ev.target) && !el.contains(ev.target)) {
      popover.remove();
      document.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => document.addEventListener('click', closeHandler), 10);
}

// Delegated handler for source chips
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-view-source]');
  if (el) viewSource(el.dataset.viewSource);

  const inlineEl = e.target.closest('.source-chip-inline');
  if (inlineEl) {
    const msgDiv = inlineEl.closest('.message');
    if (msgDiv) showSourcePopover(e, msgDiv);
  }
});

function copyMessage(btn) {
  const msgDiv = btn.closest('.message');
  if (msgDiv && msgDiv.dataset.content) {
    Utils.copyToClipboard(msgDiv.dataset.content);
  }
}

function downloadMessage(btn) {
  const msgDiv = btn.closest('.message');
  if (msgDiv && msgDiv.dataset.content) {
    const citations = msgDiv.dataset.citations ? JSON.parse(msgDiv.dataset.citations) : [];
    Utils.downloadBrandedPDF(msgDiv.dataset.content, 'LawLens Answer', citations);
  }
}

function shareMessage(btn) {
  const msgDiv = btn.closest('.message');
  if (msgDiv && msgDiv.dataset.content) {
    const citations = msgDiv.dataset.citations ? JSON.parse(msgDiv.dataset.citations) : [];
    Utils.shareContent(msgDiv.dataset.content, citations);
  }
}

function reportMessage(btn) {
  const msgDiv = btn.closest('.message');
  if (msgDiv && msgDiv.dataset.content) {
    const reason = prompt('Why are you reporting this answer? (e.g., incorrect citation, hallucination, outdated information)');
    if (reason) {
      Utils.showToast('Thank you for your feedback. We will review this answer.', 'success');
      const reports = JSON.parse(localStorage.getItem('lawlense_reports') || '[]');
      reports.push({
        content: msgDiv.dataset.content.slice(0, 200),
        reason,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('lawlense_reports', JSON.stringify(reports));
    }
  }
}

function thumbsFeedback(btn, type) {
  const msgDiv = btn.closest('.message');
  if (msgDiv) {
    const feedback = JSON.parse(localStorage.getItem('lawlense_feedback') || '[]');
    feedback.push({
      content: msgDiv.dataset.content?.slice(0, 200),
      type,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('lawlense_feedback', JSON.stringify(feedback));
    btn.style.opacity = '1';
    btn.style.transform = 'scale(1.2)';
    const sibling = type === 'up' ? btn.nextElementSibling : btn.previousElementSibling;
    if (sibling) sibling.style.opacity = '0.3';
    Utils.showToast(type === 'up' ? 'Glad this helped!' : 'Thanks, we\'ll improve this.', 'success');
  }
}

function generateFollowUpSuggestions(answer, citations) {
  const suggestions = [];
  const articleMentions = (answer.match(/Article\s+\d+/gi) || []);
  const sectionMentions = (answer.match(/Section\s+\d+/gi) || []);

  if (articleMentions.length > 0) {
    suggestions.push(`What are the exceptions to ${articleMentions[0]}?`);
    if (articleMentions.length > 1) {
      suggestions.push(`Compare ${articleMentions[0]} and ${articleMentions[1]}`);
    }
  }
  if (sectionMentions.length > 0) {
    suggestions.push(`Explain ${sectionMentions[0]} with examples`);
  }
  suggestions.push('What are the recent amendments?');
  if (suggestions.length < 3) suggestions.push('Explain in simpler language');
  return suggestions.slice(0, 3);
}

function studyThisMessage(btn) {
  const msgDiv = btn.closest('.message');
  const content = msgDiv?.querySelector('.message-bubble')?.textContent || '';
  if (!content) return;
  const topic = content.split('.').slice(0, 3).join('. ').slice(0, 100);
  localStorage.setItem('lawlense_study_topic', topic);
  localStorage.setItem('lawlense_study_content', content.slice(0, 2000));
  Utils.showToast('📚 Opening Study Hub...', 'info');
  setTimeout(() => window.location.href = './study.html', 500);
}

window.loadConversation = loadConversation;
window.deleteConversation = deleteConversation;
window.newChat = newChat;
window.viewSource = viewSource;
window.copyMessage = copyMessage;
window.downloadMessage = downloadMessage;
window.shareMessage = shareMessage;
window.reportMessage = reportMessage;
window.thumbsFeedback = thumbsFeedback;
window.studyThisMessage = studyThisMessage;
