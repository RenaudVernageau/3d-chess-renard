// src/components/NavBar.jsx
import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // On cache la partie utilisateur sur /login et /register
  const hideOn = ["/login", "/register"];
  const isHidden = hideOn.includes(location.pathname);

  return (
    <nav className="w-full bg-stone-800 text-white px-4 py-3 flex justify-between items-center">
      <NavLink to="/" className="text-2xl font-bold hover:text-stone-300">
        Roi des jeux 👑
      </NavLink>

      {!isHidden && user && (
        <div className="flex items-center space-x-4">
          {/* Enveloppe avatar + username dans un lien vers la page profil */}
          <NavLink
            to="/profile"
            className="flex items-center space-x-2 hover:underline"
          >
            <img
              src={user.avatar || "/default-avatar.png"}
              alt="Avatar"
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm">{user.username}</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition"
          >
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  );
}
