// server/controllers/authController.js
const User = require('../models/User');
const jwt  = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

// POST /api/auth/register
exports.register = async (req, res) => {
  const { username, email, password, avatar } = req.body;
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: 'username, email & password required' });
  }

  const user = new User({ username, email, password, avatar });
  try {
    await user.save();
  } catch (err) {
    // 11000 = duplicate key error
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: 'Username or email already in use' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }

  const token = jwt.sign(
    { sub: user._id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.status(201).json({ userId: user._id, token });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { sub: user._id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ userId: user._id, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
