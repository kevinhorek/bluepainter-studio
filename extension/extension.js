const vscode = require('vscode');
const path = require('path');
const { parse } = require('@babel/parser');
const traverseModule = require('@babel/traverse');
const { bootstrapFromFile, mergeNodeUpdate } = require('./lib/bootstrap');
const { parseTSX, generateTSX } = require('./lib/syncEngine');
const { evaluateReceipts, applyReceiptFix } = require('@bluepainter/shared/receiptPolicy');
const { loadReceiptPolicyFromConfig } = require('./lib/defaultReceiptPolicy');
const { SessionStore } = require('./lib/sessionStore');
const { LearningLoop } = require('./lib/learningLoop');
const { detectWorkspaceType, getWorkspaceRecommendations } = require('./lib/designSystemDetection');

const traverse = traverseModule.default || traverseModule;
const SUPPORTED_LANGS = new Set(['typescriptreact', 'javascriptreact']);

function countSyncableIds(source) {
  const ids = [];
  try {
    const ast = parse(source, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
    traverse(ast, {
      JSXOpeningElement(path) {
        const idAttr = path.node.attributes.find(
          (a) => a.name?.name === 'id' && a.value?.type === 'StringLiteral'
        );
        if (idAttr) ids.push(idAttr.value.value);
      }
    });
  } catch {
    return { error: true, ids: [] };
  }
  return { error: false, ids };
}

function getWebviewHtml(webview, extensionUri, mode = 'sidebar') {
  const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'panel.css'));
  const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'panel.js'));
  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src ${webview.cspSource}`
  ].join('; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${cssUri}" />
</head>
<body class="${mode === 'editor' ? 'bp-editor' : ''}">
  <div class="bp-shell">
    <div class="bp-first-run-tip" id="bp-first-run-tip" hidden>
      <div class="bp-tip-header">
        <span class="bp-tip-icon">👋</span>
        <div class="bp-tip-content">
          <strong>Welcome to BluePainter!</strong>
          <p>Try <code>BluePainter: Pick Component</code> from the command palette (Cmd/Ctrl+Shift+P) to quickly open TSX/JSX files. Check receipts before merging to catch policy issues.</p>
        </div>
        <button class="bp-tip-dismiss" id="bp-tip-dismiss" title="Dismiss">×</button>
      </div>
    </div>
    <header class="bp-header">
      <h1>BluePainter</h1>
      <p id="bp-file-name">No file open</p>
      <div class="bp-stats">
        <span class="bp-stat" id="bp-sync-count">0 syncable ids</span>
        <span class="bp-stat" id="bp-source"></span>
      </div>
      <p class="bp-status" id="bp-status"></p>
    </header>
    <div class="bp-tabs">
      <button class="bp-tab active" data-tab="canvas">Canvas</button>
      <button class="bp-tab" data-tab="inspector">Inspector</button>
      <button class="bp-tab" data-tab="receipts">Receipts</button>
    </div>
    <div class="bp-body">
      <section class="bp-pane active" data-pane="canvas">
        <div class="bp-canvas-wrap">
          <div class="bp-canvas" id="bp-canvas"></div>
          <p class="bp-empty" id="bp-canvas-empty">Open a TSX file with <code>id="…"</code> attributes to preview and edit.</p>
        </div>
      </section>
      <section class="bp-pane" data-pane="inspector">
        <div id="bp-inspector-empty" class="bp-empty">Select a node on the canvas to inspect properties.</div>
        <div id="bp-inspector" class="bp-inspector" hidden></div>
      </section>
      <section class="bp-pane" data-pane="receipts">
        <div id="bp-scores"></div>
        <div id="bp-receipts"></div>
      </section>
    </div>
    <footer class="bp-footer">
      <button class="bp-btn secondary" id="bp-sync-btn">Sync from file</button>
      <button class="bp-btn" id="bp-write-btn">Write to file</button>
    </footer>
    <div style="padding: 0 12px 12px;">
      <button class="bp-btn secondary" id="bp-open-demo-btn">Open web demo</button>
    </div>
  </div>
  <script src="${jsUri}"></script>
</body>
</html>`;
}

class BluePainterController {
  constructor(context) {
    this.context = context;
    this.sessionStore = new SessionStore(context);
    this.learningLoop = new LearningLoop(context);
    this.docState = new Map();
    this.skipParse = false;
    this.sidebarView = null;
    this.editorPanel = null;
    this.syncTimer = null;
  }

