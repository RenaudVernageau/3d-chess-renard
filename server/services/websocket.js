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
    transports: ["websocket"],
    pingInterval: 25000,
    pingTimeout: 60000,
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
        state: { fen: null, moves: [] },
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

      socket.emit("state_sync", room.state);
    });

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
        } else {
          // refresh username/color if needed
          const idx = room.players.findIndex((p) => p.id === userId);
          if (idx >= 0) room.players[idx] = { id: userId, username: uname || username, color };
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

      socket.emit("state_sync", room.state);
      socket.to(roomId).emit("room_player_update", {
        roomId,
        players: room.players,
      });
    });

    socket.on("join_room", ({ roomId }) => {
      const room = ensureRoom(roomId);

      let color = room.assignments[userId];
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

      socket.emit("room_joined", {
        roomId,
        players: room.players,
        yourColor: color,
        activeColor: room.turn,
      });

      socket.emit("state_sync", room.state);

      socket.to(roomId).emit("room_player_update", {
        roomId,
        players: room.players,
      });
    });

    socket.on("state_request", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) {
        console.warn(`[WS] state_request: room not found ${roomId}`);
        return socket.emit("state_sync", { fen: null, moves: [] });
      }
      socket.emit("state_sync", room.state || { fen: null, moves: [] });
    });

    socket.on("leave_room", ({ roomId }, ack) => {
      const room = rooms[roomId];
      if (!room) {
        ack?.({ ok: false, error: "room_not_found" });
        return;
      }
      removePlayerFromRoom(room, userId);
      socket.leave(roomId);
      socket.joinedGameRooms.delete(roomId);

      console.log(`[WS] ${username} left room ${roomId}`);

      broadcastPlayers(roomId);
      cleanupRoomIfEmpty(roomId);
      ack?.({ ok: true });
    });

    socket.on("room_quit", ({ roomId }, ack) => {
      const room = rooms[roomId];
      if (!room) {
        ack?.({ ok: false, error: "room_not_found" });
        return;
      }

      console.log(`[WS] ${username} quits game room ${roomId}`);

      socket.to(roomId).emit("room_peer_quit");

      removePlayerFromRoom(room, userId);
      socket.leave(roomId);
      socket.joinedGameRooms.delete(roomId);

      broadcastPlayers(roomId);
      cleanupRoomIfEmpty(roomId);
      ack?.({ ok: true });
    });

    // ======= NOUVEAU: Abandon (resign) pour terminer la partie proprement =======
    socket.on("game:resign", ({ roomId } = {}, ack) => {
      try {
        if (!roomId) {
          ack?.({ ok: false, error: "missing_room_id" });
          return;
        }
        const room = rooms[roomId];
        if (!room) {
          ack?.({ ok: false, error: "room_not_found" });
          return;
        }

        const loserId = socket.user?.id;
        // gagnant = premier autre joueur de la room si présent
        const others = (room.players || []).filter((p) => p.id !== loserId);
        const winnerId = others[0]?.id || null;

        if (!room.state) room.state = { fen: null, moves: [] };

        let winnerColor = null;
        if (winnerId) {
          const assign = room.assignments[winnerId];
          winnerColor = assign === "white" ? "white" : assign === "black" ? "black" : null;
        }

        room.state.gameOver = {
          reason: "resign",
          winner: winnerColor, // "white" | "black" | null
          at: Date.now(),
        };

        // Broadcast fin de partie au salon
        io.to(roomId).emit("game_over", {
          reason: "resign",
          winner: winnerColor,
        });

        ack?.({ ok: true });
      } catch (e) {
        console.error("[WS] game:resign error:", e);
        ack?.({ ok: false, error: "server_error" });
      }
    });
    // ===== FIN RESIGN =====

    // Réception d'un coup
    socket.on("move_piece", ({ roomId, move, color, nextFen }) => {
      const room = rooms[roomId];
      if (!room) {
        console.warn(`[WS] move_piece: room not found ${roomId}`);
        return socket.emit("error", { error: "Room not found" });
      }

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

      room.turn = room.turn === "white" ? "black" : "white";

      socket.to(roomId).emit("move_piece", { move, color, nextFen: room.state.fen || null });

      io.to(roomId).emit("turn_update", {
        roomId,
        activeColor: room.turn,
      });
    });

    // ===== MESSAGERIE =====
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

    // ===== REMATCH (rejouer) =====
    // Propose un rematch à l'adversaire de la room
    socket.on("rematch:request", (p = {}) => {
      const { roomId, fromUserId, toUserId } = p;
      if (!roomId || !fromUserId || !toUserId) return;
      console.log(`[WS] rematch:request room=${roomId} from=${fromUserId} to=${toUserId}`);
      // on notifie toute la room (front filtrera si besoin)
      io.to(roomId).emit("rematch:incoming", { roomId, fromUserId, toUserId });
    });

    // Le destinataire accepte → crée une nouvelle room et inverse les couleurs
    socket.on("rematch:accept", (p = {}) => {
      const { roomId, fromUserId, toUserId } = p;
      if (!roomId || !fromUserId || !toUserId) return;

      const old = rooms[roomId];
      if (!old) {
        console.warn(`[WS] rematch:accept but room not found ${roomId}`);
        return;
      }

      const newRoomId = uuid();
      const newRoom = ensureRoom(newRoomId);

      // tente de récupérer les infos joueurs depuis l'ancienne room
      const a = old.players.find((x) => x.id === fromUserId);
      const b = old.players.find((x) => x.id === toUserId);

      const aName = a?.username || `User_${String(fromUserId).slice(-4)}`;
      const bName = b?.username || `User_${String(toUserId).slice(-4)}`;

      // inverse les couleurs par défaut
      newRoom.assignments[fromUserId] = (a?.color === "white") ? "black" : "white";
      newRoom.assignments[toUserId]   = (b?.color === "white") ? "black" : "white";

      newRoom.players = [
        { id: fromUserId, username: aName, color: newRoom.assignments[fromUserId] },
        { id: toUserId,   username: bName, color: newRoom.assignments[toUserId] },
      ];
      newRoom.turn = "white";
      newRoom.state = { fen: null, moves: [] };

      console.log(`[WS] rematch:accepted → newRoom=${newRoomId}`);

      // Notifie la room d'origine
      io.to(roomId).emit("rematch:accepted", {
        roomId,
        newRoomId,
        swapColors: true,
      });
    });

    socket.on("rematch:decline", (p = {}) => {
      const { roomId, fromUserId, toUserId } = p;
      if (!roomId || !fromUserId || !toUserId) return;
      console.log(`[WS] rematch:decline room=${roomId} from=${fromUserId} to=${toUserId}`);
      io.to(roomId).emit("rematch:declined", { roomId, fromUserId, toUserId });
    });

    socket.on("rematch:cancel", (p = {}) => {
      const { roomId, fromUserId, toUserId } = p;
      if (!roomId || !fromUserId || !toUserId) return;
      console.log(`[WS] rematch:cancel room=${roomId} from=${fromUserId} to=${toUserId}`);
      io.to(roomId).emit("rematch:cancelled", { roomId, fromUserId, toUserId });
    });
    // ===== FIN REMATCH =====

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
