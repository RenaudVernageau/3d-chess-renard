// server/controllers/authController.js
const { users } = require('../models/User');

exports.register = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'username & password required' });
  if (users.find(u => u.username === username))
    return res.status(409).json({ error: 'User already exists' });
  users.push({ username, password });
  return res.status(201).json({ message: 'Registered' });
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  // pour MVP on renvoie un token factice
  return res.json({ token: 'fake-jwt-token', username });
};
