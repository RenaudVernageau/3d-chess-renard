// server/middleware/roles.js
const mongoose = require("mongoose");
const User = require("../models/User");

/** Hiérarchie des rôles */
const ROLE_ORDER = {
  user: 0,
  moderator: 1,
  admin: 2,
};

/** Compare deux rôles via la hiérarchie ci-dessus */
function hasAtLeastRole(userRole = "user", minRole = "user") {
  return (ROLE_ORDER[userRole] ?? 0) >= (ROLE_ORDER[minRole] ?? 0);
}

/**
 * Charge l'utilisateur depuis la DB si nécessaire pour connaître son rôle
 * (on ne “fait pas confiance” au contenu éventuel du JWT pour le rôle).
 * Ajoute req.authUser (doc Mongoose lean()).
 */
async function ensureAuthUserLoaded(req) {
  if (req.authUser) return req.authUser;
  const id = req.user?.id;
  if (!id || !mongoose.isValidObjectId(id)) return null;
  const me = await User.findById(id).select("role isSuspended").lean();
  if (me) req.authUser = { id, ...me };
  return req.authUser || null;
}

/** Refuse si le compte est suspendu */
function requireNotSuspended() {
  return async (req, res, next) => {
    const me = await ensureAuthUserLoaded(req);
    if (!me) return res.status(401).json({ message: "Not authenticated" });
    if (me.isSuspended)
      return res.status(403).json({ message: "Account suspended" });
    next();
  };
}

/**
 * Exige un rôle minimum (ex: "moderator" ou "admin").
 * Exemple: router.delete("/users/:id", auth, requireRole("admin"), ctrl.deleteUser)
 */
function requireRole(minRole) {
  return async (req, res, next) => {
    const me = await ensureAuthUserLoaded(req);
    if (!me) return res.status(401).json({ message: "Not authenticated" });
    if (!hasAtLeastRole(me.role, minRole)) {
      return res.status(403).json({ message: "Forbidden (role)" });
    }
    next();
  };
}

/**
 * Autorise si l'utilisateur agit sur lui-même OU possède un rôle minimum.
 * paramKey: nom du param route qui contient l'ID visé (par défaut "id")
 * Exemple: router.put("/users/:id", auth, selfOrRole("moderator"), ctrl.updateUser)
 */
function selfOrRole(minRole, paramKey = "id") {
  return async (req, res, next) => {
    const me = await ensureAuthUserLoaded(req);
    if (!me) return res.status(401).json({ message: "Not authenticated" });

    const targetId = String(req.params?.[paramKey] || "");
    if (targetId && targetId === String(req.user.id)) return next();

    if (!hasAtLeastRole(me.role, minRole)) {
      return res.status(403).json({ message: "Forbidden (role/self)" });
    }
    next();
  };
}

/**
 * Autorise si l'utilisateur est auteur de la ressource (via getter async)
 * OU a le rôle minimum.
 * resourceGetter: async (req) => { ownerId: "..." }
 * Exemple messages:
 *   router.delete("/messages/:msgId",
 *     auth,
 *     ownerOrRole("moderator", async (req) => {
 *       const m = await Message.findById(req.params.msgId).select("from").lean();
 *       return { ownerId: m ? String(m.from) : null };
 *     }),
 *     ctrl.deleteMessage)
 */
function ownerOrRole(minRole, resourceGetter) {
  return async (req, res, next) => {
    const me = await ensureAuthUserLoaded(req);
    if (!me) return res.status(401).json({ message: "Not authenticated" });

    try {
      const { ownerId } = (await resourceGetter(req)) || {};
      if (ownerId && String(ownerId) === String(req.user.id)) return next();
    } catch (e) {
      // si la ressource n'existe pas, on laisse le ctrl renvoyer 404
    }

    if (!hasAtLeastRole(me.role, minRole)) {
      return res.status(403).json({ message: "Forbidden (role/owner)" });
    }
    next();
  };
}

module.exports = {
  hasAtLeastRole,
  requireRole,
  selfOrRole,
  ownerOrRole,
  requireNotSuspended,
};
