// src/api/users.js
import api from './index';

// Récupère tous les utilisateurs
export const fetchAllUsers = () =>
  api('/users', { method: 'GET' });

// Récupère un utilisateur par ID
export const fetchUser = id =>
  api(`/users/${id}`, { method: 'GET' });

// Envoie une demande d’ami
export const sendFriendRequest = id =>
  api(`/users/${id}/friend-request`, { method: 'POST' });

// Répond à une demande d’ami (accept/reject)
export const respondFriendRequest = (myId, { fromId, accept }) =>
  api(`/users/${myId}/friend-request/respond`, {
    method: 'POST',
    body: { fromId, accept }
  });

// Met à jour son propre profil
export const updateUser = (id, { username, avatar }) =>
  api(`/users/${id}`, {
    method: 'PUT',
    body: { username, avatar }
  });

// Supprime son propre compte
export const deleteUser = id =>
  api(`/users/${id}`, { method: 'DELETE' });
