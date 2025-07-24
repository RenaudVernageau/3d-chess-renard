// server/controllers/authController.js
const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

/**
 * POST /api/auth/register
 * Crée un nouvel utilisateur et renvoie un JWT
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1) Vérifier doublons
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // 2) Créer et hasher le mot de passe via le pre('save')
    const user = new User({
      username,
      email,
      passwordHash: password
    });
    await user.save();

    // 3) Générer un token
    const token = jwt.sign(
      { sub: user.id, username: user.username },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id:        user.id,
        username:  user.username,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error('authController.register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/auth/login
 * Authentifie un utilisateur et renvoie un JWT
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2) Vérifier le mot de passe
    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3) Générer un token
    const token = jwt.sign(
      { sub: user.id, username: user.username },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id:        user.id,
        username:  user.username,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error('authController.login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};