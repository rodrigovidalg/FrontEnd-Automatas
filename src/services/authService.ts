// src/services/authService.ts
// Asegúrate de tener también src/services/api.ts (cliente fetch) y la variable de entorno REACT_APP_API_BASE_URL configurada.

import { apiFetch } from './api';
// Si tu archivo de rutas está en otra ubicación o se llama distinto, ajusta este import:
import { API_ROUTES } from '../utils/constants';

// Tipos básicos (ajústalos si tu backend retorna otra forma)
export interface BackendUser {
  id?: string;
  usuario?: string;
  email: string;
  nombreCompleto?: string;
  telefono?: string;
  role?: string;
  // ...otros campos que devuelva tu API
}

export interface LoginResponse {
  token: string;
  user: BackendUser;
}

export interface RegisterResponse {
  message?: string;
  user?: BackendUser;
  id?: string;
}

// Utilidad: si el input parece email
function isEmail(v: string) {
  return /\S+@\S+\.\S+/.test(v);
}

/**
 * LOGIN: acepta que el usuario escriba email o usuario en el mismo campo.
 * Si escribe algo con @, mandamos { email, password }
 * Si no, mandamos { usuario, password }
 */
export async function login(userOrEmail: string, password: string): Promise<LoginResponse> {
  const payload = isEmail(userOrEmail)
    ? { email: userOrEmail, password }
    : { usuario: userOrEmail, password };

  return apiFetch<LoginResponse>(API_ROUTES.LOGIN, { json: payload });
}

/**
 * REGISTER: mapea los nombres del front a los del backend (.NET):
 *  usuario        <- nickname | username | usuario
 *  email          <- email
 *  nombreCompleto <- fullName | nombreCompleto
 *  password       <- password
 *  telefono       <- phone | telefono
 *
 * El ORDEN en el objeto aquí se mantiene como lo escribimos,
 * pero recuerda que para JSON no es relevante.
 */
export async function register(frontData: any): Promise<RegisterResponse> {
  const payload = {
    usuario: frontData.nickname ?? frontData.username ?? frontData.usuario ?? '',
    email: frontData.email ?? '',
    nombreCompleto: frontData.fullName ?? frontData.nombreCompleto ?? '',
    password: frontData.password ?? '',
    telefono: frontData.phone ?? frontData.telefono ?? ''
  };

  return apiFetch<RegisterResponse>(API_ROUTES.REGISTER, { json: payload });
}

/**
 * ME: obtener el perfil usando el token (Bearer)
 * Ajusta la ruta si tu backend usa otra (por ejemplo /api/auth/me).
 */
export async function me(token: string): Promise<BackendUser> {
  return apiFetch<BackendUser>('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
}
