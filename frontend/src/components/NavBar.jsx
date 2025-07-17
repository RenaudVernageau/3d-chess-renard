// src/components/NavBar.jsx
import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function NavBar() {
  const { token, logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="w-full bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
      <NavLink to="/" className="text-2xl font-bold hover:text-gray-300">
        3D Chess
      </NavLink>

      {token && (
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

          <span className="text-sm">{user?.username}</span>

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
