// frontend/src/api/auth.js
import api from './index';

export function register({ username, password }) {
  return api('/auth/register', {
    method: 'POST',
    body: { username, password },
  });
}

export function login({ username, password }) {
  return api('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
}
