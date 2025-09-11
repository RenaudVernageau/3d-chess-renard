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
} = require('../controllers/userController');

router.use(auth);

// ⚠️ Routes spécifiques AVANT "/:id"
router.get('/me', getMe);
router.put('/me', updateMe);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/friend-request', sendFriendRequest);
router.post('/:id/friend-request/respond', respondFriendRequest);

module.exports = router;
