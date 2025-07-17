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
  const [color, setColor] = useState(null); // "white" or "black"
  const [copied, setCopied] = useState(false);
  const socketRef = useRef(null);
  const boardRef = useRef(null);

  // Récupérer le roomId depuis le paramètre de route
  const { roomId } = useParams();

  useEffect(() => {
    if (!roomId) return;

    const socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token: user.token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_room", { roomId });
      setConnected(true);
    });

    socket.on("room_joined", ({ players: joinedPlayers }) => {
      setPlayers(joinedPlayers);
      const isWhite = joinedPlayers[0] === user.username;
      setColor(isWhite ? "white" : "black");
    });

    socket.on("move_piece", (move) => {
      boardRef.current?.applyMove(move);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      socket.emit("leave_room", { roomId });
      socket.disconnect();
    };
  }, [roomId, user.username, user.token]);

  if (!roomId) return <Navigate to="/lobby" replace />;
  if (!connected || !color) {
    return (
      <div className="p-4">
        Connexion à la partie <strong>{roomId}</strong>…
      </div>
    );
  }

  // Camera initial positions
  const initialCamPos = color === "white" ? [4, 8, 10] : [-4, 8, -10];

  return (
    <div className="flex flex-col w-full h-screen">
      {/* Header full width */}
      <header className="flex items-center justify-between px-6 py-4 bg-black text-white w-full">
        {/* Players list */}
        <div className="text-lg">Joueurs : {players.join(", ")}</div>

        {/* Color emoji */}
        <div className="text-2xl">{color === "white" ? "⚪️" : "⚫️"}</div>

        {/* Clickable roomId (copy) */}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => {
            navigator.clipboard.writeText(roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          title="Cliquez pour copier l'ID de la room"
        >
          <span className="text-lg">Room : <strong>{roomId}</strong></span>
          <span className="text-lg">{copied ? '✅' : '📋'}</span>
        </div>
      </header>

      {/* Canvas 3D */}
      <div className="flex-1 relative">
        <Canvas
          flat
          shadows
          camera={{ fov: 45, near: 0.1, far: 200, position: initialCamPos }}
        >
          <Controls isWhite={color === "white"} />
          <Lights />
          <Suspense fallback={null}>
            <Board ref={boardRef} socket={socketRef.current} roomId={roomId} color={color} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
