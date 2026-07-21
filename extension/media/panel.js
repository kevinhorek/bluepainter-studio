(function () {
  const vscode = acquireVsCodeApi();

  const state = {
    fileName: '',
    rootNodeId: null,
    nodesMap: {},
    selectedNodeId: null,
    rules: [],
    scores: { design: 100, accessibility: 100, buildability: 100, total: 100 },
    syncableCount: 0,
    parseError: false,
    source: '',
    mode: 'sidebar'
  };

  const els = {
    fileName: document.getElementById('bp-file-name'),
    syncCount: document.getElementById('bp-sync-count'),
    source: document.getElementById('bp-source'),
    canvas: document.getElementById('bp-canvas'),
    canvasEmpty: document.getElementById('bp-canvas-empty'),
    inspector: document.getElementById('bp-inspector'),
    inspectorEmpty: document.getElementById('bp-inspector-empty'),
    receipts: document.getElementById('bp-receipts'),
    scores: document.getElementById('bp-scores'),
    status: document.getElementById('bp-status')
  };

  function camelToKebab(key) {
    return key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  }

  function styleToCss(style) {
    if (!style) return '';
    return Object.entries(style)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => {
        const prop = camelToKebab(k);
        if (typeof v === 'number' && !['opacity', 'flexGrow', 'flexShrink', 'lineHeight', 'fontWeight', 'zIndex'].includes(k)) {
          return `${prop}:${v}px`;
        }
        return `${prop}:${v}`;
      })
      .join(';');
  }

  function renderNode(nodeId) {
    const node = state.nodesMap[nodeId];
    if (!node) return null;

    let el;
    if (node.type === 'image') {
      el = document.createElement('img');
      el.src = node.src || '';
      el.alt = node.name || node.id;
    } else {
      el = document.createElement(node.tag || 'div');
      if (node.type === 'text' || node.type === 'button') {
        el.textContent = node.text || '';
      }
    }

    el.className = 'bp-node' + (state.selectedNodeId === nodeId ? ' selected' : '');
    el.dataset.nodeId = nodeId;
    el.style.cssText = styleToCss(node.style);

    if (node.type === 'button') {
      el.style.cursor = 'pointer';
    }

    (node.children || []).forEach((childId) => {
      const childEl = renderNode(childId);
      if (childEl) el.appendChild(childEl);
    });

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      vscode.postMessage({ type: 'selectNode', nodeId });
    });

    return el;
  }

  function renderCanvas() {
    els.canvas.innerHTML = '';
    const ids = Object.keys(state.nodesMap || {});
    if (!state.rootNodeId || !ids.length) {
      els.canvasEmpty.hidden = false;
      return;
    }
    els.canvasEmpty.hidden = true;
    const rootEl = renderNode(state.rootNodeId);
    if (rootEl) els.canvas.appendChild(rootEl);
  }

  function renderScores() {
    const s = state.scores || {};
    els.scores.innerHTML = `
      <div class="bp-score-row">
        <div class="bp-score"><strong>${s.total ?? 100}</strong><span>Overall</span></div>
        <div class="bp-score"><strong>${s.design ?? 100}</strong><span>Design</span></div>
        <div class="bp-score"><strong>${s.accessibility ?? 100}</strong><span>A11y</span></div>
        <div class="bp-score"><strong>${s.buildability ?? 100}</strong><span>Build</span></div>
      </div>`;
  }

  function renderReceipts() {
    renderScores();
    if (!state.rules.length) {
      els.receipts.innerHTML = '<p class="bp-empty">Select a node with policy rules to see receipts.</p>';
      return;
    }

    els.receipts.innerHTML = state.rules.map((rule) => `
      <div class="bp-receipt ${rule.valid ? 'valid' : 'invalid'}">
        <div class="bp-receipt-head">
          <span class="bp-receipt-title">${escapeHtml(rule.title)}</span>
          <span class="bp-receipt-tag">${escapeHtml(rule.tag || '')}</span>
        </div>
        <p class="bp-receipt-desc">${escapeHtml(rule.desc || '')}</p>
        ${!rule.valid && rule.fixLabel ? `<button class="bp-btn small" data-fix-key="${escapeHtml(rule.fixKey)}" data-fix-meta='${escapeAttr(JSON.stringify(rule.fixMeta || {}))}'>${escapeHtml(rule.fixLabel)}</button>` : ''}
      </div>
    `).join('');

    els.receipts.querySelectorAll('[data-fix-key]').forEach((btn) => {
      btn.addEventListener('click', () => {
        vscode.postMessage({
          type: 'applyFix',
          fixKey: btn.dataset.fixKey,
          fixMeta: JSON.parse(btn.dataset.fixMeta || '{}')
        });
      });
    });
  }

  function renderInspector() {
    const node = state.selectedNodeId ? state.nodesMap[state.selectedNodeId] : null;
    if (!node) {
      els.inspector.hidden = true;
      els.inspectorEmpty.hidden = false;
      return;
    }

    els.inspector.hidden = false;
    els.inspectorEmpty.hidden = true;

    const style = node.style || {};
    els.inspector.innerHTML = `
      <p><strong>${escapeHtml(node.name || node.id)}</strong> <span style="opacity:0.7">(${escapeHtml(node.type)})</span></p>
      ${node.type === 'text' || node.type === 'button' ? `
        <label for="bp-text">Text</label>
        <textarea id="bp-text">${escapeHtml(node.text || '')}</textarea>
      ` : ''}
      <label for="bp-padding">Padding (px)</label>
      <input id="bp-padding" type="number" value="${style.padding ?? ''}" />
      <label for="bp-bg">Background</label>
      <input id="bp-bg" type="text" value="${escapeHtml(String(style.background || ''))}" />
      <label for="bp-radius">Border radius (px)</label>
      <input id="bp-radius" type="number" value="${style.borderRadius ?? ''}" />
      <label for="bp-left">Left (px)</label>
      <input id="bp-left" type="number" value="${style.left ?? ''}" />
      <label for="bp-top">Top (px)</label>
      <input id="bp-top" type="number" value="${style.top ?? ''}" />
      <button class="bp-btn" id="bp-apply-inspector">Apply changes</button>
    `;

    document.getElementById('bp-apply-inspector').addEventListener('click', () => {
      const patch = { style: { ...style } };
      const padding = document.getElementById('bp-padding').value;
      const bg = document.getElementById('bp-bg').value;
      const radius = document.getElementById('bp-radius').value;
      const left = document.getElementById('bp-left').value;
      const top = document.getElementById('bp-top').value;
      if (padding !== '') patch.style.padding = Number(padding);
      if (bg !== '') patch.style.background = bg;
      if (radius !== '') patch.style.borderRadius = Number(radius);
      if (left !== '') patch.style.left = Number(left);
      if (top !== '') patch.style.top = Number(top);

      const textEl = document.getElementById('bp-text');
      if (textEl) patch.text = textEl.value;

      vscode.postMessage({ type: 'updateNode', nodeId: node.id, patch });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return String(str).replace(/'/g, '&#39;');
  }

  function setTab(name) {
    document.querySelectorAll('.bp-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tab === name);
    });
    document.querySelectorAll('.bp-pane').forEach((pane) => {
      pane.classList.toggle('active', pane.dataset.pane === name);
    });
  }

  function applyInit(payload) {
    Object.assign(state, payload || {});
    els.fileName.textContent = state.fileName || 'No file open';
    els.syncCount.textContent = state.parseError
      ? 'Parse error'
      : `${state.syncableCount} syncable id${state.syncableCount === 1 ? '' : 's'}`;
    els.source.textContent = state.source ? `Source: ${state.source}` : '';
    els.status.textContent = state.status || '';
    renderCanvas();
    renderInspector();
    renderReceipts();
  }

  document.querySelectorAll('.bp-tab').forEach((tab) => {
    tab.addEventListener('click', () => setTab(tab.dataset.tab));
  });

  document.getElementById('bp-sync-btn').addEventListener('click', () => {
    vscode.postMessage({ type: 'syncFromFile' });
  });

  document.getElementById('bp-write-btn').addEventListener('click', () => {
    vscode.postMessage({ type: 'writeBack' });
  });

  document.getElementById('bp-open-demo-btn').addEventListener('click', () => {
    vscode.postMessage({ type: 'openDemo' });
  });

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'init') applyInit(msg.payload);
  });

  vscode.postMessage({ type: 'ready' });
})();