  getConfig() {
    return loadReceiptPolicyFromConfig(vscode.workspace.getConfiguration('bluepainter'));
  }

  getDemoUrl() {
    return vscode.workspace.getConfiguration('bluepainter').get('demoUrl', 'https://bluepainter-studio.vercel.app/#/app');
  }

  isSupportedDocument(doc) {
    return doc && SUPPORTED_LANGS.has(doc.languageId);
  }

  getEditorState(editor) {
    if (!editor || !this.isSupportedDocument(editor.document)) return null;
    const uri = editor.document.uri.toString();
    if (!this.docState.has(uri)) {
      this.docState.set(uri, {
        rootNodeId: null,
        nodesMap: {},
        selectedNodeId: null,
        source: 'empty',
        lastSyncedVersion: editor.document.version,
        dismissedRules: new Set()
      });
    }
    return { uri, editor, state: this.docState.get(uri) };
  }

  loadDocument(editor, options = {}) {
    const ctx = this.getEditorState(editor);
    if (!ctx) return null;

    const code = editor.document.getText();
    const fileName = editor.document.fileName;
    const saved = this.sessionStore.get(ctx.uri);
    const boot = bootstrapFromFile(code, fileName, saved);

    ctx.state.rootNodeId = boot.rootNodeId;
    ctx.state.nodesMap = boot.nodesMap;
    ctx.state.source = boot.source;
    ctx.state.lastSyncedVersion = editor.document.version;
    
    // Restore dismissedRules from saved session (convert from array to Set)
    if (saved && saved.dismissedRules) {
      ctx.state.dismissedRules = new Set(saved.dismissedRules);
    } else {
      ctx.state.dismissedRules = ctx.state.dismissedRules || new Set();
    }

    if (!ctx.state.selectedNodeId && boot.rootNodeId) {
      ctx.state.selectedNodeId = boot.rootNodeId;
    }

    if (options.persist !== false) {
      this.persist(ctx.uri, ctx.state);
    }

    return ctx;
  }

  persist(uri, state) {
    return this.sessionStore.set(uri, state);
  }

  buildPayload(ctx) {
    const code = ctx.editor.document.getText();
    const syncInfo = countSyncableIds(code);
    const selected = ctx.state.selectedNodeId ? ctx.state.nodesMap[ctx.state.selectedNodeId] : null;
    const policy = this.getConfig();
    const dismissedRules = ctx.state.dismissedRules || new Set();
    const receiptResult = selected
      ? evaluateReceipts(ctx.state.nodesMap, selected, policy, dismissedRules)
      : { rules: [], scores: { design: 100, accessibility: 100, buildability: 100, total: 100 } };

    const suggestions = this.learningLoop.getSuggestions();
    const showFirstRunTip = !this.context.globalState.get('bluepainter.firstRunTipDismissed', false);

    return {
      fileName: path.basename(ctx.editor.document.fileName),
      rootNodeId: ctx.state.rootNodeId,
      nodesMap: ctx.state.nodesMap,
      selectedNodeId: ctx.state.selectedNodeId,
      rules: receiptResult.rules,
      scores: receiptResult.scores,
      syncableCount: syncInfo.ids.length,
      parseError: syncInfo.error,
      source: ctx.state.source,
      mode: 'sidebar',
      status: '',
      suggestions,
      showFirstRunTip
    };
  }

  postToWebviews(payload) {
    const msg = { type: 'init', payload };
    this.sidebarView?.webview.postMessage(msg);
    this.editorPanel?.webview.postMessage(msg);
  }

  refreshViews(editor = vscode.window.activeTextEditor) {
    const ctx = this.getEditorState(editor);
    if (!ctx) {
      this.postToWebviews({
        fileName: 'No TSX file',
        rootNodeId: null,
        nodesMap: {},
        selectedNodeId: null,
        rules: [],
        scores: { design: 100, accessibility: 100, buildability: 100, total: 100 },
        syncableCount: 0,
        parseError: false,
        source: '',
        status: 'Open a .tsx or .jsx file to begin.'
      });
      return;
    }

    if (!Object.keys(ctx.state.nodesMap || {}).length) {
      this.loadDocument(editor);
    }

    this.postToWebviews(this.buildPayload(ctx));
  }

