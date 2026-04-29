import React from 'react';
import { AVATAR_BY_KEY } from '../data/avatars';
import type { MemberProfile } from './MemberProfileDialog';

export type ClickableMember = {
  id: string;
  name: string;
  email?: string;
  avatarKey?: string | null;
  bio?: string | null;
  roleLabel?: string;
};

type AvatarSize = 'sm' | 'md' | 'lg';

const avatarSizeClasses: Record<AvatarSize, string> = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
};

const toMemberProfile = (member: ClickableMember): MemberProfile => ({
  id: member.id,
  name: member.name,
  email: member.email ?? '',
  avatarKey: member.avatarKey,
  bio: member.bio,
  roleLabel: member.roleLabel,
});

const getInitials = (name: string) => {
  const initials = name
    .split(' ')
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || '?';
};

export const MemberAvatar: React.FC<{
  member?: ClickableMember;
  size?: AvatarSize;
  className?: string;
}> = ({ member, size = 'md', className = '' }) => {
  const avatar = member?.avatarKey ? AVATAR_BY_KEY[member.avatarKey] : null;

  return (
    <span className={`app-avatar flex shrink-0 items-center justify-center rounded-xl font-bold ${avatarSizeClasses[size]} ${avatar?.bg ?? 'bg-surface-container text-on-surface'} ${className}`}>
      {avatar ? <span aria-hidden="true">{avatar.emoji}</span> : getInitials(member?.name ?? '')}
    </span>
  );
};

export const MemberAvatarButton: React.FC<{
  member?: ClickableMember;
  onOpen: (member: MemberProfile) => void;
  size?: AvatarSize;
  className?: string;
  ariaLabel?: string;
}> = ({ member, onOpen, size = 'md', className = '', ariaLabel }) => {
  if (!member) {
    return <MemberAvatar size={size} className={className} />;
  }

  return (
    <button
      type="button"
      className={`rounded-xl text-left transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 ${className}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(toMemberProfile(member));
      }}
      aria-label={ariaLabel ?? member.name}
      title={member.name}
    >
      <MemberAvatar member={member} size={size} />
    </button>
  );
};

export const MemberNameButton: React.FC<{
  member?: ClickableMember;
  label?: string;
  fallback: string;
  onOpen: (member: MemberProfile) => void;
  className?: string;
}> = ({ member, label, fallback, onOpen, className = '' }) => {
  if (!member) {
    return <span className={className}>{fallback}</span>;
  }

  return (
    <button
      type="button"
      className={`rounded-md text-left font-semibold transition hover:text-primary-fixed focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 ${className}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(toMemberProfile(member));
      }}
      title={member.name}
    >
      {label ?? member.name}
    </button>
  );
};
