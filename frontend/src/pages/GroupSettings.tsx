import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import AppLayout from '../components/AppLayout';
import CurrencyPicker from '../components/CurrencyPicker';
import MemberProfileDialog from '../components/MemberProfileDialog';
import { AVATAR_BY_KEY } from '../data/avatars';
import { GROUP_AVATARS } from '../data/groupAvatars';
import type { ApiGroup, ApiGroupDetails, ApiGroupMember } from '../types/api';
import { getApiErrorMessage } from '../utils/apiError';
import { getStoredUser } from '../utils/storage';

const GroupSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [group, setGroup] = useState<ApiGroup | null>(null);
  const [members, setMembers] = useState<ApiGroupMember[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarKey, setAvatarKey] = useState<string>('');
  const [currency, setCurrency] = useState('PLN');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<ApiGroupMember | null>(null);

  const currentUserId = useMemo(() => {
    try {
      return getStoredUser().id ?? '';
    } catch {
      return '';
    }
  }, []);

  const isOwner = Boolean(group && currentUserId && group.ownerId === currentUserId);

  const fetchData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const [groupResponse, membersResponse] = await Promise.all([
        api.get<ApiGroupDetails>(`/groups/${id}`),
        api.get<ApiGroupMember[]>(`/groups/${id}/members`)
      ]);

      const fetchedGroup = groupResponse.data;
      setGroup(fetchedGroup);
      setMembers(membersResponse.data);
      setName(fetchedGroup.name ?? '');
      setDescription(fetchedGroup.description ?? '');
      setAvatarKey(fetchedGroup.avatarKey ?? '');
      setCurrency(fetchedGroup.defaultCurrency ?? 'PLN');
    } catch (err) {
      console.error('Failed to fetch group settings', err);
      setError(t('groupSettings.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resolveRoleLabel = (member: ApiGroupMember): string => {
    if (member.userId === group?.ownerId) return t('groupSettings.owner');
    if (member.role === 1) return t('groupSettings.admin');
    return t('groupSettings.member');
  };

  const maskEmail = (value: string): string => {
    const [localPart, domain] = value.split('@');
    if (!localPart || !domain) return value;

    const visibleLocal = localPart.length <= 2 ? localPart : `${localPart.slice(0, 2)}...`;
    const [domainName, ...domainRest] = domain.split('.');
    const visibleDomain = domainName.length <= 3 ? domainName : `${domainName.slice(0, 3)}...`;

    return `${visibleLocal}@${visibleDomain}${domainRest.length > 0 ? `.${domainRest[domainRest.length - 1]}` : ''}`;
  };

  const handleSave = async () => {
    if (!id || !group || !isOwner) return;

    setSaving(true);
    setError(null);
    setBanner(null);

    try {
      const response = await api.put<ApiGroup>(`/groups/${id}`, {
        name,
        description,
        avatarKey: avatarKey || null,
        defaultCurrency: currency
      });

      setGroup(response.data);
      setBanner(t('groupSettings.saved'));
    } catch (err) {
      console.error('Failed to update group settings', err);
      setError(getApiErrorMessage(err, t, 'groupSettings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleRoleToggle = async (member: ApiGroupMember) => {
    if (!id || !isOwner || member.userId === group?.ownerId) return;

    setError(null);
    setBanner(null);

    try {
      const newRole = member.role === 1 ? 0 : 1;
      await api.put(`/groups/${id}/members/${member.userId}/role`, { role: newRole });
      await fetchData();
      setBanner(t('groupSettings.roleUpdated'));
    } catch (err) {
      console.error('Failed to update member role', err);
      setError(getApiErrorMessage(err, t, 'groupSettings.roleUpdateFailed'));
    }
  };

  const handleRemoveMember = async (member: ApiGroupMember) => {
    if (!id || !isOwner || member.userId === group?.ownerId) return;

    const confirmed = window.confirm(t('groupSettings.removeConfirm', { name: member.name }));
    if (!confirmed) return;

    setError(null);
    setBanner(null);

    try {
      await api.delete(`/groups/${id}/members/${member.userId}`);
      await fetchData();
      setBanner(t('groupSettings.memberRemoved'));
    } catch (err) {
      console.error('Failed to remove member', err);
      setError(getApiErrorMessage(err, t, 'groupSettings.removeFailed'));
    }
  };

  const handleLeaveGroup = async () => {
    if (!id || !currentUserId || isOwner) return;

    const confirmed = window.confirm(t('groupSettings.leaveConfirm'));
    if (!confirmed) return;

    setError(null);

    try {
      await api.delete(`/groups/${id}/members/${currentUserId}`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to leave group', err);
      setError(getApiErrorMessage(err, t, 'groupSettings.leaveFailed'));
    }
  };

  if (loading) {
    return (
      <AppLayout title={t('groupSettings.title')} backTo={`/groups/${id ?? ''}`}>
        <div className="py-20 text-center text-on-surface-variant">{t('common.loading')}</div>
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout title={t('groupSettings.title')} backTo={`/groups/${id ?? ''}`}>
        <div className="py-20 text-center text-error">{t('common.groupNotFound')}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t('groupSettings.title')} backTo={`/groups/${id}`}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-xl border border-error/40 bg-error/10 p-4 text-sm font-semibold text-error">
            {error}
          </div>
        )}
        {banner && (
          <div className="rounded-xl border border-primary-fixed/30 bg-primary/12 p-4 text-sm font-semibold text-primary-fixed">
            {banner}
          </div>
        )}
        {!isOwner && (
          <div className="rounded-xl border border-secondary/30 bg-secondary-container p-4 text-sm font-semibold text-secondary">
            {t('groupSettings.readOnlyDescription')}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.78fr)] xl:items-start">
        <section className={`app-card p-5 sm:p-6 ${!isOwner ? 'opacity-80' : ''}`}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-headline text-2xl font-bold text-on-surface">{t('groupSettings.groupInfo')}</h2>
            {!isOwner && (
              <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {t('groupSettings.readOnly')}
              </span>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-semibold text-on-surface-variant">{t('groupSettings.avatar')}</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {GROUP_AVATARS.map((avatar) => {
                  const selected = avatarKey === avatar.key;
                  return (
                    <button
                      key={avatar.key}
                      type="button"
                      onClick={() => setAvatarKey(avatar.key)}
                      disabled={!isOwner}
                      className={`rounded-xl border px-2 py-3 text-center transition ${
                        selected
                          ? 'border-primary-fixed/35 bg-primary/16'
                          : 'border-white/10 bg-surface-container-low hover:border-primary-fixed/45 hover:bg-surface-container'
                      } ${!isOwner ? 'cursor-not-allowed opacity-60' : ''}`}
                      title={avatar.label}
                    >
                      <div className="text-2xl">{avatar.emoji}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-on-surface-variant">{t('groupSettings.name')}</label>
              <input
                type="text"
                className="app-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!isOwner}
                maxLength={80}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-on-surface-variant">{t('groupSettings.description')}</label>
              <textarea
                className="app-input min-h-28 resize-y"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={!isOwner}
                maxLength={280}
                placeholder={t('groupSettings.descriptionPlaceholder')}
              />
              <p className="mt-1 text-xs text-on-surface-variant">{description.length}/280</p>
            </div>

            <CurrencyPicker value={currency} onChange={setCurrency} disabled={!isOwner} />

            {isOwner && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="app-button-primary"
                >
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="app-card p-5 sm:p-6">
          <h2 className="mb-6 font-headline text-2xl font-bold text-on-surface">{t('groupSettings.members')}</h2>

          <div className="space-y-3">
            {members.map((member) => {
              const avatar = member.avatarKey ? AVATAR_BY_KEY[member.avatarKey] : null;
              const isMemberOwner = member.userId === group.ownerId;
              const roleLabel = resolveRoleLabel(member);

              return (
                <div key={member.userId} className="rounded-xl border border-white/10 bg-surface-container-low p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedMember(member)}
                      className="flex w-full min-w-0 items-center gap-3 rounded-xl text-left transition hover:text-primary-fixed focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 sm:w-auto"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container text-lg">
                        {avatar ? avatar.emoji : member.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-on-surface" title={member.name}>{member.name}</p>
                        <p className="truncate text-sm text-on-surface-variant" title={member.email}>{maskEmail(member.email)}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        {roleLabel}
                      </span>
                    </button>

                    {isOwner && !isMemberOwner && (
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => handleRoleToggle(member)}
                          className="app-button-secondary py-2"
                        >
                          {member.role === 1 ? t('groupSettings.demote') : t('groupSettings.promote')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          className="app-button-secondary py-2 text-error"
                        >
                          {t('groupSettings.remove')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isOwner && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleLeaveGroup}
                className="app-button-secondary text-error"
              >
                {t('groupSettings.leaveGroup')}
              </button>
            </div>
          )}
        </section>
        </div>

        {selectedMember ? (
          <MemberProfileDialog
            member={{
              id: selectedMember.userId,
              name: selectedMember.name,
              email: selectedMember.email,
              avatarKey: selectedMember.avatarKey,
              bio: selectedMember.bio,
              roleLabel: resolveRoleLabel(selectedMember),
            }}
            isCurrentUser={selectedMember.userId === currentUserId}
            onClose={() => setSelectedMember(null)}
          />
        ) : null}
      </div>
    </AppLayout>
  );
};

export default GroupSettings;
