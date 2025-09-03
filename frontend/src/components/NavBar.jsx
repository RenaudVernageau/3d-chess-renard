// src/components/NavBar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * NavBar responsive avec menu burger.
 * Reprend l'existant: logo "Roi des jeux 👑", lien Messages, lien Liste des utilisateurs,
 * email utilisateur, bouton Déconnexion, lien Room copiable.
 *
 * Props:
 * - roomId?: string       // id de la room à copier (affiché s'il existe)
 * - color?: "white"|"black" // optionnel: icône ⚫/⚪
 *
 * Si tu avais déjà d'autres props, dis-le moi et je les remets.
 */
export default function NavBar({ roomId, color }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const nav = useNavigate();

  const handleCopyRoom = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLogout = () => {
    try {
      logout?.();
    } catch {}
    nav("/", { replace: true });
  };

  return (
    <header className="w-full bg-[#2c2523] text-white">
      {/* Ligne principale */}
      <div className="mx-auto w-full max-w-7xl px-4 py-3 flex items-center justify-between">
        {/* Brand + éventuelle couleur */}
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-bold flex items-center gap-2">
            <span>Roi des jeux</span>
            <span role="img" aria-label="crown">👑</span>
          </Link>
          {color && (
            <span
              className="hidden sm:inline-flex w-6 h-6 items-center justify-center"
              title={color === "black" ? "Vous jouez noir" : "Vous jouez blanc"}
            >
              {color === "black" ? "⚫" : "⚪"}
            </span>
          )}
        </div>

        {/* Actions desktop */}
        <nav className="hidden md:flex items-center gap-5">
          <Link to="/messages" className="hover:opacity-80">
            💬 Messages
          </Link>
          <Link to="/users" className="hover:opacity-80">
            👥 Liste des utilisateurs
          </Link>

          {roomId && (
            <button
              onClick={handleCopyRoom}
              className="flex items-center gap-2 underline hover:opacity-80"
              title="Copier l'ID de la room"
            >
              Room : <strong className="truncate max-w-[16rem]">{roomId}</strong> <span>📋</span>
            </button>
          )}

          {user?.email && (
            <span className="text-sm opacity-80 hidden lg:inline">
              {user.email}
            </span>
          )}

          <button
            onClick={handleLogout}
            className="ml-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded"
          >
            Déconnexion
          </button>
        </nav>

        {/* Burger (mobile) */}
        <button
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded hover:bg-[#3a3331] focus:outline-none"
          aria-label="Ouvrir le menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <div className="space-y-1.5">
            <span className="block w-6 h-0.5 bg-white"></span>
            <span className="block w-6 h-0.5 bg-white"></span>
            <span className="block w-6 h-0.5 bg-white"></span>
          </div>
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden border-t border-[#3a3331]">
          <div className="px-4 py-3 flex flex-col gap-2">
            {color && (
              <div className="text-sm flex items-center gap-2">
                <span>Couleur :</span>
                <span>{color === "black" ? "⚫ Noir" : "⚪ Blanc"}</span>
              </div>
            )}

            {user?.email && (
              <div className="text-sm opacity-80 truncate">{user.email}</div>
            )}

            <Link
              to="/messages"
              className="py-2 hover:bg-[#3a3331] rounded px-2"
              onClick={() => setOpen(false)}
            >
              💬 Messages
            </Link>

            <Link
              to="/users"
              className="py-2 hover:bg-[#3a3331] rounded px-2"
              onClick={() => setOpen(false)}
            >
              👥 Liste des utilisateurs
            </Link>

            {roomId && (
              <button
                onClick={() => {
                  handleCopyRoom();
                  setOpen(false);
                }}
                className="py-2 hover:bg-[#3a3331] rounded px-2 text-left"
              >
                📋 Copier l’ID de la room
              </button>
            )}

            <button
              onClick={handleLogout}
              className="mt-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}

      {/* Toast mobile "copié" */}
      {copied && (
        <div className="md:hidden fixed top-2 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1.5 rounded shadow z-50">
          ID copié !
        </div>
      )}
    </header>
  );
}
