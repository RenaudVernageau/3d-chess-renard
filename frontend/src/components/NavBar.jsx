// src/components/NavBar.jsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'


export default function NavBar() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="w-full bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-6">
        <Link to="/" className="text-2xl font-bold hover:text-gray-300">
          3D Chess
        </Link>
        {token && (
          <>
            <Link
              to="/lobby"
              className="hover:text-gray-300"
            >
              Lobby
            </Link>
            <Link
              to="/play"
              className="hover:text-gray-300"
            >
              Game
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center space-x-4">
        

        {token ? (
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition"
          >
            Déconnexion
          </button>
        ) : (
          <>
            <Link
              to="/login"
              className="hover:text-gray-300"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="hover:text-gray-300"
            >
              S’inscrire
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
