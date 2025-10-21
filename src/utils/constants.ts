// src/utils/constants.ts
// ============================================================================
// Constantes de UI / API + catálogo de efectos (stickers PNG sin fondo)
// ============================================================================

import { Effect } from '../types/effects.types';

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
  secondaryAccent: '#4ecdc4',
} as const;

export const API_ROUTES = {
  LOGIN: '/api/Auth/login',
  REGISTER: '/api/Auth/register',
  FACE_LOGIN: '/api/Auth/face-login',
  QR_LOGIN: '/api/Qr/login-qr/carnet',
  RESET_PASSWORD: '/api/Auth/reset-password',

  // === Facial ===
  FACIAL_SEGMENT: '/api/FacialAuth/segment',
  FACIAL_SAVE: '/api/FacialAuth/save',
  FACIAL_LOGIN: '/api/FacialAuth/login',

  // Reintento de envío del PDF/QR
  SEND_CARD_NOW: '/api/Auth/send-card-now',
} as const;

// Filtros clásicos (si algún componente los usa)
export const FILTERS: FilterOption[] = [
  { name: 'Normal', value: 'normal', icon: '📷' },
  { name: 'Vintage', value: 'vintage', icon: '📸' },
  { name: 'Blanco y Negro', value: 'bw', icon: '⚫' },
  { name: 'Sepia', value: 'sepia', icon: '🟤' },
];

// Por si hay componentes legados
export const EMOJIS = ['😊', '🎉', '❤️', '⭐', '🚀', '🌟', '💫', '🎈', '🎭', '🦄', '🌈', '🔥', '✨'];

// ---------------------------------------------------------------------------
// Catálogo de efectos disponibles
//  - Las imágenes deben existir en /public/stickers/ y ser PNG con transparencia.
//  - Heurística de posición/escala pensada para verse "grandes" por defecto.
// ---------------------------------------------------------------------------
export const EFFECTS: Effect[] = [
  {
    id: 'bunny-ears',
    name: 'Orejas de conejo',
    src: '/stickers/bunny-ears.png',
    position: {
      anchor: 'forehead',
      scale: 2.1,          // ancho ≈ 2.1x el ancho de la cara
      yOffset: -0.20,      // subir 20% del alto de la cara
      maxWidthRatio: 2.6,
    },
  },
  {
    id: 'cat-whiskers',
    name: 'Bigotes de gato',
    src: '/stickers/cat-whiskers.png',
    position: {
      anchor: 'whiskers',
      scale: 1.8,          // ancho ≈ 1.8x el ancho de la cara
      yOffset: 0.05,       // ligeramente bajo
      maxWidthRatio: 2.2,
    },
  },
  {
    id: 'dog-nose',
    name: 'Nariz de perro',
    src: '/stickers/dog-nose.png',
    position: {
      anchor: 'nose',
      scale: 0.55,         // ancho ≈ 0.55x el ancho de la cara
      yOffset: -0.02,
      maxWidthRatio: 0.8,
    },
  },
];
