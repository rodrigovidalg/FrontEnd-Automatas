// Definir FilterOption directamente aquí para evitar problemas de importación
export interface FilterOption {
  name: string;
  value: string;
  icon: string;
}

export const COLORS = {
  darkGray: '#666973',
  lightGray: '#CCD0D9',
  black: '#090B0D',
  teal: '#51736F',
  white: '#F2F2F2',
  accent: '#ff6b6b',
  secondaryAccent: '#4ecdc4'
};

export const API_ROUTES = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  FACE_LOGIN: '/api/auth/face-login',
  QR_LOGIN: '/api/auth/qr-login',
  RESET_PASSWORD: '/api/auth/reset-password'
};


export const FILTERS: FilterOption[] = [
  { name: 'Normal', value: 'normal', icon: '📷' },
  { name: 'Vintage', value: 'vintage', icon: '📸' },
  { name: 'Blanco y Negro', value: 'bw', icon: '⚫' },
  { name: 'Sepia', value: 'sepia', icon: '🟤' }
];

export const EMOJIS = [
  '😊', '🎉', '❤️', '⭐', '🚀', '🌟', '💫', '🎈', '🎭', '🦄', '🌈', '🔥', '✨'
];