export default function TeamPolicyPanel({ policy, onPolicyChange }) {
  const update = (key, value) => {
    onPolicyChange({ ...policy, [key]: value });
  };

  return (
    <div className="team-policy-panel">
      <div className="team-policy-header">
        <span>Team Policy</span>
        <span className="team-policy-badge">Configurable</span>
      </div>
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
          Min contrast
          <select value={policy.minContrastRatio} onChange={(e) => update('minContrastRatio', Number(e.target.value))}>
            <option value={3}>3:1 AA Large</option>
            <option value={4.5}>4.5:1 AA</option>
            <option value={7}>7:1 AAA</option>
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
      </div>
      <p className="team-policy-note">Policy changes log to the learning loop and persist for this browser.</p>
    </div>
  );
}
