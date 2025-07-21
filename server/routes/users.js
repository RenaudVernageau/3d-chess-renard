// server/routes/users.js
const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/auth");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require("../controllers/userController");

// Toutes ces routes nécessitent un JWT valide
router.use(auth);

router.get("/",      getAllUsers);
router.get("/:id",   getUserById);
router.put("/:id",   updateUser);
router.delete("/:id",deleteUser);

module.exports = router;
