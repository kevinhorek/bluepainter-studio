const vscode = require('vscode');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default || require('@babel/traverse');

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

function getPanelHtml(fileName, syncInfo) {
  const demoUrl = 'https://bluepainter-studio.vercel.app/#/studio';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; frame-src https://bluepainter-studio.vercel.app http://localhost:*;" />
  <style>
    body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-foreground); }
    h2 { font-size: 13px; margin: 0 0 8px; }
    p { font-size: 12px; line-height: 1.5; opacity: 0.9; }
    .stat { background: var(--vscode-editor-inactiveSelectionBackground); padding: 8px 10px; border-radius: 6px; margin: 10px 0; font-size: 12px; }
    button, a.btn { display: block; width: 100%; margin-top: 8px; padding: 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; text-align: center; text-decoration: none; }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    a.btn { background: var(--vscode-input-background); color: var(--vscode-textLink-foreground); border: 1px solid var(--vscode-input-border); }
    code { font-size: 11px; }
  </style>
</head>
<body>
  <h2>BluePainter Studio</h2>
  <p>v1 extension scaffold — reads your TSX file and prepares repo-native sync.</p>
  <div class="stat">
    <strong>File:</strong> ${fileName || 'None'}<br/>
    <strong>Syncable ids:</strong> ${syncInfo.error ? 'Parse error' : syncInfo.ids.length}<br/>
    ${syncInfo.ids.length ? `<code>${syncInfo.ids.slice(0, 6).join(', ')}${syncInfo.ids.length > 6 ? '…' : ''}</code>` : '<em>Add id="…" attributes per AST_SCOPE.md</em>'}
  </div>
  <button onclick="vscode.postMessage({ type: 'analyze' })">Re-analyze file</button>
  <a class="btn" href="${demoUrl}" target="_blank" rel="noreferrer">Open validation demo</a>
  <p style="margin-top:16px; opacity:0.7;">Next: embed canvas webview + write-back via AST patch.</p>
  <script>
    const vscode = acquireVsCodeApi();
  </script>
</body>
</html>`;
}

function activate(context) {
  let panelView;

  const refreshPanel = (webviewView) => {
    const editor = vscode.window.activeTextEditor;
    const doc = editor?.document;
    const text = doc?.getText() || '';
    const syncInfo = doc ? countSyncableIds(text) : { error: false, ids: [] };
    webviewView.webview.html = getPanelHtml(doc?.fileName.split('/').pop(), syncInfo);
    webviewView.webview.onDidReceiveMessage((msg) => {
      if (msg.type === 'analyze') refreshPanel(webviewView);
    });
  };

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('bluepainter.panel', {
      resolveWebviewView(webviewView) {
        panelView = webviewView;
        webviewView.webview.options = { enableScripts: true };
        refreshPanel(webviewView);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bluepainter.openPanel', () => {
      vscode.commands.executeCommand('workbench.view.extension.bluepainter');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bluepainter.syncFromFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Open a TSX/JSX file first.');
        return;
      }
      const { error, ids } = countSyncableIds(editor.document.getText());
      if (error) {
        vscode.window.showErrorMessage('Could not parse file — check syntax.');
        return;
      }
      vscode.window.showInformationMessage(`BluePainter: found ${ids.length} syncable id(s).`);
      if (panelView) refreshPanel(panelView);
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      if (panelView) refreshPanel(panelView);
    })
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
