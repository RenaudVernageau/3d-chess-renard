// server/services/websocket.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { rooms } = require("../models/Game");
const { v4: uuid } = require("uuid");
const Message = require("../models/Message");

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
      // ⚠️ ton JWT met l'id dans "sub"
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
    socket.on("create_room", () => {
      const roomId = uuid();
      rooms[roomId] = { id: roomId, players: [username], state: null };
      socket.join(roomId);
      console.log(`[WS] room created ${roomId} by ${username}`);
      socket.emit("room_created", { roomId, players: rooms[roomId].players });
    });

    socket.on("join_room", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return socket.emit("error", { error: "Room not found" });
      if (!room.players.includes(username)) room.players.push(username);
      socket.join(roomId);
      console.log(`[WS] ${username} joined game room ${roomId}`);
      io.in(roomId).emit("room_joined", { roomId, players: room.players });
    });

    socket.on("move_piece", ({ roomId, move }) => {
      const room = rooms[roomId];
      if (!room) {
        console.warn(`[WS] move_piece: room not found ${roomId}`);
        return socket.emit("error", { error: "Room not found" });
      }
      socket.to(roomId).emit("move_piece", move);
    });

    // ===== MESSAGERIE TEMPS RÉEL =====
    socket.on("message:send", async (payload, ack) => {
      try {
        console.log("[WS] message:send reçu:", payload, "from", userId);
        const to = String(payload?.to || "").trim();
        const text = String(payload?.text || "").trim();
        if (!to || !text) throw new Error("Invalid payload");

        // debug: le destinataire est-il bien dans sa room perso ?
        const hasDest = io.sockets.adapter.rooms.get(`user:${to}`);
        console.log(`[WS] user:${to} present?`, !!hasDest, "size=", hasDest?.size || 0);

        const doc = await Message.create({ from: userId, to, text });
        const msg = {
          _id: String(doc._id),
          from: userId,
          to,
          text,
          createdAt: doc.createdAt,
        };

        console.log("[WS] message:new ->", `user:${to}`, "et", userRoom, msg);
        io.to(`user:${to}`).emit("message:new", msg); // destinataire
        io.to(userRoom).emit("message:new", msg);     // émetteur (toutes ses tabs)

        ack && ack({ ok: true, msg });
      } catch (err) {
        console.error("[WS] message:send error:", err);
        ack && ack({ ok: false, error: err.message });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[WS] disconnect ${username} (${socket.id}) reason=${reason}`);
    });
  });

  return io;
}

module.exports = initWebsocket;
