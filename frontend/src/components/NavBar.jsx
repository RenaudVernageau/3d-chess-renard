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

  // Hide auth section on login/register pages
  const hideOn = ["/login", "/register"];
  const isHidden = hideOn.includes(location.pathname);

  return (
    <nav className="w-full bg-black-800 text-white px-4 py-3 flex justify-between items-center">
      <NavLink to="/" className="text-2xl font-bold hover:text-black-300">
        Roi des jeux 👑
      </NavLink>

      {/* Show only user name and logout */}
      {!isHidden && user && (
        <div className="flex items-center space-x-4">
          <span className="text-sm">{user.username}</span>
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
