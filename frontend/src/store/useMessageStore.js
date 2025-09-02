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
    const otherId =
      String(msg.from) === String(myUserId) ? String(msg.to) : String(msg.from);

    set((state) => {
      const list = state.messages[otherId] || [];
      const already = list.some((m) => m._id === msg._id);
      const nextList = already ? list : [...list, msg];

      const convs = state.conversations || [];
      const idx = convs.findIndex((c) => String(c.partner?._id) === otherId);

      const partnerName =
        String(msg.from) === String(myUserId)
          ? msg.toName || "Joueur"
          : msg.fromName || "Joueur";
      const partnerAvatar =
        String(msg.from) === String(myUserId)
          ? msg.toAvatar || ""
          : msg.fromAvatar || "";

      let nextConvs;
      if (idx >= 0) {
        const copy = convs.slice();
        copy[idx] = {
          ...copy[idx],
          partner: {
            ...(copy[idx].partner || {}),
            _id: otherId,
            username: partnerName,
            avatarUrl: partnerAvatar || copy[idx].partner?.avatarUrl || "",
          },
          lastMessage: msg,
        };
        nextConvs = copy;
      } else {
        nextConvs = [
          {
            partner: {
              _id: otherId,
              username: partnerName,
              avatarUrl: partnerAvatar,
            },
            lastMessage: msg,
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
