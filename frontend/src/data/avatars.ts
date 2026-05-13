export interface Avatar {
  key: string;
  label: string;
  emoji: string;
  bg: string;
}

export const AVATARS: Avatar[] = [
  { key: 'fox', label: 'Fox', emoji: '🦊', bg: 'bg-orange-500/20' },
  { key: 'owl', label: 'Owl', emoji: '🦉', bg: 'bg-amber-500/20' },
  { key: 'wave', label: 'Wave', emoji: '🌊', bg: 'bg-cyan-500/20' },
  { key: 'mountain', label: 'Mountain', emoji: '⛰️', bg: 'bg-slate-500/20' },
  { key: 'rocket', label: 'Rocket', emoji: '🚀', bg: 'bg-indigo-500/20' },
  { key: 'cactus', label: 'Cactus', emoji: '🌵', bg: 'bg-emerald-500/20' },
  { key: 'coffee', label: 'Coffee', emoji: '☕', bg: 'bg-stone-500/20' },
  { key: 'book', label: 'Book', emoji: '📘', bg: 'bg-blue-500/20' },
  { key: 'music', label: 'Music', emoji: '🎧', bg: 'bg-pink-500/20' },
  { key: 'bike', label: 'Bike', emoji: '🚴', bg: 'bg-lime-500/20' },
  { key: 'camera', label: 'Camera', emoji: '📷', bg: 'bg-rose-500/20' },
  { key: 'sun', label: 'Sun', emoji: '☀️', bg: 'bg-yellow-500/20' }
];

export const AVATAR_KEYS = AVATARS.map((avatar) => avatar.key);

export const AVATAR_BY_KEY: Record<string, Avatar> = Object.fromEntries(
  AVATARS.map((avatar) => [avatar.key, avatar])
);
