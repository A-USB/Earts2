import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { api } from '../utils/api';
import { EartsLogo } from '../components/EartsLogo';
import ThemeToggle from '../components/ThemeToggle';
import './PasswordRecovery.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await api.post('/auth/forgot-password', { email });
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message || 'Could not request a reset link. Please try again.');
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
        {message ? (
          <>
            <MailCheck className="password-recovery-icon" size={36} />
            <h1>Check your email</h1>
            <p>{message}</p>
          </>
        ) : (
          <>
            <h1>Forgot your password?</h1>
            <p>Enter the email address linked to your Earts account. If it matches, we’ll send you a reset link.</p>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <form onSubmit={submit} className="auth-form">
              <div className="form-group">
                <label htmlFor="recovery-email">Email address</label>
                <input id="recovery-email" type="email" autoComplete="email" maxLength={60} required value={email} onChange={event => setEmail(event.target.value)} />
              </div>
              <button className="btn-primary auth-submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
        <Link className="password-recovery-back" to="/login"><ArrowLeft size={16} /> Back to sign in</Link>
      </section>
    </div>
  );
}
