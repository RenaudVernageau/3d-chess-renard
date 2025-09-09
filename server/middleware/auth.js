// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.split(" ")[1] || req.cookies?.token;
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);

    // l’ID peut être dans sub, id ou _id selon ton sign()
    const userId = payload.sub || payload.id || payload._id;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload (no id)' });
    }

    req.user = { id: String(userId), username: payload.username || payload.name || "" };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
