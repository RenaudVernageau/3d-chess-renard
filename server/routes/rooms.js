// server/routes/rooms.js
const express = require('express');
const router = express.Router();
const gameCtrl = require('../controllers/gameController');

router.post('/',         gameCtrl.createRoom);      // POST /api/rooms
router.post('/:roomId/join', gameCtrl.joinRoom);    // POST /api/rooms/:roomId/join

module.exports = router;
