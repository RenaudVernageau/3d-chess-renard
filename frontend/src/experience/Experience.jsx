// src/experience/Experience.jsx
import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
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

  // On récupère roomId depuis l’URL : /play?room=xxxx
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");

  useEffect(() => {
    if (!roomId) {
      console.error("No roomId in URL");
      return;
    }
    // Connexion WS avec JWT
    const socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token: user.token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_room", { roomId });
      setConnected(true);
    });

    socket.on("room_joined", ({ roomId: rid, players }) => {
      setPlayers(players);
    });

    socket.on("move_piece", (move) => {
      // Si Board gère les moves via props, ou via ref
      // Ici on passe directement à Board via ref (voir ci‑dessous)
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
      socket.disconnect();
    };
  }, [roomId, user.token]);

  // Ref pour appeler les méthodes de Board
  const boardRef = useRef(null);

  if (!roomId) {
    return <div className="p-4">Aucun room spécifié.</div>;
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
      {/* Navbar / Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
        <div>Joueurs : {players.join(", ")}</div>
      </header>

      {/* Canvas 3D */}
      <div className="flex-1 relative">
        <Canvas
          flat
          shadows
          camera={{ fov: 45, near: 0.1, far: 200, position: [4, 8, 10] }}
        >
          <Controls />
          <Lights />
          <Suspense fallback={null}>
            {/* 
              On passe socket & roomId à Board pour qu’il émette
              socket.emit('move_piece', { roomId, move })
            */}
            <Board ref={boardRef} socket={socketRef.current} roomId={roomId} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
