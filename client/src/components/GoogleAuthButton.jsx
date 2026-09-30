import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleAuthButton({ accountType = 'artist', role = 'Artist', onError }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (googleClientId && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (err) {
        console.warn('Google GSI initialization warning:', err);
      }
    }
  }, [googleClientId]);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response.credential) return;
    setLoading(true);
    try {
      await loginWithGoogle({
        credential: response.credential,
        accountType,
        role
      });
      navigate('/feed');
    } catch (err) {
      if (onError) onError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    if (googleClientId && window.google) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to token client or demo if prompt is dismissed
            setShowDemoModal(true);
          }
        });
        return;
      } catch (e) {
        console.warn('Google prompt fallback:', e);
      }
    }
    // If no client ID configured yet, open quick test Google selector
    setShowDemoModal(true);
  };

  const handleDemoGoogleSignIn = async (profile) => {
    setLoading(true);
    setShowDemoModal(false);
    try {
      await loginWithGoogle({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
        googleId: profile.googleId,
        accountType,
        role
      });
      navigate('/feed');
    } catch (err) {
      if (onError) onError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="google-btn"
        onClick={handleGoogleClick}
        disabled={loading}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
      </button>

      {/* Demo Google Account Switcher Modal (Active when no Google Client ID or for instant testing) */}
      {showDemoModal && (
        <div className="google-demo-overlay" onClick={() => setShowDemoModal(false)}>
          <div className="google-demo-modal" onClick={e => e.stopPropagation()}>
            <div className="google-demo-header">
              <svg width="24" height="24" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              <div>
                <h4>Sign in with Google</h4>
                <p>Choose a Google account to continue to <strong>Earts</strong></p>
              </div>
            </div>

            <div className="google-demo-list">
              <button
                type="button"
                className="google-account-item"
                onClick={() => handleDemoGoogleSignIn({
                  email: 'alex.creator@gmail.com',
                  firstName: 'Alex',
                  lastName: 'Vance',
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  googleId: 'google_1029384756'
                })}
              >
                <div className="google-acc-avatar" style={{ background: '#5B4BF5' }}>A</div>
                <div className="google-acc-info">
                  <strong>Alex Vance</strong>
                  <span>alex.creator@gmail.com</span>
                </div>
              </button>

              <button
                type="button"
                className="google-account-item"
                onClick={() => handleDemoGoogleSignIn({
                  email: 'maya.art@gmail.com',
                  firstName: 'Maya',
                  lastName: 'Lin',
                  avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
                  googleId: 'google_9876543210'
                })}
              >
                <div className="google-acc-avatar" style={{ background: '#FF6B9D' }}>M</div>
                <div className="google-acc-info">
                  <strong>Maya Lin</strong>
                  <span>maya.art@gmail.com</span>
                </div>
              </button>

              <button
                type="button"
                className="google-account-item"
                onClick={() => handleDemoGoogleSignIn({
                  email: `creator_${Date.now().toString().slice(-4)}@gmail.com`,
                  firstName: 'Google',
                  lastName: 'Artist',
                  avatar: null,
                  googleId: `google_${Date.now()}`
                })}
              >
                <div className="google-acc-avatar" style={{ background: '#10B981' }}>+</div>
                <div className="google-acc-info">
                  <strong>Use another Google account</strong>
                  <span>Auto-generates instant profile</span>
                </div>
              </button>
            </div>

            <div className="google-demo-footer">
              <span>To use live OAuth in production, set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env</code></span>
              <button type="button" className="google-cancel-btn" onClick={() => setShowDemoModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
