export interface GroupAvatar {
  key: string;
  emoji: string;
  label: string;
}

export const GROUP_AVATARS: GroupAvatar[] = [
  { key: 'mountain', emoji: '🏔️', label: 'Mountain' },
  { key: 'sail', emoji: '⛵', label: 'Sail' },
  { key: 'beach', emoji: '🏖️', label: 'Beach' },
  { key: 'ski', emoji: '🎿', label: 'Ski' },
  { key: 'camp', emoji: '🏕️', label: 'Camp' },
  { key: 'home', emoji: '🏡', label: 'Home' },
  { key: 'dinner', emoji: '🍽️', label: 'Dinner' },
  { key: 'party', emoji: '🎉', label: 'Party' },
  { key: 'roadtrip', emoji: '🚗', label: 'Road trip' },
  { key: 'flight', emoji: '✈️', label: 'Flight' },
  { key: 'band', emoji: '🎸', label: 'Band' },
  { key: 'stadium', emoji: '🏟️', label: 'Stadium' }
];

export const GROUP_AVATAR_KEYS = GROUP_AVATARS.map((avatar) => avatar.key);

export const GROUP_AVATAR_BY_KEY: Record<string, GroupAvatar> = Object.fromEntries(
  GROUP_AVATARS.map((avatar) => [avatar.key, avatar])
);
