export default function AppToast({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="app-toast" role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" className="app-toast-close" onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  );
}
