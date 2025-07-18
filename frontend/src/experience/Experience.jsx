// src/experience/Experience.jsx
import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import useWebSocket from "../hooks/useWebSocket";
import Controls from "./Controls.jsx";
import Lights from "./Lights.jsx";
import Board from "../components/Board.jsx";

export default function Experience() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const { socket, connected, emit, on, off } = useWebSocket(user?.token);
  const [players, setPlayers] = useState([]);
  const [color, setColor] = useState(null);
  const [copied, setCopied] = useState(false);
  const boardRef = useRef(null);

  useEffect(() => {
    if (!roomId || !connected || !socket) return;

    // Rejoindre la room
    emit("join_room", { roomId, username: user.username });

    const handleRoomJoined = ({ players: joinedPlayers }) => {
      setPlayers(joinedPlayers);
      const isWhite = joinedPlayers[0] === user.username;
      setColor(isWhite ? "white" : "black");
    };

    const handleMove = (move) => {
      boardRef.current?.applyMove(move);
    };

    on("room_joined", handleRoomJoined);
    on("move_piece", handleMove);

    return () => {
      emit("leave_room", { roomId });
      off("room_joined", handleRoomJoined);
      off("move_piece", handleMove);
    };
  }, [roomId, socket, connected, emit, on, off, user]);

  if (!roomId) return <Navigate to="/lobby" replace />;
  if (!connected || !color) {
    return (
      <div className="p-4 text-center text-white bg-black">
        Connexion à la partie <strong>{roomId}</strong>…
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen bg-black">
      <header className="flex items-center justify-between px-6 py-4 text-white">
        <div className="text-lg">Joueurs : {players.join(", ")}</div>
        <div className="text-2xl">{color === "white" ? "⚪️" : "⚫️"}</div>
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => {
            navigator.clipboard.writeText(roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          title="Cliquez pour copier l'ID de la room"
        >
          <span className="text-lg underline">
            Room : <strong>{roomId}</strong>
          </span>
          <span className="text-lg">{copied ? "✅" : "📋"}</span>
        </div>
      </header>

      <div className="flex-1 relative">
        <Canvas flat shadows camera={{ fov: 45, near: 0.1, far: 200 }}>
          <Controls isWhite={color === "white"} />
          <Lights />
          <Suspense fallback={null}>
            <Board
              ref={boardRef}
              socket={socket}
              roomId={roomId}
              color={color}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
