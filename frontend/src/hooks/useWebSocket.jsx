import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";
import { useMessageStore } from "../store/useMessageStore";
import { useGameUiStore } from "../store/useGameUiStore";

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

export default function useWebSocket(token) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || socketRef.current) return;

    console.log("[WS] Initialisation WebSocket...");

    const socket = io(import.meta.env.VITE_WS_URL || "http://localhost:4000", {
      auth: { token },
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
    });

    socketRef.current = socket;

    const rejoinIfNeeded = () => {
      const state = useGameUiStore.getState();
      const roomId = state.currentRoomId;
      // username: essaye via localStorage (robuste après reload), sinon fallback
      const username =
        localStorage.getItem("username") ||
        state.players?.[0] ||
        "player";
      if (roomId) {
        console.log("[WS] 🔁 Rejoin room", roomId);
        socket.emit("join_room", { roomId, username });
      }
    };

    socket.on("connect", () => {
      console.log("[WS] ✅ Connected to server");
      setConnected(true);
      rejoinIfNeeded(); // rejoin sur toute (re)connexion
    });

    socket.on("reconnect", (attempt) => {
      console.log("[WS] 🔗 Reconnected", attempt);
      setConnected(true);
      rejoinIfNeeded();
    });

    socket.on("disconnect", (reason) => {
      console.warn("[WS] ❌ Disconnected:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("[WS] 🚫 Connection error:", err.message);
    });

    // 🔔 Écoute globale message:new (même hors page Chat)
    const ping = typeof Audio !== "undefined" ? new Audio("/sounds/ping.mp3") : null;
    const playPing = () => { try { ping && ping.play(); } catch {} };

    const maybeNotify = (title, body) => {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") new Notification(title, { body });
        });
      }
    };

    const myId = parseJwt(token)?.sub || "";
    const handleGlobalNewMessage = (msg) => {
      // Normalise + met à jour non-lus si nécessaire
      useMessageStore.getState().handleIncomingSocketMessage(msg, myId);
      // feedback léger si message d'une autre room que celle active
      const active = useMessageStore.getState().activeRoomId;
      const otherId = (msg?.from === myId) ? msg?.to : msg?.from;
      if (otherId && otherId !== active) {
        playPing();
        maybeNotify("Nouveau message", msg?.text || "…");
      }
    };

    socket.on("message:new", handleGlobalNewMessage);

    return () => {
      console.log("[WS] 🧹 Cleaning up socket connection");
      socket.off("message:new", handleGlobalNewMessage);
      socket.off("connect");
      socket.off("reconnect");
      socket.off("disconnect");
      socket.off("connect_error");
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
