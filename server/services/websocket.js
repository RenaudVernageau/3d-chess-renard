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
  });

  // Auth WS
  io.use((socket, next) => {
    const token = socket.handshake?.auth?.token;
    if (!token) return next(new Error("Missing or invalid token"));
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      socket.user = { id: payload.sub, username: payload.username };
      return next();
    } catch (err) {
      return next(new Error("Missing or invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    const username = socket.user?.username;
    console.log(`[WS] connect ${username} (${socket.id}) userId=${userId}`);

    if (!userId) {
      console.error("[WS] ❌ userId manquant (JWT 'sub' ?)");
      return;
    }

    // Room perso pour la messagerie
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    console.log(`[WS] ${username} joined ${userRoom}`);

    // ===== ROOMS (jeu) =====

    // Helpers internes
    function ensureRoom(roomId) {
      if (!rooms[roomId]) {
        rooms[roomId] = {
          id: roomId,
          players: [],            // [{ id, username, color }]
          assignments: {},        // { [userId]: "white"|"black"|"spectator" }
          turn: "white",
          state: null,
          createdAt: Date.now(),
        };
      }
      return rooms[roomId];
    }

    function pickNextColor(assignments) {
      const colors = Object.values(assignments);
      if (!colors.includes("white")) return "white";
      if (!colors.includes("black")) return "black";
      return "spectator";
    }

    socket.on("create_room", () => {
      const roomId = uuid();
      const room = ensureRoom(roomId);

      // Créateur = white (si pas déjà assigné)
      if (!room.assignments[userId]) {
        room.assignments[userId] = "white";
        room.players.push({ id: userId, username, color: "white" });
      }

      socket.join(roomId);
      console.log(`[WS] room created ${roomId} by ${username}`);
      socket.emit("room_created", {
        roomId,
        players: room.players,
        yourColor: room.assignments[userId] || "white",
      });
    });

    socket.on("join_room", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return socket.emit("error", { error: "Room not found" });

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
      console.log(`[WS] ${username} joined game room ${roomId} as ${color}`);

      // Notifie l'arrivant avec sa couleur et l'état de la room
      socket.emit("room_joined", {
        roomId,
        players: room.players,
        yourColor: color,
        turn: room.turn,
      });

      // Notifie les autres d'une mise à jour
      socket.to(roomId).emit("room_player_update", {
        roomId,
        players: room.players,
      });
    });

    socket.on("move_piece", ({ roomId, move, color }) => {
      const room = rooms[roomId];
      if (!room) {
        console.warn(`[WS] move_piece: room not found ${roomId}`);
        return socket.emit("error", { error: "Room not found" });
      }

      // (Optionnel) faire respecter le tour
      // if (room.turn !== color) return socket.emit("error", { error: "Not your turn" });
      // room.turn = room.turn === "white" ? "black" : "white";

      socket.to(roomId).emit("move_piece", { move, color /*, turn: room.turn*/ });
    });

    // ===== MESSAGERIE TEMPS RÉEL =====
    socket.on("message:send", async (payload, ack) => {
      try {
        console.log("[WS] message:send reçu:", payload, "from", userId);
        const to = String(payload?.to || "").trim();
        const text = String(payload?.text || "").trim();
        if (!to || !text) throw new Error("Invalid payload");

        // 1) Sauvegarde en DB
        const doc = await Message.create({ from: userId, to, text });

        // 2) Infos utilisateurs (pour enrichir les convos)
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

        // 3) Diffusion temps réel
        io.to(`user:${to}`).emit("message:new", msg);
        io.to(userRoom).emit("message:new", msg);

        // 4) Ack pour le client émetteur
        ack?.({ ok: true, msg });
      } catch (err) {
        console.error("[WS] message:send error:", err);
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[WS] disconnect ${username} (${socket.id}) reason=${reason}`);
    });
  });

  return io;
}

module.exports = initWebsocket;
