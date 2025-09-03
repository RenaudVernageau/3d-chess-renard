import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMessageStore } from "../store/useMessageStore";
import { useNavigate, useSearchParams } from "react-router-dom";
import useWebSocket from "../hooks/useWebSocket";

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

/**
 * Liste des conversations (dernier message par partenaire)
 */
export function ConversationsList({ onSelect, selectedId }) {
  const { conversations, fetchConversations, unreadByRoom } = useMessageStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const list = Array.isArray(conversations) ? conversations : [];

  return (
    <aside className="h-full w-full bg-stone-800 p-4 overflow-y-auto">
      <h2 className="text-white text-lg font-semibold mb-4">Conversations</h2>

      {list.length === 0 ? (
        <div className="text-stone-400 text-sm">
          Aucune conversation pour le moment.
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((conv) => {
            const partner = conv?.partner || {};
            const pid = String(partner?._id || "");
            const isActive = pid && String(pid) === String(selectedId);

            const partnerName =
              partner.username ||
              (partner.email ? partner.email.split("@")[0] : "Joueur");
            const avatar = partner.avatarUrl || "/default-avatar.jpg";

            const last = conv?.lastMessage;
            const when =
              last?.createdAt &&
              new Date(last.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

            const unread = (unreadByRoom && pid && unreadByRoom[pid]) || 0;

            return (
              <li
                key={pid || conv?.lastMessage?._id || Math.random().toString(36)}
                onClick={() => pid && onSelect(String(pid))}
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
                    <div className="flex items-center gap-2">
                      {unread > 0 && (
                        <span className="inline-block rounded-full bg-red-600 text-white text-[10px] px-1.5 py-0.5">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                      <div className="text-xs text-stone-400">{when}</div>
                    </div>
                  </div>
                  <div className="text-sm text-stone-400 truncate">
                    {last?.text}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

/**
 * Fenêtre de chat pour une conversation
 */
export function ChatWindow({ otherId, onBack }) {
  const { user, token: authTokenFromHook } = useAuth() || {};
  const authToken = authTokenFromHook || localStorage.getItem("token") || "";
  const myId = String(
    user?.id || user?._id || parseJwt(authToken)?.sub || ""
  );

  const { socket, on, off } = useWebSocket(authToken);

  const {
    messages,
    fetchMessages,
    sendMessageRealtime,
    handleIncomingSocketMessage,
    conversations,
    setActiveRoom,
    clearUnread,
  } = useMessageStore();

  const [text, setText] = useState("");
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
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

  // WS: réception message (redondant avec écoute globale, mais ok grâce à l'anti-doublon)
  useEffect(() => {
    if (!socket || !myId) return;
    const handler = (msg) => {
      handleIncomingSocketMessage(msg, myId);
    };
    on("message:new", handler);
    return () => off("message:new", handler);
  }, [socket, myId, on, off, handleIncomingSocketMessage]);

  // Active la room et clear les non-lus quand on est dessus
  useEffect(() => {
    if (!otherId) return;
    setActiveRoom(otherId);
    clearUnread(otherId);
    return () => setActiveRoom(null);
  }, [otherId, setActiveRoom, clearUnread]);

  const handleSend = (e) => {
    e?.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    sendMessageRealtime(String(otherId), clean, socket, (err) => {
      if (err) console.error("ack error", err);
    });
    setText("");
  };

  const msgs = Array.isArray(messages[otherId]) ? messages[otherId] : [];

  // 🌟 Nom/Avatar dans l’en-tête (si dispo via conversations)
  const partner = (Array.isArray(conversations) ? conversations : []).find(
    (c) => String(c?.partner?._id) === String(otherId)
  )?.partner;
  const partnerName =
    partner?.username ||
    (partner?.email ? partner.email.split("@")[0] : "Joueur");
  const partnerAvatar = partner?.avatarUrl || "/default-avatar.jpg";

  // 🔙 Retour : efface ?user= (ou appelle onBack si fourni)
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      setSearchParams({});
    }
  };

  if (!myId) {
    return (
      <div className="flex flex-col flex-1 bg-stone-900">
        <header className="bg-stone-800 p-4 flex items-center gap-3">
          <button
            onClick={handleBackClick}
            className="text-stone-400 hover:text-white md:hidden"
          >
            ← Retour
          </button>
          <h3 className="text-white font-semibold">Discussion</h3>
        </header>
        <div className="p-4 text-stone-400">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-stone-900">
      {/* Header */}
      <header className="bg-stone-800 p-4 flex items-center gap-3">
        {/* visible surtout sur mobile */}
        <button
          onClick={handleBackClick}
          className="text-stone-400 hover:text-white md:hidden"
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
          const isMine = fromId === myId;
          const stamp = msg?.createdAt ? new Date(msg.createdAt) : new Date();

          const displayName = isMine ? "Moi" : msg.fromName || partnerName;

          return (
            <div
              key={msg._id || `${fromId}-${stamp.getTime()}`}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[70%]">
                <div className="text-xs text-stone-400 mb-1 px-1">
                  {displayName}
                </div>
                <div
                  className={`px-4 py-2 rounded-2xl break-words relative ${
                    isMine ? "bg-blue-600 text-white" : "bg-stone-700 text-white"
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
