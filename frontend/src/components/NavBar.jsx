// src/components/NavBar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGameUiStore } from "../store/useGameUiStore";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Store
  const roomId   = useGameUiStore((s) => s.currentRoomId);
  const color    = useGameUiStore((s) => s.myColor);
  const players  = useGameUiStore((s) => s.players) || [];

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-stone-900/95 backdrop-blur supports-[backdrop-filter]:bg-stone-900/75">
      {/* Barre du haut */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-white">
            <span className="text-xl">Roi des jeux</span>
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
            <Link to="/messages" className="hover:text-white">💬 Messages</Link>
            <Link to="/users" className="hover:text-white">👥 Liste des utilisateurs</Link>
          </nav>
        </div>
      </div>

      {/* Barre du bas */}
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
                  <span className="text-xl">{color === "white" ? "⚪" : "⚫"}</span>
                )}
              </div>

              {/* Room + copier */}
              <div className="flex items-center gap-3">
                {roomId && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="opacity-80">Room&nbsp;:</span>

                      {/* Sélectionnable + clique-copie + hover animé */}
                      <button
                        type="button"
                        onClick={handleCopyRoom}
                        onKeyDown={(e) =>
                          (e.key === "Enter" || e.key === " ") && handleCopyRoom()
                        }
                        className="underline underline-offset-2 break-all select-text cursor-pointer transition-colors duration-200 ease-in-out hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-white/30 px-0"
                        title="Cliquer pour copier (ou sélectionner pour copier)"
                      >
                        {roomId}
                      </button>
                    </div>

                    {/* Bouton copie avec feedback + hover animé */}
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
