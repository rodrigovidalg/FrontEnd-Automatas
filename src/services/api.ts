const rawBase = process.env.REACT_APP_API_BASE_URL || '';
// quita barras finales y espacios
export const API_BASE = rawBase.trim().replace(/\/+$/, '');

type Options = RequestInit & { json?: any };

export async function apiFetch<T = any>(path: string, options: Options = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const { json, headers, ...rest } = options;

  const resp = await fetch(url, {
    method: json ? 'POST' : (options.method || 'GET'),
    headers: {
      'Accept': 'application/json',
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(headers || {})
    },
    body: json ? JSON.stringify(json) : options.body,
    ...rest,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    // intenta parsear error JSON si existe
    try {
      const data = JSON.parse(text);
      throw new Error(data.message || data.error || `HTTP ${resp.status}`);
    } catch {
      throw new Error(text || `HTTP ${resp.status}`);
    }
  }

  // intenta JSON, si no, devuelve vacío
  try {
    return (await resp.json()) as T;
  } catch {
    return undefined as unknown as T;
  }
}
