// src/hooks/useWebSocket.jsx
import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * Hook WS simple avec Socket.IO
 * @param {string} token - JWT pour auth WS
 */
export default function useWebSocket(token) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Crée et connecte la socket
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WS] Connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const on = useCallback((event, handler) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    if (!socketRef.current) return;
    socketRef.current.off(event, handler);
  }, []);

  const emit = useCallback((event, payload) => {
    if (!socketRef.current) return;
    socketRef.current.emit(event, payload);
  }, []);

  return {
    socket: socketRef.current,
    connected,
    on,
    off,
    emit,
  };
}