  async writeBack(editor = vscode.window.activeTextEditor, options = {}) {
    const ctx = this.getEditorState(editor);
    if (!ctx || !Object.keys(ctx.state.nodesMap || {}).length) {
      vscode.window.showWarningMessage('BluePainter: nothing to write — open a syncable TSX file first.');
      return false;
    }

    // Conflict detection: check if document has changed since last sync
    const currentVersion = ctx.editor.document.version;
    const hasConflict = ctx.state.lastSyncedVersion && currentVersion !== ctx.state.lastSyncedVersion && !options.forceOverwrite;

    if (hasConflict && !options.quiet) {
      const choice = await vscode.window.showWarningMessage(
        'The file has been modified externally. How do you want to proceed?',
        { modal: true },
        'Overwrite with canvas',
        'Discard canvas changes',
        'Cancel'
      );

      if (choice === 'Discard canvas changes') {
        this.syncFromFile(editor);
        this.learningLoop.log('conflict_resolved', {
          resolution: 'discard_canvas',
          fileName: path.basename(ctx.editor.document.fileName)
        });
        return false;
      } else if (choice === 'Cancel' || !choice) {
        return false;
      }
      // If 'Overwrite with canvas', continue with write
      this.learningLoop.log('conflict_resolved', {
        resolution: 'overwrite_with_canvas',
        fileName: path.basename(ctx.editor.document.fileName)
      });
    }

    const existing = ctx.editor.document.getText();
    const nextCode = generateTSX(ctx.state.nodesMap, existing);
    if (!nextCode) {
      vscode.window.showErrorMessage('BluePainter: AST patch failed. Ensure nodes have matching id attributes.');
      return false;
    }

    if (nextCode === existing) {
      if (!options.quiet) vscode.window.showInformationMessage('BluePainter: file already up to date.');
      ctx.state.lastSyncedVersion = currentVersion;
      return true;
    }

    this.skipParse = true;
    const fullRange = new vscode.Range(
      ctx.editor.document.positionAt(0),
      ctx.editor.document.positionAt(existing.length)
    );

    const ok = await ctx.editor.edit((editBuilder) => {
      editBuilder.replace(fullRange, nextCode);
    });

    if (!ok) {
      this.skipParse = false;
      vscode.window.showErrorMessage('BluePainter: could not apply edit.');
      return false;
    }

    ctx.state.lastSyncedVersion = ctx.editor.document.version + 1;
    this.persist(ctx.uri, ctx.state);
    
    // Log canvas→code round-trip to learning loop
    if (!options.quiet) {
      const nodeCount = Object.keys(ctx.state.nodesMap).length;
      this.learningLoop.log('canvas_to_code_roundtrip', {
        fileName: path.basename(ctx.editor.document.fileName),
        nodeCount,
        hadConflict: hasConflict
      });
      vscode.window.showInformationMessage(`BluePainter: wrote ${nodeCount} node(s) to file.`);
    }
    
    this.refreshViews(editor);
    setTimeout(() => { this.skipParse = false; }, 250);
    return true;
  }

  updateNode(editor, nodeId, patch, options = {}) {
    const ctx = this.getEditorState(editor);
    if (!ctx || !ctx.state.nodesMap[nodeId]) return;

    ctx.state.nodesMap = mergeNodeUpdate(ctx.state.nodesMap, nodeId, patch);
    this.persist(ctx.uri, ctx.state);

    if (options.autoWrite !== false) {
      const patchType = Object.keys(patch).join(',');
      this.learningLoop.logCanvasToCodeSync(nodeId, path.basename(editor.document.fileName), patchType);
      this.writeBack(editor, { quiet: true });
    } else {
      this.refreshViews(editor);
    }
  }

  applyFix(editor, fixKey, fixMeta, ruleId) {
    const ctx = this.getEditorState(editor);
    if (!ctx) return;

    applyReceiptFix(fixKey, fixMeta, ctx.state.nodesMap, (nodeId, patch) => {
      ctx.state.nodesMap = mergeNodeUpdate(ctx.state.nodesMap, nodeId, patch);
    });

    this.learningLoop.logReceiptFixApplied(fixKey, fixMeta.nodeId, fixMeta, ruleId);

    this.persist(ctx.uri, ctx.state);
    this.writeBack(editor, { quiet: true });
  }

  syncFromFile(editor = vscode.window.activeTextEditor) {
    const ctx = this.loadDocument(editor, { persist: true });
    if (!ctx) {
      vscode.window.showWarningMessage('BluePainter: open a TSX/JSX file first.');
      return;
    }
    
    const nodeCount = Object.keys(ctx.state.nodesMap).length;
    this.learningLoop.log('code_to_canvas_roundtrip', {
      fileName: path.basename(ctx.editor.document.fileName),
      nodeCount,
      source: ctx.state.source
    });
    vscode.window.showInformationMessage(
      `BluePainter: synced ${nodeCount} node(s) from file.`
    );
    this.refreshViews(editor);
  }

