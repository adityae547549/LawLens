/**
 * LawLens Studio — Knowledge Graph Module
 * Interactive visual graph editor with canvas rendering
 */

Studio.Modules.register('graph', () => {
  let _graphData = { nodes: [], edges: [] };
  let _canvas = null;
  let _ctx = null;
  let _zoom = 1;
  let _pan = { x: 0, y: 0 };
  let _dragging = null;
  let _selectedNode = null;
  let _hoveredNode = null;
  let _searchQuery = '';
  let _nodePositions = {};
  let _animationFrame = null;

  const NODE_COLORS = {
    constitutional_article: '#6366f1',
    statutory_provision: '#22c55e',
    landmark_case: '#f59e0b',
    historical_statute: '#6b7280',
    procedural_law: '#3b82f6',
    evidence_law: '#8b5cf6',
    legal_maxim: '#06b6d4'
  };

  const NODE_WIDTH = 140;
  const NODE_HEIGHT = 50;

  async function loadGraph() {
    try {
      const res = await Studio.api('/studio/graph');
      _graphData = res.data || { nodes: [], edges: [] };
      // Assign positions if not set
      _graphData.nodes.forEach((n, i) => {
        if (!_nodePositions[n.id]) {
          const angle = (i / _graphData.nodes.length) * Math.PI * 2;
          const radius = 200 + Math.random() * 100;
          _nodePositions[n.id] = {
            x: 400 + Math.cos(angle) * radius,
            y: 300 + Math.sin(angle) * radius
          };
        }
      });
    } catch (err) {
      _graphData = { nodes: [], edges: [] };
    }
  }

  function getNodeColor(type) {
    return NODE_COLORS[type] || '#6b7280';
  }

  function drawGraph() {
    if (!_ctx || !_canvas) return;
    const ctx = _ctx;
    const w = _canvas.width;
    const h = _canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(_pan.x, _pan.y);
    ctx.scale(_zoom, _zoom);

    // Draw edges
    _graphData.edges.forEach(edge => {
      const fromPos = _nodePositions[edge.source];
      const toPos = _nodePositions[edge.target];
      if (!fromPos || !toPos) return;

      ctx.beginPath();
      ctx.moveTo(fromPos.x + NODE_WIDTH / 2, fromPos.y + NODE_HEIGHT / 2);

      // Curved edge
      const midX = (fromPos.x + toPos.x) / 2;
      const midY = (fromPos.y + toPos.y) / 2 - 30;
      ctx.quadraticCurveTo(midX, midY, toPos.x + NODE_WIDTH / 2, toPos.y + NODE_HEIGHT / 2);

      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Arrow
      const angle = Math.atan2(toPos.y + NODE_HEIGHT / 2 - midY, toPos.x + NODE_WIDTH / 2 - midX);
      const arrowX = toPos.x + NODE_WIDTH / 2 - Math.cos(angle) * 25;
      const arrowY = toPos.y + NODE_HEIGHT / 2 - Math.sin(angle) * 25;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 8 * Math.cos(angle - 0.4), arrowY - 8 * Math.sin(angle - 0.4));
      ctx.lineTo(arrowX - 8 * Math.cos(angle + 0.4), arrowY - 8 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.5)';
      ctx.fill();

      // Edge label
      if (edge.relationship) {
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText(edge.relationship, midX, midY - 5);
      }
    });

    // Draw nodes
    _graphData.nodes.forEach(node => {
      const pos = _nodePositions[node.id];
      if (!pos) return;

      const isSelected = _selectedNode?.id === node.id;
      const isHovered = _hoveredNode?.id === node.id;
      const isSearchMatch = _searchQuery && (node.title || '').toLowerCase().includes(_searchQuery.toLowerCase());
      const isDimmed = _searchQuery && !isSearchMatch;

      // Node shadow
      if (isSelected || isHovered) {
        ctx.shadowColor = getNodeColor(node.type);
        ctx.shadowBlur = 16;
      }

      // Node body
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(pos.x, pos.y, NODE_WIDTH, NODE_HEIGHT, 10);
      } else {
        // Fallback for older browsers
        const r = 10;
        ctx.moveTo(pos.x + r, pos.y);
        ctx.lineTo(pos.x + NODE_WIDTH - r, pos.y);
        ctx.arcTo(pos.x + NODE_WIDTH, pos.y, pos.x + NODE_WIDTH, pos.y + r, r);
        ctx.lineTo(pos.x + NODE_WIDTH, pos.y + NODE_HEIGHT - r);
        ctx.arcTo(pos.x + NODE_WIDTH, pos.y + NODE_HEIGHT, pos.x + NODE_WIDTH - r, pos.y + NODE_HEIGHT, r);
        ctx.lineTo(pos.x + r, pos.y + NODE_HEIGHT);
        ctx.arcTo(pos.x, pos.y + NODE_HEIGHT, pos.x, pos.y + NODE_HEIGHT - r, r);
        ctx.lineTo(pos.x, pos.y + r);
        ctx.arcTo(pos.x, pos.y, pos.x + r, pos.y, r);
      }
      ctx.fillStyle = isDimmed ? 'rgba(30, 30, 54, 0.5)' : '#1e1e36';
      ctx.fill();
      ctx.strokeStyle = isSelected ? getNodeColor(node.type) : isHovered ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Color accent bar
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y + 10);
      ctx.arcTo(pos.x, pos.y, pos.x + 10, pos.y, 10);
      ctx.lineTo(pos.x + 4, pos.y);
      ctx.lineTo(pos.x + 4, pos.y + NODE_HEIGHT);
      ctx.lineTo(pos.x, pos.y + NODE_HEIGHT);
      ctx.arcTo(pos.x, pos.y + NODE_HEIGHT, pos.x, pos.y + NODE_HEIGHT - 10, 10);
      ctx.fillStyle = getNodeColor(node.type);
      ctx.fill();

      // Title
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = isDimmed ? 'rgba(255,255,255,0.3)' : '#e8e8f0';
      ctx.textAlign = 'left';
      const title = (node.title || node.id || '').substring(0, 16);
      ctx.fillText(title, pos.x + 12, pos.y + 22);

      // Type label
      ctx.font = '9px Inter, sans-serif';
      ctx.fillStyle = isDimmed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)';
      const typeLabel = (node.type || '').replace(/_/g, ' ').substring(0, 18);
      ctx.fillText(typeLabel, pos.x + 12, pos.y + 38);
    });

    ctx.restore();
  }

  function getNodeAt(x, y) {
    const worldX = (x - _pan.x) / _zoom;
    const worldY = (y - _pan.y) / _zoom;

    for (let i = _graphData.nodes.length - 1; i >= 0; i--) {
      const node = _graphData.nodes[i];
      const pos = _nodePositions[node.id];
      if (!pos) continue;
      if (worldX >= pos.x && worldX <= pos.x + NODE_WIDTH &&
          worldY >= pos.y && worldY <= pos.y + NODE_HEIGHT) {
        return node;
      }
    }
    return null;
  }

  function renderNodePanel() {
    if (!_selectedNode) return '';
    const node = _selectedNode;
    const edges = _graphData.edges.filter(e => e.source === node.id || e.target === node.id);

    return `
      <div class="studio-section" style="position:sticky;top:0;">
        <div class="studio-section-header">
          <span class="studio-section-title">Node Details</span>
          <button class="studio-btn studio-btn-ghost studio-btn-sm" id="closeNodePanel"><i data-lucide="x" style="width:12px;height:12px;"></i></button>
        </div>
        <div class="studio-section-body">
          <div class="studio-form-group">
            <label class="studio-form-label">Title</label>
            <input class="studio-form-input" id="nodeTitle" value="${node.title || ''}">
          </div>
          <div class="studio-form-group">
            <label class="studio-form-label">ID</label>
            <input class="studio-form-input" id="nodeId" value="${node.id || ''}" disabled style="opacity:0.6;">
          </div>
          <div class="studio-form-group">
            <label class="studio-form-label">Type</label>
            <select class="studio-form-input studio-form-select" id="nodeType">
              ${Object.keys(NODE_COLORS).map(t => `<option value="${t}" ${node.type === t ? 'selected' : ''}>${t.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
          <div class="studio-form-group">
            <label class="studio-form-label">Act</label>
            <input class="studio-form-input" id="nodeAct" value="${node.act || ''}">
          </div>
          <div style="display:flex;gap:6px;margin-top:12px;">
            ${Studio.UI.btn('Save', { icon: 'check', variant: 'primary', size: 'sm', id: 'saveNodeBtn' })}
            ${Studio.UI.btn('Delete', { icon: 'trash-2', variant: 'danger', size: 'sm', id: 'deleteNodeBtn' })}
          </div>
          <div style="margin-top:16px;">
            <div class="studio-form-label">Connections (${edges.length})</div>
            ${edges.length === 0 ? '<div style="font-size:0.8rem;color:var(--text-tertiary);margin-top:4px;">No connections</div>' :
              edges.map(e => {
                const other = e.source === node.id ? e.target : e.source;
                return `<div style="display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid var(--border-light);font-size:0.8rem;">
                  <span style="color:var(--text-tertiary);">${e.source === node.id ? '→' : '←'}</span>
                  <span style="color:var(--text-primary);">${other}</span>
                  <span style="color:var(--text-tertiary);font-size:0.72rem;">${e.relationship}</span>
                </div>`;
              }).join('')}
          </div>
        </div>
      </div>`;
  }

  function renderLegend() {
    return `
      <div style="display:flex;gap:12px;flex-wrap:wrap;padding:12px;background:var(--bg-tertiary);border-radius:8px;">
        ${Object.entries(NODE_COLORS).map(([type, color]) => `
          <div style="display:flex;align-items:center;gap:5px;font-size:0.72rem;color:var(--text-secondary);">
            <div style="width:10px;height:10px;border-radius:3px;background:${color};"></div>
            ${type.replace(/_/g, ' ')}
          </div>`).join('')}
      </div>`;
  }

  return {
    async render() {
      await loadGraph();

      return `
        <div class="studio-module-header">
          <div>
            <h1 class="studio-module-title">Knowledge Graph</h1>
            <p class="studio-module-subtitle">${_graphData.nodes.length} nodes, ${_graphData.edges.length} relationships</p>
          </div>
          <div class="studio-module-actions">
            <div style="position:relative;">
              <i data-lucide="search" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--text-tertiary);"></i>
              <input class="studio-form-input" id="graphSearch" placeholder="Search nodes..." style="padding-left:28px;width:200px;padding:6px 10px 6px 28px;font-size:0.82rem;">
            </div>
            ${Studio.UI.btn('Add Node', { icon: 'plus', variant: 'primary', id: 'addNodeBtn' })}
            ${Studio.UI.btn('Fit View', { icon: 'maximize-2', id: 'fitViewBtn' })}
          </div>
        </div>
        ${renderLegend()}
        <div style="display:grid;grid-template-columns:1fr 280px;gap:16px;margin-top:16px;">
          <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;overflow:hidden;position:relative;">
            <canvas id="graphCanvas" style="width:100%;height:500px;cursor:grab;"></canvas>
            <div style="position:absolute;bottom:12px;left:12px;display:flex;gap:4px;">
              <button class="studio-btn studio-btn-secondary studio-btn-sm" id="zoomIn"><i data-lucide="plus" style="width:12px;height:12px;"></i></button>
              <button class="studio-btn studio-btn-secondary studio-btn-sm" id="zoomOut"><i data-lucide="minus" style="width:12px;height:12px;"></i></button>
              <span style="font-size:0.7rem;color:var(--text-tertiary);padding:4px 8px;background:var(--bg-tertiary);border-radius:6px;" id="zoomLevel">100%</span>
            </div>
          </div>
          <div id="nodePanel">${renderNodePanel()}</div>
        </div>`;
    },

    mount() {
      _canvas = document.getElementById('graphCanvas');
      if (!_canvas) return;
      _ctx = _canvas.getContext('2d');

      // Set canvas size
      const resize = () => {
        const rect = _canvas.parentElement.getBoundingClientRect();
        _canvas.width = rect.width * window.devicePixelRatio;
        _canvas.height = 500 * window.devicePixelRatio;
        _canvas.style.width = rect.width + 'px';
        _canvas.style.height = '500px';
        _ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        drawGraph();
      };
      resize();
      window.addEventListener('resize', resize);

      // Mouse events
      let isPanning = false;
      let lastMouse = { x: 0, y: 0 };

      _canvas.addEventListener('mousedown', (e) => {
        const rect = _canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const node = getNodeAt(x, y);

        if (node) {
          _dragging = node;
          _selectedNode = node;
          _canvas.style.cursor = 'grabbing';
          this._refreshPanel();
        } else {
          isPanning = true;
          _canvas.style.cursor = 'grabbing';
        }
        lastMouse = { x: e.clientX, y: e.clientY };
      });

      _canvas.addEventListener('mousemove', (e) => {
        const rect = _canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (_dragging) {
          const pos = _nodePositions[_dragging.id];
          if (pos) {
            pos.x += (e.clientX - lastMouse.x) / _zoom;
            pos.y += (e.clientY - lastMouse.y) / _zoom;
            drawGraph();
          }
        } else if (isPanning) {
          _pan.x += e.clientX - lastMouse.x;
          _pan.y += e.clientY - lastMouse.y;
          drawGraph();
        } else {
          const node = getNodeAt(x, y);
          if (node !== _hoveredNode) {
            _hoveredNode = node;
            _canvas.style.cursor = node ? 'pointer' : 'grab';
            drawGraph();
          }
        }
        lastMouse = { x: e.clientX, y: e.clientY };
      });

      _canvas.addEventListener('mouseup', () => {
        _dragging = null;
        isPanning = false;
        _canvas.style.cursor = 'grab';
      });

      _canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        _zoom = Math.max(0.2, Math.min(3, _zoom * delta));
        const zoomEl = document.getElementById('zoomLevel');
        if (zoomEl) zoomEl.textContent = Math.round(_zoom * 100) + '%';
        drawGraph();
      });

      // Zoom buttons
      document.getElementById('zoomIn')?.addEventListener('click', () => {
        _zoom = Math.min(3, _zoom * 1.2);
        document.getElementById('zoomLevel').textContent = Math.round(_zoom * 100) + '%';
        drawGraph();
      });
      document.getElementById('zoomOut')?.addEventListener('click', () => {
        _zoom = Math.max(0.2, _zoom * 0.8);
        document.getElementById('zoomLevel').textContent = Math.round(_zoom * 100) + '%';
        drawGraph();
      });

      // Fit view
      document.getElementById('fitViewBtn')?.addEventListener('click', () => {
        if (_graphData.nodes.length === 0) return;
        _zoom = 0.8;
        _pan = { x: 50, y: 50 };
        drawGraph();
      });

      // Search
      document.getElementById('graphSearch')?.addEventListener('input', (e) => {
        _searchQuery = e.target.value;
        drawGraph();
      });

      // Add node
      document.getElementById('addNodeBtn')?.addEventListener('click', () => {
        Studio.Modal.show({
          title: 'Add Graph Node',
          body: `
            <div class="studio-form-group">
              <label class="studio-form-label">Title *</label>
              <input class="studio-form-input" id="newNodeTitle" placeholder="e.g., Article 21">
            </div>
            <div class="studio-form-group">
              <label class="studio-form-label">Type</label>
              <select class="studio-form-input studio-form-select" id="newNodeType">
                ${Object.keys(NODE_COLORS).map(t => `<option value="${t}">${t.replace(/_/g, ' ')}</option>`).join('')}
              </select>
            </div>
            <div class="studio-form-group">
              <label class="studio-form-label">Act</label>
              <input class="studio-form-input" id="newNodeAct" placeholder="e.g., Constitution of India">
            </div>`,
          footer: `
            <button class="studio-btn studio-btn-secondary" onclick="Studio.Modal.hide()">Cancel</button>
            <button class="studio-btn studio-btn-primary" id="saveNewNode">Add Node</button>`
        });

        document.getElementById('saveNewNode')?.addEventListener('click', async () => {
          const title = document.getElementById('newNodeTitle')?.value;
          if (!title) { Studio.Toast.error('Title required'); return; }
          try {
            const res = await Studio.api('/studio/graph/nodes', {
              method: 'POST',
              body: {
                title,
                type: document.getElementById('newNodeType')?.value,
                act: document.getElementById('newNodeAct')?.value
              }
            });
            const node = res.data;
            _graphData.nodes.push(node);
            _nodePositions[node.id] = {
              x: 300 + Math.random() * 200,
              y: 200 + Math.random() * 200
            };
            Studio.Modal.hide();
            Studio.Toast.success('Node added');
            drawGraph();
          } catch (err) {
            Studio.Toast.error(err.message);
          }
        });
      });

      // Node panel buttons
      this._bindPanelEvents();
      drawGraph();
    },

    unmount() {
      _canvas = null;
      _ctx = null;
      _selectedNode = null;
      _hoveredNode = null;
      if (_animationFrame) cancelAnimationFrame(_animationFrame);
    },

    _refreshPanel() {
      const panel = document.getElementById('nodePanel');
      if (panel) {
        panel.innerHTML = renderNodePanel();
        if (window.lucide) lucide.createIcons();
        this._bindPanelEvents();
      }
    },

    _bindPanelEvents() {
      document.getElementById('closeNodePanel')?.addEventListener('click', () => {
        _selectedNode = null;
        this._refreshPanel();
        drawGraph();
      });

      document.getElementById('saveNodeBtn')?.addEventListener('click', async () => {
        if (!_selectedNode) return;
        try {
          await Studio.api(`/studio/graph/nodes/${_selectedNode.id}`, {
            method: 'PUT',
            body: {
              title: document.getElementById('nodeTitle')?.value,
              type: document.getElementById('nodeType')?.value,
              act: document.getElementById('nodeAct')?.value
            }
          });
          // Update local data
          const node = _graphData.nodes.find(n => n.id === _selectedNode.id);
          if (node) {
            node.title = document.getElementById('nodeTitle')?.value;
            node.type = document.getElementById('nodeType')?.value;
            node.act = document.getElementById('nodeAct')?.value;
          }
          Studio.Toast.success('Node updated');
          drawGraph();
        } catch (err) {
          Studio.Toast.error(err.message);
        }
      });

      document.getElementById('deleteNodeBtn')?.addEventListener('click', async () => {
        if (!_selectedNode) return;
        Studio.Modal.confirm('Delete Node', `Delete "${_selectedNode.title}" and all its connections?`, async () => {
          try {
            await Studio.api(`/studio/graph/nodes/${_selectedNode.id}`, { method: 'DELETE' });
            _graphData.nodes = _graphData.nodes.filter(n => n.id !== _selectedNode.id);
            _graphData.edges = _graphData.edges.filter(e => e.source !== _selectedNode.id && e.target !== _selectedNode.id);
            delete _nodePositions[_selectedNode.id];
            _selectedNode = null;
            this._refreshPanel();
            Studio.Toast.success('Node deleted');
            drawGraph();
          } catch (err) {
            Studio.Toast.error(err.message);
          }
        });
      });
    }
  };
});
