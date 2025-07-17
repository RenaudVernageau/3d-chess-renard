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
      // Crée une room via l'API REST
      const { roomId: newRoomId } = await createRoom();
      console.log('Created room via API:', newRoomId);
      // Redirige directement vers l'expérience 3D
      navigate(`/play/${newRoomId}`);
    } catch (err) {
      console.error("Error creating room:", err);
      setError("Impossible de créer la partie.");
    }
  };

  const handleJoin = async () => {
    setError("");
    const trimmed = roomId.trim();
    if (!trimmed) {
      setError("Saisis un ID de room.");
      return;
    }
    try {
      // Rejoindre la room via l'API REST
      await joinRoom(trimmed, user.username);
      console.log('Joined room via API:', trimmed);
      navigate(`/play/${trimmed}`);
    } catch (err) {
      console.error("Error joining room:", err);
      setError(err.error || "Impossible de rejoindre la partie.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-300 dark:from-stone-800 dark:to-stone-900 transition-colors duration-500">
      <div className="bg-white bg-opacity-30 backdrop-blur-md dark:bg-stone-800 dark:bg-opacity-40 p-8 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-center text-stone-900 dark:text-stone-100 mb-8">Salon de jeu</h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <button onClick={handleCreate} className="w-full py-3 mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
          Créer une partie
        </button>

        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="ID de la room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="flex-1 px-4 py-2 bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button onClick={handleJoin} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition">
            Rejoindre
          </button>
        </div>
      </div>
    </div>
  );
}
