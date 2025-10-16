// src/services/api.ts

// ===== BASE URL (CRA) =================================================
const RAW_BASE =
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) ||
  'https://pruebaproyectounido-production.up.railway.app';

export const BASE = String(RAW_BASE).replace(/\s+$/g, '').replace(/\/+$/, ''); // sin trailing slash

// ===== Helpers ========================================================
export function authHeaders() {
  const t = localStorage.getItem('auth_token') || localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}


export function buildUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!BASE) console.warn('REACT_APP_API_BASE_URL no está configurada. Usando ruta relativa:', pathOrUrl);
  const slash = pathOrUrl.startsWith('/') ? '' : '/';
  let url = `${BASE}${slash}${pathOrUrl}`;
  url = url.replace(/([^:]\/)\/+/g, '$1');     // quita dobles //
  url = url.replace(/\/api\/+api\//, '/api/'); // evita /api/api/
  return url;
}

// ===== API moderna: api() (para nuevos servicios) =====================
// Nota: NO omitimos 'body' para permitir que puedas pasar body: JSON.stringify(...).
export type ApiOpts = Omit<RequestInit, 'headers'> & {
  auth?: boolean;                    // agrega Authorization automáticamente
  json?: any;                        // atajo: body = JSON.stringify(json) si no pasas body
  headers?: Record<string, string>;  // headers tipados como string-string
};

/**
 * Ejemplos:
 *  api('/api/Auth/login',  { method:'POST', json:{...} })
 *  api('/api/FacialAuth/save', { method:'POST', auth:true, body: JSON.stringify({ ... }) })
 */
export async function api<T = any>(path: string, opts: ApiOpts = {}): Promise<T> {
  const url = buildUrl(path);

  // construir headers sin uniones con undefined (evita TS2322)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.auth) Object.assign(headers, authHeaders());
  if (opts.headers) Object.assign(headers, opts.headers);

  const init: RequestInit = { ...opts, headers };

  // helper json si no se pasó body manual
  if (opts.json !== undefined && init.body === undefined) {
    init.body = JSON.stringify(opts.json);
  }

  const res = await fetch(url, init);
  const text = await res.text(); // permite text/plain

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = text ? JSON.parse(text) : {};
      message = data?.message || data?.mensaje || data?.error || message;
    } catch {
      if (text) message = `${message}: ${text}`;
    }
    throw new Error(message);
  }

  if (!text) return {} as T;
  try { return JSON.parse(text) as T; } catch { return (text as unknown) as T; }
}

// ===== Compat: tu apiFetch original ==================================
type ApiOptions = {
  method?: string;
  headers?: Record<string, string>;
  json?: any;
  body?: BodyInit;
};

/**
 * Compatibilidad con código existente:
 *   apiFetch('/api/Algo', { method:'POST', json:{...} })
 */
export async function apiFetch<T>(pathOrUrl: string, opts: ApiOptions = {}): Promise<T> {
  const url = buildUrl(pathOrUrl);
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const init: RequestInit = { method: opts.method || (opts.json ? 'POST' : 'GET'), headers };

  if (opts.json !== undefined) init.body = JSON.stringify(opts.json);
  if (opts.body !== undefined) init.body = opts.body;

  const res = await fetch(url, init);
  const text = await res.text(); // importante para text/plain

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = JSON.parse(text);
      message = data?.message || data?.error || message;
    } catch {
      if (text) message = `${message}: ${text}`;
    }
    throw new Error(message);
  }

  if (!text) return {} as T;
  try { return JSON.parse(text) as T; } catch { return (text as unknown) as T; }
}
