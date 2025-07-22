// server/controllers/userController.js
const User = require("../models/User");

/**
 * GET /api/users
 * Renvoie la liste de tous les utilisateurs
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("username email avatar createdAt");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/users/:id
 * Renvoie un utilisateur par son ID
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("username email avatar createdAt");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * PUT /api/users/:id
 * Met à jour **son propre** profil (username & avatar uniquement)
 */
exports.updateUser = async (req, res) => {
  // 1) On n’autorise que soi‑même
  if (req.user.sub !== req.params.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { username, avatar } = req.body;
  const updates = {};

  // 2) Si le pseudo change, on vérifie qu’il n’est pas déjà pris
  if (username) {
    const already = await User.findOne({ username });
    if (already && already._id.toString() !== req.params.id) {
      return res.status(409).json({ error: "Username already in use" });
    }
    updates.username = username;
  }

  // 3) Si on fournit un avatar (DataURL ou URL), on le met à jour
  if (avatar) {
    updates.avatar = avatar;
  }

  try {
    // 4) findByIdAndUpdate n’impose la validation que sur les champs passés
    const userUpdated = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    ).select("username email avatar");

    if (!userUpdated) {
      return res.status(404).json({ error: "User not found" });
    }

    // 5) On renvoie les données à jour pour le front
    res.json({
      userId:   userUpdated._id,
      username: userUpdated.username,
      email:    userUpdated.email,
      avatar:   userUpdated.avatar,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * DELETE /api/users/:id
 * Supprime **son propre** compte
 */
exports.deleteUser = async (req, res) => {
  if (req.user.sub !== req.params.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
