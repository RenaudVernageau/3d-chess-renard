// src/components/NavBar.jsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useGameUiStore } from "../store/useGameUiStore";
import { useMessageStore } from "../store/useMessageStore";
import { useAuth } from "../hooks/useAuth";

export default function NavBar() {
  // Auth / routing
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location?.pathname || "/";
  const onPlayRoute = pathname.startsWith("/play/");

  // UI local
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Stores
  const roomId      = useGameUiStore((s) => s.currentRoomId);
  const color       = useGameUiStore((s) => s.myColor);
  const turnColor   = useGameUiStore((s) => s.turnColor);
  const myTurn      = useGameUiStore((s) => s.myTurn);
  const players     = useGameUiStore((s) => s.players) || [];
  const totalUnread = useMessageStore((s) => s.totalUnread()); // 🔔 somme non-lus

  if (!user) return null;

  // Données utilisateur
  const username = user?.username || "";
  const avatarRaw = user?.avatar || user?.avatarUrl || "";
  const avatar =
    avatarRaw && String(avatarRaw).trim() !== "" ? avatarRaw : "/default-avatar.jpg";

  // Liste joueurs (desktop)
  const playersList = (Array.isArray(players) ? players : [])
    .map((p) => (typeof p === "string" ? p : p?.username))
    .filter(Boolean)
    .join(", ");

  const handleCopyRoom = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Impossible de copier l'ID de la room", e);
    }
  };

  const handleResume = () => {
    if (!roomId) return;
    navigate(`/play/${roomId}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Helpers affichage tour
  const Dot = ({ c }) => (
    <span aria-hidden className="text-base leading-none">
      {c === "white" ? "⚪" : "⚫"}
    </span>
  );

  const resolvedTurn = typeof turnColor === "string" ? turnColor : color;
  const turnText = myTurn
    ? "À vous de jouer"
    : resolvedTurn === "white" || resolvedTurn === "black"
    ? `Au tour des ${resolvedTurn === "white" ? "Blancs" : "Noirs"}`
    : "";

  const TurnPill = () =>
    turnText ? (
      <span
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] sm:text-sm
                   bg-stone-800/70 border border-stone-700 text-stone-100 font-medium"
        aria-live="polite"
      >
        <Dot c={myTurn ? color || turnColor : resolvedTurn} />
        <span className="whitespace-nowrap">{turnText}</span>
      </span>
    ) : null;

  return (
    <>
      {/* --- Fixed top bar --- */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-stone-800 bg-stone-900/95 backdrop-blur supports-[backdrop-filter]:bg-stone-900/75">
        {/* Barre du haut */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <Link to="/lobby" className="flex items-center gap-2 font-semibold text-white">
              <span className="text-xl">Immersive Chess ♔</span>
            </Link>

            {/* Burger (mobile) avec badge non-lus */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="relative md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl
               bg-stone-800/80 hover:bg-stone-700 active:scale-95 border border-stone-600 shadow-sm
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-stone-900 transition"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label="Ouvrir le menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-stone-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>

              {/* 🔔 Badge non-lus visible même menu fermé */}
              {totalUnread > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[18px] text-center"
                  title={`${totalUnread} nouveau${totalUnread>1?"x":""} message${totalUnread>1?"s":""}`}
                >
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </button>

            {/* Liens desktop */}
            <nav className="hidden md:flex items-center gap-6 text-stone-200">
              <Link to="/messages" className="relative hover:text-white">
                💬 Messages
                {totalUnread > 0 && (
                  <span className="absolute -top-2 -right-3 rounded-full bg-red-600 text-white text-[10px] px-1.5 py-0.5 leading-none">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </Link>
              <Link to="/users" className="hover:text-white">👥 Utilisateurs</Link>
              <Link to="/profile" className="group flex items-center gap-2 hover:text-white">
                <img
                  src={avatar}
                  alt={username || "Profil"}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-stone-600/60"
                  onError={(e)=>{ e.currentTarget.src="/default-avatar.jpg"; }}
                />
                <span className="hidden sm:inline">{username || "Mon profil"}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="ml-1 text-sm px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Déconnexion
              </button>
            </nav>
          </div>

          {/* Menu mobile (drop under fixed bar) */}
          <div
            id="mobile-menu"
            className={`md:hidden overflow-hidden transition-[max-height] duration-300 ${open ? "max-h-64" : "max-h-0"}`}
          >
            <div className="flex flex-col gap-3 py-3 text-stone-200">
              <Link to="/messages" className="px-1 hover:text-white" onClick={() => setOpen(false)}>
                💬 Messages
                {totalUnread > 0 && (
                  <span className="ml-2 rounded-full bg-red-600 text-white text-[10px] px-1.5 py-0.5">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </Link>
              <Link to="/users" className="px-1 hover:text-white" onClick={() => setOpen(false)}>
                👥 Utilisateurs
              </Link>
              <Link to="/profile" className="px-1 hover:text-white flex items-center gap-2" onClick={() => setOpen(false)}>
                <img
                  src={avatar}
                  alt={username || "Profil"}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-stone-600/60"
                  onError={(e)=>{ e.currentTarget.src="/default-avatar.jpg"; }}
                />
                <span>{username || "Mon profil"}</span>
              </Link>
              <button
                onClick={() => { handleLogout(); setOpen(false); }}
                className="px-1 text-left text-red-400 hover:text-red-300"
              >
                ⏻ Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer pour compenser la fixed bar (h-14 = 56px) */}
      <div aria-hidden className="h-14" />

      {/* --- In-game info bar: dans le flux normal (plus dans le header) --- */}
      {roomId && (
        <div className="w-full py-2">
          <div className="mx-auto max-w-6xl px-3 sm:px-6">
            <div
              className="mx-auto max-w-sm sm:max-w-none rounded-xl bg-stone-900/90 border border-stone-700
                         flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2
                         text-stone-100 text-base tracking-wide"
            >
              {/* Gauche : pastille + joueurs (desktop) */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <TurnPill />
                {playersList && (
                  <span
                    className="hidden sm:inline truncate max-w-[40vw] font-medium"
                    title={playersList}
                  >
                    Joueurs : {playersList}
                  </span>
                )}
              </div>

              {/* Droite : Room + copier + Reprendre */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 justify-between sm:justify-end">
                <span className="opacity-80 shrink-0">Room :</span>

                <button
                  type="button"
                  onClick={handleCopyRoom}
                  className="truncate max-w-[40vw] sm:max-w-[24vw] text-left underline underline-offset-2 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-white/30"
                  title="Cliquer pour copier l'ID de la room"
                >
                  {roomId}
                </button>

                <button
                  type="button"
                  onClick={handleCopyRoom}
                  className="shrink-0 inline-flex items-center justify-center w-7 h-7 sm:w-6 sm:h-6 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  {copied ? "✅" : "📋"}
                </button>

                {!onPlayRoute && (
                  <button
                    type="button"
                    onClick={handleResume}
                    className="ml-1 hidden sm:inline-flex items-center gap-2 px-3 h-7 rounded-lg border border-stone-700 bg-stone-800/70 hover:bg-stone-700 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    ▶️ Reprendre
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
