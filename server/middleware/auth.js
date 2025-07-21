// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing or invalid token' });
  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET); // { sub, username, iat, exp }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
