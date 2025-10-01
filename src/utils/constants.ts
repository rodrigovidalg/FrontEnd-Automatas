export const APP_CONFIG = {
  name: 'AnalizadorPro',
  subtitle: 'Sistema Avanzado',
  version: '1.0.0'
} as const;

export const COLORS = {
  darkGray: '#666973',
  lightGray: '#CCD0D9',
  black: '#090B0D',
  teal: '#51736F',
  white: '#F2F2F2',
  accent: '#ff6b6b',
  secondaryAccent: '#4ecdc4'
} as const;

export const FILTERS = [
  { id: 'normal', label: 'Normal', emoji: '🔍' },
  { id: 'vintage', label: 'Vintage', emoji: '📸' },
  { id: 'bw', label: 'Blanco y Negro', emoji: '⚫' },
  { id: 'sepia', label: 'Sepia', emoji: '🟤' }
] as const;

export const EMOJI_EFFECTS = [
  '😊', '🎉', '❤️', '⭐', '🚀', '🌟', '💫', '🎈', '🎭', '🦄', '🌈', '🔥', '✨'
] as const;