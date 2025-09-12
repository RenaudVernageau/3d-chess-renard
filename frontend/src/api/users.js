import api from "./index";

// ---- Current user ----
export function getMe() {
  return api("/users/me", { method: "GET" });
}

export function updateMe(payload) {
  // Back: PUT /users/me ; payload peut contenir { username?, avatar? }
  return api("/users/me", { method: "PUT", body: payload });
}

// ---- Others (inchangés / utiles ailleurs) ----
export const fetchAllUsers = () => api("/users", { method: "GET" });

export const fetchUser = (id) => api(`/users/${id}`, { method: "GET" });

export const sendFriendRequest = (id) =>
  api(`/users/${id}/friend-request`, { method: "POST" });

export const respondFriendRequest = (myId, { fromId, accept }) =>
  api(`/users/${myId}/friend-request/respond`, {
    method: "POST",
    body: { fromId, accept },
  });

export const updateUser = (id, { username, avatar }) =>
  api(`/users/${id}`, {
    method: "PUT",
    body: { username, avatar },
  });

export const deleteUser = (id) => api(`/users/${id}`, { method: "DELETE" });

export const setUserRole = (id, role) =>
  api(`/users/${id}/role`, { method: "PATCH", body: { role } });
