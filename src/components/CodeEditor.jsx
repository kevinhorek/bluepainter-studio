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
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  // High-fidelity syntax highlighting helper using regular expressions
  const highlightCode = (rawCode) => {
    if (!rawCode) return '';
    
    let esc = rawCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. Strings
    esc = esc.replace(/(["'])(.*?)\1/g, '<span class="code-string">"$2"</span>');

    // 2. Keywords
    const keywords = ['export', 'function', 'return', 'import', 'from', 'default', 'const', 'let', 'var'];
    keywords.forEach(word => {
      const reg = new RegExp(`\\b(${word})\\b`, 'g');
      esc = esc.replace(reg, '<span class="code-keyword">$1</span>');
    });

    // 3. Built-in elements / Tags
    esc = esc.replace(/(&lt;\/?[a-z1-6]+|&gt;)/gi, '<span class="code-tag">$1</span>');

    // 4. Style properties & Attributes
    esc = esc.replace(/(style|className|href|onClick|type|id)=/g, '<span class="code-attr">$1</span>=');
    esc = esc.replace(/\b(padding|borderRadius|background|color):\b/g, '<span class="code-attr">$1</span>:');

    // 5. Numbers
    esc = esc.replace(/\b(\d+)\b/g, '<span class="code-number">$1</span>');

    // 6. Comments
    esc = esc.replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>');

    return esc;
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
