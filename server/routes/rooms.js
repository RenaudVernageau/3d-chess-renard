// server/routes/rooms.js
const express = require('express');
const router = express.Router();
const gameCtrl = require('../controllers/gameController');
const authMiddleware = require('../middleware/auth');

// Toutes ces routes exigent un JWT valide
router.post('/', authMiddleware, gameCtrl.createRoom);
router.post('/:roomId/join', authMiddleware, gameCtrl.joinRoom);

module.exports = router;
