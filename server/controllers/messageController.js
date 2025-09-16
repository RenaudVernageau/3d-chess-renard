const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const HiddenThread = require("../models/HiddenThread");

/**
 * GET /api/messages/conversations
 * Renvoie la liste des conversations (dernier message par partenaire)
 * -> Exclut les threads masqués par l'utilisateur
 */
exports.listConversations = async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.user.id);

    // threads masqués par moi
    const hidden = await HiddenThread.find({ userId: me }).select("otherId").lean();
    const hiddenSet = new Set(hidden.map(h => String(h.otherId)));

    const convs = await Message.aggregate([
      { $match: { $or: [ { from: me }, { to: me } ] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $cond: [ { $eq: ["$from", me] }, "$to", "$from" ] },
          lastMessage: { $first: "$$ROOT" }
        }
      },
      { $limit: 50 }
    ]);

    const partnerIds = convs.map(c => c._id).filter(id => !hiddenSet.has(String(id)));
    const partners = await User.find({ _id: { $in: partnerIds } })
      .select("username avatarUrl email")
      .lean();
    const map = new Map(partners.map(p => [String(p._id), p]));

    const result = convs
      .filter(c => !hiddenSet.has(String(c._id)))
      .map(c => {
        const p = map.get(String(c._id));
        return {
          partner: {
            _id: String(c._id),
            username: p?.username || (p?.email ? p.email.split("@")[0] : "Joueur"),
            avatarUrl: p?.avatarUrl || "",
          },
          lastMessage: {
            _id: String(c.lastMessage._id),
            from: String(c.lastMessage.from),
            to: String(c.lastMessage.to),
            text: c.lastMessage.text,
            createdAt: c.lastMessage.createdAt,
          },
        };
      });

    res.json(result);
  } catch (err) {
    console.error("listConversations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/messages/:otherId
 * Renvoie l'historique complet avec otherId (tri croissant par date)
 * -> Si le thread est masqué, on renvoie quand même le contenu (au cas où l'UI veut le ré-afficher)
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
 * Crée un message (fallback HTTP)
 */
exports.create = async (req, res) => {
  try {
    const me = req.user.id;
    const to = String(req.body?.to || "").trim();
    const text = String(req.body?.text || "").trim();
    if (!to || !text)
      return res.status(400).json({ message: "to and text are required" });

    const doc = await Message.create({ from: me, to, text });

    // si le thread était masqué pour l’émetteur, on peut le démasquer automatiquement
    await HiddenThread.deleteOne({ userId: me, otherId: to });

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

/**
 * DELETE /api/messages/:messageId
 * Supprime un message :
 *  - l'auteur du message peut supprimer SON message
 *  - moderator/admin peuvent supprimer n'importe quel message
 */
exports.removeMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const me = req.user.id;
    const role = req.user.role || "user";

    const msg = await Message.findById(messageId).lean();
    if (!msg) return res.status(404).json({ message: "Message not found" });

    const isAuthor = String(msg.from) === String(me);
    const isPrivileged = role === "moderator" || role === "admin";
    if (!isAuthor && !isPrivileged) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Message.findByIdAndDelete(messageId);
    return res.json({ ok: true });
  } catch (err) {
    console.error("removeMessage error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/messages/thread/:otherId/hidden
 * Masque (hidden=true) ou ré-affiche (hidden=false) une conversation pour l'utilisateur courant
 * body: { hidden: boolean }
 */
exports.setThreadHidden = async (req, res) => {
  try {
    const me = req.user.id;
    const otherId = req.params.otherId;
    const hidden = !!req.body?.hidden;

    if (!mongoose.isValidObjectId(otherId)) {
      return res.status(400).json({ message: "Invalid otherId" });
    }

    if (hidden) {
      await HiddenThread.updateOne(
        { userId: me, otherId },
        { $set: { userId: me, otherId, hiddenAt: new Date() } },
        { upsert: true }
      );
    } else {
      await HiddenThread.deleteOne({ userId: me, otherId });
    }

    res.json({ ok: true, hidden });
  } catch (err) {
    console.error("setThreadHidden error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
