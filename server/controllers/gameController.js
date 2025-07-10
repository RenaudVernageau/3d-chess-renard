// server/controllers/gameController.js
const { rooms } = require('../models/Game');
const { v4: uuid } = require('uuid');

exports.createRoom = (req, res) => {
  const roomId = uuid();
  rooms[roomId] = { id: roomId, players: [] };
  return res.status(201).json({ roomId });
};

exports.joinRoom = (req, res) => {
  const { roomId } = req.params;
  const { username } = req.body;
  const room = rooms[roomId];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (!username) return res.status(400).json({ error: 'username required' });
  if (!room.players.includes(username)) room.players.push(username);
  return res.json({ roomId, players: room.players });
};
