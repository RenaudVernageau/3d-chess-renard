import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMessageStore } from "../store/useMessageStore";
import { useNavigate, useSearchParams } from "react-router-dom";
import useWebSocket from "../hooks/useWebSocket";

/* ===================== Utils dates (FR) ===================== */
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
function inSameWeek(a, b) {
  const week = (d) => {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    return Math.ceil(((dt - yearStart) / 86400000 + 1) / 7);
  };
  return a.getFullYear() === b.getFullYear() && week(a) === week(b);
}

function formatTimeHHmm(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatDayLabel(date, { withYear = true } = {}) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yest.toDateString();

  if (isToday) return "Aujourd’hui";
  if (isYesterday) return "Hier";

  const opts = { weekday: "long", day: "numeric", month: "long" };
  if (withYear && d.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  return new Intl.DateTimeFormat("fr-FR", opts).format(d);
}

function formatListParts(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffDays = (startOfDay(now) - startOfDay(d)) / 86400000;

  let label;
  if (diffDays === 0) label = "Aujourd’hui";
  else if (diffDays === 1) label = "Hier";
  else if (inSameWeek(d, now)) {
    const wd = new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(d);
    label = capitalize(wd.replace(".", ""));
  } else {
    label = new Intl.DateTimeFormat("fr-FR").format(d);
  }

  return { label, time: formatTimeHHmm(d) };
}

function groupMessagesByDay(messages, getDate = (m) => m.createdAt || m.date) {
  const map = new Map();
  for (const m of messages || []) {
    const d = new Date(getDate(m) || Date.now());
    const key = d.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, arr]) => ({
      key,
      date: new Date(key),
      items: arr.sort(
        (a, b) => new Date(getDate(a)) - new Date(getDate(b))
      ),
    }));
}

/* ===================== Helpers ===================== */
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

/* ===================== ConversationsList ===================== */
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
            const when = last?.createdAt
              ? formatListParts(last.createdAt)
              : null;

            const unread = (unreadByRoom && pid && unreadByRoom[pid]) || 0;

            return (
              <li
                key={
                  pid ||
                  conv?.lastMessage?._id ||
                  Math.random().toString(36)
                }
                onClick={() => pid && onSelect(String(pid))}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  isActive ? "bg-stone-700" : "hover:bg-stone-700"
                }`}
              >
                <img
                  src={avatar}
                  alt={partnerName}
                  className="w-12 h-12 rounded-full object-cover mr-3"
                  onError={(e) => {
                    e.currentTarget.src = "/default-avatar.jpg";
                  }}
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
                      {when && (
                        <div className="text-xs text-stone-400 flex items-center gap-1">
                          <span>{when.label}</span>
                          <span className="opacity-60">|</span>
                          <span>{when.time}</span>
                        </div>
                      )}
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

/* ===================== ChatWindow ===================== */
export function ChatWindow({ otherId, onBack }) {
  const { user, token: authTokenFromHook } = useAuth() || {};
  const authToken =
    authTokenFromHook || localStorage.getItem("token") || "";
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

  useEffect(() => {
    if (otherId) {
      fetchMessages(otherId);
    }
  }, [otherId, fetchMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages[otherId]]);

  useEffect(() => {
    if (!socket || !myId) return;
    const handler = (msg) => {
      handleIncomingSocketMessage(msg, myId);
    };
    on("message:new", handler);
    return () => off("message:new", handler);
  }, [socket, myId, on, off, handleIncomingSocketMessage]);

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
  const groups = groupMessagesByDay(msgs, (m) => m.createdAt);

  const partner = (Array.isArray(conversations) ? conversations : []).find(
    (c) => String(c?.partner?._id) === String(otherId)
  )?.partner;
  const partnerName =
    partner?.username ||
    (partner?.email ? partner.email.split("@")[0] : "Joueur");
  const partnerAvatar = partner?.avatarUrl || "/default-avatar.jpg";

  const handleBackClick = () => {
    if (onBack) onBack();
    else setSearchParams({});
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
          onError={(e) => {
            e.currentTarget.src = "/default-avatar.jpg";
          }}
        />
        <h3 className="text-white font-semibold truncate">
          {partnerName}
        </h3>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {groups.map(({ key, date, items }) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-center">
              <span className="px-3 py-1 text-xs rounded-full bg-stone-700 text-stone-200 border border-stone-600">
                {formatDayLabel(date)}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((msg) => {
                const fromId = String(msg?.from?._id || msg?.from || "");
                const isMine = fromId === myId;
                const stamp = msg?.createdAt
                  ? new Date(msg.createdAt)
                  : new Date();
                const displayName = isMine
                  ? "Moi"
                  : msg.fromName || partnerName;

                return (
                  <div
                    key={msg._id || `${fromId}-${stamp.getTime()}`}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-[75%]">
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
                        <div
                          className={`mt-1 text-[11px] ${
                            isMine
                              ? "text-blue-200/80"
                              : "text-stone-300/70"
                          } flex items-center gap-1 justify-end`}
                        >
                          <span>
                            {formatDayLabel(stamp, { withYear: false })}
                          </span>
                          <span className="opacity-60">|</span>
                          <span>{formatTimeHHmm(stamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
