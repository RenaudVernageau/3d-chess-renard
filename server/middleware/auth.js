// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

async function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.split(" ")[1] : null;
  const token = bearer || req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    const userId = payload.sub || payload.id || payload._id;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload (no id)' });
    }

    // 🔎 récupère role/isSuspended pour l’auth courante
    const u = await User.findById(userId).select("role isSuspended username").lean();
    if (!u) return res.status(401).json({ message: "User not found" });
    if (u.isSuspended) return res.status(403).json({ message: "Account suspended" });

    req.user = {
      id: String(userId),
      username: u.username || payload.username || payload.name || "",
      role: u.role || "user",
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Helpers middlewares
auth.requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  next();
};

auth.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
  next();
};

module.exports = auth;
