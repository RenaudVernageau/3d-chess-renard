// src/components/NavBar.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGameUiStore } from "../store/useGameUiStore";
import { useMessageStore } from "../store/useMessageStore";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Store jeu
  const roomId  = useGameUiStore((s) => s.currentRoomId);
  const color   = useGameUiStore((s) => s.myColor);
  const players = useGameUiStore((s) => s.players) || [];

  // Store messages
  const totalUnread = useMessageStore((s) => s.totalUnread());

  const playersList = (Array.isArray(players) ? players : [])
    .map((p) => (typeof p === "string" ? p : p?.username))
    .filter(Boolean)
    .join(", ");

  // Sommes-nous sur la page de jeu ?
  // HashRouter -> pathname ressemble à "/play/xxxxx"
  const isOnGameRoute = location.pathname.startsWith("/play/");

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

  const handleResumeGame = () => {
    if (roomId) navigate(`/play/${roomId}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-stone-900/95 backdrop-blur supports-[backdrop-filter]:bg-stone-900/75">
      {/* Barre du haut */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-white">
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
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-stone-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>

          {/* Liens desktop + badge total non-lus + (Resume game hors page de jeu) */}
          <nav className="hidden md:flex items-center gap-4 text-stone-200">
            <Link to="/messages" className="relative hover:text-white px-2 py-1 rounded">
              💬 Messages
              {totalUnread > 0 && (
                <span className="absolute -top-2 -right-3 rounded-full bg-red-600 text-white text-[10px] px-1.5 py-0.5 leading-none">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </Link>
            <Link to="/users" className="hover:text-white px-2 py-1 rounded">
              👥 Liste des utilisateurs
            </Link>

            {roomId && !isOnGameRoute && (
              <button
                onClick={handleResumeGame}
                className="ml-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 transition active:scale-95"
                title="Revenir à la partie en cours"
              >
                🎮 Resume game
              </button>
            )}
          </nav>
        </div>

        {/* Menu mobile */}
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
              👥 Liste des utilisateurs
            </Link>

            {roomId && !isOnGameRoute && (
              <button
                onClick={() => { setOpen(false); handleResumeGame(); }}
                className="mt-1 w-fit rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 transition active:scale-95"
                title="Revenir à la partie en cours"
              >
                🎮 Retourner à la partie
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barre du bas (infos partie) */}
      {(playersList || roomId) && (
        <div className="w-full bg-black text-stone-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex h-10 items-center justify-between">
              {/* Joueurs + couleur */}
              <div className="flex items-center gap-3 min-w-0">
                {playersList ? (
                  <>
                    <span className="opacity-80">Joueurs&nbsp;:</span>
                    <span className="font-medium truncate" title={playersList}>{playersList}</span>
                  </>
                ) : (
                  <span className="opacity-80">Joueurs&nbsp;: —</span>
                )}
                {typeof color === "string" && (
                  <span className="text-xl" aria-label={`couleur ${color}`} title={`Couleur : ${color}`}>
                    {color === "white" ? "⚪" : "⚫"}
                  </span>
                )}
              </div>

              {/* Room + copier */}
              <div className="flex items-center gap-3">
                {roomId && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="opacity-80">Room&nbsp;:</span>
                      <button
                        type="button"
                        onClick={() => {
                          handleCopyRoom();
                        }}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleCopyRoom()}
                        className="underline underline-offset-2 break-all select-text cursor-pointer transition-colors duration-200 ease-in-out hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-white/30 px-0"
                        title="Cliquer pour copier (ou sélectionner pour copier)"
                        aria-label="Copier l'ID de la room"
                      >
                        {roomId}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyRoom}
                      className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded cursor-pointer transition-colors duration-200 ease-in-out hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                      title="Copier l'ID de la room"
                      aria-live="polite"
                    >
                      {copied ? "✅" : "📋"}
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
