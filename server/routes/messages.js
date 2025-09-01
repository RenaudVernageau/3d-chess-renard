// server/routes/messages.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const msgCtrl = require("../controllers/messageController");

router.use(auth);

router.get("/conversations", msgCtrl.getConversations);
router.get("/:otherId", msgCtrl.getMessagesWith);
router.post("/", msgCtrl.sendMessage);

module.exports = router;
