// frontend/src/api/auth.js
import api from "./index";

// Normalise la réponse backend -> format attendu par useAuth
export function register({ username, email, password, avatar }) {
  return api("/auth/register", {
    method: "POST",
    body: {
      username,
      email,
      password,
      avatar,            // certains backends lisent `avatar`
      avatarUrl: avatar, // d'autres lisent `avatarUrl`
    },
  }).then((res) => {
    const { token, user } = res || {};
    return {
      token: token || null,
      userId: user?.id || null,
      username: user?.username || username || null,
      // le backend ne renvoie pas toujours l'email
      email: email || null,
      // on privilégie avatarUrl si présent
      avatar: user?.avatarUrl || user?.avatar || null,
    };
  });
}

export function login({ username, password }) {
  return api("/auth/login", {
    method: "POST",
    body: { username, password },
  }).then((res) => {
    const { token, user } = res || {};
    return {
      token: token || null,
      userId: user?.id || null,
      username: user?.username || username || null,
      // le backend ne renvoie pas l'email
      email: null,
      avatar: user?.avatarUrl || user?.avatar || null,
    };
  });
}
