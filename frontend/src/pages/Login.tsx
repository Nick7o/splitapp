import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import api from '../api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleAuthSuccess = (token: string, user: AuthUser) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      localStorage.removeItem('redirectAfterLogin');
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
      setError('Google login failed.');
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
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Authentication failed.');
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="app-card-strong w-full max-w-md p-6 text-center sm:p-8">
          <h1 className="mb-2 font-headline text-4xl font-extrabold tracking-tighter text-secondary">SplitApp</h1>
          <p className="text-on-surface-variant font-body mb-8">Manage group expenses without the stress.</p>
          
          {error && <div className="mb-4 p-3 bg-error/10 text-error rounded-xl text-sm font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4 mb-6 text-left">
            {isRegistering && (
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="app-input"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="app-input"
                placeholder="adres@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">Password</label>
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
              {isRegistering ? 'Sign up' : 'Log in'}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-outline-variant/30"></div>
            <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">OR</span>
            <div className="flex-1 h-px bg-outline-variant/30"></div>
          </div>

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError('Google login failed.');
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
            className="text-sm font-semibold text-secondary transition-colors hover:text-tertiary-container focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:ring-offset-2 focus:ring-offset-background rounded-lg px-2 py-1"
          >
            {isRegistering ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
