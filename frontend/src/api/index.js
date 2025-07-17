// frontend/src/api/index.js
export default async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(
    `${import.meta.env.VITE_WS_URL}/api${path}`,
    {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }
  );

  // Si erreur HTTP
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err;
  }
  // JSON ou vide
  return res.status === 204 ? null : res.json();
}
