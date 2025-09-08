// server/server.js
require("dotenv").config(); // 1) Charger .env dès le départ
const path = require("path");

// 2) Connexion à MongoDB
const initDb = require("./services/db");
initDb();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { json } = require("body-parser");
const config = require("./config");
const logger = require("./utils/logger");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const roomsRoutes = require("./routes/rooms");
const notificationsRoutes = require("./routes/notifications");
const messageRoutes = require("./routes/messages");

// WebSocket (rooms + notifications)
const initWs = require("./services/websocket");

const app = express();

/* -------------------------------
 * CORS
 * ------------------------------- */
const allowAllForNow = process.env.CORS_ALLOW_ALL === "true"; // utile pour débloquer si besoin

const allowedOrigins = [];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL); // ex: https://3d-chess-renard.vercel.app
if (process.env.FRONTEND_URL_PREVIEW) {
  // ex: .vercel.app (on acceptera tous les sous-domaines vercel)
  allowedOrigins.push(process.env.FRONTEND_URL_PREVIEW);
}
// En dev, autoriser le front local Vite
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:5173");
}

function isOriginAllowed(origin) {
  if (!origin) return true; // ex: Postman, curl
  return allowedOrigins.some((pat) => {
    if (!pat) return false;
    // autoriser wildcard vercel: ".vercel.app" -> origin se termine par ".vercel.app"
    if (pat.startsWith(".")) return origin.endsWith(pat);
    // autoriser "*.domain.tld"
    if (pat.startsWith("*.")) return origin.endsWith(pat.slice(1));
    // match exact
    return origin === pat;
  });
}

app.use(
  cors({
    origin: allowAllForNow ? true : (origin, cb) => cb(null, isOriginAllowed(origin)),
    credentials: true,
    // ✅ inclut PATCH et gère le preflight proprement
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Répondre explicitement aux preflights
// app.options("*", cors());

/* -------------------------------
 * Middlewares
 * ------------------------------- */
app.use(json({ limit: "5mb" })); // utile pour avatars en base64
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // fichiers statiques (avatars, etc.)

/* -------------------------------
 * Routes API
 * ------------------------------- */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/rooms", roomsRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/messages", messageRoutes);

/* -------------------------------
 * HTTP + WebSocket
 * ------------------------------- */
const server = http.createServer(app);
initWs(server);

server.listen(config.PORT, () => {
  logger.info(`HTTP+WS server listening on port ${config.PORT}`);
});
