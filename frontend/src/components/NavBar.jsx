// src/components/NavBar.jsx
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="w-full bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-6">
        <NavLink to="/" className="text-2xl font-bold hover:text-gray-300">
          3D Chess
        </NavLink>

        {user && (
          <>
            <NavLink
              to="/lobby"
              className={({ isActive }) =>
                `hover:text-gray-300 ${isActive ? 'text-gray-300 underline' : ''}`
              }
            >
              Lobby
            </NavLink>
            <NavLink
              to="/play"
              className={({ isActive }) =>
                `hover:text-gray-300 ${isActive ? 'text-gray-300 underline' : ''}`
              }
            >
              Game
            </NavLink>
          </>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <span className="text-sm mr-4">{user.username}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <>
            {location.pathname !== '/login' && (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `hover:text-gray-300 ${isActive ? 'text-gray-300 underline' : ''}`
                }
              >
                Se connecter
              </NavLink>
            )}
            {location.pathname !== '/register' && (
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `hover:text-gray-300 ${isActive ? 'text-gray-300 underline' : ''}`
                }
              >
                S’inscrire
              </NavLink>
            )}
          </>
        )}
      </div>
    </nav>
)}
