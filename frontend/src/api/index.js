// frontend/src/api/index.js

// URL de base de ton API REST (pas WebSocket)
const BASE = import.meta.env.VITE_API_URL || "";

export default async function api(path, { method = "GET", body, headers = {} } = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    // Construit l’URL comme : `${BASE}/api/users/...` ou `/api/...` en dev
    `${BASE}/api${path}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }
  );

  if (!res.ok) {
    // Essaie de parser un JSON d’erreur, sinon renvoie un objet vide
    let err = {};
    try {
      err = await res.json();
    } catch {}
    throw err;
  }

  // 204 No Content → on renvoie null
  if (res.status === 204) return null;
  return res.json();
}
