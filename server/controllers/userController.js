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
 * Met à jour **son propre** profil
 */
exports.updateUser = async (req, res) => {
  // Autorise seulement l’utilisateur lui‑même
  if (req.user.sub !== req.params.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { username, email, avatar, password } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Si on change le pseudo, s’assurer qu’il reste unique
    if (username && username !== user.username) {
      if (await User.findOne({ username })) {
        return res.status(409).json({ error: "Username already in use" });
      }
      user.username = username;
    }

    // Même logique pour l’email
    if (email && email !== user.email) {
      if (await User.findOne({ email })) {
        return res.status(409).json({ error: "Email already in use" });
      }
      user.email = email;
    }

    // Si on envoie un nouvel avatar (URL ou path)
    if (avatar) {
      user.avatar = avatar;
    }

    // Si on change de mot de passe
    if (password) {
      user.password = password; // sera hashé grâce au pre('save') dans le modèle
    }

    await user.save();
    res.json({ message: "Profile updated" });
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
