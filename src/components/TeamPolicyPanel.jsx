export default function TeamPolicyPanel({ policy, onPolicyChange, compact = false }) {
  const update = (key, value) => {
    onPolicyChange({ ...policy, [key]: value });
  };

  const handleExport = () => {
    const config = {
      receiptPolicy: policy
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.bluepainter.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target?.result;
          const config = JSON.parse(content);
          if (config.receiptPolicy) {
            onPolicyChange({ ...policy, ...config.receiptPolicy });
          } else {
            alert('Invalid .bluepainter.json format. Expected { "receiptPolicy": {...} }');
          }
        } catch (err) {
          alert(`Failed to import config: ${err.message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleWeakCtaChange = (value) => {
    const words = value.split(',').map(w => w.trim()).filter(w => w.length > 0);
    update('weakCtaWords', words);
  };

  const handleRuleSeverityChange = (ruleId, severity) => {
    const severities = policy.ruleSeverities || {};
    update('ruleSeverities', { ...severities, [ruleId]: severity });
  };

  const RECEIPT_RULES = [
    { id: 'spacing', label: 'Spacing grid', default: 'warning' },
    { id: 'radius', label: 'Border radius', default: 'warning' },
    { id: 'contrast', label: 'Contrast', default: 'error' },
    { id: 'copy', label: 'CTA copy', default: 'warning' },
    { id: 'features', label: 'Feature count', default: 'warning' }
  ];

  return (
    <div className="team-policy-panel">
      {!compact && (
        <>
          <div className="team-policy-header">
            <span>Team receipt policy</span>
          </div>
          <div className="team-policy-intro">
            Configure design rules for your team. These settings control what receipts are shown and how fixes are applied. Export as <code>.bluepainter.json</code> to version-control your team policy.
          </div>
          <div className="team-policy-actions">
            <button 
              onClick={handleImport}
              className="team-policy-action-btn team-policy-import-btn"
              title="Import .bluepainter.json from your repository"
            >
              📥 Import config
            </button>
            <button 
              onClick={handleExport}
              className="team-policy-action-btn team-policy-export-btn"
              title="Export as .bluepainter.json"
            >
              📤 Export config
            </button>
          </div>
        </>
      )}
      <div className="team-policy-grid">
        <label>
          Spacing grid
          <select value={policy.spacingGrid} onChange={(e) => update('spacingGrid', Number(e.target.value))}>
            <option value={4}>4px</option>
            <option value={8}>8px</option>
            <option value={16}>16px</option>
          </select>
        </label>
        <label>
          Radius grid
          <select value={policy.radiusGrid} onChange={(e) => update('radiusGrid', Number(e.target.value))}>
            <option value={2}>2px</option>
            <option value={4}>4px</option>
            <option value={8}>8px</option>
          </select>
        </label>
        <label>
          Contrast
          <select value={policy.minContrastRatio} onChange={(e) => update('minContrastRatio', Number(e.target.value))}>
            <option value={4.5}>AA 4.5:1</option>
            <option value={7}>AAA 7:1</option>
          </select>
        </label>
        <label>
          Max features
          <input
            type="number"
            min={3}
            max={10}
            value={policy.maxFeatureCount}
            onChange={(e) => update('maxFeatureCount', Number(e.target.value))}
          />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          Suggested CTA
          <input
            type="text"
            value={policy.suggestedCta || ''}
            onChange={(e) => update('suggestedCta', e.target.value)}
            placeholder="e.g., Start free trial"
          />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          Weak CTA words (comma-separated)
          <input
            type="text"
            value={(policy.weakCtaWords || []).join(', ')}
            onChange={(e) => handleWeakCtaChange(e.target.value)}
            placeholder="e.g., submit, click here, send"
          />
        </label>
        <label>
          Contrast fix color
          <input
            type="color"
            value={policy.contrastFixColor || '#1e40af'}
            onChange={(e) => update('contrastFixColor', e.target.value)}
            style={{ height: '32px', cursor: 'pointer' }}
          />
        </label>
      </div>
<<<<<<< HEAD
      
      {!compact && (
        <>
          <div className="team-policy-section-header">
            <span>Rule severities</span>
            <span className="team-policy-section-hint">error = blocks CI | warning = logged | info = hidden</span>
          </div>
          <div className="team-policy-severities-grid">
            {RECEIPT_RULES.map((rule) => {
              const currentSeverity = policy.ruleSeverities?.[rule.id] || rule.default;
              return (
                <div key={rule.id} className="team-policy-severity-row">
                  <span className="team-policy-severity-label">{rule.label}</span>
                  <select 
                    value={currentSeverity}
                    onChange={(e) => handleRuleSeverityChange(rule.id, e.target.value)}
                    className="team-policy-severity-select"
                  >
                    <option value="error">Error</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info (hidden)</option>
                  </select>
                </div>
              );
            })}
=======
      {!compact && (
        <>
          <div className="team-policy-divider" />
          <div className="team-policy-section-label">Design Tokens</div>
          <div className="team-policy-grid">
            <label>
              Primary color
              <input
                type="color"
                value={policy.primaryColor || '#2563eb'}
                onChange={(e) => update('primaryColor', e.target.value)}
                title="Brand/theme primary color"
              />
            </label>
            <label>
              Secondary color
              <input
                type="color"
                value={policy.secondaryColor || '#64748b'}
                onChange={(e) => update('secondaryColor', e.target.value)}
                title="Secondary/accent color"
              />
            </label>
            <label>
              Text color
              <input
                type="color"
                value={policy.textColor || '#1e293b'}
                onChange={(e) => update('textColor', e.target.value)}
                title="Default text color"
              />
            </label>
>>>>>>> 63de0e5 (feat: add design tokens to policy config with receipt integration)
          </div>
          <div className="team-policy-divider" />
          <div className="team-policy-section-label">Design Tokens</div>
          <div className="team-policy-grid">
            <label>
              Primary color
              <input
                type="color"
                value={policy.primaryColor || '#2563eb'}
                onChange={(e) => update('primaryColor', e.target.value)}
                title="Brand/theme primary color"
              />
            </label>
            <label>
              Secondary color
              <input
                type="color"
                value={policy.secondaryColor || '#64748b'}
                onChange={(e) => update('secondaryColor', e.target.value)}
                title="Secondary/accent color"
              />
            </label>
            <label>
              Text color
              <input
                type="color"
                value={policy.textColor || '#1e293b'}
                onChange={(e) => update('textColor', e.target.value)}
                title="Default text color"
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
