// server/controllers/messageController.js
const mongoose = require('mongoose');
const Message  = require('../models/Message');

// Helper
const { Types: { ObjectId } } = mongoose;

/**
 * GET /api/messages/conversations
 */
exports.getConversations = async (req, res) => {
  try {
    const me = new ObjectId(req.user.sub);

    const convs = await Message.aggregate([
      { $match: { $or: [ { from: me }, { to: me } ] } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: { $cond: [ { $eq: ['$from', me] }, '$to', '$from' ] },
          lastMessage: { $first: '$$ROOT' }
      }},
      { $lookup: {
          from: 'users', localField: '_id', foreignField: '_id', as: 'partner'
      }},
      { $unwind: '$partner' },
      { $project: {
          _id: 0,
          partner: {
            _id:       '$partner._id',
            username:  '$partner.username',
            avatarUrl: '$partner.avatarUrl'
          },
          lastMessage: {
            _id:       '$lastMessage._id',
            text:      '$lastMessage.text',
            from:      '$lastMessage.from',
            to:        '$lastMessage.to',
            createdAt: '$lastMessage.createdAt'
          }
      }}
    ]);
    res.json(convs);
  } catch (err) {
    console.error('messageController.getConversations error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};

/**
 * GET /api/messages/:otherId
 */
exports.getMessagesWith = async (req, res) => {
  try {
    const me    = new ObjectId(req.user.sub);
    const other = new ObjectId(req.params.otherId);

    const msgs = await Message.find({
      $or: [ { from: me, to: other }, { from: other, to: me } ]
    })
    .sort({ createdAt: 1 })
    .populate('from', 'username avatarUrl')
    .populate('to',   'username avatarUrl');

    res.json(msgs);
  } catch (err) {
    console.error('messageController.getMessagesWith error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};

/**
 * POST /api/messages
 */
exports.sendMessage = async (req, res) => {
  try {
    console.log('sendMessage payload:', req.body, 'user:', req.user);
    const from = new ObjectId(req.user.sub);
    const to   = new ObjectId(req.body.to);
    const text = String(req.body.text || '').trim();

    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }

    const msg = new Message({ from, to, text });
    await msg.save();
    await msg.populate('from', 'username avatarUrl');
    await msg.populate('to',   'username avatarUrl');

    res.status(201).json(msg);
  } catch (err) {
    console.error('messageController.sendMessage error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};
