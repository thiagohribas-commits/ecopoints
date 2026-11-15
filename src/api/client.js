export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Não foi possível conectar à API. Verifique se o json-server está rodando (npm run server).');
  }
  if (!res.ok) throw new Error(`Erro ${res.status} ao acessar ${path}`);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

/** Busca entregas e resgates de um usuário (ou de todos, se userId for omitido). */
export async function fetchActivity(userId) {
  const q = userId ? `?userId=${userId}` : '';
  const [deliveries, redemptions] = await Promise.all([
    api.get(`/deliveries${q}`),
    api.get(`/redemptions${q}`),
  ]);
  return { deliveries, redemptions };
}