  handleDocumentChange(document) {
    if (this.skipParse) return;
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== document.uri.toString()) return;
    if (!this.isSupportedDocument(document)) return;

    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      const ctx = this.getEditorState(editor);
      if (!ctx) return;
      const parsed = parseTSX(document.getText(), ctx.state.nodesMap);
      const nodeCount = Object.keys(parsed).length;
      ctx.state.nodesMap = parsed;
      ctx.state.lastSyncedVersion = document.version;
      this.persist(ctx.uri, ctx.state);
      this.learningLoop.logCodeToCanvasSync(path.basename(document.fileName), nodeCount);
      this.refreshViews(editor);
    }, 350);
  }

  async pickAndOpenComponent() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || !workspaceFolders.length) {
      vscode.window.showWarningMessage('BluePainter: no workspace folder open.');
      return;
    }

    const files = await vscode.workspace.findFiles(
      '{src/**/*.{tsx,jsx},**/*.{tsx,jsx}}',
      '**/node_modules/**',
      100
    );

    if (!files.length) {
      vscode.window.showWarningMessage('BluePainter: no TSX/JSX files found in workspace.');
      return;
    }

    const items = files.map((uri) => {
      const relativePath = vscode.workspace.asRelativePath(uri);
      const fileName = path.basename(uri.fsPath);
      return {
        label: fileName,
        description: relativePath,
        uri
      };
    });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a component to open in BluePainter',
      matchOnDescription: true
    });

    if (!selected) return;

    const doc = await vscode.workspace.openTextDocument(selected.uri);
    const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
    
    this.loadDocument(editor);
    this.refreshViews(editor);
    vscode.window.showInformationMessage(`BluePainter: opened ${selected.label}`);
  }

  async openEditorPanel() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !this.isSupportedDocument(editor.document)) {
      vscode.window.showWarningMessage('BluePainter: open a TSX/JSX file first.');
      return;
    }

    this.loadDocument(editor);

    if (this.editorPanel) {
      this.editorPanel.reveal(vscode.ViewColumn.Beside, true);
      this.refreshViews(editor);
      return;
    }

    this.editorPanel = vscode.window.createWebviewPanel(
      'bluepainterCanvas',
      'BluePainter Canvas',
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    this.editorPanel.webview.html = getWebviewHtml(
      this.editorPanel.webview,
      this.context.extensionUri,
      'editor'
    );

    this.editorPanel.webview.onDidReceiveMessage((msg) => this.handleWebviewMessage(msg));
    this.editorPanel.onDidDispose(() => {
      this.editorPanel = null;
    });

    this.refreshViews(editor);
  }

  handleWebviewMessage(msg) {
    const editor = vscode.window.activeTextEditor;

    switch (msg.type) {
      case 'ready':
        this.refreshViews(editor);
        break;
      case 'selectNode':
        if (editor) {
          const ctx = this.getEditorState(editor);
          if (ctx) {
            ctx.state.selectedNodeId = msg.nodeId;
            this.refreshViews(editor);
          }
        }
        break;
      case 'updateNode':
        if (editor && msg.nodeId && msg.patch) {
          this.updateNode(editor, msg.nodeId, msg.patch, { autoWrite: true });
        }
        break;
      case 'applyFix':
        if (editor && msg.fixKey) {
          this.applyFix(editor, msg.fixKey, msg.fixMeta, msg.ruleId);
        }
        break;
      case 'dismissReceipt':
        if (editor && msg.ruleId) {
          const ctx = this.getEditorState(editor);
          if (ctx) {
            ctx.state.dismissedRules.add(msg.ruleId);
            this.persist(ctx.uri, ctx.state);
            this.learningLoop.logReceiptDismissed(msg.ruleId, msg.nodeId, path.basename(editor.document.fileName));
            this.refreshViews(editor);
          }
        }
        break;
      case 'applySuggestion':
        if (editor && msg.suggestion) {
          const ctx = this.getEditorState(editor);
          if (ctx) {
            const suggestion = msg.suggestion;
            
            if (suggestion.type === 'downgrade_rule') {
              ctx.state.dismissedRules.add(suggestion.ruleId);
              this.persist(ctx.uri, ctx.state);
              this.learningLoop.log('learning_suggestion_applied', {
                type: 'downgrade_rule',
                ruleId: suggestion.ruleId,
                weight: suggestion.weight
              });
              vscode.window.showInformationMessage(`BluePainter: Rule "${suggestion.ruleId}" hidden from receipts.`);
              this.refreshViews(editor);
            } else if (suggestion.type === 'prefer_quick_fix') {
              const prefKey = 'bluepainter.quickFixPrefs';
              const prefs = this.context.globalState.get(prefKey, {});
              prefs[suggestion.fixKey] = {
                preferred: true,
                appliedAt: Date.now(),
                weight: suggestion.weight
              };
              this.context.globalState.update(prefKey, prefs);
              this.learningLoop.log('learning_suggestion_applied', {
                type: 'prefer_quick_fix',
                fixKey: suggestion.fixKey,
                weight: suggestion.weight
              });
              vscode.window.showInformationMessage(`BluePainter: Quick-fix preference saved for "${suggestion.fixKey}".`);
            }
          }
        }
        break;
      case 'exportLearningLoop': {
        const loopData = this.learningLoop.exportJSON();
        vscode.window.showInformationMessage(`Learning loop: ${loopData.stats.total} events`);
        break;
      }
      case 'dismissFirstRunTip':
        this.context.globalState.update('bluepainter.firstRunTipDismissed', true);
        this.refreshViews(editor);
        break;
      case 'syncFromFile':
        this.syncFromFile(editor);
        break;
      case 'writeBack':
        this.writeBack(editor);
        break;
      case 'openDemo':
        vscode.env.openExternal(vscode.Uri.parse(this.getDemoUrl()));
        break;
      default:
        break;
    }
  }

  registerSidebarProvider() {
    const provider = {
      resolveWebviewView: (webviewView) => {
        this.sidebarView = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = getWebviewHtml(webviewView.webview, this.context.extensionUri, 'sidebar');
        webviewView.webview.onDidReceiveMessage((msg) => this.handleWebviewMessage(msg));
        webviewView.onDidDispose(() => {
          this.sidebarView = null;
        });
        this.refreshViews(vscode.window.activeTextEditor);
      }
    };

    this.context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('bluepainter.panel', provider, {
        webviewOptions: { retainContextWhenHidden: true }
      })
    );
  }
}

