// src/components/Lobby.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import useWebSocket from '../hooks/useWebSocket'

export default function Lobby() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const socket = useWebSocket()
  const [roomId, setRoomId] = useState('')
  const [input, setInput] = useState('')

  useEffect(() => {
    if (!token) return
    // Listen for room creation
    socket.on('room_created', ({ roomId }) => {
      console.log('🟢 room_created:', roomId)
      navigate(`/play/${roomId}`)
    })
    // Listen for join acknowledgement
    socket.on('room_joined', ({ roomId }) => {
      console.log('🟢 room_joined:', roomId)
      navigate(`/play/${roomId}`)
    })
    return () => {
      socket.off('room_created')
      socket.off('room_joined')
    }
  }, [socket, navigate, token])

  const handleCreate = () => {
    console.log('🔴 emit create_room')
    socket.emit('create_room')
  }

  const handleJoin = () => {
    if (!input) return
    console.log('🔴 emit join_room', input)
    socket.emit('join_room', { roomId: input })
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Salon de jeu</h2>
      <button
        onClick={handleCreate}
        className="w-full mb-4 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded"
      >
        Créer une partie
      </button>
      <div className="flex space-x-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="ID de la room"
          className="flex-1 border px-3 py-2 rounded"
        />
        <button
          onClick={handleJoin}
          className="bg-green-600 hover:bg-green-500 text-white px-4 rounded"
        >
          Rejoindre
        </button>
      </div>
    </div>
  )
}
