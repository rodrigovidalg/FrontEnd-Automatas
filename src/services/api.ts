// src/services/api.ts
type ApiOptions = {
  method?: string;
  headers?: Record<string, string>;
  json?: any;
  body?: BodyInit;
};

const RAW_BASE = process.env.REACT_APP_API_BASE_URL || '';
const BASE = RAW_BASE.replace(/\s+$/g, '').replace(/\/+$/, '');

function buildUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!BASE) console.warn('REACT_APP_API_BASE_URL no está configurada. Usando ruta relativa:', pathOrUrl);
  const slash = pathOrUrl.startsWith('/') ? '' : '/';
  let url = `${BASE}${slash}${pathOrUrl}`;
  url = url.replace(/([^:]\/)\/+/g, '$1');     // quita dobles //
  url = url.replace(/\/api\/+api\//, '/api/'); // evita /api/api/
  return url;
}

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
