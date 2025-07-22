// frontend/src/api/users.js
import api from "./index";

// Récupère tous les utilisateurs
export const fetchAllUsers = () =>
  api("/users", {
    method: "GET",
  });

// Récupère un utilisateur par ID
export const fetchUser = (id) =>
  api(`/users/${id}`, {
    method: "GET",
  });

// Met à jour son propre profil (ici on n’envoie que username & avatar)
export const updateUser = (id, { username, avatar }) =>
  api(`/users/${id}`, {
    method: "PUT",
    body: { username, avatar },
  });

// Supprime son propre compte
export const deleteUser = (id) =>
  api(`/users/${id}`, {
    method: "DELETE",
  });
