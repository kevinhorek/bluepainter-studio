import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('magic-link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { signIn, signUp, signInWithOtp } = useAuth();

  if (!isOpen) return null;

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error: otpError } = await signInWithOtp(email);

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
    } else {
      setMessage('Check your email for the magic link!');
      setTimeout(() => {
        setEmail('');
        setMessage('');
        onClose?.();
      }, 3000);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error: signInError } = await signIn(email, password);

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    } else {
      setEmail('');
      setPassword('');
      onSuccess?.();
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error: signUpError } = await signUp(email, password);

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setMessage('Check your email to confirm your account!');
      setTimeout(() => {
        setEmail('');
        setPassword('');
        setMessage('');
      }, 3000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Sign in to BluePainter</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="auth-modal-tabs">
          <button
            type="button"
            className={mode === 'magic-link' ? 'active' : ''}
            onClick={() => setMode('magic-link')}
          >
            Magic Link
          </button>
          <button
            type="button"
            className={mode === 'signin' ? 'active' : ''}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {mode === 'magic-link' && (
          <form onSubmit={handleMagicLink} className="auth-form">
            <p className="auth-description">
              We&apos;ll send you a magic link to sign in without a password.
            </p>
            <div className="form-group">
              <label htmlFor="email-magic">Email</label>
              <input
                id="email-magic"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}

        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="auth-form">
            <div className="form-group">
              <label htmlFor="email-signin">Email</label>
              <input
                id="email-signin"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password-signin">Password</label>
              <input
                id="password-signin"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="auth-form">
            <div className="form-group">
              <label htmlFor="email-signup">Email</label>
              <input
                id="email-signup"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password-signup">Password</label>
              <input
                id="password-signup"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}

        {message && <div className="auth-message auth-success">{message}</div>}
        {error && <div className="auth-message auth-error">{error}</div>}
      </div>
    </div>
  );
}
