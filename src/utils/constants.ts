// src/utils/constants.ts

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
  LOGIN: '/api/Auth/login',      // <— coincide con Swagger
  REGISTER: '/api/Auth/register', // si tu register es /api/Auth/register
  FACE_LOGIN: '/api/Auth/face-login',
  QR_LOGIN: '/api/Qr/login-qr/carnet',
  RESET_PASSWORD: '/api/Auth/reset-password',

   // === Facial ===
  FACIAL_SEGMENT: '/api/FacialAuth/segment',
  FACIAL_SAVE: '/api/FacialAuth/save',
  FACIAL_LOGIN: '/api/FacialAuth/login'// reemplaza el viejo FACE_LOGIN
} as const;

export const FILTERS: FilterOption[] = [
  { name: 'Normal', value: 'normal', icon: '📷' },
  { name: 'Vintage', value: 'vintage', icon: '📸' },
  { name: 'Blanco y Negro', value: 'bw', icon: '⚫' },
  { name: 'Sepia', value: 'sepia', icon: '🟤' }
];

export const EMOJIS = ['😊','🎉','❤️','⭐','🚀','🌟','💫','🎈','🎭','🦄','🌈','🔥','✨'];
