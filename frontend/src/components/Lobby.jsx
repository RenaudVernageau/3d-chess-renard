// src/components/Lobby.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, joinRoom } from "../api/game";
import { useAuth } from "../hooks/useAuth";

export default function Lobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setError("");
    try {
      // Appel à l’API pour créer une room protégée par JWT
      const { roomId: newRoomId } = await createRoom();
      // Navigue vers l’écran de jeu avec le roomId
      navigate(`/play?room=${newRoomId}`);
    } catch (err) {
      console.error(err);
      setError("Impossible de créer la partie.");
    }
  };

  const handleJoin = async () => {
    setError("");
    if (!roomId.trim()) {
      setError("Saisis un ID de room.");
      return;
    }
    try {
      // Appel à l’API pour rejoindre la room
      await joinRoom(roomId.trim(), user.username);
      navigate(`/play?room=${roomId.trim()}`);
    } catch (err) {
      console.error(err);
      setError(err.error || "Impossible de rejoindre la partie.");
    }
  };

  return (
    <div
      className="
        min-h-screen flex items-center justify-center
        bg-gradient-to-br from-black-100 to-black-300
        dark:from-black-800 dark:to-black-900
        transition-colors duration-500
      "
    >
      <div
        className="
          bg-white bg-opacity-30 backdrop-blur-md
          dark:bg-black-800 dark:bg-opacity-40
          p-8 rounded-xl shadow-xl
          w-full max-w-md
        "
      >
        <h1 className="text-3xl font-extrabold text-center text-black-900 dark:text-black-100 mb-8">
          Salon de jeu
        </h1>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        {/* Bouton Créer une partie */}
        <button
          onClick={handleCreate}
          className="
            w-full py-3 mb-6
            bg-blue-600 hover:bg-blue-700
            text-white font-semibold
            rounded-lg
            transition
          "
        >
          Créer une partie
        </button>

        {/* Rejoindre une partie */}
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="ID de la room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="
              flex-1 px-4 py-2
              bg-black-100 dark:bg-black-700
              text-black-900 dark:text-black-100
              rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              transition
            "
          />
          <button
            onClick={handleJoin}
            className="
              px-4 py-2
              bg-green-600 hover:bg-green-700
              text-white font-semibold
              rounded-lg
              transition
            "
          >
            Rejoindre
          </button>
        </div>
      </div>
    </div>
  );
}
