import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { api } from '../utils/api';
import { EartsLogo } from '../components/EartsLogo';
import ThemeToggle from '../components/ThemeToggle';
import './PasswordRecovery.css';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const checks = [
    { label: '7–17 characters', valid: password.length >= 7 && password.length <= 17 },
    { label: 'At least one number', valid: /\d/.test(password) },
    { label: 'At least one special character', valid: /[^A-Za-z0-9\s]/.test(password) },
  ];

  useEffect(() => {
    if (location.hash) navigate(location.pathname, { replace: true });
  }, [location.hash, location.pathname, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('This reset link is missing or invalid. Request a new one.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    if (!checks.every(check => check.valid)) {
      setError('Meet all password requirements before continuing.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setComplete(true);
      window.setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (requestError) {
      setError(requestError.message || 'This reset link may have expired. Request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page password-recovery-page">
      <div className="auth-topbar password-recovery-topbar">
        <Link to="/login" className="auth-logo-link" title="Back to sign in"><EartsLogo size={32} /></Link>
        <ThemeToggle />
      </div>
      <section className="password-recovery-card">
        <h1>{complete ? 'Password updated' : 'Choose a new password'}</h1>
        {complete ? (
          <p>Your password has been changed. Taking you to sign in…</p>
        ) : (
          <>
            <p>Choose a new password for your Earts account.</p>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <form onSubmit={submit} className="auth-form">
              <div className="form-group">
                <label htmlFor="new-password">New password</label>
                <input id="new-password" type="password" autoComplete="new-password" maxLength={17} required value={password} onChange={event => setPassword(event.target.value)} />
              </div>
              <ul className="reset-password-checklist" aria-live="polite">
                {checks.map(check => <li key={check.label} className={check.valid ? 'is-valid' : ''}>{check.valid ? <Check size={15} /> : <X size={15} />}{check.label}</li>)}
              </ul>
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm new password</label>
                <input id="confirm-password" type="password" autoComplete="new-password" maxLength={17} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
              </div>
              <button className="btn-primary auth-submit" disabled={loading}>
                {loading ? 'Updating…' : 'Reset password'}
              </button>
            </form>
          </>
        )}
        <Link className="password-recovery-back" to="/login"><ArrowLeft size={16} /> Back to sign in</Link>
      </section>
    </div>
  );
}
