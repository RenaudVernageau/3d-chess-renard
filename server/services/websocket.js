// server/services/websocket.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { rooms } = require("../models/Game");
const { v4: uuid } = require("uuid");
const Message = require("../models/Message");
const User = require("../models/User");

function initWebsocket(server) {
  const io = require("socket.io")(server, {
    cors: { origin: "*" },
    path: "/socket.io",
    // ✅ Ajout pour limiter les déco sur mobile / onglets en veille
    transports: ["websocket"], // évite de retomber en polling
    pingInterval: 25000,       // battement ping
    pingTimeout: 60000,        // délai avant de considérer la connexion perdue
  });

  // --- Auth WS ---
  io.use((socket, next) => {
    const token = socket.handshake?.auth?.token;
    if (!token) return next(new Error("Missing or invalid token"));
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      socket.user = { id: String(payload.sub), username: payload.username };
      return next();
    } catch (err) {
      return next(new Error("Missing or invalid token"));
    }
  });

  // ====== Helpers État de partie ======
  function ensureRoom(roomId) {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        players: [],            // [{ id, username, color }]
        assignments: {},        // { [userId]: "white"|"black"|"spectator" }
        turn: "white",
        state: { fen: null, moves: [] }, // ✅ état minimal en mémoire
        createdAt: Date.now(),
      };
    } else if (!rooms[roomId].state) {
      rooms[roomId].state = { fen: null, moves: [] };
    }
    return rooms[roomId];
  }

  function pickNextColor(assignments) {
    const colors = Object.values(assignments);
    if (!colors.includes("white")) return "white";
    if (!colors.includes("black")) return "black";
    return "spectator";
  }

  function removePlayerFromRoom(room, uid) {
    if (!room) return;
    delete room.assignments[uid];
    room.players = room.players.filter((p) => p.id !== uid);
  }

  function broadcastPlayers(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    io.to(roomId).emit("room_player_update", {
      roomId,
      players: room.players,
    });
  }

  function cleanupRoomIfEmpty(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    if (room.players.length === 0) {
      delete rooms[roomId];
      console.log(`[WS] room ${roomId} deleted (empty)`);
    }
  }

  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    const username = socket.user?.username;
    console.log(`[WS] connect ${username} (${socket.id}) userId=${userId}`);

    if (!userId) {
      console.error("[WS] ❌ userId manquant (JWT 'sub' ?)");
      return;
    }

    // Track des rooms jeu rejointes par ce socket (pour cleanup à disconnect)
    socket.joinedGameRooms = new Set();

    // Room perso pour la messagerie
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    console.log(`[WS] ${username} joined ${userRoom}`);

    // ===== ROOMS (jeu) =====

    socket.on("create_room", () => {
      const roomId = uuid();
      const room = ensureRoom(roomId);

      if (!room.assignments[userId]) {
        room.assignments[userId] = "white";
        room.players.push({ id: userId, username, color: "white" });
      }

      socket.join(roomId);
      socket.joinedGameRooms.add(roomId);

      console.log(`[WS] room created ${roomId} by ${username}`);
      socket.emit("room_created", {
        roomId,
        players: room.players,
        yourColor: room.assignments[userId] || "white",
        activeColor: room.turn,
      });

      // ✅ Envoie l'état initial (vide) au créateur
      socket.emit("state_sync", room.state);
    });

    // Créer une room avec un ID donné (fallback)
    socket.on("create_room_with_id", ({ roomId, username: uname }) => {
      if (!roomId) return;
      const room = ensureRoom(roomId);

      if (!room.assignments[userId]) {
        const color = pickNextColor(room.assignments);
        room.assignments[userId] = color;
        if (!room.players.some((p) => p.id === userId)) {
          room.players.push({ id: userId, username: uname || username, color });
        }
      } else {
        const color = room.assignments[userId];
        if (!room.players.some((p) => p.id === userId)) {
          room.players.push({ id: userId, username: uname || username, color });
        }
      }

      socket.join(roomId);
      socket.joinedGameRooms.add(roomId);

      console.log(`[WS] room ${roomId} created/joined by ${username}`);

      socket.emit("room_created", {
        roomId,
        players: room.players,
        yourColor: room.assignments[userId] || "white",
        activeColor: room.turn,
      });

      socket.emit("state_sync", room.state); // ✅ état au créateur/joiner
      socket.to(roomId).emit("room_player_update", {
        roomId,
        players: room.players,
      });
    });

    socket.on("join_room", ({ roomId }) => {
      const room = ensureRoom(roomId);

      // Si le joueur a déjà une couleur, on la garde
      let color = room.assignments[userId];

      // Sinon on lui en attribue une disponible
      if (!color) {
        color = pickNextColor(room.assignments);
        room.assignments[userId] = color;
        if (!room.players.some((p) => p.id === userId)) {
          room.players.push({ id: userId, username, color });
        }
      } else {
        const idx = room.players.findIndex((p) => p.id === userId);
        if (idx >= 0) {
          room.players[idx] = { id: userId, username, color };
        } else {
          room.players.push({ id: userId, username, color });
        }
      }

      socket.join(roomId);
      socket.joinedGameRooms.add(roomId);

      console.log(`[WS] ${username} joined game room ${roomId} as ${color}`);

      // Notifie l'arrivant
      socket.emit("room_joined", {
        roomId,
        players: room.players,
        yourColor: color,
        activeColor: room.turn,
      });

      // ✅ Envoie l'état courant pour resync (reload/entrée tardive)
      socket.emit("state_sync", room.state);

      // Notifie les autres d'une mise à jour
      socket.to(roomId).emit("room_player_update", {
        roomId,
        players: room.players,
      });
    });

    // Le client peut demander explicitement l'état (ex: après reconnect)
    socket.on("state_request", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) {
        console.warn(`[WS] state_request: room not found ${roomId}`);
        return socket.emit("state_sync", { fen: null, moves: [] });
      }
      socket.emit("state_sync", room.state || { fen: null, moves: [] });
    });

    // Option : quitter la room (sans “quitter la partie” pour l'autre)
    socket.on("leave_room", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      removePlayerFromRoom(room, userId);
      socket.leave(roomId);
      socket.joinedGameRooms.delete(roomId);

      console.log(`[WS] ${username} left room ${roomId}`);

      broadcastPlayers(roomId);
      cleanupRoomIfEmpty(roomId);
    });

    // Quitter la partie (et prévenir l’adversaire)
    socket.on("room_quit", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;

      console.log(`[WS] ${username} quits game room ${roomId}`);

      socket.to(roomId).emit("room_peer_quit");

      removePlayerFromRoom(room, userId);
      socket.leave(roomId);
      socket.joinedGameRooms.delete(roomId);

      broadcastPlayers(roomId);
      cleanupRoomIfEmpty(roomId);
    });

    // Réception d'un coup
    // payload attendu: { roomId, move: {from,to, ...}, color, nextFen? }
    socket.on("move_piece", ({ roomId, move, color, nextFen }) => {
      const room = rooms[roomId];
      if (!room) {
        console.warn(`[WS] move_piece: room not found ${roomId}`);
        return socket.emit("error", { error: "Room not found" });
      }

      // (Optionnel) appliquer une règle de tour serveur
      // if (room.turn !== color) {
      //   return socket.emit("error", { error: "Not your turn" });
      // }

      // ✅ Persister l'état minimal
      try {
        if (!room.state) room.state = { fen: null, moves: [] };
        if (move && move.from && move.to) {
          room.state.moves.push(move);
        }
        if (typeof nextFen === "string" && nextFen.trim().length) {
          room.state.fen = nextFen;
        }
      } catch (e) {
        console.error("[WS] move_piece state persist error:", e);
      }

      // Bascule du tour serveur (si tu relies au moteur, remplace par la vraie couleur active)
      room.turn = room.turn === "white" ? "black" : "white";

      // Diffuse le coup aux autres
      socket.to(roomId).emit("move_piece", { move, color, nextFen: room.state.fen || null });

      // Diffuse la mise à jour de tour (aux deux côtés)
      io.to(roomId).emit("turn_update", {
        roomId,
        activeColor: room.turn,
      });
    });

    // ===== MESSAGERIE TEMPS RÉEL =====
    socket.on("message:send", async (payload, ack) => {
      try {
        console.log("[WS] message:send reçu:", payload, "from", userId);
        const to = String(payload?.to || "").trim();
        const text = String(payload?.text || "").trim();
        if (!to || !text) throw new Error("Invalid payload");

        const doc = await Message.create({ from: userId, to, text });

        const [fromUser, toUser] = await Promise.all([
          User.findById(userId).select("username avatarUrl email").lean(),
          User.findById(to).select("username avatarUrl email").lean(),
        ]);
        const fallbackName = (u, id) =>
          (u?.username && u.username.trim()) ||
          (u?.email ? u.email.split("@")[0] : `Joueur_${String(id).slice(-4)}`);

        const msg = {
          _id: String(doc._id),
          from: String(userId),
          to: String(to),
          text,
          createdAt: doc.createdAt,
          fromName: fallbackName(fromUser, userId),
          toName: fallbackName(toUser, to),
          fromAvatar: fromUser?.avatarUrl || "",
          toAvatar: toUser?.avatarUrl || "",
        };

        io.to(`user:${to}`).emit("message:new", msg);
        io.to(userRoom).emit("message:new", msg);

        ack?.({ ok: true, msg });
      } catch (err) {
        console.error("[WS] message:send error:", err);
        ack?.({ ok: false, error: err.message });
      }
    });

    // ===== Déconnexion socket =====
    socket.on("disconnect", (reason) => {
      console.log(`[WS] disconnect ${username} (${socket.id}) reason=${reason}`);

      for (const roomId of socket.joinedGameRooms) {
        const room = rooms[roomId];
        if (!room) continue;

        removePlayerFromRoom(room, userId);
        broadcastPlayers(roomId);
        cleanupRoomIfEmpty(roomId);
      }
      socket.joinedGameRooms.clear();
    });
  });

  return io;
}

module.exports = initWebsocket;
