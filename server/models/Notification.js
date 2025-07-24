// server/models/Notification.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const notificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',       // destinataire de la notification
    required: true
  },
  type: {
    type: String,
    enum: ['friend_request', 'friend_accepted', 'duel_invite'],
    required: true
  },
  payload: {
    type: Schema.Types.Mixed, // objet libre : { from: userId, duelId, etc. }
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = model('Notification', notificationSchema);
