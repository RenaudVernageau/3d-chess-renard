// server/services/websocket.js
const { rooms } = require('../models/Game');
const { v4: uuid } = require('uuid');

function initWebsocket(server) {
  const io = require('socket.io')(server, {
    cors: { origin: '*' }
  });

  io.on('connection', socket => {
    console.log('WS: client connected', socket.id);

    socket.on('create_room', () => {
      const roomId = uuid();
      rooms[roomId] = { id: roomId, players: [] };
      socket.emit('room_created', { roomId });
    });

    socket.on('join_room', ({ roomId, username }) => {
      const room = rooms[roomId];
      if (room) {
        if (!room.players.includes(username)) room.players.push(username);
        io.to(socket.id).emit('room_joined', { roomId, players: room.players });
      } else {
        io.to(socket.id).emit('error', { error: 'Room not found' });
      }
    });

    socket.on('disconnect', () => {
      console.log('WS: client disconnected', socket.id);
    });
  });

  return io;
}

module.exports = initWebsocket;
