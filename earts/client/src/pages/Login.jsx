import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
      navigate('/');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-left">
          <div className="auth-left-inner">
            <span className="eyebrow" style={{color:'#FF6B9D'}}>Artist Community</span>
            <h2>Where artists grow, share & thrive together</h2>
            <p>Join thousands of artists sharing, growing, and turning their passion into livelihood.</p>
            <ul className="auth-features">
              {['Showcase your artwork to the world','Collaborate with fellow creators','Sell your work in our marketplace'].map(f => (
                <li key={f}><CheckCircle size={16} /> {f}</li>
              ))}
            </ul>
            <div className="auth-avatars">
              {['AM','MC','BJ','US'].map((a,i) => (
                <div key={i} className="mini-avatar" style={{
                  background: `hsl(${i*60+200},70%,55%)`,
                  marginLeft: i > 0 ? '-10px' : 0
                }}>{a}</div>
              ))}
              <span>+12000 other artists, sculptors, illustrators joined</span>
            </div>
          </div>
        </div>
        <div className="auth-right">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your Earts account</p>

          <button className="google-btn">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>

          <div className="auth-divider"><span>or sign in with email</span></div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email address</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(p => ({...p, email: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrap">
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm(p => ({...p, password: e.target.value}))} required />
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
