// src/components/NavBar.jsx
import { FaUsers } from "react-icons/fa";
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
          <NavLink
            to="/users"
            className="flex items-center ml-4 text-sm hover:underline"
          >
            <FaUsers className="mr-1" />
            Liste des utilisateurs
          </NavLink>
          <NavLink to="/profile" className="text-sm hover:underline">
            {user.username}
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
