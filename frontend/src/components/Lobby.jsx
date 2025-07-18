// src/components/Lobby.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useWebSocket from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';

export default function Lobby() {
  const { user } = useAuth();
  const socket = useWebSocket();
  const navigate = useNavigate();
  const [inputRoom, setInputRoom] = useState('');
  const [error, setError] = useState('');

  // Callbacks for socket events
  const handleRoomCreated = useCallback(
    ({ roomId }) => {
      navigate(`/play/${roomId}`);
    },
    [navigate]
  );

  const handleRoomJoined = useCallback(
    ({ roomId }) => {
      navigate(`/play/${roomId}`);
    },
    [navigate]
  );

  useEffect(() => {
    // Listen for server events
    socket.on('room_created', handleRoomCreated);
    socket.on('room_joined',   handleRoomJoined);

        // No cleanup needed, singleton socket
  }, [socket, handleRoomCreated, handleRoomJoined]);
  }, [socket, handleRoomCreated, handleRoomJoined]);

  const handleCreate = () => {
    setError('');
    socket.emit('create_room');
  };

  const handleJoin = () => {
    setError('');
    const roomId = inputRoom.trim();
    if (!roomId) {
      setError('Saisis un ID de room.');
      return;
    }
    socket.emit('join_room', { roomId, username: user.username });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-300 dark:from-stone-800 dark:to-stone-900 transition-colors duration-500">
      <div className="bg-white bg-opacity-30 backdrop-blur-md dark:bg-stone-800 dark:bg-opacity-40 p-8 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-center text-stone-900 dark:text-stone-100 mb-8">
          Salon de jeu
        </h1>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <button
          onClick={handleCreate}
          className="w-full py-3 mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
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
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            Rejoindre
          </button>
        </div>
      </div>
    </div>
  );
}
