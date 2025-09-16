// server/routes/messages.js
const router = require("express").Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/messageController");

// Historique
router.get("/conversations", auth, ctrl.listConversations);
router.get("/:otherId",      auth, ctrl.listWithUser);

// Fallback HTTP d'envoi
router.post("/",             auth, ctrl.create);

// Supprimer un message (auteur OU moderator/admin)
router.delete("/:messageId", auth, ctrl.removeMessage);

// Masquer / ré-afficher un thread pour l’utilisateur courant
router.patch("/thread/:otherId/hidden", auth, ctrl.setThreadHidden);

module.exports = router;
