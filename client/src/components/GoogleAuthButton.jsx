import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleAuthButton({ accountType = 'artist', role = 'Artist', onError, redirectTo }) {
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
    let drawnWidth = 0;
    let resizeObserver;

    // Google draws a fixed-width iframe (200 to 400px). Fit it to the space the card actually has,
    // and redraw whenever that space changes (rotation, window resize, keyboard, breakpoints).
    const drawButton = () => {
      const host = buttonRef.current;
      if (!host || !window.google?.accounts?.id) return;
      const available = Math.floor(host.parentElement?.clientWidth || host.clientWidth || 400);
      const width = Math.max(200, Math.min(available, 400));
      if (width === drawnWidth) return;
      drawnWidth = width;
      host.innerHTML = '';
      window.google.accounts.id.renderButton(host, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rect',
        width,
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
      if (typeof ResizeObserver !== 'undefined' && buttonRef.current.parentElement) {
        let frame = 0;
        resizeObserver = new ResizeObserver(() => {
          window.cancelAnimationFrame(frame);
          frame = window.requestAnimationFrame(drawButton);
        });
        resizeObserver.observe(buttonRef.current.parentElement);
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
      resizeObserver?.disconnect();
    };
  }, [googleClientId, handleGoogleCredentialResponse]);

  return (
    <div className="google-auth-container">
      <div
        ref={buttonRef}
        className={`google-gsi-button${ready ? '' : ' is-loading'}${loading ? ' is-signing-in' : ''}`}
        aria-label="Continue with Google"
        aria-hidden={loading}
      />
      {!googleClientId && <p className="google-auth-help">Google sign-in isn’t configured yet.</p>}
      {googleClientId && loadError && <p className="google-auth-help">Google sign-in couldn’t load. Please use email and password instead.</p>}
      {googleClientId && !ready && <span className="sr-only">Loading Google sign-in…</span>}
      {loading && <div className="google-auth-loading" role="status">Signing in with Google…</div>}
    </div>
  );
}