function activate(context) {
  const controller = new BluePainterController(context);
  controller.registerSidebarProvider();

  context.subscriptions.push(
    vscode.commands.registerCommand('bluepainter.openPanel', () => {
      vscode.commands.executeCommand('workbench.view.extension.bluepainter');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bluepainter.openCanvas', () => controller.openEditorPanel())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bluepainter.pickComponent', () => controller.pickAndOpenComponent())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bluepainter.syncFromFile', () => controller.syncFromFile())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bluepainter.writeToFile', () => controller.writeBack())
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && controller.isSupportedDocument(editor.document)) {
        controller.loadDocument(editor);
      }
      controller.refreshViews(editor);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      controller.handleDocumentChange(event.document);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (!controller.isSupportedDocument(doc)) return;
      const editor = vscode.window.activeTextEditor;
      if (editor?.document.uri.toString() === doc.uri.toString()) {
        controller.syncFromFile(editor);
      }
    })
  );

  if (vscode.window.activeTextEditor) {
    controller.loadDocument(vscode.window.activeTextEditor);
    controller.refreshViews(vscode.window.activeTextEditor);
  }

  const config = vscode.workspace.getConfiguration('bluepainter');
  const enableDetection = config.get('enableDesignSystemDetection', true);
  
  if (enableDetection) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const detection = detectWorkspaceType(workspaceRoot);
      
      if (detection.isDesignSystem && detection.confidence !== 'none') {
        const channel = vscode.window.createOutputChannel('BluePainter');
        channel.appendLine('BluePainter: Design system detected');
        channel.appendLine(`  Confidence: ${detection.confidence}`);
        channel.appendLine(`  Indicators: ${detection.indicators.join(', ')}`);
        
        const recommendations = getWorkspaceRecommendations(detection);
        if (recommendations.length > 0) {
          channel.appendLine('\nRecommendations:');
          recommendations.forEach((rec) => {
            channel.appendLine(`  [${rec.type}] ${rec.message}`);
          });
        }

        if (detection.confidence === 'high') {
          const msg = `Design system detected: ${detection.indicators[0]}`;
          vscode.window.showInformationMessage(msg, 'Learn More').then((choice) => {
            if (choice === 'Learn More') {
              vscode.env.openExternal(vscode.Uri.parse('https://bluepainter-studio.vercel.app/#/docs'));
            }
          });
        }
      }
    }
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
