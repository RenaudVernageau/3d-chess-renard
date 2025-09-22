// src/components/Lobby.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useWebSocket from "../hooks/useWebSocket";
import { useAuth } from "../hooks/useAuth";
import { useGameUiStore } from "../store/useGameUiStore";

/**
 * Règle :
 * - On ignore les EVENTS AUTO (room_created/room_joined) si hasQuit === true OU si la fenêtre temps est active.
 * - On n'empêche PAS l'utilisateur de cliquer si hasQuit === true (c'était le bug).
 *   Les boutons ne sont désactivés QUE pendant la petite fenêtre temporelle.
 * - Au clic manuel (Créer/Rejoindre), on enlève les garde-fous (hasQuit=false + on annule la fenêtre)
 *   pour que l'event de retour soit bien pris en compte.
 */
export default function Lobby() {
  const { user } = useAuth();
  const { socket, on, off, emit } = useWebSocket(user?.token);
  const navigate = useNavigate();

  const [inputRoom, setInputRoom] = useState("");
  const [error, setError] = useState("");

  // Store
  const hasQuit = useGameUiStore((s) => s.hasQuit);
  const isInGame = useGameUiStore((s) => s.isInGame);
  const currentRoomId = useGameUiStore((s) => s.currentRoomId);

  const lastHandledAtRef = useRef(0);

  // --- helpers fenêtre temporelle ---
  const getGuardUntil = () => {
    try {
      return Number(localStorage.getItem("ignoreRoomEventsUntil") || "0");
    } catch {
      return 0;
    }
  };
  const isTimeGuardActive = () => Date.now() < getGuardUntil();

  // ❌ Ancienne erreur : on utilisait hasQuit ici -> bloquait aussi les clics manuels.
  // Désormais, pour désactiver les boutons, on ne regarde QUE la fenêtre de temps.
  const shouldDisableActions = () => isTimeGuardActive();

  // Pour les events auto, on garde la logique stricte.
  const shouldIgnoreIncomingEvents = () => hasQuit || isTimeGuardActive();

  // Purge défensive en arrivant au lobby: si une session traîne, on la nettoie.
  useEffect(() => {
    const { currentRoomId: rid, isInGame: ingame } = useGameUiStore.getState();
    if (rid || ingame) {
      useGameUiStore.getState().leaveGame();
      // petite fenêtre très courte pour absorber d'éventuels events tardifs
      try {
        localStorage.setItem("ignoreRoomEventsUntil", String(Date.now() + 800));
      } catch {}
    }
  }, []);

  // Annule tous les garde-fous avant une action MANUELLE
  const clearGuardsForManualAction = () => {
    // 1) hasQuit=false pour que l'event de retour ne soit pas ignoré
    useGameUiStore.setState({ hasQuit: false });
    // 2) on coupe la fenêtre temps
    try {
      localStorage.setItem("ignoreRoomEventsUntil", "0");
    } catch {}
  };

  useEffect(() => {
    if (!socket) return;

    const handleRoomEvent = ({ roomId }) => {
      // On ignore seulement les EVENTS AUTO si on vient de quitter
      if (shouldIgnoreIncomingEvents()) {
        if (import.meta?.env?.MODE !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[Lobby] Ignored room event (guard active).", {
            hasQuit,
            ignoreUntil: localStorage.getItem("ignoreRoomEventsUntil"),
            roomId,
          });
        }
        return;
      }

      // anti-doublon navigation
      const now = Date.now();
      if (now - lastHandledAtRef.current < 400) return;
      lastHandledAtRef.current = now;

      if (roomId) navigate(`/play/${roomId}`);
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
    // On laisse cliquer même si hasQuit===true ; on nettoie les garde-fous.
    clearGuardsForManualAction();

    if (shouldDisableActions()) {
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

    clearGuardsForManualAction();

    if (shouldDisableActions()) {
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

        {/* Message doux uniquement si la fenêtre temps est active */}
        {isTimeGuardActive() && (
          <p className="text-stone-600 dark:text-stone-300 text-sm mb-4 text-center">
            Retour au salon ⏳ ...
          </p>
        )}

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <button
          onClick={handleCreate}
          className="w-full py-3 mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-60"
          disabled={shouldDisableActions()}
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
            disabled={shouldDisableActions()}
          >
            Rejoindre
          </button>
        </div>

        {/* Petit statut utile en debug */}
        <div className="mt-6 text-xs text-stone-500 dark:text-stone-400 text-center">
          {isInGame && currentRoomId ? (
            <>Session active: <span className="font-mono">{currentRoomId}</span></>
          ) : (
            "Aucune session active"
          )}
        </div>
      </div>
    </div>
  );
}
