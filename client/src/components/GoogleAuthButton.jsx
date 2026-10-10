import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleAuthButton({ accountType = 'artist', role = 'Artist', onError }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleCredentialResponse = useCallback(async ({ credential } = {}) => {
    if (!credential) {
      onError?.('Google did not return a sign-in credential. Please try again.');
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle({ credential, accountType, role });
      navigate('/feed');
    } catch (error) {
      onError?.(error.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [accountType, loginWithGoogle, navigate, onError, role]);

  useEffect(() => {
    if (!googleClientId || !buttonRef.current) return undefined;
    let initialized = false;
    const initializeGoogle = () => {
      if (initialized || !window.google?.accounts?.id || !buttonRef.current) return;
      initialized = true;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rect',
        width: Math.min(buttonRef.current.clientWidth || 400, 400),
        logo_alignment: 'center',
      });
      setReady(true);
    };

    initializeGoogle();
    const interval = window.setInterval(initializeGoogle, 100);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      if (!initialized) setLoadError(true);
    }, 10000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [googleClientId, handleGoogleCredentialResponse]);

  return (
    <div className="google-auth-container">
      <div ref={buttonRef} className={`google-gsi-button${ready ? '' : ' is-loading'}`} aria-label="Continue with Google" />
      {!googleClientId && <p className="google-auth-help">Google sign-in isn’t configured yet.</p>}
      {googleClientId && loadError && <p className="google-auth-help">Google sign-in couldn’t load. Please use email and password instead.</p>}
      {googleClientId && !ready && <span className="sr-only">Loading Google sign-in…</span>}
      {loading && <div className="google-auth-loading">Signing in with Google…</div>}
    </div>
  );
}
