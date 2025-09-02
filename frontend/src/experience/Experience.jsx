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

  const [players, setPlayers] = useState([]);   // [{id, username, color}]
  const [color, setColor] = useState(null);     // "white" | "black"
  const [copied, setCopied] = useState(false);
  const boardRef = useRef(null);

  useEffect(() => {
    if (!roomId || !connected || !socket) return;

    // Rejoindre la room
    emit("join_room", { roomId, username: user.username });

    const handleRoomJoined = ({ players: joinedPlayers, yourColor }) => {
      setPlayers(Array.isArray(joinedPlayers) ? joinedPlayers : []);

      // Attribue la couleur uniquement si pas encore défini
      setColor((prev) => {
        if (prev) return prev;
        // si ton serveur envoie yourColor, on l'utilise; sinon on garde la logique existante
        if (yourColor) return yourColor;
        const usernames = (joinedPlayers || []).map((p) => p.username || p);
        const isWhite = usernames[0] === user.username;
        return isWhite ? "white" : "black";
      });
    };

    const handlePlayerUpdate = ({ players: updated }) => {
      setPlayers(Array.isArray(updated) ? updated : []);
    };

    const handleMove = (moveObj) => {
      const move = moveObj?.move || moveObj; // compat ancienne signature
      if (!move || !move.from || !move.to) {
        console.warn("[WS] Move reçu invalide", moveObj);
        return;
      }
      boardRef.current?.applyMove(move);
    };

    on("room_joined", handleRoomJoined);
    on("room_player_update", handlePlayerUpdate); // utile si un joueur (re)joint
    on("move_piece", handleMove);

    return () => {
      emit("leave_room", { roomId });
      off("room_joined", handleRoomJoined);
      off("room_player_update", handlePlayerUpdate);
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
        <div className="text-lg">
          Joueurs : {players.map((p) => p.username ?? String(p)).join(", ")}
        </div>
        <div className="text-2xl">
          {color === "black" ? <span>⚫</span> : <span>⚪</span>}
        </div>
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
