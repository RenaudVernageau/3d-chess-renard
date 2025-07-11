import React from 'react'
import { Link } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav className="w-full bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="text-xl font-bold">
        <Link to="/lobby" className="hover:text-gray-300">3D Chess</Link>
      </div>
      <div className="space-x-4">
        <Link to="/lobby" className="hover:text-gray-300">Lobby</Link>
        <Link to="/play" className="hover:text-gray-300">Game</Link>
      </div>
    </nav>
  )
}