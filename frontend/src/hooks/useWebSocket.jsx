// src/hooks/useWebSocket.jsx
import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";

export default function useWebSocket(token) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || socketRef.current) return;

    console.log("[WS] Initialisation WebSocket...");

    const socket = io(import.meta.env.VITE_WS_URL || "http://localhost:4000", {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WS] ✅ Connected to server");
      setConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.warn("[WS] ❌ Disconnected:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("[WS] 🚫 Connection error:", err.message);
    });

    return () => {
      console.log("[WS] 🧹 Cleaning up socket connection");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
    };
  }, [token]);

  const on = useCallback((event, handler) => {
    if (!socketRef.current) return;
    console.log(`[WS] 🟢 Listening to event: "${event}"`);
    socketRef.current.on(event, handler);
  }, []);

  const once = useCallback((event, handler) => {
    if (!socketRef.current) return;
    console.log(`[WS] 🟡 Listening once to event: "${event}"`);
    socketRef.current.once(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    if (!socketRef.current) return;
    console.log(`[WS] 🔴 Stop listening to event: "${event}"`);
    socketRef.current.off(event, handler);
  }, []);

  const emit = useCallback((event, payload, ack) => {
    if (!socketRef.current) return;
    console.log(`[WS] 📤 Emitting "${event}"`, payload);
    if (ack) {
      socketRef.current.emit(event, payload, ack);
    } else {
      socketRef.current.emit(event, payload);
    }
  }, []);

  return {
    socket: socketRef.current,
    connected,
    on,
    once,
    off,
    emit,
  };
}
