// server/controllers/userController.js
const User = require('../models/User');

/**
 * GET /api/users
 * Renvoie la liste de tous les utilisateurs (sans données sensibles)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('username email avatarUrl createdAt')
      .sort({ username: 1 });
    res.json(users);
  } catch (err) {
    console.error('getAllUsers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/users/:id
 * Renvoie un utilisateur par son ID (profil complet)
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash')
      .populate('friends', 'username avatarUrl')
      .populate('friendRequests.from', 'username avatarUrl');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('getUserById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/users/:id
 * Met à jour le profil de l'utilisateur authentifié (username & avatarUrl)
 */
exports.updateUser = async (req, res) => {
  const authUserId = req.user.id;
  const { id } = req.params;
  if (authUserId !== id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { username, avatarUrl } = req.body;
  const updates = {};

  if (username) {
    const exists = await User.findOne({ username });
    if (exists && exists._id.toString() !== id) {
      return res.status(409).json({ message: 'Username already in use' });
    }
    updates.username = username;
  }
  if (avatarUrl) updates.avatarUrl = avatarUrl;

  try {
    const userUpdated = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true, context: 'query' }
    ).select('username email avatarUrl createdAt');
    if (!userUpdated) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(userUpdated);
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /api/users/:id
 * Supprime le compte de l'utilisateur authentifié
 */
exports.deleteUser = async (req, res) => {
  const authUserId = req.user.id;
  const { id } = req.params;
  if (authUserId !== id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/users/:id/friend-request
 * Envoie une demande d'ami vers l'utilisateur ciblé
 */
exports.sendFriendRequest = async (req, res) => {
  const fromId = req.user.id;
  const toId = req.params.id;
  if (fromId === toId) {
    return res.status(400).json({ message: 'Cannot friend yourself' });
  }
  try {
    const target = await User.findById(toId);
    if (!target) {
      return res.status(404).json({ message: 'Target user not found' });
    }
    const alreadyFriends = target.friends.includes(fromId);
    const existingRequest = target.friendRequests.some(
      fr => fr.from.toString() === fromId
    );
    if (alreadyFriends || existingRequest) {
      return res.status(409).json({ message: 'Already friends or request pending' });
    }
    await User.findByIdAndUpdate(toId, {
      $push: { friendRequests: { from: fromId } }
    });
    res.status(201).json({ message: 'Friend request sent' });
  } catch (err) {
    console.error('sendFriendRequest error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/users/:id/friend-request/respond
 * Répond à une demande d'ami (accept/reject)
 */
exports.respondFriendRequest = async (req, res) => {
  const authUserId = req.user.id;
  const { id } = req.params;
  const { fromId, accept } = req.body;
  if (authUserId !== id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const me = await User.findById(authUserId);
    const request = me.friendRequests.find(
      fr => fr.from.toString() === fromId
    );
    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    request.status = accept ? 'accepted' : 'rejected';
    await me.save();
    if (accept) {
      await User.findByIdAndUpdate(fromId, { $push: { friends: authUserId } });
      me.friends.push(fromId);
      await me.save();
    }
    res.json({ message: accept ? 'Friend request accepted' : 'Friend request rejected' });
  } catch (err) {
    console.error('respondFriendRequest error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
