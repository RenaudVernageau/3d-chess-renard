// frontend/src/api/auth.js
import api from './index';

// Normalise la réponse backend -> format attendu par useAuth
export function register({ username, email, password, avatar }) {
  return api('/auth/register', {
    method: 'POST',
    body: { username, email, password, avatar },
  }).then((res) => {
    const { token, user } = res || {};
    return {
      token: token || null,
      userId: user?.id || null,
      username: user?.username || username || null,
      email: email || null,               // le backend ne renvoie pas l'email
      avatar: user?.avatarUrl || null,
    };
  });
}

export function login({ username, password }) {
  return api('/auth/login', {
    method: 'POST',
    body: { username, password },
  }).then((res) => {
    const { token, user } = res || {};
    return {
      token: token || null,
      userId: user?.id || null,
      username: user?.username || username || null,
      email: null,                        // le backend ne renvoie pas l'email
      avatar: user?.avatarUrl || null,
    };
  });
}
