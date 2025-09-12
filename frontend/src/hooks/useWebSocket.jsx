// src/hooks/useWebSocket.js
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
      const username =
        localStorage.getItem("username") ||
        state.players?.[0] ||
        "player";
      if (roomId) {
        socket.emit("join_room", { roomId, username });
        socket.emit("state_request", { roomId });
      }
    };

    // ===== Connexion
    socket.on("connect", () => {
      setConnected(true);
      rejoinIfNeeded();
    });

    socket.on("reconnect", () => {
      setConnected(true);
      rejoinIfNeeded();
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (err) => console.error("[WS] connect_error:", err?.message));

    // ====== MESSAGERIE
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
      useMessageStore.getState().handleIncomingSocketMessage(msg, myId);
      const active = useMessageStore.getState().activeRoomId;
      const otherId = (msg?.from === myId) ? msg?.to : msg?.from;
      if (otherId && otherId !== active) {
        playPing();
        maybeNotify("Nouveau message", msg?.text || "…");
      }
    };
    socket.on("message:new", handleGlobalNewMessage);

    // ====== GAME: hydratation autoritative
    const applyCapture = (payload) => {
      useGameUiStore.getState().applyCapture({
        by: payload.by,
        piece: payload.piece,
        from: payload.from,
        to: payload.to,
        at: payload.at,
      });
    };

    const hydrateSnapshot = (snap) => {
      // snap: { fen, captures:{w:[],b:[]}, turn:'w'|'b', movesCount }
      const state = useGameUiStore.getState();
      // on n’écrase que les champs UI qu’on gère côté client
      state.setGameUi({
        // garde currentRoomId / players / etc. inchangés
        // remonte les captures serveur (miroir)
        captures: snap?.captures || { w: [], b: [] },
      });
      // NOTE: si tu ajoutes un chargement de FEN côté client, c’est ici
      // que tu appelleras ton hook pour synchroniser l’échiquier.
    };

    socket.on("piece:capture", applyCapture);
    socket.on("game:snapshot", hydrateSnapshot);
    socket.on("state_sync", hydrateSnapshot);

    return () => {
      socket.off("message:new", handleGlobalNewMessage);
      socket.off("piece:capture", applyCapture);
      socket.off("game:snapshot", hydrateSnapshot);
      socket.off("state_sync", hydrateSnapshot);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
    };
  }, [token]);

  const on = useCallback((event, handler) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, handler);
  }, []);

  const once = useCallback((event, handler) => {
    if (!socketRef.current) return;
    socketRef.current.once(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    if (!socketRef.current) return;
    socketRef.current.off(event, handler);
  }, []);

  const emit = useCallback((event, payload, ack) => {
    if (!socketRef.current) return;
    if (ack) socketRef.current.emit(event, payload, ack);
    else socketRef.current.emit(event, payload);
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
