export default function ReceiptMessageBar({ rules, onOpenReceipt, onOpenRule }) {
  const issues = rules.filter((r) => !r.valid);
  if (issues.length === 0) return null;

  return (
    <div className="receipt-message-bar">
      {issues.map((rule) => (
        <button
          key={rule.id}
          type="button"
          className={`receipt-message ${rule.severity === 'error' ? 'receipt-message-error' : ''}`}
          onClick={() => {
            onOpenReceipt?.();
            onOpenRule?.(rule.id);
          }}
        >
          <span className="receipt-message-icon">{rule.severity === 'error' ? '!' : '·'}</span>
          <span className="receipt-message-text">{rule.title}</span>
        </button>
      ))}
    </div>
  );
}
