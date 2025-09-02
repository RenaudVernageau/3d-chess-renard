//server/routes/messages.js
const router = require("express").Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/messageController");

// Historique
router.get("/conversations", auth, ctrl.listConversations);
router.get("/:otherId",      auth, ctrl.listWithUser);

// Fallback HTTP d'envoi (si pas de WS)
router.post("/",             auth, ctrl.create);

module.exports = router;
