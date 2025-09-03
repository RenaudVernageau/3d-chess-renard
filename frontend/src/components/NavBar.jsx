// src/components/NavBar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function NavBar({ roomId, color }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-stone-900/95 backdrop-blur supports-[backdrop-filter]:bg-stone-900/75">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-semibold text-white">
            <span className="text-xl">Roi des jeux 👑</span>
          </Link>

          {/* Icône couleur + room (si en partie) : desktop */}
          <div className="hidden md:flex items-center gap-4 text-white">
            {typeof color === "string" && (
              <span aria-label={color === "white" ? "Blanc" : "Noir"}>
                {color === "white" ? "⚪" : "⚫"}
              </span>
            )}
            {roomId && (
              <Link
                to={`/room/${roomId}`}
                className="underline underline-offset-4 decoration-stone-500 hover:text-blue-300"
                title="Voir la partie en cours"
              >
                Room : <strong>{roomId}</strong>
              </Link>
            )}
          </div>

          {/* Burger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-700 bg-stone-800 text-stone-100 hover:bg-stone-700 focus:outline-none"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <span className="sr-only">Menu</span>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              {!open ? (
                <path d="M4 6h16M4 12h16M4 18h16" />
              ) : (
                <path d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
          </button>

          {/* Liens desktop */}
          <nav className="hidden md:flex items-center gap-6 text-stone-200">
            <Link to="/messages" className="hover:text-white">💬 Messages</Link>
            <Link to="/users" className="hover:text-white">👥 Liste des utilisateurs</Link>
            {/* ajoute ici ton bouton Logout existant si besoin */}
          </nav>
        </div>

        {/* Panneau mobile */}
        <div
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-[max-height] duration-300 ${open ? "max-h-64" : "max-h-0"}`}
        >
          <div className="flex flex-col gap-3 py-3 text-stone-200">
            <Link to="/messages" className="px-1 hover:text-white" onClick={() => setOpen(false)}>💬 Messages</Link>
            <Link to="/users" className="px-1 hover:text-white" onClick={() => setOpen(false)}>👥 Liste des utilisateurs</Link>

            {(roomId || color) && (
              <div className="mt-2 flex items-center gap-3 px-1 text-sm">
                {typeof color === "string" && <span>{color === "white" ? "⚪" : "⚫"}</span>}
                {roomId && (
                  <Link to={`/room/${roomId}`} onClick={() => setOpen(false)} className="underline underline-offset-4">
                    Room : <strong>{roomId}</strong>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
