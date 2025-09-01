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
          const isActive = conv.partner._id === selectedId;
          return (
            <li
              key={conv.partner._id}
              onClick={() => onSelect(conv.partner._id)}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                isActive ? "bg-stone-700" : "hover:bg-stone-700"
              }`}
            >
              <img
                src={conv.partner.avatarUrl || "/default-avatar.jpg"}
                alt={conv.partner.username}
                className="w-12 h-12 rounded-full object-cover mr-3"
              />
              <div className="flex-1">
                <div className="text-white font-medium">
                  {conv.partner.username}
                </div>
                <div className="text-sm text-stone-400 truncate">
                  {conv.lastMessage?.text}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

/**
 * Fenêtre de chat pour une conversation
 */
export function ChatWindow({ otherId }) {
  const { user } = useAuth();
  const { socket, on, off } = useWebSocket(user?.token);
  const {
    messages,
    fetchMessages,
    sendMessageRealtime,
    handleIncomingSocketMessage,
  } = useMessageStore();
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const endRef = useRef(null);

  // Récupère l'historique dès que change de conversation
  useEffect(() => {
    if (otherId) {
      console.log("[ChatWindow] Fetch messages for", otherId);
      fetchMessages(otherId);
    }
  }, [otherId, fetchMessages]);

  // Auto-scroll quand messages changent
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages[otherId]]);

  // Abonne aux nouveaux messages via WS
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      console.log("[ChatWindow] Reçu message:new", msg);
      handleIncomingSocketMessage(msg, user.id);
    };
    on("message:new", handler);
    return () => off("message:new", handler);
  }, [socket, user?.id, on, off, handleIncomingSocketMessage]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    console.log("[ChatWindow] Envoi message via WS", { to: otherId, text });

    sendMessageRealtime(otherId, text.trim(), socket, (err, msg) => {
      if (err) {
        console.error("[ChatWindow] Erreur ack:", err);
      } else {
        console.log("[ChatWindow] Ack OK, message:", msg);
      }
    });

    setText("");
  };

  const msgs = Array.isArray(messages[otherId]) ? messages[otherId] : [];

  return (
    <div className="flex flex-col flex-1 bg-stone-900">
      {/* Header */}
      <header className="bg-stone-800 p-4 flex items-center">
        <button
          onClick={() => navigate("/messages")}
          className="mr-4 text-stone-400 hover:text-white"
        >
          ← Retour
        </button>
        <h3 className="text-white font-semibold">Discussion</h3>
      </header>

      {/* Messages List */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {msgs.map((msg) => {
          const fromId = msg.from?._id || msg.from; // REST (obj) ou WS (string)
          const isMine = fromId === user.id;
          return (
            <div
              key={msg._id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl break-words relative ${
                  isMine ? "bg-blue-600 text-white" : "bg-stone-700 text-white"
                }`}
              >
                <span>{msg.text}</span>
                <time className="text-[10px] text-stone-400 absolute bottom-1 right-2">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </main>

      {/* Input Area */}
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
