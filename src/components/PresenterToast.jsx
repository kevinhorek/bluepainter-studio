export default function PresenterToast({ message }) {
  if (!message) return null;

  return (
    <div className="presenter-toast" role="status" aria-live="polite">
      <span className="presenter-toast-icon">▶</span>
      <span>{message}</span>
    </div>
  );
}
