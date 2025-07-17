// src/experience/Experience.jsx
import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useParams, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import Controls from "./Controls.jsx";
import Lights from "./Lights.jsx";
import Board from "../components/Board.jsx";

export default function Experience() {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const boardRef = useRef(null);

  // Récupérer le roomId depuis le paramètre de route
  const { roomId } = useParams();

  useEffect(() => {
    if (!roomId) return;

    // Connexion WS avec JWT
    const socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token: user.token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_room", { roomId });
      setConnected(true);
    });

    socket.on("room_joined", ({ players }) => {
      setPlayers(players);
    });

    socket.on("move_piece", (move) => {
      if (boardRef.current?.applyMove) {
        boardRef.current.applyMove(move);
      }
    });

    socket.on("connect_error", (err) => {
      console.error("WS Error:", err.message);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      socket.emit("leave_room", { roomId });
      socket.disconnect();
    };
  }, [roomId, user.token]);

  if (!roomId) {
    return <Navigate to="/lobby" replace />;
  }
  if (!connected) {
    return (
      <div className="p-4">
        Connexion à la partie <strong>{roomId}</strong>…
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-black text-white">
        <div>Joueurs : {players.join(", ")}</div>
        <div>Room : {roomId}</div>
      </header>

      {/* Canvas 3D */}
      <div className="flex-1 relative">
        <Canvas flat shadows camera={{ fov: 45, near: 0.1, far: 200, position: [4, 8, 10] }}>
          <Controls />
          <Lights />
          <Suspense fallback={null}>
            <Board ref={boardRef} socket={socketRef.current} roomId={roomId} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
