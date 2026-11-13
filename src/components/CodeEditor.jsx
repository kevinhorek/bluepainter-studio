import { useRef, useEffect } from 'react';
import { getFileLabel } from '../data/workspaceFiles';

export default function CodeEditor({ code, onChange, onFocus, activeFile, onCollapse, paneLayout, onToggleExpand }) {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  const handleFocus = () => {
    if (onFocus) onFocus();
  };

  // Sync scrolling of textarea and highlight layer
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Keep scroll in sync even after external text updates
  useEffect(() => {
    handleScroll();
  }, [code]);

  // Support Tab key indentation
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      
      onChange(newValue);
      
      // Reset cursor position after React re-renders
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      });
    }
  };

  // Single-pass tokenizer. The highlight layer sits exactly under a transparent
  // textarea, so it must emit the same characters the user typed (the old
  // multi-pass regexes rewrote quotes and re-highlighted inside earlier spans).
  const highlightCode = (rawCode) => {
    if (!rawCode) return '';

    const esc = (str) => str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const KEYWORDS = new Set(['export', 'function', 'return', 'import', 'from', 'default', 'const', 'let', 'var']);
    const token = /(\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\/|(?<![:'"\w])\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(<\/?[A-Za-z][\w.]*|\/?>)|\b([A-Za-z_$][\w$-]*)(?=\s*=(?!=|>))|\b([A-Za-z_$][\w$]*)(?=\s*:)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)\b/g;

    let out = '';
    let last = 0;
    let m;
    while ((m = token.exec(rawCode)) !== null) {
      out += esc(rawCode.slice(last, m.index));
      last = token.lastIndex;
      const [text, comment, string, tag, attr, prop, number, word] = m;
      if (comment) out += `<span class="code-comment">${esc(text)}</span>`;
      else if (string) out += `<span class="code-string">${esc(text)}</span>`;
      else if (tag) out += `<span class="code-tag">${esc(text)}</span>`;
      else if (attr && !KEYWORDS.has(attr)) out += `<span class="code-attr">${esc(text)}</span>`;
      else if (prop) out += `<span class="code-attr">${esc(text)}</span>`;
      else if (number) out += `<span class="code-number">${esc(text)}</span>`;
      else if (KEYWORDS.has(word || attr)) out += `<span class="code-keyword">${esc(text)}</span>`;
      else out += esc(text);
    }
    out += esc(rawCode.slice(last));
    // A trailing newline needs a character after it or the layer is one line short.
    return out.endsWith('\n') ? `${out} ` : out;
  };

  // Count lines for line numbering gutter
  const lineCount = code ? code.split('\n').length : 1;
  const linesArray = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="editor-pane" data-tour="code" onClick={handleFocus}>
      <div className="editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span className="studio-pane-bar-kind" style={{ fontSize: '0.65rem' }}>Code</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getFileLabel(activeFile)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(code);
            }}
            title="Copy code"
            className="studio-pane-bar-btn"
          >
            📋
          </button>
          {onToggleExpand && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              title={paneLayout === 'code' ? 'Restore split view' : 'Expand code (~90%)'}
              className={`studio-pane-bar-btn ${paneLayout === 'code' ? 'active' : ''}`}
              aria-pressed={paneLayout === 'code'}
            >
              {paneLayout === 'code' ? '⊟' : '⊞'}
            </button>
          )}
          {onCollapse && !onToggleExpand && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCollapse();
              }}
              title="Collapse Editor"
              className="studio-pane-bar-btn"
            >
              ▶
            </button>
          )}
        </div>
      </div>
      <div className="editor-wrapper" style={{ display: 'flex' }}>
        {/* Line Numbers Gutter */}
        <div 
          className="line-gutter" 
          style={{
            padding: '16px 8px 16px 12px',
            background: 'rgba(0,0,0,0.15)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'right',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.825rem',
            color: 'rgba(255,255,255,0.25)',
            lineHeight: '1.5',
            userSelect: 'none',
            minWidth: '38px',
          }}
        >
          {linesArray.map(n => (
            <div key={n}>{n}</div>
          ))}
        </div>

        {/* Text Area and Highlight Overlays */}
        <div style={{ position: 'relative', flex: 1, height: '100%' }}>
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            spellCheck="false"
            style={{
              paddingLeft: '12px',
            }}
          />
          <div
            ref={highlightRef}
            className="editor-highlight"
            dangerouslySetInnerHTML={{ __html: highlightCode(code) }}
            style={{
              paddingLeft: '12px',
            }}
          />
        </div>
      </div>
    </div>
  );
}
