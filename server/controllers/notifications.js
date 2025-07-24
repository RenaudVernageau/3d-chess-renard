// server/controllers/notifications.js
const Notification = require('../models/Notification');

/**
 * GET /api/notifications
 * Récupère toutes les notifications de l'utilisateur connecté
 */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort('-createdAt')
      .lean();
    res.json(notifications);
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/notifications/:id/read
 * Marque la notification spécifiée comme lue
 */
exports.markAsRead = async (req, res) => {
  try {
    const notifId = req.params.id;
    const updated = await Notification.findOneAndUpdate(
      { _id: notifId, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
