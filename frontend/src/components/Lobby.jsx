// src/components/Lobby.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Lobby() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");

  const handleCreate = () => {
    // ici on redirige vers /play (ou créer la room côté WS avant)
    navigate("/play");
  };

  const handleJoin = () => {
    if (roomId.trim()) {
      navigate(`/play?room=${roomId.trim()}`);
    }
  };

  return (
    <div
      className="
        min-h-screen flex items-center justify-center
        bg-gradient-to-br from-gray-100 to-gray-300
        dark:from-gray-800 dark:to-gray-900
        transition-colors duration-500
      "
    >
      {/* Toggle thème */}
      <nav className="absolute top-4 right-4 flex flex-end">
        <ThemeToggle />
      </nav>

      {/* Carte semi-transparente */}
      <div
        className="
          bg-white bg-opacity-30 backdrop-blur-md
          dark:bg-gray-800 dark:bg-opacity-40
          p-8 rounded-xl shadow-xl
          w-full max-w-md
        "
      >
        <h1 className="text-3xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-8">
          Salon de jeu
        </h1>

        {/* Bouton créer */}
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
              bg-gray-100 dark:bg-gray-700
              text-gray-900 dark:text-gray-100
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
