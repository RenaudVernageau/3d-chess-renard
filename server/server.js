// server/server.js
require("dotenv").config(); // 1) Charger .env dès le départ
const path = require("path");
const initDb = require("./services/db");
initDb(); // 2) Connexion à MongoDB

const express = require("express");
const http = require("http");
const cors = require("cors");
const { json } = require("body-parser");
const config = require("./config");
const logger = require("./utils/logger");

// Importer les routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const roomsRoutes = require("./routes/rooms");
const notificationsRoutes = require("./routes/notifications");
const messageRoutes = require('./routes/messages');
// Initialisation WebSocket (rooms + notifications)
const initWs = require("./services/websocket");

const app = express();

// --- CORS Middleware ---
const allowedOrigins = [];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
if (process.env.FRONTEND_URL_PREVIEW)
  allowedOrigins.push(process.env.FRONTEND_URL_PREVIEW);
// En dev, autoriser le front local Vite
if (process.env.NODE_ENV !== "production")
  allowedOrigins.push("http://localhost:5173");

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Gérer explicitement les preflights pour toutes les routes
app.options("*", cors());

// --- JSON Body Parsing ---
app.use(json({ limit: "5mb" }));

// --- Servir les fichiers uploadés (avatars, etc.) ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Routes API ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/messages", messageRoutes);

// --- HTTP + WebSocket Server ---
const server = http.createServer(app);
initWs(server);

server.listen(config.PORT, () => {
  logger.info(`HTTP+WS server listening on port ${config.PORT}`);
});
