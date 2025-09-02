//server/controllers/messageController.js
const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");

/**
 * GET /api/messages/conversations
 * Renvoie la liste des conversations (dernier message par partenaire)
 */
exports.listConversations = async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.user.id);

    // On regroupe par "autre utilisateur"
    const convs = await Message.aggregate([
      { $match: { $or: [{ from: me }, { to: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$from", me] }, "$to", "$from"],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      { $limit: 50 }, // sécurité simple
    ]);

    // Récupérer les infos partenaires
    const partnerIds = convs.map((c) => c._id);
    const partners = await User.find({ _id: { $in: partnerIds } })
      .select("username avatarUrl email")
      .lean();

    const partnerMap = new Map(partners.map((p) => [String(p._id), p]));

    const result = convs.map((c) => ({
      partner: partnerMap.get(String(c._id)) || {
        _id: c._id,
        username: "Joueur",
        avatarUrl: "",
      },
      lastMessage: {
        _id: String(c.lastMessage._id),
        from: String(c.lastMessage.from),
        to: String(c.lastMessage.to),
        text: c.lastMessage.text,
        createdAt: c.lastMessage.createdAt,
      },
    }));

    res.json(result);
  } catch (err) {
    console.error("listConversations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/messages/:otherId
 * Renvoie l'historique complet avec otherId (tri croissant par date)
 */
exports.listWithUser = async (req, res) => {
  try {
    const me = req.user.id;
    const otherId = req.params.otherId;

    const msgs = await Message.find({
      $or: [
        { from: me, to: otherId },
        { from: otherId, to: me },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    // Shape simple attendu par ton UI (string ids ok)
    const result = msgs.map((m) => ({
      _id: String(m._id),
      from: String(m.from),
      to: String(m.to),
      text: m.text,
      createdAt: m.createdAt,
    }));

    res.json(result);
  } catch (err) {
    console.error("listWithUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/messages
 * Crée un message (fallback HTTP, utile si WS indisponible)
 * body: { to, text }
 */
exports.create = async (req, res) => {
  try {
    const me = req.user.id;
    const to = String(req.body?.to || "").trim();
    const text = String(req.body?.text || "").trim();
    if (!to || !text)
      return res.status(400).json({ message: "to and text are required" });

    const doc = await Message.create({ from: me, to, text });
    res.status(201).json({
      _id: String(doc._id),
      from: String(doc.from),
      to: String(doc.to),
      text: doc.text,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error("create message error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
