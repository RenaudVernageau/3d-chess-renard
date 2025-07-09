// src/api/game.js
// Wrapper pour émettre les commandes create/join via WebSocket

/**
 * Demande la création d'une nouvelle salle
 * @param {Socket} socket - instance WebSocket client
 */
export function createRoom(socket) {
  if (!socket) throw new Error("Socket non connecté")
  socket.emit("create_room")
}

/**
 * Demande à rejoindre une salle existante
 * @param {Socket} socket - instance WebSocket client
 * @param {string} roomId - identifiant de la salle
 */
export function joinRoom(socket, roomId) {
  if (!socket) throw new Error("Socket non connecté")
  if (!roomId) throw new Error("roomId requis pour rejoindre une partie")
  socket.emit("join_room", { roomId })
}