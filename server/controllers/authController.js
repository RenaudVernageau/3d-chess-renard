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

    // 2) Créer l'utilisateur en alimentant **password** (le pre('save') de ton schéma
    //     hashera ce champ automatiquement)
    const user = new User({ username, email, password });
    await user.save();

    // 3) Générer un JWT
    const token = jwt.sign(
      { sub: user.id, username: user.username },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4) Répondre avec le token et les infos publiques
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
/**
 * POST /api/auth/login
 * Authentifie un utilisateur et renvoie un JWT
 */
exports.login = async (req, res) => {
  try {
    const { email, username, identifier, password } = req.body || {};

    // On normalise : "identifier" > email > username
    const id = identifier || email || username;
    if (!id || !password) {
      return res.status(400).json({ message: "Email/username and password are required" });
    }

    // Détecte si c'est un email
    const isEmail = /^\S+@\S+\.\S+$/.test(id);

    // Récupère l'utilisateur + hash
    const user = await User
      .findOne(isEmail ? { email: id.toLowerCase() } : { username: id })
      .select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare les mots de passe
    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Génère le JWT
    const token = jwt.sign(
      { sub: user.id, username: user.username },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Réponse (jamais renvoyer le hash)
    res.json({
      token,
      user: {
        id:        user.id,
        username:  user.username,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error("authController.login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
