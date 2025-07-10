// server/server.js
const express = require('express');
const http    = require('http');
const cors    = require('cors');
const { json } = require('body-parser');
const config  = require('./config');
const logger  = require('./utils/logger');
const authRoutes  = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');
const initWebsocket = require('./services/websocket');

const app = express();

// Middlewares
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);

// Start HTTP + WS
const server = http.createServer(app);
initWebsocket(server);

server.listen(config.PORT, () => {
  logger.info(`HTTP+WS server listening on port ${config.PORT}`);
});
