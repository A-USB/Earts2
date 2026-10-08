import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EartsLogo } from '../components/EartsLogo';
import ThemeToggle from '../components/ThemeToggle';
import GoogleAuthButton from '../components/GoogleAuthButton';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/feed');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <Link to="/" className="auth-logo-link" title="Earts Home">
          <EartsLogo size={32} />
        </Link>
        <ThemeToggle />
      </div>

      <div className="auth-card">
        <div className="auth-left">
          <div className="auth-left-content">
            <span className="eyebrow">Artist Community</span>
            <h2>Where artists grow, share & thrive together</h2>
            <p>Join thousands of artists sharing, growing, and turning their passion into livelihood.</p>
            <ul className="auth-features">
              {['Showcase your artwork to the world', 'Collaborate with fellow creators', 'Sell your work in our marketplace'].map(f => (
                <li key={f}><CheckCircle size={16} /> {f}</li>
              ))}
            </ul>
          </div>
          <div className="auth-left-footer">
            <div className="auth-avatars">
              {['AM', 'MC', 'BJ', 'US'].map((a, i) => (
                <div key={i} className="mini-avatar" style={{
                  background: `hsl(${i * 60 + 200}, 70%, 55%)`,
                  marginLeft: i > 0 ? '-10px' : 0
                }}>{a}</div>
              ))}
              <span>+12,000 creators joined</span>
            </div>
          </div>
        </div>
        <div className="auth-right">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your Earts account</p>

          <GoogleAuthButton onError={setError} />

          <div className="auth-divider"><span>or sign in with email</span></div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email address</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} maxLength={254} autoComplete="email" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrap">
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} maxLength={128} autoComplete="current-password" required />
                <button type="button" className="input-icon" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Join Earts for free.</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
