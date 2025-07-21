// server/services/websocket.js
const jwt    = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { rooms }      = require('../models/Game');
const { v4: uuid }   = require('uuid');

function initWebsocket(server) {
  const io = require('socket.io')(server, {
    cors: { origin: '*' }
  });

  // Middleware WS : vérifie le token JWT avant toute connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Missing or invalid token'));
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (err) {
      next(new Error('Missing or invalid token'));
    }
  });

  io.on('connection', socket => {
    const { username } = socket.user;
    console.log(`WS: ${username} connected (${socket.id})`);

    // Création de room
    socket.on('create_room', () => {
      const roomId = uuid();
      // Initialiser la room avec le créateur comme premier joueur
      rooms[roomId] = { id: roomId, players: [username], state: null };
      socket.join(roomId);
      socket.emit('room_created', { roomId, players: rooms[roomId].players });
    });

    // Rejoindre une room existante
    socket.on('join_room', ({ roomId }) => {
      const room = rooms[roomId];
      if (room) {
        if (!room.players.includes(username)) {
          room.players.push(username);
        }
        socket.join(roomId);
        // Informe tous les membres de la room de la nouvelle liste de joueurs
        io.in(roomId).emit('room_joined', { roomId, players: room.players });
      } else {
        socket.emit('error', { error: 'Room not found' });
      }
    });

    // Réception d’un déplacement et diffusion aux autres
    socket.on('move_piece', ({ roomId, move }) => {
      const room = rooms[roomId];
      if (!room) {
        return socket.emit('error', { error: 'Room not found' });
      }
      // (Optionnel) valider move avec chess.js ici et mettre à jour room.state
      // Puis diffuser aux autres clients de la room
      socket.to(roomId).emit('move_piece', move);
    });

    socket.on('disconnect', () => {
      console.log(`WS: ${username} disconnected (${socket.id})`);
      // (Optionnel) retirer de rooms[...] si tu veux gérer les déconnections
    });
  });

  return io;
}

module.exports = initWebsocket;
