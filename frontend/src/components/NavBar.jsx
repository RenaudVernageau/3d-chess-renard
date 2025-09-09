// frontend/src/components/NavBar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGameUiStore } from "../store/useGameUiStore";
import { useMessageStore } from "../store/useMessageStore";
import { useAuth } from "../hooks/useAuth";

export default function NavBar() {
  // 🔹 Tous les hooks en haut, dans le même ordre à chaque rendu
  const { user } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Stores (ce sont aussi des hooks)
  const roomId = useGameUiStore((s) => s.currentRoomId);
  const color = useGameUiStore((s) => s.myColor);
  const players = useGameUiStore((s) => s.players) || [];
  const totalUnread = useMessageStore((s) => s.totalUnread());

  // Guard après les hooks → OK pour l'eslint
  if (!user) return null;

  // Données utilisateur
  const username = user?.username || "";
  const avatarRaw = user?.avatar || user?.avatarUrl || "";
  const avatar =
    avatarRaw && String(avatarRaw).trim() !== ""
      ? avatarRaw
      : "/default-avatar.jpg";

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-stone-900/95 backdrop-blur supports-[backdrop-filter]:bg-stone-900/75">
      {/* Barre du haut */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link
            to="/lobby"
            className="flex items-center gap-2 font-semibold text-white"
          >
            <span className="text-xl">Roi des jeux ♔</span>
          </Link>

          {/* Burger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl
             bg-stone-800/80 hover:bg-stone-700 active:scale-95 border border-stone-600 shadow-sm
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-stone-900 transition"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Ouvrir le menu"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-stone-100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {open ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
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
            <Link to="/users" className="hover:text-white">
              👥 Utilisateurs
            </Link>
            <Link
              to="/profile"
              className="group flex items-center gap-2 hover:text-white"
            >
              <img
                src={avatar}
                alt={username || "Profil"}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-stone-600/60"
              />
              <span className="hidden sm:inline">
                {username || "Mon profil"}
              </span>
            </Link>
          </nav>
        </div>

        {/* Menu mobile */}
        <div
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-[max-height] duration-300 ${
            open ? "max-h-64" : "max-h-0"
          }`}
        >
          <div className="flex flex-col gap-3 py-3 text-stone-200">
            <Link
              to="/messages"
              className="px-1 hover:text-white"
              onClick={() => setOpen(false)}
            >
              💬 Messages
              {totalUnread > 0 && (
                <span className="ml-2 rounded-full bg-red-600 text-white text-[10px] px-1.5 py-0.5">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </Link>
            <Link
              to="/users"
              className="px-1 hover:text-white"
              onClick={() => setOpen(false)}
            >
              👥 Utilisateurs
            </Link>
            <Link
              to="/profile"
              className="px-1 hover:text-white flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <img
                src={avatar}
                alt={username || "Profil"}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-stone-600/60"
              />
              <span>{username || "Mon profil"}</span>
            </Link>
          </div>
        </div>
      </div>
      {/* Barre du bas (infos partie) */}
      {(playersList || roomId) && (
        <div className="w-full bg-black text-stone-100">
          <div className="mx-auto max-w-6xl px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:h-10 sm:items-center sm:justify-between gap-2 py-2 sm:py-0">
              {/* Joueurs + couleur */}
              <div className="flex items-center gap-2 min-w-0">
                {playersList ? (
                  <>
                    <span className="opacity-80 text-sm sm:text-base">
                      Joueurs&nbsp;:
                    </span>
                    <span
                      className="font-medium truncate max-w-[50vw] sm:max-w-[30vw] text-sm sm:text-base"
                      title={playersList}
                    >
                      {playersList}
                    </span>
                  </>
                ) : (
                  <span className="opacity-80 text-sm sm:text-base">
                    Joueurs&nbsp;: —
                  </span>
                )}
                {typeof color === "string" && (
                  <span
                    className="text-lg sm:text-xl"
                    aria-label={`couleur ${color}`}
                    title={`Couleur : ${color}`}
                  >
                    {color === "white" ? "⚪" : "⚫"}
                  </span>
                )}
              </div>

              {/* Room + copier + Reprendre (compact mobile) */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 justify-between sm:justify-end">
                {roomId && (
                  <>
                    <span className="opacity-80 text-sm sm:text-base shrink-0">
                      Room&nbsp;:
                    </span>

                    {/* ID truncatable (évite les retours à la ligne) */}
                    <button
                      type="button"
                      onClick={handleCopyRoom}
                      className="truncate max-w-[42vw] sm:max-w-[20vw] text-left underline underline-offset-2 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-white/30 px-0 text-sm sm:text-base"
                      title="Cliquer pour copier l'ID de la room"
                      aria-label="Copier l'ID de la room"
                    >
                      {roomId}
                    </button>

                    {/* Icône copier / état */}
                    <button
                      type="button"
                      onClick={handleCopyRoom}
                      className="shrink-0 inline-flex items-center justify-center w-7 h-7 sm:w-6 sm:h-6 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                      title="Copier l'ID de la room"
                      aria-live="polite"
                    >
                      {copied ? "✅" : "📋"}
                    </button>

                    {/* Reprendre — visible AUSSI en mobile (version courte) */}
                    <button
                      type="button"
                      onClick={handleResume}
                      className="ml-1 inline-flex items-center gap-2 px-3 h-8 sm:h-7 rounded-lg border border-stone-700 bg-stone-800/70 hover:bg-stone-700 text-[13px] sm:text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-white/30"
                      title="Revenir à la partie en cours"
                      aria-label="Revenir à la partie en cours"
                    >
                      <span aria-hidden>▶️</span>
                      <span className="hidden xs:inline sm:inline">
                        Reprendre la partie
                      </span>
                      <span className="xs:hidden sm:hidden">Reprendre</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
