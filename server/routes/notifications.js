// server/routes/notifications.js
const router = require('express').Router();
const auth = require('../middleware/auth');
const { getNotifications, markAsRead } = require('../controllers/notifications');

router.use(auth); // JWT obligatoire

// GET  /api/notifications
router.get('/', getNotifications);

// POST /api/notifications/:id/read
router.post('/:id/read', markAsRead);

module.exports = router;
