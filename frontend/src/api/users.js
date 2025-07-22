// frontend/src/api/users.js
import api from './index';

// Récupère tous les users
export function fetchAllUsers() {
  return api('/users', {
    method: 'GET',
  });
}

// Récupère un user par ID
export function fetchUser(id) {
  return api(`/users/${id}`, {
    method: 'GET',
  });
}

// Met à jour son propre profil
export function updateUser(id, data) {
  return api(`/users/${id}`, {
    method: 'PUT',
    body: data,
  });
}

// Supprime son propre compte
export function deleteUser(id) {
  return api(`/users/${id}`, {
    method: 'DELETE',
  });
}
