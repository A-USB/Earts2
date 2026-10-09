import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Grid2x2, Users, Sparkles, ArrowRight, ArrowLeft, Palette, Briefcase, MapPin, Wrench, CheckCircle2, Check, X, Compass } from 'lucide-react';
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

const EXPLORER_INTERESTS = ['Painting', 'Digital Art', 'Illustration', 'Photography', 'Sculpture', 'Mixed Media', 'Watercolour', 'Abstract'];

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
    bio: '',
    interests: []
  });
  const [showPass, setShowPass] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setError('');
  };

  const toggleInterest = (interest) => {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : current.interests.length < 5 ? [...current.interests, interest] : current.interests
    }));
  };

  const passwordChecks = [
    { label: 'Between 7 and 17 characters', valid: form.password.length >= 7 && form.password.length <= 17 },
    { label: 'At least one number', valid: /\d/.test(form.password) },
    { label: 'At least one special character', valid: /[^A-Za-z0-9\s]/.test(form.password) }
  ];
  const passwordValid = passwordChecks.every((check) => check.valid);
  const emailValid = form.email.trim().length <= 60 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Please provide your first and last name');
      return;
    }
    if (form.firstName.trim().length > 30 || form.lastName.trim().length > 30) {
      setError('First and last names must be 30 characters or fewer');
      return;
    }
    if (!emailValid) {
      setEmailTouched(true);
      setError('Enter a valid email address with no more than 60 characters');
      return;
    }
    if (!passwordValid) {
      setPasswordTouched(true);
      setError('Complete all password requirements before continuing');
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
      const profile = accountType === 'artist'
        ? { role: form.role, workplace: form.workplace, location: form.location, tools: form.tools, bio: form.bio }
        : { role: 'Collector', location: form.location, bio: form.bio, interests: form.interests };
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        accountType,
        ...profile
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
            <h2>{accountType === 'artist' ? 'Your creative journey starts here' : 'Discover art on your terms'}</h2>
            <p>{accountType === 'artist'
              ? 'Create your profile, share your artwork, and connect with a global community of creators.'
              : 'Explore original artwork, follow artists, and save the pieces that inspire you.'}</p>
            <div className="auth-perks">
              {(accountType === 'artist' ? [
                { icon: <Grid2x2 size={18} />, title: 'Build your gallery', desc: 'Upload and organise your artwork in one place' },
                { icon: <Users size={18} />, title: 'Connect and collaborate', desc: 'Meet artists who share your style and vision' },
                { icon: <Sparkles size={18} />, title: 'Sell your creations', desc: 'Turn your art into income through our marketplace' }
              ] : [
                { icon: <Grid2x2 size={18} />, title: 'Explore the marketplace', desc: 'Find original work across styles and mediums' },
                { icon: <Users size={18} />, title: 'Follow artists', desc: 'Keep up with creators and their latest work' },
                { icon: <Sparkles size={18} />, title: 'Save what inspires you', desc: 'Build a personal collection of favorite pieces' }
              ]).map((p) => (
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
              <span className="step-label">{accountType === 'artist' ? 'Creative Profile' : 'Explorer Profile'}</span>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* PHASE 1: CREDENTIALS */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="auth-form step-fade-in" noValidate>
              <div className="auth-header-block">
                <h2>Create account</h2>
                <p className="auth-subtitle">Phase 1: Choose how you want to use Earts</p>
              </div>

              <div className="form-group">
                <label>I want to...</label>
                <div className="account-type-cards">
                  <button
                    type="button"
                    className={`account-type-card ${accountType === 'artist' ? 'active' : ''}`}
                    aria-pressed={accountType === 'artist'}
                    onClick={() => setAccountType('artist')}
                  >
                    <Palette size={21} />
                    <strong>Artist</strong>
                    <span>Share and sell your artwork</span>
                  </button>
                  <button
                    type="button"
                    className={`account-type-card ${accountType === 'collector' ? 'active' : ''}`}
                    aria-pressed={accountType === 'collector'}
                    onClick={() => setAccountType('collector')}
                  >
                    <Compass size={21} />
                    <strong>Explorer</strong>
                    <span>Discover art and follow artists</span>
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
                  <input placeholder="John" value={form.firstName} onChange={set('firstName')} maxLength={30} autoComplete="given-name" required />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input placeholder="Doe" value={form.lastName} onChange={set('lastName')} maxLength={30} autoComplete="family-name" required />
                </div>
              </div>

              <div className="form-group">
                <label>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  onBlur={() => setEmailTouched(true)}
                  maxLength={60}
                  autoComplete="email"
                  aria-invalid={emailTouched && !emailValid}
                  aria-describedby={emailTouched && !emailValid ? 'signup-email-error' : undefined}
                  required
                />
                {emailTouched && !emailValid && (
                  <div className="signup-validation-card signup-validation-error" id="signup-email-error" role="alert">
                    Enter a valid email address (maximum 60 characters).
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="7–17 characters, number + special sign"
                    value={form.password}
                    onChange={set('password')}
                    onFocus={() => setPasswordTouched(true)}
                    minLength={7}
                    maxLength={17}
                    autoComplete="new-password"
                    aria-invalid={passwordTouched && !passwordValid}
                    aria-describedby={passwordTouched && !passwordValid ? 'signup-password-checklist' : undefined}
                    required
                  />
                  <button type="button" className="input-icon" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordTouched && !passwordValid && (
                  <div className="signup-validation-card signup-password-checklist" id="signup-password-checklist" role="status" aria-live="polite">
                    <strong>Password requirements</strong>
                    <ul>
                      {passwordChecks.map((check) => (
                        <li key={check.label} className={check.valid ? 'is-valid' : 'is-invalid'}>
                          {check.valid ? <Check size={15} aria-hidden="true" /> : <X size={15} aria-hidden="true" />}
                          <span>{check.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
                <h2>{accountType === 'artist' ? 'Creative Identity' : 'Explorer Profile'}</h2>
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
                    <label className="label-with-icon"><Palette size={14} /> What art are you interested in? <span>(Optional, choose up to 5)</span></label>
                    <div className="signup-interest-options">
                      {EXPLORER_INTERESTS.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          className={`signup-interest-chip ${form.interests.includes(interest) ? 'active' : ''}`}
                          aria-pressed={form.interests.includes(interest)}
                          onClick={() => toggleInterest(interest)}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
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
                    <label>What are you hoping to discover? <span>(Optional)</span></label>
                    <input
                      placeholder="Tell artists what you enjoy seeing"
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
