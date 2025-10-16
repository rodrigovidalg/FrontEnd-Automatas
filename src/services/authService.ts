// src/services/authService.ts
import { apiFetch } from './api';
import { API_ROUTES } from '../utils/constants';

export interface BackendUser {
  id?: string | number;
  usuario?: string;
  email: string;
  nombreCompleto?: string;
  telefono?: string;
  role?: string;
}

export interface LoginResponse {
  token: string;      // mapeado desde accessToken
  user: BackendUser;  // mapeado desde "usuario" (objeto)
}


// ⬇⬇⬇ NUEVO: login por QR
export async function loginByQr(codigoQr: string): Promise<LoginResponse> {
  const body = { codigoQr }; // el backend hace binding case-insensitive
  const raw = await apiFetch<BackendLoginRaw>(API_ROUTES.QR_LOGIN, { json: body });

  return {
    token: raw.accessToken,
    user: {
      id: raw.usuario.id,
      usuario: raw.usuario.usuario,
      email: raw.usuario.email,
      nombreCompleto: raw.usuario.nombreCompleto,
      telefono: raw.usuario.telefono,
      role: raw.usuario.role
    }
  };
}

export interface RegisterResponse {
  message?: string;
  user?: BackendUser;
  id?: string | number;
}

// --- shapes del backend según Swagger ---
type BackendLoginRaw = {
  accessToken: string;
  expiresInSeconds: number;
  usuario: {
    id: number | string;
    usuario: string;
    email: string;
    nombreCompleto: string;
    telefono: string;
    role?: string;
  };
};

// LOGIN: contrato exacto del backend (Swagger)
export async function loginApi(usuarioOrEmail: string, password: string): Promise<LoginResponse> {
  const body = {
    usuarioOrEmail: (usuarioOrEmail ?? '').trim(),
    password: password ?? ''
  };

  const raw = await apiFetch<BackendLoginRaw>(API_ROUTES.LOGIN, { json: body });

  return {
    token: raw.accessToken,
    user: {
      id: raw.usuario.id,
      usuario: raw.usuario.usuario,
      email: raw.usuario.email,
      nombreCompleto: raw.usuario.nombreCompleto,
      telefono: raw.usuario.telefono,
      role: raw.usuario.role
    }
  };
}

// REGISTER (ajústalo si tu Swagger muestra otros nombres)
export function registerApi(frontData: any): Promise<RegisterResponse> {
  const payload = {
    usuario: (frontData?.nickname ?? frontData?.username ?? frontData?.usuario ?? '').replace(/\s+/g, ''),
    email: frontData?.email ?? '',
    nombreCompleto: frontData?.fullName ?? frontData?.nombreCompleto ?? '',
    password: frontData?.password ?? '',
    telefono: frontData?.phone ?? frontData?.telefono ?? ''
  };

  return apiFetch<RegisterResponse>(API_ROUTES.REGISTER, { json: payload });
}

// /auth/me opcional (deducido)
export function me(token: string): Promise<BackendUser> {
  const mePath = API_ROUTES.LOGIN.replace(/\/login$/i, '/me');
  return apiFetch<BackendUser>(mePath, { headers: { Authorization: `Bearer ${token}` } });
}

// Alias para compatibilidad con AuthContext
export { loginApi as login, registerApi as register };


