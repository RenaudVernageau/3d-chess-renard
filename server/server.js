// server/server.js
require("dotenv").config();            // 1) Charge .env en premier
const path      = require("path");
const initDb    = require("./services/db");
initDb();                              // 2) Connexion à MongoDB

const express   = require("express");
const http      = require("http");
const cors      = require("cors");
const { json }  = require("body-parser");
const config    = require("./config");
const logger    = require("./utils/logger");

const authRoutes  = require("./routes/auth");
const userRoutes  = require("./routes/users");
const roomsRoutes = require("./routes/rooms");
const initWs      = require("./services/websocket");

const app = express();

// --- CORS Middleware ---
const allowedOrigins = [];
if (process.env.FRONTEND_URL)         allowedOrigins.push(process.env.FRONTEND_URL);
if (process.env.FRONTEND_URL_PREVIEW) allowedOrigins.push(process.env.FRONTEND_URL_PREVIEW);

app.use(cors({
  origin:      allowedOrigins,
  credentials: true,
  methods:     ["GET","POST","PUT","DELETE","OPTIONS"]
}));

// --- JSON Body Parsing ---
// augmente la limite pour accepter de gros payload (ex. DataURL avatar)
app.use(json({ limit: "5mb" }));

// --- Servir les fichiers uploadés (avatars, etc.) ---
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// --- Routes API ---
app.use("/api/auth",  authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomsRoutes);

// --- HTTP + WebSocket Server ---
const server = http.createServer(app);
initWs(server);

server.listen(config.PORT, () => {
  logger.info(`HTTP+WS server listening on port ${config.PORT}`);
});
