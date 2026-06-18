export default function InspectorPanel({
  selectedNodeId,
  nodesMap,
  onUpdateNode
}) {
  const node = nodesMap[selectedNodeId];

  if (!node) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
        Select a layer on the canvas or layers panel to inspect properties
      </div>
    );
  }

  // Update specific style property
  const handleStyleChange = (key, value) => {
    const updatedStyle = { ...node.style, [key]: value };
    onUpdateNode(selectedNodeId, { style: updatedStyle });
  };

  // Update simple text property (for text and button nodes)
  const handleTextChange = (e) => {
    onUpdateNode(selectedNodeId, { text: e.target.value });
  };

  const style = node.style || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#cbd5e1' }}>
      
      {/* 1. Header Title */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #444',
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#94a3b8',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Properties Inspector</span>
        <span style={{ color: 'var(--purple-figma)', fontWeight: 'bold' }}>{node.tag}</span>
      </div>

      {/* 2. Scrollable Inspector Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* SECTION A: DIMENSIONS */}
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}>Dimensions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.6rem', color: '#64748b', display: 'block', marginBottom: 2 }}>Width</label>
              <input 
                type="text" 
                value={style.width !== undefined ? style.width : 'auto'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleStyleChange('width', /^\d+$/.test(val) ? parseInt(val, 10) : val);
                }}
                style={{ width: '100%', background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.6rem', color: '#64748b', display: 'block', marginBottom: 2 }}>Height</label>
              <input 
                type="text" 
                value={style.height !== undefined ? style.height : 'auto'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleStyleChange('height', /^\d+$/.test(val) ? parseInt(val, 10) : val);
                }}
                style={{ width: '100%', background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION B: LAYOUT (Only show for non-leaf text/button tags if flex is enabled) */}
        {(node.type === 'frame' || node.type === 'list') && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}>Flex Layout</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Display Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Display</span>
                <select 
                  value={style.display || 'block'} 
                  onChange={(e) => handleStyleChange('display', e.target.value)}
                  style={{ background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '4px', borderRadius: 4, fontSize: '0.7rem', outline: 'none' }}
                >
                  <option value="block">Block</option>
                  <option value="flex">Flexbox</option>
                </select>
              </div>

              {style.display === 'flex' && (
                <>
                  {/* Direction */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Direction</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button 
                        onClick={() => handleStyleChange('flexDirection', 'row')}
                        style={{
                          background: style.flexDirection === 'row' ? 'var(--purple-figma)' : '#2c2c2c',
                          color: 'white', border: '1px solid #444', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', cursor: 'pointer'
                        }}
                      >
                        Row
                      </button>
                      <button 
                        onClick={() => handleStyleChange('flexDirection', 'column')}
                        style={{
                          background: style.flexDirection === 'column' ? 'var(--purple-figma)' : '#2c2c2c',
                          color: 'white', border: '1px solid #444', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', cursor: 'pointer'
                        }}
                      >
                        Col
                      </button>
                    </div>
                  </div>

                  {/* Align Items */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Align Items</span>
                    <select 
                      value={style.alignItems || 'stretch'} 
                      onChange={(e) => handleStyleChange('alignItems', e.target.value)}
                      style={{ background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '4px', borderRadius: 4, fontSize: '0.7rem', outline: 'none' }}
                    >
                      <option value="stretch">Stretch</option>
                      <option value="center">Center</option>
                      <option value="flex-start">Start</option>
                      <option value="flex-end">End</option>
                    </select>
                  </div>

                  {/* Justify Content */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Justify</span>
                    <select 
                      value={style.justifyContent || 'flex-start'} 
                      onChange={(e) => handleStyleChange('justifyContent', e.target.value)}
                      style={{ background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '4px', borderRadius: 4, fontSize: '0.7rem', outline: 'none' }}
                    >
                      <option value="flex-start">Start</option>
                      <option value="center">Center</option>
                      <option value="space-between">Space Between</option>
                      <option value="flex-end">End</option>
                    </select>
                  </div>

                  {/* Gap spacing */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Gap Spacing</span>
                    <input 
                      type="number" 
                      value={style.gap || 0}
                      onChange={(e) => handleStyleChange('gap', parseInt(e.target.value, 10) || 0)}
                      style={{ width: '60px', background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '4px 6px', borderRadius: 4, fontSize: '0.75rem', outline: 'none' }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* SECTION C: TEXT CONTENT & TYPOGRAPHY */}
        {(node.type === 'text' || node.type === 'button') && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}>Typography</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Text Area */}
              <div>
                <label style={{ fontSize: '0.6rem', color: '#64748b', display: 'block', marginBottom: 2 }}>Content</label>
                <textarea 
                  value={node.text || ''}
                  onChange={handleTextChange}
                  style={{ width: '100%', background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '6px 8px', borderRadius: 4, fontSize: '0.75rem', outline: 'none', resize: 'none', height: 50 }}
                />
              </div>

              {/* Font Size & Weight */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.6rem', color: '#64748b', display: 'block', marginBottom: 2 }}>Font Size</label>
                  <input 
                    type="number" 
                    value={style.fontSize || 14}
                    onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value, 10) || 14)}
                    style={{ width: '100%', background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.6rem', color: '#64748b', display: 'block', marginBottom: 2 }}>Weight</label>
                  <select 
                    value={style.fontWeight || 400}
                    onChange={(e) => handleStyleChange('fontWeight', parseInt(e.target.value, 10) || 400)}
                    style={{ width: '100%', background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '4px', borderRadius: 4, fontSize: '0.75rem', outline: 'none' }}
                  >
                    <option value="300">Light</option>
                    <option value="400">Regular</option>
                    <option value="500">Medium</option>
                    <option value="600">Semibold</option>
                    <option value="700">Bold</option>
                    <option value="800">Black</option>
                  </select>
                </div>
              </div>

              {/* Text Align */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Alignment</span>
                <select 
                  value={style.textAlign || 'left'} 
                  onChange={(e) => handleStyleChange('textAlign', e.target.value)}
                  style={{ background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '4px', borderRadius: 4, fontSize: '0.7rem', outline: 'none' }}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              {/* Text Color */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Text Color</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={style.color && style.color.startsWith('#') ? style.color : '#000000'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    style={{ width: 24, height: 20, border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    value={style.color || ''}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    style={{ width: 70, background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION D: FILL AND BORDER */}
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}>Fills & Borders</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Background Fill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Background</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={style.background && style.background.startsWith('#') ? style.background : '#ffffff'}
                  onChange={(e) => handleStyleChange('background', e.target.value)}
                  style={{ width: 24, height: 20, border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  value={style.background || ''}
                  onChange={(e) => handleStyleChange('background', e.target.value)}
                  style={{ width: 70, background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', outline: 'none' }}
                />
              </div>
            </div>

            {/* Padding slider */}
            <div className="slider-group">
              <div className="slider-label" style={{ fontSize: '0.65rem' }}>
                <span>Padding spacing</span>
                <span className="value">{style.padding || 0}px</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="64" 
                value={style.padding || 0} 
                onChange={(e) => handleStyleChange('padding', parseInt(e.target.value, 10))}
                className="range-input padding-slider"
              />
            </div>

            {/* Border Radius */}
            <div className="slider-group">
              <div className="slider-label" style={{ fontSize: '0.65rem' }}>
                <span>Corner Radius</span>
                <span className="value">{style.borderRadius || 0}px</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="32" 
                value={style.borderRadius || 0} 
                onChange={(e) => handleStyleChange('borderRadius', parseInt(e.target.value, 10))}
                className="range-input radius-slider"
              />
            </div>

            {/* Border Width & Color */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 10, alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '0.6rem', color: '#64748b', display: 'block', marginBottom: 2 }}>Border Width</label>
                <input 
                  type="number" 
                  value={style.borderWidth || 0}
                  onChange={(e) => {
                    handleStyleChange('borderWidth', parseInt(e.target.value, 10) || 0);
                    handleStyleChange('borderStyle', 'solid');
                  }}
                  style={{ width: '100%', background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.6rem', color: '#64748b', display: 'block', marginBottom: 2 }}>Border Color</label>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={style.borderColor && style.borderColor.startsWith('#') ? style.borderColor : '#cbd5e1'}
                    onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                    style={{ width: 20, height: 20, border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    value={style.borderColor || ''}
                    onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                    style={{ width: '100%', background: '#2c2c2c', border: '1px solid #444', color: 'white', padding: '2px 4px', borderRadius: 4, fontSize: '0.7rem', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3. Footer info */}
      <div style={{
        padding: 12,
        borderTop: '1px solid #444',
        fontSize: '0.65rem',
        color: '#64748b',
        lineHeight: 1.3
      }}>
        ⚡ All property edits patch the virtual JSX AST. Watch the editor code update in real-time.
      </div>

    </div>
  );
}
