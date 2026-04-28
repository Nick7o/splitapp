import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppLayout from '../components/AppLayout';
import api from '../api';
import { AVATAR_BY_KEY, AVATARS } from '../data/avatars';
import { SUPPORTED_LANGUAGES, type SupportedLang } from '../i18n';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarKey?: string | null;
  bio?: string | null;
  hasPassword: boolean;
}

interface ApiError {
  response?: {
    data?: {
      Error?: string;
      error?: string;
      message?: string;
      detail?: string;
      Code?: string;
      code?: string;
    };
  };
}

const BIO_LIMIT = 280;

const getStoredUser = (): Partial<UserProfile> => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError;
  return (
    apiError.response?.data?.detail ||
    apiError.response?.data?.message ||
    apiError.response?.data?.Error ||
    apiError.response?.data?.error ||
    apiError.response?.data?.Code ||
    apiError.response?.data?.code ||
    fallback
  );
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const storedUser = useMemo(() => getStoredUser(), []);
  const [name, setName] = useState(storedUser.name ?? '');
  const [email, setEmail] = useState(storedUser.email ?? '');
  const [bio, setBio] = useState(storedUser.bio ?? '');
  const [avatarKey, setAvatarKey] = useState(storedUser.avatarKey ?? '');
  const [hasPassword, setHasPassword] = useState<boolean | null>(
    typeof storedUser.hasPassword === 'boolean' ? storedUser.hasPassword : null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get<UserProfile>('/users/me');
        const user = response.data;
        setName(user.name);
        setEmail(user.email);
        setBio(user.bio ?? '');
        setAvatarKey(user.avatarKey ?? '');
        setHasPassword(user.hasPassword);
        localStorage.setItem('user', JSON.stringify(user));
      } catch (error) {
        setProfileError(getErrorMessage(error, t('profile.loadFailed')));
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [t]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const selectedAvatar = avatarKey ? AVATAR_BY_KEY[avatarKey] : null;
  const previewInitial = (name || email || 'U').charAt(0).toUpperCase();
  const remainingBioChars = BIO_LIMIT - bio.length;

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) {
      setProfileError(t('profile.nameRequired'));
      return;
    }

    setSaving(true);
    try {
      const response = await api.put<UserProfile>('/users/me', {
        name: name.trim(),
        bio: bio.trim() || null,
        avatarKey: avatarKey || null
      });
      const user = response.data;
      setName(user.name);
      setEmail(user.email);
      setBio(user.bio ?? '');
      setAvatarKey(user.avatarKey ?? '');
      setHasPassword(user.hasPassword);
      localStorage.setItem('user', JSON.stringify(user));
      setProfileSuccess(t('profile.saved'));
    } catch (error) {
      setProfileError(getErrorMessage(error, t('profile.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t('profile.allPasswordFieldsRequired'));
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t('profile.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.passwordMismatch'));
      return;
    }

    setPasswordSaving(true);
    try {
      await api.post('/users/me/password', {
        currentPassword,
        newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(t('profile.passwordUpdated'));
    } catch (error) {
      setPasswordError(getErrorMessage(error, t('profile.passwordUpdateFailed')));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <AppLayout title={t('profile.title')} titleVariant="hidden" maxWidthClassName="max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)] lg:items-start">
        <form onSubmit={handleProfileSubmit} className="app-card-strong p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl text-4xl font-bold text-on-surface shadow-lg ${selectedAvatar?.bg ?? 'bg-primary text-on-primary shadow-primary/20'}`}>
              {selectedAvatar ? <span aria-hidden="true">{selectedAvatar.emoji}</span> : previewInitial}
            </div>
            <div className="min-w-0">
              <h2 className="font-headline text-2xl font-bold text-on-surface">{name || t('profile.yourProfile')}</h2>
              <p className="mt-1 truncate text-on-surface-variant">{email}</p>
              {loading ? <p className="mt-2 text-sm text-on-surface-variant">{t('common.loading')}</p> : null}
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            <div>
              <label className="mb-1 block text-sm font-semibold text-on-surface-variant">{t('profile.name')}</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="app-input"
                maxLength={80}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-on-surface-variant">{t('profile.bio')}</label>
                <span className="font-label text-xs font-semibold text-on-surface-variant">{bio.length} / {BIO_LIMIT}</span>
              </div>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                className="app-input min-h-28 resize-y"
                maxLength={BIO_LIMIT}
              />
              <p className={`mt-1 text-xs font-medium ${remainingBioChars < 20 ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                {t('profile.remainingChars', { count: remainingBioChars })}
              </p>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-on-surface-variant">{t('profile.avatar')}</p>
              <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
                {AVATARS.map((avatar) => {
                  const selected = avatarKey === avatar.key;

                  return (
                    <button
                      key={avatar.key}
                      type="button"
                      onClick={() => setAvatarKey(selected ? '' : avatar.key)}
                      className={`flex aspect-square items-center justify-center rounded-2xl border text-2xl transition-all focus:outline-none focus:ring-2 focus:ring-primary-fixed/60 ${
                        selected
                          ? 'border-primary-fixed/35 bg-primary/16 text-primary-fixed shadow-inner'
                          : `border-outline-variant/40 ${avatar.bg} hover:border-primary-fixed/60`
                      }`}
                      aria-label={avatar.label}
                      title={avatar.label}
                    >
                      <span aria-hidden="true">{avatar.emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {profileError ? <div className="mt-5 rounded-xl bg-error/10 p-3 text-sm font-medium text-error">{profileError}</div> : null}
          {profileSuccess ? <div className="mt-5 rounded-xl bg-secondary-container p-3 text-sm font-semibold text-secondary">{profileSuccess}</div> : null}

          <div className="mt-8 flex justify-end">
            <button type="submit" className="app-button-primary" disabled={saving || loading}>
              <span className="material-symbols-outlined">save</span>
              {saving ? t('common.saving') : t('profile.saveProfile')}
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <section className="app-card p-5 sm:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">{t('profile.language.title')}</h3>
              </div>
              <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-surface-container p-1">
                {SUPPORTED_LANGUAGES.map((language) => {
                  const selected = i18n.resolvedLanguage === language || i18n.language === language;

                  return (
                    <button
                      key={language}
                      type="button"
                      onClick={() => {
                        void i18n.changeLanguage(language as SupportedLang);
                      }}
                      className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                        selected
                          ? 'bg-primary text-on-primary'
                          : 'text-on-surface-variant hover:bg-white/10 hover:text-on-surface'
                      }`}
                    >
                      {t(`profile.language.${language}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="app-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container text-secondary">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">{t('profile.password')}</h3>
                <p className="text-sm text-on-surface-variant">{t('profile.passwordDescription')}</p>
              </div>
            </div>

            {hasPassword === true ? (
              <form onSubmit={handlePasswordSubmit} className="grid gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-on-surface-variant">{t('profile.currentPassword')}</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="app-input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-on-surface-variant">{t('profile.newPassword')}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="app-input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-on-surface-variant">{t('profile.confirmPassword')}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="app-input"
                  />
                </div>

                {passwordError ? <div className="rounded-xl bg-error/10 p-3 text-sm font-medium text-error">{passwordError}</div> : null}
                {passwordSuccess ? <div className="rounded-xl bg-secondary-container p-3 text-sm font-semibold text-secondary">{passwordSuccess}</div> : null}

                <div className="flex justify-end">
                  <button type="submit" className="app-button-secondary" disabled={passwordSaving}>
                    <span className="material-symbols-outlined">key</span>
                    {passwordSaving ? t('profile.updating') : t('profile.updatePassword')}
                  </button>
                </div>
              </form>
            ) : hasPassword === false ? (
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container/60 p-4 text-sm font-medium text-on-surface-variant">
                {t('profile.googlePasswordNote')}
              </div>
            ) : (
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container/60 p-4 text-sm font-medium text-on-surface-variant">
                {t('profile.loadingPasswordSettings')}
              </div>
            )}
          </section>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-error/20 bg-error/10 px-6 py-4 font-body text-base font-bold text-error transition-colors hover:bg-error/20 focus:outline-none focus:ring-2 focus:ring-error/60 focus:ring-offset-2 focus:ring-offset-background"
          >
            <span className="material-symbols-outlined">logout</span>
            {t('profile.logout')}
          </button>
        </aside>
      </div>
    </AppLayout>
  );
};

export default Profile;
