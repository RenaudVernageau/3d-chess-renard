// server/routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  sendFriendRequest,
  respondFriendRequest
} = require('../controllers/userController');

// Toutes ces routes nécessitent un JWT valide
router.use(auth);

// Récupère tous les utilisateurs (annuaire)
router.get('/', getAllUsers);

// Récupère le profil d'un utilisateur
router.get('/:id', getUserById);

// Met à jour son propre profil (username, avatarUrl)
router.put('/:id', updateUser);

// Supprime son propre compte
router.delete('/:id', deleteUser);

// Envoie d'une demande d'ami vers l'utilisateur ciblé
router.post('/:id/friend-request', sendFriendRequest);

// Répond à une demande d'ami (accept/reject)
router.post('/:id/friend-request/respond', respondFriendRequest);

module.exports = router;
