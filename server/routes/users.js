// server/routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
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
} = require('../controllers/userController');

router.use(auth);

// ⚠️ Routes spécifiques AVANT "/:id"
router.get('/me', getMe);
router.put('/me', updateMe);

router.get('/', getAllUsers);
router.get('/:id', getUserById);

// update par self, mod, admin (control déjà dans controller)
router.put('/:id', updateUser);

// suspend (mod/admin)
router.patch('/:id/suspend', auth.requireRole("moderator", "admin"), suspendUser);

// delete par self ou admin (control déjà dans controller)
router.delete('/:id', deleteUser);

router.post('/:id/friend-request', sendFriendRequest);
router.post('/:id/friend-request/respond', respondFriendRequest);

module.exports = router;
