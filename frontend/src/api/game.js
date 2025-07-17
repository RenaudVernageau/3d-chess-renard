// frontend/src/api/game.js
import api from './index';

export function createRoom() {
  return api('/rooms', { method: 'POST' });
}

export function joinRoom(roomId, username) {
  return api(`/rooms/${roomId}/join`, {
    method: 'POST',
    body: { username },
  });
}
