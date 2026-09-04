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
          Grid
          <select value={policy.spacingGrid} onChange={(e) => update('spacingGrid', Number(e.target.value))}>
            <option value={4}>4px</option>
            <option value={8}>8px</option>
            <option value={16}>16px</option>
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
          Max items
          <input
            type="number"
            min={3}
            max={10}
            value={policy.maxFeatureCount}
            onChange={(e) => update('maxFeatureCount', Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
