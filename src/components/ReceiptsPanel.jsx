// Simple helper to check color contrast (basic approximation for prototype)
// In a real app we'd convert hex to RGB and compute relative luminance
function getContrastRatio(hexcolor) {
  if (!hexcolor || hexcolor.length < 6) return 8.7; // default fallback
  
  const color = hexcolor.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Calculate relative luminance
  const a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  
  const luminance = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  
  // Contrast ratio with white text (luminance = 1)
  const ratio = 1.05 / (luminance + 0.05);
  return Math.round(ratio * 100) / 100;
}

export default function ReceiptsPanel({ component, nodesMap, onUpdateNode, lightMode = false }) {
  if (!component) {
    return (
      <div className={`receipts-pane ${lightMode ? 'receipts-light' : ''}`}>
        <div className="receipts-header">
          <div className="receipts-title">RECEIPTS</div>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
          Select a component to inspect design receipts
        </div>
      </div>
    );
  }

  // Find relevant nodes in the active tree
  const activeRoot = (nodesMap && (nodesMap['pricing-card-frame'] || nodesMap['hero-frame'])) || component;
  const buttonNode = component.type === 'button' ? component : (nodesMap ? (nodesMap['cta-button'] || nodesMap['hero-button']) : null);
  const featuresListNode = nodesMap ? nodesMap['features-list'] : null;

  // 1. Audit Spacing
  const targetSpacingNode = component.type === 'frame' ? component : activeRoot;
  const paddingVal = targetSpacingNode.style?.padding !== undefined ? parseInt(targetSpacingNode.style.padding, 10) : 0;
  const isSpacingValid = isNaN(paddingVal) || paddingVal % 8 === 0;
  const nearestPadding = isNaN(paddingVal) ? 8 : Math.round(paddingVal / 8) * 8;

  // 2. Audit Contrast
  let btnColor = buttonNode?.style?.background || '#2563eb';
  if (btnColor === 'blue' || btnColor === 'primary') btnColor = '#2563eb';
  const contrastRatio = getContrastRatio(btnColor);
  const isContrastValid = contrastRatio >= 4.5;

  // 3. Audit Copy Strength
  const weakCopys = ['submit', 'click here', 'send', 'button', 'ok', 'enter'];
  const buttonText = buttonNode?.text || '';
  const isCopyWeak = buttonNode ? weakCopys.includes(buttonText.toLowerCase().trim()) : false;

  // 4. Audit Radius (for Pricing Card)
  const pricingFrameNode = (nodesMap && nodesMap['pricing-card-frame']) || (component.type === 'frame' && component.id.includes('pricing') ? component : null);
  const borderRadiusVal = pricingFrameNode?.style?.borderRadius !== undefined ? parseInt(pricingFrameNode.style.borderRadius, 10) : 0;
  const isRadiusValid = !pricingFrameNode || (borderRadiusVal % 4 === 0);
  const nearestRadius = pricingFrameNode ? Math.round(borderRadiusVal / 4) * 4 : 0;

  // 5. Audit Feature Count (for Pricing Card)
  const featureCount = featuresListNode && featuresListNode.children ? featuresListNode.children.length : 0;
  const isFeatureCountValid = !featuresListNode || featureCount <= 5;

  // Compute Scores
  let designScore = 100;
  if (!isSpacingValid) designScore -= 20;
  if (isCopyWeak) designScore -= 15;
  if (!isRadiusValid) designScore -= 10;

  let accessibilityScore = 100;
  if (!isContrastValid) accessibilityScore -= 45;

  let buildabilityScore = 100;
  if (!isFeatureCountValid) buildabilityScore -= 25;

  const totalScore = Math.round((designScore + accessibilityScore + buildabilityScore) / 3);

  // Helper to trigger fix
  const handleFixClick = (ruleKey) => {
    if (!onUpdateNode) return;

    if (ruleKey === 'spacing') {
      onUpdateNode(targetSpacingNode.id, {
        style: {
          ...targetSpacingNode.style,
          padding: nearestPadding || 8
        }
      });
    } else if (ruleKey === 'contrast' && buttonNode) {
      onUpdateNode(buttonNode.id, {
        style: {
          ...buttonNode.style,
          background: '#1e40af' // WCAG AA contrasting blue
        }
      });
    } else if (ruleKey === 'copy' && buttonNode) {
      onUpdateNode(buttonNode.id, {
        text: 'Start free trial'
      });
    } else if (ruleKey === 'radius' && pricingFrameNode) {
      onUpdateNode(pricingFrameNode.id, {
        style: {
          ...pricingFrameNode.style,
          borderRadius: nearestRadius
        }
      });
    } else if (ruleKey === 'features' && featuresListNode) {
      onUpdateNode(featuresListNode.id, {
        children: featuresListNode.children.slice(0, 5)
      });
    }
  };

  return (
    <div className={`receipts-pane ${lightMode ? 'receipts-light' : ''}`} data-tour="receipts">
      <div className="receipts-header">
        <div className="receipts-title">
          <span>⚡ RECEIPTS</span>
        </div>
        <div className={`score-badge ${totalScore < 90 ? 'warning' : ''}`}>
          {totalScore}/100
        </div>
      </div>

      <div className="receipts-scroll">
        {/* Score Metrics Bars */}
        <div className="score-metrics">
          <div className="metric-row">
            <div className="metric-info">
              <span>Design</span>
              <span>{designScore}</span>
            </div>
            <div className="metric-bar-bg">
              <div 
                className="metric-bar-fill" 
                style={{ 
                  width: `${designScore}%`, 
                  background: designScore >= 90 ? 'var(--success-color)' : 'var(--warning-color)' 
                }} 
              />
            </div>
          </div>

          <div className="metric-row">
            <div className="metric-info">
              <span>Buildability</span>
              <span>{buildabilityScore}</span>
            </div>
            <div className="metric-bar-bg">
              <div 
                className="metric-bar-fill" 
                style={{ 
                  width: `${buildabilityScore}%`, 
                  background: buildabilityScore >= 90 ? 'var(--success-color)' : 'var(--warning-color)' 
                }} 
              />
            </div>
          </div>

          <div className="metric-row">
            <div className="metric-info">
              <span>Accessibility</span>
              <span>{accessibilityScore}</span>
            </div>
            <div className="metric-bar-bg">
              <div 
                className="metric-bar-fill" 
                style={{ 
                  width: `${accessibilityScore}%`, 
                  background: accessibilityScore >= 90 ? 'var(--success-color)' : 'var(--danger-color)' 
                }} 
              />
            </div>
          </div>
        </div>

        {/* Live Rules Audits */}
        <div className="rules-list">
          
          {/* 1. Spacing check */}
          {isSpacingValid ? (
            <div className="rule-card success">
              <span className="rule-icon">✓</span>
              <div className="rule-content">
                <div className="rule-title">Padding aligns to 8px grid</div>
                <div className="rule-desc">Layout padding is {paddingVal}px which fits system scale.</div>
                <span className="rule-tag">Design</span>
              </div>
            </div>
          ) : (
            <div className="rule-card warning">
              <span className="rule-icon">⚠️</span>
              <div className="rule-content">
                <div className="rule-title">Off-grid spacing warning</div>
                <div className="rule-desc">Padding of {paddingVal}px is off-grid. Recommend {nearestPadding}px.</div>
                <button className="rule-action-btn" onClick={() => handleFixClick('spacing')}>
                  Snap to {nearestPadding}px
                </button>
              </div>
            </div>
          )}

          {/* 2. Contrast Check */}
          {isContrastValid ? (
            <div className="rule-card success">
              <span className="rule-icon">✓</span>
              <div className="rule-content">
                <div className="rule-title">Button contrast ratio {contrastRatio}:1</div>
                <div className="rule-desc">Passes WCAG 2.1 AA requirement (minimum 4.5:1).</div>
                <span className="rule-tag">Accessibility</span>
              </div>
            </div>
          ) : (
            <div className="rule-card warning" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <span className="rule-icon">🚨</span>
              <div className="rule-content">
                <div className="rule-title">Low contrast ratio ({contrastRatio}:1)</div>
                <div className="rule-desc">Fails WCAG AA. Text might be hard to read on this button color.</div>
                <button 
                  className="rule-action-btn" 
                  style={{ background: 'var(--danger-color)' }}
                  onClick={() => handleFixClick('contrast')}
                >
                  Enhance Contrast
                </button>
              </div>
            </div>
          )}

          {/* 3. Copy strength check */}
          {!isCopyWeak ? (
            <div className="rule-card success">
              <span className="rule-icon">✓</span>
              <div className="rule-content">
                <div className="rule-title">Strong CTA Copy</div>
                <div className="rule-desc">"{buttonText}" is active and conversion-oriented.</div>
                <span className="rule-tag">Conversion</span>
              </div>
            </div>
          ) : (
            <div className="rule-card warning">
              <span className="rule-icon">💡</span>
              <div className="rule-content">
                <div className="rule-title">Weak CTA copy detected</div>
                <div className="rule-desc">"{buttonText}" feels generic. Suggest an action-oriented copy.</div>
                <button className="rule-action-btn" onClick={() => handleFixClick('copy')}>
                  Change to "Start free trial"
                </button>
              </div>
            </div>
          )}

          {/* 4. Radius scale check (PricingCard only) */}
          {pricingFrameNode && (
            isRadiusValid ? (
              <div className="rule-card success">
                <span className="rule-icon">✓</span>
                <div className="rule-content">
                  <div className="rule-title">Border-radius fits 4px scale</div>
                  <div className="rule-desc">Corners are rounded at {borderRadiusVal}px.</div>
                  <span className="rule-tag">Design</span>
                </div>
              </div>
            ) : (
              <div className="rule-card warning">
                <span className="rule-icon">⚠️</span>
                <div className="rule-content">
                  <div className="rule-title">Odd corner rounding</div>
                  <div className="rule-desc">Border radius of {borderRadiusVal}px doesn't match 4px scale.</div>
                  <button className="rule-action-btn" onClick={() => handleFixClick('radius')}>
                    Snap to {nearestRadius}px
                  </button>
                </div>
              </div>
            )
          )}

          {/* 5. Features count check (PricingCard only) */}
          {featuresListNode && (
            isFeatureCountValid ? (
              <div className="rule-card success">
                <span className="rule-icon">✓</span>
                <div className="rule-content">
                  <div className="rule-title">{featureCount} features - sweet spot</div>
                  <div className="rule-desc">Features list height is optimal.</div>
                  <span className="rule-tag">Buildability</span>
                </div>
              </div>
            ) : (
              <div className="rule-card warning">
                <span className="rule-icon">⚠️</span>
                <div className="rule-content">
                  <div className="rule-title">High visual clutter</div>
                  <div className="rule-desc">Pricing lists with {featureCount} items exceed recommendation (max 5).</div>
                  <button className="rule-action-btn" onClick={() => handleFixClick('features')}>
                    Truncate to 5 items
                  </button>
                </div>
              </div>
            )
          )}

        </div>
      </div>

      <div className="receipts-footer">
        <span>Live Checks</span>
        <span>WCAG 2.1 AA • 8px Grid • CTA Copy</span>
      </div>
    </div>
  );
}
