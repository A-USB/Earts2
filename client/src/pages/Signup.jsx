import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';
import { Eye, EyeOff, Grid2x2, Users, Sparkles } from 'lucide-react';

const ROLES = ['Painter','Illustrator','Sculptor','Digital Artist','Photographer','Printmaker','Ceramicist','Mixed Media','Other'];

export default function Signup() {
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'', role:'Sculptor' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
  <div className="auth-card auth-card-wide">
    <div className="auth-left">
      <div className="auth-left-inner">
        <span className="eyebrow" style={{color:'#FF6B9D'}}>Join today — it's free</span>
        <h2>Your creative journey starts here</h2>
        <p>Create your profile, upload your first artwork, and connect with a global community of creators.</p>
        <div className="auth-perks">
          {[
            { icon: <Grid2x2 size={18}/>, title: 'Build your gallery', desc: 'Upload and organise your artwork in one place' },
            { icon: <Users size={18}/>, title: 'Connect and collaborate', desc: 'Meet artists who share your style and vision' },
            { icon: <Sparkles size={18}/>, title: 'Sell your creations', desc: 'Turn your art into income through our marketplace' },
          ].map(p => (
            <div key={p.title} className="auth-perk">
              <div className="perk-icon">{p.icon}</div>
              <div>
                <strong>{p.title}</strong>
                <span>{p.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="auth-right">
          <h2>Create account</h2>
          <p className="auth-subtitle">Join our art community</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input placeholder="eg: John" value={form.firstName} onChange={set('firstName')} required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input placeholder="eg: Doe" value={form.lastName} onChange={set('lastName')} required />
              </div>
            </div>
            <div className="form-group">
              <label>Email address</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrap">
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')} required />
                <button type="button" className="input-icon" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>I am a ......</label>
              <select value={form.role} onChange={set('role')}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <Link to="/login" className="forgot-link">Already have an account? Sign in</Link>
            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create your account'}
            </button>
          </form>
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in to Earts.</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
