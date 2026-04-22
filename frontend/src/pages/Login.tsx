import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import api from '../api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleAuthSuccess = (token: string, user: any) => {
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await api.post('/auth/google', {
        credential: credentialResponse.credential
      });
      handleAuthSuccess(res.data.token, res.data.user);
    } catch (error) {
      console.error('Login failed', error);
      setError('Logowanie przez Google nie powiodło się.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        const res = await api.post('/auth/register', { email, password, name });
        handleAuthSuccess(res.data.token, res.data.user);
      } else {
        const res = await api.post('/auth/login', { email, password });
        handleAuthSuccess(res.data.token, res.data.user);
      }
    } catch (err: any) {
      console.error('Auth failed', err);
      setError(err.response?.data?.message || 'Wystąpił błąd autoryzacji.');
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md bg-surface-container-lowest backdrop-blur-lg border border-white/60 rounded-2xl p-8 shadow-soft text-center">
          <h1 className="font-headline font-extrabold text-primary tracking-tighter text-4xl mb-2">SplitApp</h1>
          <p className="text-on-surface-variant font-body mb-8">Zarządzaj wydatkami grupowymi bez stresu.</p>
          
          {error && <div className="mb-4 p-3 bg-error/10 text-error rounded-xl text-sm font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4 mb-6 text-left">
            {isRegistering && (
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">Imię</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="Twoje imię"
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
                className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="adres@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">Hasło</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="********"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container transition-colors shadow-md shadow-primary/20 mt-2"
            >
              {isRegistering ? 'Zarejestruj się' : 'Zaloguj się'}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-outline-variant/30"></div>
            <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">LUB</span>
            <div className="flex-1 h-px bg-outline-variant/30"></div>
          </div>

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError('Logowanie przez Google nie powiodło się.');
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
            className="text-sm font-semibold text-secondary hover:text-secondary-container transition-colors"
          >
            {isRegistering ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
          </button>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
