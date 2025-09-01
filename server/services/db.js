// server/services/db.js
const mongoose = require("mongoose");
const { MONGO_URI } = require("../config");

module.exports = async function initDb() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("[DB] MongoDB connecté");

    mongoose.connection.on("error", (err) => {
      console.error("[DB] Erreur MongoDB :", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[DB] Déconnecté de MongoDB");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("[DB] Reconnecté à MongoDB");
    });

    // Optionnel : fermeture propre quand le process stoppe
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("[DB] Connexion MongoDB fermée (SIGINT)");
      process.exit(0);
    });
  } catch (err) {
    console.error("[DB] Erreur de connexion :", err);
    process.exit(1);
  }
};
