// src/components/NavBar.jsx
import React from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function NavBar() {
  const { token, logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Do not render any nav links on login or register pages
  const hideOn = ['/login', '/register']
  const isHidden = hideOn.includes(location.pathname)

  return (
    <nav className="w-full bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
      <NavLink to="/" className="text-2xl font-bold hover:text-gray-300">
        3D Chess
      </NavLink>

      {/* Only show Logout when user is authenticated and not on login/register */}
      {!isHidden && user && (
        <div className="flex items-center space-x-6">
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
  )
}
