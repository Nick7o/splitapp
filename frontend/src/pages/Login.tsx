import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import api from '../api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import type { ApiUser } from '../types/api';
import { getApiErrorMessage } from '../utils/apiError';
import { clearRedirectAfterLogin, getRedirectAfterLogin, setAuthSession } from '../utils/storage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_LOGIN_RELOAD_KEY = 'splitapp:google-login-reloaded';

interface AuthResponse {
  token: string;
  user: ApiUser;
}

interface GoogleLoginBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface GoogleLoginBoundaryState {
  hasError: boolean;
}

class GoogleLoginBoundary extends React.Component<GoogleLoginBoundaryProps, GoogleLoginBoundaryState> {
  state: GoogleLoginBoundaryState = { hasError: false };

  static getDerivedStateFromError(): GoogleLoginBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    try {
      if (sessionStorage.getItem(GOOGLE_LOGIN_RELOAD_KEY) !== '1') {
        sessionStorage.setItem(GOOGLE_LOGIN_RELOAD_KEY, '1');
        window.location.reload();
      }
    } catch {
      // Fall through to the visible fallback if session storage or reload is unavailable.
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const googleClientId = typeof GOOGLE_CLIENT_ID === 'string' && GOOGLE_CLIENT_ID.trim().length > 0
    ? GOOGLE_CLIENT_ID
    : null;
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleAuthSuccess = (token: string, user: ApiUser) => {
    setAuthSession(token, user);
    
    const redirectUrl = getRedirectAfterLogin();
    if (redirectUrl) {
      clearRedirectAfterLogin();
      navigate(redirectUrl);
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const res = await api.post<AuthResponse>('/auth/google', {
        credential: credentialResponse.credential
      });
      handleAuthSuccess(res.data.token, res.data.user);
    } catch (error) {
      console.error('Login failed', error);
      setError(t('login.googleFailed'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        const res = await api.post<AuthResponse>('/auth/register', { email, password, name });
        handleAuthSuccess(res.data.token, res.data.user);
      } else {
        const res = await api.post<AuthResponse>('/auth/login', { email, password });
        handleAuthSuccess(res.data.token, res.data.user);
      }
    } catch (err: unknown) {
      console.error('Auth failed', err);
      setError(getApiErrorMessage(err, t, 'login.authFailed'));
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-start overflow-x-hidden bg-background px-4 py-4 sm:px-6 sm:py-6 md:justify-center md:py-10">
      <div className="w-full max-w-md sm:max-w-lg">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher className="shadow-[0_10px_28px_rgba(2,6,23,0.22)]" />
        </div>
        <div className="app-card-strong w-full p-5 text-center sm:p-6 md:p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary-fixed/20 bg-primary/16 text-primary-fixed shadow-inner sm:mb-5 sm:h-14 sm:w-14">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
          <h1 className="mb-2 font-headline text-3xl font-extrabold tracking-normal text-on-surface sm:text-4xl">{t('app.name')}</h1>
          <p className="font-body mb-6 text-sm text-on-surface-variant sm:mb-8 sm:text-base">{t('login.tagline')}</p>

          {error && <div className="mb-4 rounded-xl bg-error/10 p-3 text-sm font-medium text-error">{error}</div>}

          <form onSubmit={handleSubmit} className="mb-5 space-y-3 text-left sm:mb-6 sm:space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">{t('login.name')}</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="app-input py-2.5 sm:py-3"
                  placeholder={t('login.yourName')}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">{t('login.email')}</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="app-input py-2.5 sm:py-3"
                placeholder={t('login.emailPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">{t('login.password')}</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="app-input py-2.5 sm:py-3"
                placeholder="********"
              />
            </div>
            <button 
              type="submit"
              className="app-button-primary mt-2 w-full"
            >
              {isRegistering ? t('login.signUp') : t('login.logIn')}
            </button>
          </form>

          {googleClientId && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-outline-variant/30"></div>
                <span className="text-xs text-on-surface-variant uppercase tracking-normal font-bold">{t('login.or')}</span>
                <div className="flex-1 h-px bg-outline-variant/30"></div>
              </div>

              <div className="mx-auto mb-5 flex justify-center sm:mb-6">
                <GoogleLoginBoundary
                  fallback={(
                    <div className="w-full rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-3 text-center text-sm font-semibold text-on-surface-variant">
                      <p>{t('login.googleUnavailable')}</p>
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-3 rounded-lg border border-white/10 bg-surface-container-high px-3 py-2 text-xs font-bold text-on-surface transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
                      >
                        {t('login.refreshPage')}
                      </button>
                    </div>
                  )}
                >
                  <GoogleOAuthProvider clientId={googleClientId}>
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => {
                        setError(t('login.googleFailed'));
                      }}
                      auto_select={false}
                      use_fedcm_for_prompt={false}
                      use_fedcm_for_button={false}
                      type="icon"
                      theme="filled_black"
                      shape="circle"
                      size="large"
                      containerProps={{
                        className: 'google-login-slot',
                        style: { width: 40, height: 40 },
                      }}
                    />
                  </GoogleOAuthProvider>
                </GoogleLoginBoundary>
              </div>
            </>
          )}

          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-secondary transition-colors hover:text-tertiary-container focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 focus:ring-offset-2 focus:ring-offset-background"
          >
            {isRegistering ? t('login.alreadyHave') : t('login.dontHave')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
