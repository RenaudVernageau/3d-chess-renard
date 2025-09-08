// frontend/src/api/index.js

// Base URL de l'API (sans / final). En dev, tu peux laisser vide et utiliser un proxy Vite.
// Exemple prod: VITE_API_URL=https://chess-3d-dd1c42f23b5e.herokuapp.com
const RAW = import.meta.env.VITE_API_URL || "";
const API_BASE = RAW.replace(/\/+$/, ""); // retire tout trailing slash

export default async function api(path, { method = "GET", body, headers = {} } = {}) {
  // garantit un seul "/" entre base et path
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const token = localStorage.getItem("token") || "";
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
    mode: "cors",
  });

  // 204 No Content → null
  if (res.status === 204) return null;

  // essaie de parser le JSON même en cas d’erreur HTTP
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}
