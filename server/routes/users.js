// server/routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,       // update par :id
  deleteUser,
  sendFriendRequest,
  respondFriendRequest,
  updateMe          // <-- ajoute cette action dans le controller (voir plus bas)
} = require('../controllers/userController');

router.use(auth);

// IMPORTANT: routes spécifiques avant '/:id'
router.put('/me', updateMe);           // <-- pour le front qui fait PUT /users/me

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/friend-request', sendFriendRequest);
router.post('/:id/friend-request/respond', respondFriendRequest);

module.exports = router;
