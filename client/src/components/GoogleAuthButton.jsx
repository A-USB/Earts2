import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// mode picks the wording: 'signin' -> "Sign in with Google", 'signup' -> "Sign up with Google", otherwise "Continue with Google"
const GOOGLE_TEXT = { signin: 'signin_with', signup: 'signup_with', continue: 'continue_with' };
const GOOGLE_LABEL = { signin: 'Sign in with Google', signup: 'Sign up with Google', continue: 'Continue with Google' };

export default function GoogleAuthButton({ accountType = 'artist', role = 'Artist', onError, redirectTo, mode = 'continue' }) {
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
      const result = await loginWithGoogle({ credential, accountType, role });
      navigate(result.isNewUser ? '/choose-avatar' : (redirectTo || '/feed'));
    } catch (error) {
      onError?.(error.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [accountType, loginWithGoogle, navigate, onError, role, redirectTo]);

  useEffect(() => {
    if (!googleClientId || !buttonRef.current) return undefined;
    let initialized = false;
    let renderedWidth = 0;
    let resizeTimer = null;
    let observer = null;

    // Google's button is a fixed-width iframe (200 to 400px), so redraw it to fit its container
    const drawButton = () => {
      const el = buttonRef.current;
      if (!el || !window.google?.accounts?.id) return;
      const available = el.clientWidth || 400;
      renderedWidth = available;
      window.google.accounts.id.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: GOOGLE_TEXT[mode] || 'continue_with',
        shape: 'rect',
        width: Math.max(200, Math.min(available, 400)),
        logo_alignment: 'center',
      });
    };

    const initializeGoogle = () => {
      if (initialized || !window.google?.accounts?.id || !buttonRef.current) return;
      initialized = true;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      drawButton();
      setReady(true);

      if (typeof ResizeObserver !== 'undefined' && buttonRef.current) {
        observer = new ResizeObserver(() => {
          const el = buttonRef.current;
          if (!el || Math.abs((el.clientWidth || 0) - renderedWidth) < 8) return;
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(drawButton, 150);
        });
        observer.observe(buttonRef.current);
      }
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
      window.clearTimeout(resizeTimer);
      observer?.disconnect();
    };
  }, [googleClientId, handleGoogleCredentialResponse, mode]);

  return (
    <div className="google-auth-container" data-mode={mode}>
      <div
        ref={buttonRef}
        className={`google-gsi-button${ready ? '' : ' is-loading'}${loading ? ' is-signing-in' : ''}`}
        aria-label={GOOGLE_LABEL[mode] || GOOGLE_LABEL.continue}
        aria-hidden={loading}
      />
      {!googleClientId && <p className="google-auth-help">Google sign-in isn’t configured yet.</p>}
      {googleClientId && loadError && <p className="google-auth-help">Google sign-in couldn’t load. Please use email and password instead.</p>}
      {googleClientId && !ready && <span className="sr-only">Loading Google sign-in…</span>}
      {loading && <div className="google-auth-loading" role="status">Signing in with Google…</div>}
    </div>
  );
}
