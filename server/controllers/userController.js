const mongoose = require("mongoose");
const User = require("../models/User");

/* ---------- helpers ---------- */
function toPublicUser(u) {
  if (!u) return null;
  const id = String(u._id || u.id);
  const avatar = u.avatarUrl || u.avatar || "";
  return {
    id,
    username: u.username,
    email: u.email,
    avatar,
    createdAt: u.createdAt,
  };
}

/* ========== GET /users/me ========== */
exports.getMe = async (req, res) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId)
      return res.status(401).json({ message: "Not authenticated" });

    const me = await User.findById(authUserId)
      .select("username email avatar avatarUrl createdAt")
      .lean();

    if (!me) return res.status(404).json({ message: "User not found" });
    return res.json(toPublicUser(me));
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ========== GET /users ========== */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("username email avatar avatarUrl createdAt")
      .sort({ username: 1 })
      .lean();

    res.json(users.map(toPublicUser));
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ========== GET /users/:id ========== */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Evite les 500 si l'id n'est pas un ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // ❗ Correction: on utilise uniquement une projection en INCLUSION
    // et on retire les populate qui ne sont pas nécessaires pour "photo + username"
    const user = await User.findById(id)
      .select("username email avatar avatarUrl createdAt")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(toPublicUser(user));
  } catch (err) {
    console.error("getUserById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ---------- facteur commun de mise à jour ---------- */
async function applyUserUpdates({ targetUserId, body }) {
  const updates = {};

  // username
  if (typeof body.username === "string" && body.username.trim()) {
    const username = body.username.trim();
    const exists = await User.findOne({ username }).lean();
    if (exists && String(exists._id) !== String(targetUserId)) {
      const e = new Error("Username already in use");
      e.code = 409;
      throw e;
    }
    updates.username = username;
  }

  // Avatar : on accepte "avatar" ET/OU "avatarUrl", on sauve toujours en avatarUrl (conforme au schéma)
  if (typeof body.avatar === "string" && body.avatar.trim()) {
    updates.avatarUrl = body.avatar.trim();
  }
  if (typeof body.avatarUrl === "string" && body.avatarUrl.trim()) {
    updates.avatarUrl = body.avatarUrl.trim();
  }

  if (Object.keys(updates).length === 0) {
    const e = new Error("No changes");
    e.code = 400;
    throw e;
  }

  const user = await User.findByIdAndUpdate(targetUserId, updates, {
    new: true,
    runValidators: true,
    context: "query",
  }).select("username email avatar avatarUrl createdAt");

  if (!user) {
    const e = new Error("User not found");
    e.code = 404;
    throw e;
  }
  return user;
}

/* ========== PUT /users/me ========== */
exports.updateMe = async (req, res) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId)
      return res.status(401).json({ message: "Not authenticated" });

    const updated = await applyUserUpdates({
      targetUserId: authUserId,
      body: req.body,
    });
    return res.json(toPublicUser(updated));
  } catch (err) {
    const status = err.code || 500;
    if (status !== 500)
      return res.status(status).json({ message: err.message });
    console.error("updateMe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ========== PUT /users/:id ========== */
exports.updateUser = async (req, res) => {
  try {
    const authUserId = req.user?.id;
    const { id } = req.params;
    if (!authUserId || String(authUserId) !== String(id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const updated = await applyUserUpdates({
      targetUserId: id,
      body: req.body,
    });
    return res.json(toPublicUser(updated));
  } catch (err) {
    const status = err.code || 500;
    if (status !== 500)
      return res.status(status).json({ message: err.message });
    console.error("updateUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ========== DELETE /users/:id ========== */
exports.deleteUser = async (req, res) => {
  const authUserId = req.user?.id;
  const { id } = req.params;
  if (!authUserId || String(authUserId) !== String(id)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    await User.findByIdAndDelete(id);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ========== POST /users/:id/friend-request ========== */
exports.sendFriendRequest = async (req, res) => {
  const fromId = req.user?.id;
  const toId = req.params.id;
  if (String(fromId) === String(toId)) {
    return res.status(400).json({ message: "Cannot friend yourself" });
  }
  try {
    const target = await User.findById(toId);
    if (!target)
      return res.status(404).json({ message: "Target user not found" });

    const alreadyFriends = target.friends.map(String).includes(String(fromId));
    const existingRequest = target.friendRequests.some(
      (fr) => String(fr.from) === String(fromId)
    );
    if (alreadyFriends || existingRequest) {
      return res
        .status(409)
        .json({ message: "Already friends or request pending" });
    }
    await User.findByIdAndUpdate(toId, {
      $push: { friendRequests: { from: fromId } },
    });
    res.status(201).json({ message: "Friend request sent" });
  } catch (err) {
    console.error("sendFriendRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ========== POST /users/:id/friend-request/respond ========== */
exports.respondFriendRequest = async (req, res) => {
  const authUserId = req.user?.id;
  const { id } = req.params;
  const { fromId, accept } = req.body;
  if (!authUserId || String(authUserId) !== String(id)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const me = await User.findById(authUserId);
    const request = me.friendRequests.find(
      (fr) => String(fr.from) === String(fromId)
    );
    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    request.status = accept ? "accepted" : "rejected";
    await me.save();

    if (accept) {
      await User.findByIdAndUpdate(fromId, { $push: { friends: authUserId } });
      me.friends.push(fromId);
      await me.save();
    }
    res.json({
      message: accept ? "Friend request accepted" : "Friend request rejected",
    });
  } catch (err) {
    console.error("respondFriendRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
