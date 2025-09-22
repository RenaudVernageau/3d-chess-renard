// src/components/Lobby.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useWebSocket from "../hooks/useWebSocket";
import { useAuth } from "../hooks/useAuth";
import { useGameUiStore } from "../store/useGameUiStore";

/**
 * Garde client pour éviter le "yo-yo" après Quit :
 * - On ignore les events room_created / room_joined tant que:
 *    • un flag temporel localStorage "ignoreRoomEventsUntil" n'est pas expiré
 *    • OU le store indique hasQuit === true
 * - La fenêtre est paramétrée par Experience.handleQuitGame (1.5s par défaut)
 */
export default function Lobby() {
  const { user } = useAuth();
  const { socket, on, off, emit } = useWebSocket(user?.token);
  const navigate = useNavigate();

  const [inputRoom, setInputRoom] = useState("");
  const [error, setError] = useState("");

  // read-only flags depuis le store
  const hasQuit = useGameUiStore((s) => s.hasQuit);
  const isInGame = useGameUiStore((s) => s.isInGame);
  const currentRoomId = useGameUiStore((s) => s.currentRoomId);

  // petit buffer local pour "debouncer" la re-navigation si jamais
  const lastHandledAtRef = useRef(0);

  const shouldIgnoreRoomEvents = () => {
    try {
      const until = Number(localStorage.getItem("ignoreRoomEventsUntil") || "0");
      const timeGuard = Date.now() < until;
      return hasQuit || timeGuard;
    } catch {
      return hasQuit;
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleRoomEvent = ({ roomId }) => {
      // Anti-race: on ignore si on vient juste de quitter
      if (shouldIgnoreRoomEvents()) {
        // Optionnel: message debug discret en dev
        if (import.meta?.env?.MODE !== "production") {
          // eslint-disable-next-line no-console
          console.debug(
            "[Lobby] Ignored room event because user just quit.",
            { hasQuit, ignoreUntil: localStorage.getItem("ignoreRoomEventsUntil"), roomId }
          );
        }
        return;
      }

      // Évite double navigation si deux events consécutifs arrivent
      const now = Date.now();
      if (now - lastHandledAtRef.current < 400) return;
      lastHandledAtRef.current = now;

      if (roomId) {
        navigate(`/play/${roomId}`);
      }
    };

    on("room_created", handleRoomEvent);
    on("room_joined", handleRoomEvent);

    return () => {
      off("room_created", handleRoomEvent);
      off("room_joined", handleRoomEvent);
    };
  }, [socket, on, off, navigate, hasQuit]);

  const handleCreate = () => {
    setError("");
    if (shouldIgnoreRoomEvents()) {
      setError("Patiente un instant…");
      return;
    }
    emit("create_room");
  };

  const handleJoin = () => {
    setError("");
    const roomId = inputRoom.trim();
    if (!roomId) {
      setError("Saisis un ID de room.");
      return;
    }
    if (shouldIgnoreRoomEvents()) {
      setError("Patiente un instant…");
      return;
    }
    emit("join_room", { roomId, username: user.username });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-300 dark:from-stone-800 dark:to-stone-900 transition-colors duration-500">
      <div className="bg-white bg-opacity-30 backdrop-blur-md dark:bg-stone-800 dark:bg-opacity-40 p-8 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-center text-stone-900 dark:text-stone-100 mb-8">
          Salon de jeu
        </h1>

        {/* Info douce si on sort tout juste d'une partie */}
        {shouldIgnoreRoomEvents() && (
          <p className="text-stone-600 dark:text-stone-300 text-sm mb-4 text-center">
            Retour au calme… tu peux créer/rejoindre dans une seconde.
          </p>
        )}

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <button
          onClick={handleCreate}
          className="w-full py-3 mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-60"
          disabled={shouldIgnoreRoomEvents()}
        >
          Créer une partie
        </button>

        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="ID de la room"
            value={inputRoom}
            onChange={(e) => setInputRoom(e.target.value)}
            className="flex-1 px-4 py-2 bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button
            onClick={handleJoin}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-60"
            disabled={shouldIgnoreRoomEvents()}
          >
            Rejoindre
          </button>
        </div>

        {/* Petit statut utile en debug */}
        <div className="mt-6 text-xs text-stone-500 dark:text-stone-400 text-center">
          {isInGame && currentRoomId
            ? <>Session active: <span className="font-mono">{currentRoomId}</span></>
            : "Aucune session active"}
        </div>
      </div>
    </div>
  );
}
