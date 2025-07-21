// server/services/db.js
const mongoose = require('mongoose');
const { MONGO_URI } = require('../config');

module.exports = async function initDb() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[DB] MongoDB connecté');
  } catch (err) {
    console.error('[DB] Erreur de connexion :', err);
    process.exit(1);
  }
};
