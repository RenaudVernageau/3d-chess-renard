// server/services/websocket.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { rooms } = require("../models/Game");
const { v4: uuid } = require("uuid");
const { Chess } = require("chess.js");
const { pieceValues } = require("../utils/chessValues");
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
      socket.user = {
        id: String(payload.sub || payload.id || payload._id),
        username: payload.username || payload.name || "",
        role: payload.role || "user",
      };
      return next();
    } catch {
      return next(new Error("Missing or invalid token"));
    }
  });

  // ===== Helpers État de partie autoritatif =====
  function ensureRoom(roomId) {
    if (!rooms[roomId]) {
      const chess = new Chess();
      rooms[roomId] = {
        id: roomId,
        players: [],                  // [{ id, username, color }]
        assignments: {},              // { [userId]: 'white'|'black'|'spectator' }
        createdAt: Date.now(),
        chess,                        // instance autoritative
        state: {
          fen: chess.fen(),
          captures: { w: [], b: [] }, // côté qui CAPTURE
          turn: chess.turn(),         // 'w'|'b'
          moves: [],                  // (optionnel) trace minimale
        },
      };
    } else if (!rooms[roomId].state) {
      const chess = rooms[roomId].chess || new Chess();
      rooms[roomId].chess = chess;
      rooms[roomId].state = {
        fen: chess.fen(),
        captures: { w: [], b: [] },
        turn: chess.turn(),
        moves: [],
      };
    }
    return rooms[roomId];
  }

  const colorFromSide = (side) => (side === "w" ? "white" : "black");
  const sideFromColor = (c) => (c === "white" ? "w" : c === "black" ? "b" : "w");

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

  // --- Snapshot complet (toujours idempotent)
  function emitSnapshot(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    const { state } = room;
    io.to(roomId).emit("game:snapshot", {
      fen: state.fen,
      captures: state.captures,
      turn: state.turn, // 'w'|'b'
      movesCount: state.moves.length,
    });
  }

  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    const username = socket.user?.username || `User_${String(userId).slice(-4)}`;

    if (!userId) {
      console.error("[WS] ❌ userId manquant");
      return;
    }

    socket.joinedGameRooms = new Set();

    // Room perso (messagerie)
    const userRoom = `user:${userId}`;
    socket.join(userRoom);

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

      socket.emit("room_created", {
        roomId,
        players: room.players,
        yourColor: room.assignments[userId] || "white",
        activeColor: colorFromSide(room.state.turn),
      });

      // état initial
      socket.emit("state_sync", {
        fen: room.state.fen,
        captures: room.state.captures,
        turn: room.state.turn,
        movesCount: room.state.moves.length,
      });
    });

    // Créer/join une room avec ID donné
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

      socket.emit("room_created", {
        roomId,
        players: room.players,
        yourColor: room.assignments[userId] || "white",
        activeColor: colorFromSide(room.state.turn),
      });

      socket.emit("state_sync", {
        fen: room.state.fen,
        captures: room.state.captures,
        turn: room.state.turn,
        movesCount: room.state.moves.length,
      });

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
        if (idx >= 0) room.players[idx] = { id: userId, username, color };
        else room.players.push({ id: userId, username, color });
      }

      socket.join(roomId);
      socket.joinedGameRooms.add(roomId);

      socket.emit("room_joined", {
        roomId,
        players: room.players,
        yourColor: color,
        activeColor: colorFromSide(room.state.turn),
      });

      // Snapshot complet
      socket.emit("state_sync", {
        fen: room.state.fen,
        captures: room.state.captures,
        turn: room.state.turn,
        movesCount: room.state.moves.length,
      });

      socket.to(roomId).emit("room_player_update", {
        roomId,
        players: room.players,
      });
    });

    socket.on("state_request", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) {
        return socket.emit("state_sync", { fen: null, captures: { w: [], b: [] }, turn: "w", movesCount: 0 });
      }
      socket.emit("state_sync", {
        fen: room.state.fen,
        captures: room.state.captures,
        turn: room.state.turn,
        movesCount: room.state.moves.length,
      });
    });

    socket.on("leave_room", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      removePlayerFromRoom(room, userId);
      socket.leave(roomId);
      socket.joinedGameRooms.delete(roomId);

      broadcastPlayers(roomId);
      cleanupRoomIfEmpty(roomId);
    });

    socket.on("room_quit", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;

      socket.to(roomId).emit("room_peer_quit");
      removePlayerFromRoom(room, userId);
      socket.leave(roomId);
      socket.joinedGameRooms.delete(roomId);

      broadcastPlayers(roomId);
      cleanupRoomIfEmpty(roomId);
    });

    // ====== COUP AUTORITATIF ======
    // payload attendu: { roomId, move: { from:'e2', to:'e4', promotion? }, color:'white'|'black' }
    socket.on("move_piece", ({ roomId, move, color }) => {
      try {
        if (!roomId || !move?.from || !move?.to) return;

        const room = rooms[roomId] || ensureRoom(roomId);
        const { chess, state } = room;

        // Vérif tour serveur
        const sideToPlay = chess.turn(); // 'w'|'b'
        const humanTurn = colorFromSide(sideToPlay);
        if (humanTurn !== color) {
          return socket.emit("error", { error: "Not your turn" });
        }

        // Appliquer coup via chess.js (serveur = vérité)
        const m = chess.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion || (move.to.endsWith("8") || move.to.endsWith("1") ? "q" : undefined),
        });

        if (!m) {
          return socket.emit("error", { error: "Illegal move" });
        }

        // Capture ?
        if (m.captured && m.captured !== "k") {
          const by = m.color; // 'w'|'b' qui a joué donc capturé
          state.captures[by].push({
            piece: m.captured,
            by,
            at: Date.now(),
            from: m.from,
            to: m.to,
          });

          io.to(roomId).emit("piece:capture", {
            roomId,
            by,
            piece: m.captured,
            value: pieceValues[m.captured] || 0,
            at: Date.now(),
            from: m.from,
            to: m.to,
          });
        }

        // Mettre à jour le snapshot
        state.fen = chess.fen();
        state.turn = chess.turn(); // prochain à jouer
        state.moves.push({ from: m.from, to: m.to, san: m.san });

        // Notifier le coup (utile si ton client attend ce pipe)
        socket.to(roomId).emit("move_piece", {
          move: { from: m.from, to: m.to, san: m.san, promotion: m.promotion || undefined },
          color, // couleur qui vient de jouer
          nextFen: state.fen,
        });

        // Snapshot complet pour tous (idempotent)
        emitSnapshot(roomId);
      } catch (err) {
        console.error("[WS] move_piece error:", err);
        socket.emit("error", { error: "Move processing error" });
      }
    });

    // ===== MESSAGERIE =====
    socket.on("message:send", async (payload, ack) => {
      try {
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

    // ===== Déconnexion =====
    socket.on("disconnect", (reason) => {
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

  // accès io dans req.app si besoin
  server.setMaxListeners?.(0);
  server.on?.("request", (req, res) => { /* noop to keep handle */ });
  server.io = io;
  return io;
}

module.exports = initWebsocket;
