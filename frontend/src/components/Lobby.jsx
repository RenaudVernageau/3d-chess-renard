// src/components/Lobby.jsx
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import useWebSocket from "../hooks/useWebSocket"
import { createRoom, joinRoom } from "../api/game"

export default function Lobby() {
  const { token } = useAuth()
  const { socket, connect, on, emit } = useWebSocket(token)
  const nav = useNavigate()

  // ID saisi pour rejoindre
  const [joinId, setJoinId] = useState("")

  // 1) On connecte la socket au chargement du composant
  useEffect(() => {
    if (token) connect()
  }, [token, connect])

  // 2) Écoute des events WebSocket
  useEffect(() => {
    if (!socket) return

    on("room_created", ({ roomId }) => {
      // une fois la room créée, on navigue vers /play?room=xxx
      nav(`/play?room=${roomId}`)
    })

    on("room_joined", ({ roomId }) => {
      nav(`/play?room=${roomId}`)
    })

    on("error", ({ message }) => {
      alert("Erreur WS : " + message)
    })
  }, [socket, on, nav])

  const handleCreate = () => {
    try {
      createRoom(socket)
    } catch (e) {
      alert(e.message)
    }
  }

  const handleJoin = () => {
    if (!joinId.trim()) {
      alert("Merci de saisir un roomId.")
      return
    }
    try {
      joinRoom(socket, joinId.trim())
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "0 auto" }}>
      <h1>Lobby</h1>

      <button onClick={handleCreate} style={{ marginBottom: 12 }}>
        ➕ Créer une nouvelle partie
      </button>

      <div>
        <input
          placeholder="Entrer room ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <button onClick={handleJoin}>🔗 Rejoindre une partie</button>
      </div>
    </div>
  )
}
