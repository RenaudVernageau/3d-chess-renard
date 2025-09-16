// server/routes/messages.js
const router = require("express").Router();

const auth = require("../middleware/auth");
// For future: you can require role here if you add staff-only endpoints
// const { requireRole } = require("../middleware/roles");

const ctrl = require("../controllers/messageController");

// All message routes require auth
router.use(auth);

// Conversations list + thread history
router.get("/conversations", ctrl.listConversations);
router.get("/:otherId", ctrl.listWithUser);

// Fallback HTTP send (WS down)
router.post("/", ctrl.create);

// Delete a message:
// - Author can delete their own
// - moderator/admin can delete any (enforced inside controller)
router.delete("/:messageId", ctrl.removeMessage);

// Hide/unhide a thread for the current user
router.patch("/thread/:otherId/hidden", ctrl.setThreadHidden);

module.exports = router;
