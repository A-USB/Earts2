import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Grid2x2, Users, Sparkles, ArrowRight, ArrowLeft, Palette, Briefcase, MapPin, Wrench, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EartsLogo } from '../components/EartsLogo';
import ThemeToggle from '../components/ThemeToggle';
import GoogleAuthButton from '../components/GoogleAuthButton';
import './Auth.css';

const ROLES = [
  'Painter',
  'Digital Artist',
  'Illustrator',
  'Sculptor',
  'Concept Artist',
  'Photographer',
  '3D & VFX Artist',
  'Printmaker',
  'Ceramicist',
  'Mixed Media',
  'Other'
];

export default function Signup() {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState('artist'); // 'artist' | 'collector'
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Painter',
    workplace: '',
    location: '',
    tools: '',
    bio: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Please provide your first and last name');
      return;
    }
    if (!form.email.trim()) {
      setError('Please provide a valid email address');
      return;
    }
    if (form.firstName.trim().length > 80 || form.lastName.trim().length > 80) {
      setError('Names must be 80 characters or fewer');
      return;
    }
    if (form.email.trim().length > 254) {
      setError('Email must be 254 characters or fewer');
      return;
    }
    if (form.password.length < 8 || form.password.length > 128) {
      setError('Password must be between 8 and 128 characters');
      return;
    }
    setError('');
    setStep(2);
  };

  const handlePrevStep = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register({
        ...form,
        accountType,
        role: accountType === 'collector' ? 'Collector' : form.role
      });
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
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
        {/* Left Informational Sidebar */}
        <div className="auth-left">
          <div className="auth-left-content">
            <span className="eyebrow">Join today — it's free</span>
            <h2>Your creative journey starts here</h2>
            <p>Create your profile, upload your first artwork, and connect with a global community of creators.</p>
            <div className="auth-perks">
              {[
                { icon: <Grid2x2 size={18} />, title: 'Build your gallery', desc: 'Upload and organise your artwork in one place' },
                { icon: <Users size={18} />, title: 'Connect and collaborate', desc: 'Meet artists who share your style and vision' },
                { icon: <Sparkles size={18} />, title: 'Sell your creations', desc: 'Turn your art into income through our marketplace' }
              ].map((p) => (
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
          <div className="auth-left-footer">
            <div className="auth-avatars">
              {['AM', 'MC', 'BJ', 'US'].map((a, i) => (
                <div
                  key={i}
                  className="mini-avatar"
                  style={{
                    background: `hsl(${i * 60 + 200}, 70%, 55%)`,
                    marginLeft: i > 0 ? '-10px' : 0
                  }}
                >
                  {a}
                </div>
              ))}
              <span>+12,000 creators joined</span>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="auth-right">
          {/* Stepper Header */}
          <div className="auth-stepper">
            <div className={`step-item ${step === 1 ? 'active' : 'completed'}`}>
              <div className="step-circle">{step > 1 ? <CheckCircle2 size={15} /> : '1'}</div>
              <span className="step-label">Credentials</span>
            </div>
            <div className="step-divider" />
            <div className={`step-item ${step === 2 ? 'active' : ''}`}>
              <div className="step-circle">2</div>
              <span className="step-label">Creative Profile</span>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* PHASE 1: CREDENTIALS */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="auth-form step-fade-in">
              <div className="auth-header-block">
                <h2>Create account</h2>
                <p className="auth-subtitle">Phase 1: Basic credentials & account intent</p>
              </div>

              <div className="form-group">
                <label>I want to...</label>
                <div className="account-type-toggle">
                  <button
                    type="button"
                    className={accountType === 'artist' ? 'active' : ''}
                    onClick={() => setAccountType('artist')}
                  >
                    Sell my art
                  </button>
                  <button
                    type="button"
                    className={accountType === 'collector' ? 'active' : ''}
                    onClick={() => setAccountType('collector')}
                  >
                    Just browse & collect
                  </button>
                </div>
              </div>

              <GoogleAuthButton accountType={accountType} role={form.role} onError={setError} />

              <div className="auth-divider">
                <span>or register with email</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input placeholder="John" value={form.firstName} onChange={set('firstName')} maxLength={80} autoComplete="given-name" required />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input placeholder="Doe" value={form.lastName} onChange={set('lastName')} maxLength={80} autoComplete="family-name" required />
                </div>
              </div>

              <div className="form-group">
                <label>Email address</label>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} maxLength={254} autoComplete="email" required />
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="•••••••• (8–128 characters)"
                    value={form.password}
                    onChange={set('password')}
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className="input-icon" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary auth-submit">
                <span>Continue to Creative Profile</span>
                <ArrowRight size={16} />
              </button>

              <p className="auth-switch">
                Already have an account? <Link to="/login">Sign in to Earts.</Link>
              </p>
            </form>
          )}

          {/* PHASE 2: ARTISTIC / CREATIVE PROFILE */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="auth-form step-fade-in">
              <div className="auth-header-block">
                <h2>{accountType === 'artist' ? 'Creative Identity' : 'Collector Profile'}</h2>
                <p className="auth-subtitle">
                  {accountType === 'artist'
                    ? 'Phase 2: Tell the community what you craft'
                    : 'Phase 2: Personalize your discovery feed'}
                </p>
              </div>

              {accountType === 'artist' ? (
                <>
                  <div className="form-group">
                    <label className="label-with-icon">
                      <Palette size={14} /> Creative Specialty
                    </label>
                    <select value={form.role} onChange={set('role')} required>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="label-with-icon">
                        <Briefcase size={14} /> Workplace / Studio
                      </label>
                      <input
                        placeholder="e.g. Freelance, Studio, Agency"
                        value={form.workplace}
                        onChange={set('workplace')}
                        maxLength={100}
                      />
                    </div>
                    <div className="form-group">
                      <label className="label-with-icon">
                        <MapPin size={14} /> Location / City
                      </label>
                      <input
                        placeholder="e.g. Paris, Tokyo, New York"
                        value={form.location}
                        onChange={set('location')}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label-with-icon">
                      <Wrench size={14} /> Primary Tools & Mediums
                    </label>
                    <input
                      placeholder="e.g. Procreate, Blender, Oil Paint, Clay"
                      value={form.tools}
                      onChange={set('tools')}
                      maxLength={300}
                    />
                  </div>

                  <div className="form-group">
                    <label>Short Tagline / Bio (Optional)</label>
                    <input
                      placeholder="e.g. Exploring surreal cyberpunk digital landscapes"
                      value={form.bio}
                      onChange={set('bio')}
                      maxLength={300}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="label-with-icon">
                      <Palette size={14} /> Favorite Art Mediums
                    </label>
                    <select value={form.role} onChange={set('role')}>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label-with-icon">
                      <MapPin size={14} /> Location / City
                    </label>
                    <input
                      placeholder="e.g. London, United Kingdom"
                      value={form.location}
                      onChange={set('location')}
                      maxLength={100}
                    />
                  </div>

                  <div className="form-group">
                    <label>Collecting Bio / Interests (Optional)</label>
                    <input
                      placeholder="e.g. Passionate collector of contemporary oil works and 3D art"
                      value={form.bio}
                      onChange={set('bio')}
                      maxLength={300}
                    />
                  </div>
                </>
              )}

              <div className="auth-stepper-actions">
                <button type="button" onClick={handlePrevStep} className="btn-secondary auth-back-btn">
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button type="submit" className="btn-primary auth-submit flex-1" disabled={loading}>
                  {loading ? 'Creating account...' : 'Complete & Join Earts ✦'}
                </button>
              </div>

              <p className="auth-switch">
                Already have an account? <Link to="/login">Sign in to Earts.</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
