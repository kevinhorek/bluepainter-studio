export default function TeamPolicyPanel({ policy, onPolicyChange, compact = false }) {
  const update = (key, value) => {
    onPolicyChange({ ...policy, [key]: value });
  };

  return (
    <div className="team-policy-panel">
      {!compact && (
        <div className="team-policy-header">
          <span>Team rules</span>
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
