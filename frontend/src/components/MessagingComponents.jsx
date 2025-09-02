import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMessageStore } from "../store/useMessageStore";
import { useNavigate } from "react-router-dom";
import useWebSocket from "../hooks/useWebSocket";

/**
 * Liste des conversations (dernier message par partenaire)
 */
export function ConversationsList({ onSelect, selectedId }) {
  const { conversations, fetchConversations } = useMessageStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <aside className="w-1/3 bg-stone-800 p-4 overflow-y-auto">
      <h2 className="text-white text-lg font-semibold mb-4">Conversations</h2>
      <ul className="space-y-3">
        {conversations.map((conv) => {
          const partner = conv.partner || {};
          const isActive = String(partner._id) === String(selectedId);
          const partnerName =
            partner.username ||
            (partner.email ? partner.email.split("@")[0] : "Joueur");
          const avatar = partner.avatarUrl || "/default-avatar.jpg";
          const last = conv.lastMessage;
          const when =
            last?.createdAt &&
            new Date(last.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

          return (
            <li
              key={partner._id}
              onClick={() => onSelect(partner._id)}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                isActive ? "bg-stone-700" : "hover:bg-stone-700"
              }`}
            >
              <img
                src={avatar}
                alt={partnerName}
                className="w-12 h-12 rounded-full object-cover mr-3"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-white font-medium truncate">
                    {partnerName}
                  </div>
                  <div className="text-xs text-stone-400 ml-2">{when}</div>
                </div>
                <div className="text-sm text-stone-400 truncate">
                  {last?.text}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export function ChatWindow({ otherId }) {
  const { user } = useAuth();
  const myId = String(user?.id || user?._id || ""); // ✅ robustesse
  const { socket, on, off } = useWebSocket(user?.token);

  const {
    messages,
    fetchMessages,
    sendMessageRealtime,
    handleIncomingSocketMessage,
    conversations,
  } = useMessageStore();

  const [text, setText] = useState("");
  const navigate = useNavigate();
  const endRef = useRef(null);

  // Récupère l'historique
  useEffect(() => {
    if (otherId) {
      fetchMessages(otherId);
    }
  }, [otherId, fetchMessages]);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages[otherId]]);

  // WS: réception message
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      handleIncomingSocketMessage(msg, myId);
    };
    on("message:new", handler);
    return () => off("message:new", handler);
  }, [socket, myId, on, off, handleIncomingSocketMessage]);

  const handleSend = (e) => {
    e?.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    sendMessageRealtime(otherId, clean, socket, (err) => {
      if (err) console.error("ack error", err);
    });
    setText("");
  };

  const msgs = Array.isArray(messages[otherId]) ? messages[otherId] : [];

  // 🌟 Nom/Avatar dans l’en-tête (si dispo via conversations)
  const partner = conversations.find(
    (c) => c.partner?._id === otherId
  )?.partner;
  const partnerName =
    partner?.username ||
    (partner?.email ? partner.email.split("@")[0] : "Joueur");
  const partnerAvatar = partner?.avatarUrl || "/default-avatar.jpg";

  return (
    <div className="flex flex-col flex-1 bg-stone-900">
      {/* Header */}
      <header className="bg-stone-800 p-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/messages")}
          className="text-stone-400 hover:text-white"
        >
          ← Retour
        </button>
        <img
          src={partnerAvatar}
          alt={partnerName}
          className="w-8 h-8 rounded-full object-cover"
        />
        <h3 className="text-white font-semibold truncate">{partnerName}</h3>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map((msg) => {
          const fromId = String(msg?.from?._id || msg?.from || "");
          const isMine = fromId === myId; // ✅ compare en string
          const stamp = msg?.createdAt ? new Date(msg.createdAt) : new Date();

          // nom optionnel au-dessus de la bulle (si tu veux)
          const displayName = isMine
            ? msg.fromName || "Moi"
            : msg.fromName && fromId !== myId
            ? msg.fromName
            : partnerName;

          return (
            <div
              key={msg._id || `${fromId}-${stamp.getTime()}`}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[70%]">
                {/* petit nom au-dessus si besoin */}
                <div className="text-xs text-stone-400 mb-1 px-1">
                  {displayName}
                </div>
                <div
                  className={`px-4 py-2 rounded-2xl break-words relative ${
                    isMine
                      ? "bg-blue-600 text-white"
                      : "bg-stone-700 text-white"
                  }`}
                >
                  <span>{msg.text}</span>
                  <time className="text-[10px] text-stone-300 absolute -bottom-4 right-2">
                    {stamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </main>

      {/* Input */}
      <footer className="p-4 bg-stone-800 flex items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 bg-stone-700 text-white px-4 py-2 rounded-full focus:outline-none mr-2"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition"
        >
          Envoyer
        </button>
      </footer>
    </div>
  );
}
