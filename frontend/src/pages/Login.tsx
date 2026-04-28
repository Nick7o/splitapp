import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import api from '../api';
import type { ApiUser } from '../types/api';
import { getApiErrorMessage } from '../utils/apiError';
import { clearRedirectAfterLogin, getRedirectAfterLogin, setAuthSession } from '../utils/storage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface AuthResponse {
  token: string;
  user: ApiUser;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-5">
        <div className="app-card-strong w-full max-w-md p-6 text-center sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-fixed/20 bg-primary/16 text-primary-fixed shadow-inner">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
          <h1 className="mb-2 font-headline text-4xl font-extrabold tracking-tight text-on-surface">{t('app.name')}</h1>
          <p className="text-on-surface-variant font-body mb-8">{t('login.tagline')}</p>
          
          {error && <div className="mb-4 p-3 bg-error/10 text-error rounded-xl text-sm font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4 mb-6 text-left">
            {isRegistering && (
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">{t('login.name')}</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="app-input"
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
                className="app-input"
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
                className="app-input"
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

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-outline-variant/30"></div>
            <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">{t('login.or')}</span>
            <div className="flex-1 h-px bg-outline-variant/30"></div>
          </div>

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError(t('login.googleFailed'));
              }}
              useOneTap
              theme="filled_black"
              shape="pill"
            />
          </div>

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
    </GoogleOAuthProvider>
  );
};

export default Login;
