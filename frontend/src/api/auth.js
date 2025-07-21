// frontend/src/api/auth.js
import api from './index';

export function register({ username, email, password, avatar }) {
  return api('/auth/register', {
    method: 'POST',
    body: { username, email, password, avatar },
  });
}

export function login({ username, password }) {
  return api('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
}
