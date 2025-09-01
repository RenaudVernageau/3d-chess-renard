// src/store/useMessageStore.js
import { create } from "zustand";
import api from "../api";

export const useMessageStore = create((set, get) => ({
  conversations: [], // [{ partner, lastMessage }]
  messages: {}, // { [otherId]: [ Message ] }

  // --- REST ---

  // Récupère le dernier message de chaque conversation
  fetchConversations: async () => {
    try {
      const data = await api("/messages/conversations", { method: "GET" });
      set({ conversations: Array.isArray(data) ? data : [] });
    } catch (err) {
      console.error("fetchConversations error", err);
      set({ conversations: [] });
    }
  },

  // Récupère tout l'historique avec otherId
  fetchMessages: async (otherId) => {
    try {
      const msgs = await api(`/messages/${otherId}`, { method: "GET" });
      set((state) => ({
        messages: {
          ...state.messages,
          [otherId]: Array.isArray(msgs) ? msgs : [],
        },
      }));
    } catch (err) {
      console.error("fetchMessages error", err);
      set((state) => ({
        messages: { ...state.messages, [otherId]: [] },
      }));
    }
  },

  // Envoie un message en HTTP (fallback ou compat historique)
  sendMessage: async (otherId, text) => {
    try {
      const msg = await api("/messages", {
        method: "POST",
        body: { to: otherId, text },
      });
      set((state) => {
        const list = state.messages[otherId] || [];
        return {
          messages: {
            ...state.messages,
            [otherId]: [...list, msg],
          },
        };
      });
      get().fetchConversations();
      return msg;
    } catch (err) {
      console.error("sendMessage error", err);
    }
  },

  // --- SOCKET.IO ---

  // Envoi via WebSocket (si socket dispo)
  sendMessageRealtime: (otherId, text, socket, ackCb) => {
    return new Promise((resolve) => {
      if (!socket) {
        // fallback REST si pas de socket
        get().sendMessage(otherId, text).then(resolve);
        return;
      }
      socket.emit("message:send", { to: otherId, text }, (ack) => {
        if (ack?.ok && ack?.msg) {
          const msg = ack.msg;
          set((state) => {
            const list = state.messages[otherId] || [];
            return {
              messages: {
                ...state.messages,
                [otherId]: [...list, msg],
              },
            };
          });
          ackCb?.(null, msg);
          resolve(msg);
        } else {
          // fallback REST si erreur côté WS
          get().sendMessage(otherId, text).then(resolve);
        }
      });
    });
  },

  // Réception temps réel d’un nouveau message
  handleIncomingSocketMessage: (msg, myUserId) => {
    if (!msg || !msg.from) return;
    const otherId = msg.from === myUserId ? msg.to : msg.from;

    set((state) => {
      const list = state.messages[otherId] || [];
      const already = list.some((m) => m._id === msg._id);
      const nextList = already ? list : [...list, msg];

      let nextConvs = [...(state.conversations || [])];
      const idx = nextConvs.findIndex((c) => c.partner?._id === otherId);

      if (idx >= 0) {
        // conversation existante → maj lastMessage
        nextConvs[idx] = {
          ...nextConvs[idx],
          lastMessage: msg,
        };
      } else {
        // conversation inconnue → créer une nouvelle entrée minimale
        nextConvs.unshift({
          partner: {
            _id: otherId,
            username:
              msg.from === myUserId ? msg.toName : msg.fromName || "Inconnu",
            avatarUrl: "/default-avatar.jpg",
          },
          lastMessage: msg,
        });
      }

      return {
        messages: { ...state.messages, [otherId]: nextList },
        conversations: nextConvs,
      };
    });
  },
}));
