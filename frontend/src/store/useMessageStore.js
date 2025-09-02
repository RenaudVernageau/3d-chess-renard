// src/store/useMessageStore.js
import { create } from "zustand";
import api from "../api";

const S = (v) => (v == null ? "" : String(v));

const pickPartnerFromMsg = (msg, myId) => {
  const from = S(msg?.from?._id || msg?.from);
  const to = S(msg?.to?._id || msg?.to);
  const otherId = from === S(myId) ? to : from;

  // on préfère ne PAS écraser un partner existant plus tard
  const partner = {
    _id: otherId,
    username:
      from === S(myId)
        ? (msg?.toName || "")
        : (msg?.fromName || ""),
    avatarUrl:
      from === S(myId)
        ? (msg?.toAvatar || "")
        : (msg?.fromAvatar || ""),
  };
  return { otherId, partner };
};

export const useMessageStore = create((set, get) => ({
  conversations: [],      // [{ partner: {_id, username, avatarUrl}, lastMessage }]
  messages: {},           // { [otherId]: [ Message ] }

  // --- REST ---

  fetchConversations: async () => {
    try {
      const data = await api("/messages/conversations", { method: "GET" });
      // normaliser en string et filtrer doublons éventuels
      const map = new Map();
      (Array.isArray(data) ? data : []).forEach((c) => {
        const pid = S(c?.partner?._id);
        if (!pid) return;
        const existing = map.get(pid);
        const clean = {
          partner: {
            _id: pid,
            username: S(c?.partner?.username) || (c?.partner?.email ? c.partner.email.split("@")[0] : "Joueur"),
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
        // garder le plus récent si collision
        if (!existing) {
          map.set(pid, clean);
        } else {
          const a = new Date(existing.lastMessage?.createdAt || 0).getTime();
          const b = new Date(clean.lastMessage?.createdAt || 0).getTime();
          map.set(pid, b >= a ? clean : existing);
        }
      });
      set({ conversations: Array.from(map.values()) });
    } catch (err) {
      console.error("fetchConversations error", err);
      set({ conversations: [] });
    }
  },

  fetchMessages: async (otherId) => {
    const key = S(otherId);
    if (!key) return;
    try {
      const msgs = await api(`/messages/${key}`, { method: "GET" });
      set((state) => ({
        messages: {
          ...state.messages,
          [key]: (Array.isArray(msgs) ? msgs : []).map((m) => ({
            ...m,
            _id: S(m._id),
            from: S(m.from?._id || m.from),
            to: S(m.to?._id || m.to),
          })),
        },
      }));
    } catch (err) {
      console.error("fetchMessages error", err);
      set((state) => ({ messages: { ...state.messages, [key]: [] } }));
    }
  },

  // fallback HTTP si WS HS
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
      set((state) => {
        const list = state.messages[key] || [];
        return { messages: { ...state.messages, [key]: [...list, m] } };
      });
      // resync convs (ne double pas grâce à la normalisation)
      get().fetchConversations();
      return m;
    } catch (err) {
      console.error("sendMessage error", err);
    }
  },

  // --- SOCKET.IO ---

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
          set((state) => {
            const list = state.messages[key] || [];
            return { messages: { ...state.messages, [key]: [...list, m] } };
          });
          // mettre à jour la lastMessage sans recréer/écraser le partner
          set((state) => {
            const convs = state.conversations || [];
            const idx = convs.findIndex((c) => S(c.partner?._id) === key);
            if (idx >= 0) {
              const copy = convs.slice();
              copy[idx] = { ...copy[idx], lastMessage: m };
              return { conversations: copy };
            }
            // si pas de conv, on crée minimalement avec partner inconnu (sera corrigé par fetchConversations)
            return {
              conversations: [
                {
                  partner: { _id: key, username: "", avatarUrl: "" },
                  lastMessage: m,
                },
                ...convs,
              ],
            };
          });
          ackCb?.(null, m);
          resolve(m);
        } else {
          get().sendMessage(key, text).then(resolve);
        }
      });
    });
  },

  // ne duplique pas / n’écrase pas le partner connu
  handleIncomingSocketMessage: (msg, myUserId) => {
    if (!msg || !msg.from) return;
    const my = S(myUserId);
    const { otherId, partner } = pickPartnerFromMsg(msg, my);
    const mid = S(msg._id);

    set((state) => {
      // messages
      const list = state.messages[otherId] || [];
      const already = list.some((m) => S(m._id) === mid);
      const nextList = already ? list : [...list, {
        ...msg,
        _id: mid,
        from: S(msg.from),
        to: S(msg.to),
      }];

      // conversations
      const convs = state.conversations || [];
      const idx = convs.findIndex((c) => S(c.partner?._id) === otherId);
      let nextConvs;
      if (idx >= 0) {
        const copy = convs.slice();
        const existingPartner = copy[idx].partner || {};
        // ⚠️ on NE REMPLACE PAS un nom/avatar existant par une chaîne vide
        copy[idx] = {
          partner: {
            _id: otherId,
            username: existingPartner.username || partner.username || "Joueur",
            avatarUrl: existingPartner.avatarUrl || partner.avatarUrl || "",
          },
          lastMessage: {
            _id: mid,
            from: S(msg.from),
            to: S(msg.to),
            text: msg.text,
            createdAt: msg.createdAt,
          },
        };
        nextConvs = copy;
      } else {
        nextConvs = [
          {
            partner: {
              _id: otherId,
              username: partner.username || "Joueur",
              avatarUrl: partner.avatarUrl || "",
            },
            lastMessage: {
              _id: mid,
              from: S(msg.from),
              to: S(msg.to),
              text: msg.text,
              createdAt: msg.createdAt,
            },
          },
          ...convs,
        ];
      }

      return {
        messages: { ...state.messages, [otherId]: nextList },
        conversations: nextConvs,
      };
    });
  },
}));
