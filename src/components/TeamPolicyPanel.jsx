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

  return (
    <div className="team-policy-panel">
      {!compact && (
        <div className="team-policy-header">
          <span>Team rules</span>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button 
              onClick={handleImport}
              style={{ 
                padding: '4px 12px', 
                fontSize: '12px',
                background: 'transparent',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#64748b'
              }}
              title="Import .bluepainter.json"
            >
              Import
            </button>
            <button 
              onClick={handleExport}
              style={{ 
                padding: '4px 12px', 
                fontSize: '12px',
                background: 'transparent',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#64748b'
              }}
              title="Export as .bluepainter.json"
            >
              Export
            </button>
          </div>
        </div>
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
    </div>
  );
}
