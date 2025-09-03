import { create } from "zustand";
import api from "../api";

/** Helpers */
const S = (v) => (v == null ? "" : String(v));
const byAscDate = (a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
const byDescDate = (a, b) =>
  new Date(b?.lastMessage?.createdAt || 0) - new Date(a?.lastMessage?.createdAt || 0);

/** Déduit l'autre participant d'un message + propose un partner non destructif */
const pickPartnerFromMsg = (msg, myId) => {
  const from = S(msg?.from?._id || msg?.from);
  const to = S(msg?.to?._id || msg?.to);
  const me = S(myId);
  const otherId = from === me ? to : from;

  return {
    otherId,
    partner: {
      _id: otherId,
      username: from === me ? (msg?.toName || "") : (msg?.fromName || ""),
      avatarUrl: from === me ? (msg?.toAvatar || "") : (msg?.fromAvatar || ""),
    },
  };
};

export const useMessageStore = create((set, get) => ({
  conversations: [],      // [{ partner: {_id, username, avatarUrl}, lastMessage }]
  messages: {},           // { [otherId]: [ Message ] }

  // 🔔 Notifications
  unreadByRoom: {},       // { [otherId]: number }
  activeRoomId: null,

  setActiveRoom: (roomId) => set({ activeRoomId: S(roomId) || null }),
  setUnreadCount: (roomId, count) =>
    set((s) => ({ unreadByRoom: { ...s.unreadByRoom, [S(roomId)]: Math.max(0, count) } })),
  incUnread: (roomId) =>
    set((s) => ({
      unreadByRoom: { ...s.unreadByRoom, [S(roomId)]: (s.unreadByRoom[S(roomId)] || 0) + 1 },
    })),
  clearUnread: (roomId) =>
    set((s) => ({ unreadByRoom: { ...s.unreadByRoom, [S(roomId)]: 0 } })),
  totalUnread: () => {
    const map = get().unreadByRoom || {};
    return Object.values(map).reduce((a, b) => a + (b || 0), 0);
  },

  /** --- REST --- */

  // Liste des conversations (dernier message par partenaire), triée desc
  fetchConversations: async () => {
    try {
      const data = await api("/messages/conversations", { method: "GET" });

      const map = new Map();
      (Array.isArray(data) ? data : []).forEach((c) => {
        const pid = S(c?.partner?._id);
        if (!pid) return;

        const clean = {
          partner: {
            _id: pid,
            username:
              S(c?.partner?.username) ||
              (c?.partner?.email ? c.partner.email.split("@")[0] : "Joueur"),
            avatarUrl: S(c?.partner?.avatarUrl || ""),
          },
          lastMessage: c?.lastMessage
            ? {
                _id: S(c.lastMessage._id),
                from: S(c.lastMessage.from),
                to: S(c.lastMessage.to),
                text: c.lastMessage.text,
                createdAt: c.lastMessage.createdAt,
              }
            : null,
        };

        const existing = map.get(pid);
        if (!existing) {
          map.set(pid, clean);
        } else {
          // garde la plus récente
          const a = new Date(existing.lastMessage?.createdAt || 0).getTime();
          const b = new Date(clean.lastMessage?.createdAt || 0).getTime();
          map.set(pid, b >= a ? clean : existing);
        }
      });

      const convs = Array.from(map.values()).sort(byDescDate);
      set({ conversations: convs });
    } catch (err) {
      console.error("fetchConversations error", err);
      set({ conversations: [] });
    }
  },

  // Historique d'une conversation, trié asc
  fetchMessages: async (otherId) => {
    const key = S(otherId);
    if (!key) return;

    try {
      const msgs = await api(`/messages/${key}`, { method: "GET" });
      const normalized = (Array.isArray(msgs) ? msgs : [])
        .map((m) => ({
          ...m,
          _id: S(m._id),
          from: S(m.from?._id || m.from),
          to: S(m.to?._id || m.to),
        }))
        .sort(byAscDate);

      set((state) => ({
        messages: { ...state.messages, [key]: normalized },
      }));
    } catch (err) {
      console.error("fetchMessages error", err);
      set((state) => ({ messages: { ...state.messages, [key]: [] } }));
    }
  },

  // Fallback HTTP si WS indisponible
  sendMessage: async (otherId, text) => {
    const key = S(otherId);
    try {
      const msg = await api("/messages", { method: "POST", body: { to: key, text } });
      const m = {
        ...msg,
        _id: S(msg._id),
        from: S(msg.from),
        to: S(msg.to),
      };

      // Messages (tri asc)
      set((state) => {
        const list = (state.messages[key] || []).slice();
        list.push(m);
        list.sort(byAscDate);
        return { messages: { ...state.messages, [key]: list } };
      });

      // Conversations: met à jour lastMessage et remonte en tête
      set((state) => {
        const convs = (state.conversations || []).slice();
        const idx = convs.findIndex((c) => S(c.partner?._id) === key);
        if (idx >= 0) {
          convs[idx] = { ...convs[idx], lastMessage: m };
          const [item] = convs.splice(idx, 1);
          convs.unshift(item);
        } else {
          convs.unshift({
            partner: { _id: key, username: "", avatarUrl: "" },
            lastMessage: m,
          });
        }
        return { conversations: convs };
      });

      return m;
    } catch (err) {
      console.error("sendMessage error", err);
    }
  },

  /** --- SOCKET.IO --- */

  // Envoi temps réel via WS (avec ack)
  sendMessageRealtime: (otherId, text, socket, ackCb) => {
    const key = S(otherId);
    return new Promise((resolve) => {
      if (!socket) {
        get().sendMessage(key, text).then(resolve);
        return;
      }

      socket.emit("message:send", { to: key, text }, (ack) => {
        if (ack?.ok && ack?.msg) {
          const am = ack.msg;
          const m = {
            ...am,
            _id: S(am._id),
            from: S(am.from),
            to: S(am.to),
          };

          // Messages (tri asc)
          set((state) => {
            const list = (state.messages[key] || []).slice();
            // éviter doublon
            if (!list.some((x) => S(x._id) === S(m._id))) {
              list.push(m);
              list.sort(byAscDate);
            }
            return { messages: { ...state.messages, [key]: list } };
          });

          // Conversations: update lastMessage + bump to top (sans écraser partner)
          set((state) => {
            const convs = (state.conversations || []).slice();
            const idx = convs.findIndex((c) => S(c.partner?._id) === key);
            if (idx >= 0) {
              const p = convs[idx].partner || {};
              convs[idx] = { partner: p, lastMessage: m };
              const [item] = convs.splice(idx, 1);
              convs.unshift(item);
            } else {
              convs.unshift({
                partner: { _id: key, username: "", avatarUrl: "" },
                lastMessage: m,
              });
            }
            return { conversations: convs };
          });

          ackCb?.(null, m);
          resolve(m);
        } else {
          // Fallback REST si erreur WS
          get().sendMessage(key, text).then(resolve);
        }
      });
    });
  },

  // Réception d’un message WS (entrant ou écho)
  handleIncomingSocketMessage: (msg, myUserId) => {
    if (!msg || !msg.from) return;

    const my = S(myUserId);
    const { otherId, partner } = pickPartnerFromMsg(msg, my);
    const mid = S(msg._id);
    const from = S(msg.from);
    const to = S(msg.to);

    // Messages (tri asc)
    set((state) => {
      const list = (state.messages[otherId] || []).slice();
      if (!list.some((m) => S(m._id) === mid)) {
        list.push({ ...msg, _id: mid, from, to });
        list.sort(byAscDate);
      }
      return { messages: { ...state.messages, [otherId]: list } };
    });

    // Conversations (update lastMessage, conserver partner connu, bump to top)
    set((state) => {
      const convs = (state.conversations || []).slice();
      const idx = convs.findIndex((c) => S(c.partner?._id) === otherId);

      if (idx >= 0) {
        const existingPartner = convs[idx].partner || {};
        convs[idx] = {
          partner: {
            _id: otherId,
            username: existingPartner.username || partner.username || "Joueur",
            avatarUrl: existingPartner.avatarUrl || partner.avatarUrl || "",
          },
          lastMessage: {
            _id: mid,
            from,
            to,
            text: msg.text,
            createdAt: msg.createdAt,
          },
        };
        const [item] = convs.splice(idx, 1);
        convs.unshift(item);
      } else {
        convs.unshift({
          partner: {
            _id: otherId,
            username: partner.username || "Joueur",
            avatarUrl: partner.avatarUrl || "",
          },
          lastMessage: {
            _id: mid,
            from,
            to,
            text: msg.text,
            createdAt: msg.createdAt,
          },
        });
      }

      return { conversations: convs };
    });

    // 🔔 Incrément non-lus si le fil n'est pas actif et que le message vient d'un autre
    const active = get().activeRoomId;
    if (otherId && otherId !== active && from !== my) {
      const curr = get().unreadByRoom[otherId] || 0;
      set({ unreadByRoom: { ...get().unreadByRoom, [otherId]: curr + 1 } });
    }
  },
}));
