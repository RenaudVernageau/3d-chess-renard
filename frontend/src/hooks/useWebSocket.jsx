// src/hooks/useWebSocket.jsx
import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

/**
 * Hook WS simple avec Socket.IO
 * @param {string} token - JWT pour auth WS
 */
export default function useWebSocket(token) {
  const socketRef = useRef(null)

  const connect = useCallback(() => {
    if (socketRef.current) return
    // initialisation de la connexion
    socketRef.current = io(import.meta.env.VITE_WS_URL || 'http://localhost:4000', {
      auth: { token }
    })
  }, [token])

  const on = useCallback((event, handler) => {
    if (!socketRef.current) return
    socketRef.current.on(event, handler)
  }, [])

  const emit = useCallback((event, payload) => {
    if (!socketRef.current) return
    socketRef.current.emit(event, payload)
  }, [])

  useEffect(() => {
    return () => {
      // clean up on unmount
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  return { socket: socketRef.current, connect, on, emit }
}
