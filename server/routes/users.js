// server/routes/users.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { requireRole, selfOrRole } = require("../middleware/roles");

const {
  getMe,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  sendFriendRequest,
  respondFriendRequest,
  updateMe,
  suspendUser,
} = require("../controllers/userController");

// Toutes ces routes nécessitent un JWT valide
router.use(auth);

// Spécifiques AVANT "/:id"
router.get("/me", getMe);
router.put("/me", updateMe);

// Liste & lecture
router.get("/", getAllUsers);
router.get("/:id", getUserById);

// Update profil : self OU au moins moderator (admin passe aussi)
router.put("/:id", selfOrRole("moderator"), updateUser);

// Suspendre/désuspendre : au moins moderator
router.patch("/:id/suspend", requireRole("moderator"), suspendUser);

// Supprimer le compte : self OU admin
router.delete("/:id", selfOrRole("admin"), deleteUser);

// Friend requests
router.post("/:id/friend-request", sendFriendRequest);
router.post("/:id/friend-request/respond", respondFriendRequest);

module.exports = router;
