// src/experience/Experience.jsx
import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import useWebSocket from "../hooks/useWebSocket";
import Controls from "./Controls.jsx";
import Lights from "./Lights.jsx";
import Board from "../components/Board.jsx";
import { useGameUiStore } from "../store/useGameUiStore";

export default function Experience() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const { socket, connected, emit, on, off } = useWebSocket(user?.token);

  // players peut être un tableau d'objets [{id, username, color}] ou d'anciens strings
  const [players, setPlayers] = useState([]);
  const [color, setColor] = useState(null); // "white" | "black"
  const [copied, setCopied] = useState(false);
  const boardRef = useRef(null);

  // Actions store global pour NavBar (roomId & color)
  const setGameUi   = useGameUiStore((s) => s.setGameUi);
  const clearGameUi = useGameUiStore((s) => s.clearGameUi);

  useEffect(() => {
    if (!roomId || !connected || !socket) return;

    // Publie la room dans le store (NavBar)
    setGameUi({ currentRoomId: roomId });

    // Rejoindre la room
    emit("join_room", { roomId, username: user.username });

    // Normalise un tableau de joueurs en noms pour fallback "premier = blanc"
    const toNames = (arr) =>
      (Array.isArray(arr) ? arr : []).map((p) =>
        typeof p === "string" ? p : p?.username
      );

    // Créateur (certains flux envoient cet event)
    const handleRoomCreated = ({ players: createdPlayers, yourColor }) => {
      setPlayers(Array.isArray(createdPlayers) ? createdPlayers : []);
      setColor((prev) => {
        if (yourColor) return yourColor;
        if (prev) return prev;
        const names = toNames(createdPlayers);
        const isWhite = names[0] === user.username;
        return isWhite ? "white" : "black";
      });
    };

    // Join / rejoin
    const handleRoomJoined = ({ players: joinedPlayers, yourColor }) => {
      setPlayers(Array.isArray(joinedPlayers) ? joinedPlayers : []);
      setColor((prev) => {
        if (yourColor) return yourColor;
        if (prev) return prev;
        const names = toNames(joinedPlayers);
        const isWhite = names[0] === user.username;
        return isWhite ? "white" : "black";
      });
    };

    // Mise à jour liste joueurs (quand un autre (re)joint)
    const handlePlayerUpdate = ({ players: updatedPlayers }) => {
      setPlayers(Array.isArray(updatedPlayers) ? updatedPlayers : []);
    };

    // ✅ Accepte { move, color } OU directement move
    const handleMove = (payload) => {
      const m = payload?.move ?? payload;
      if (!m || !m.from || !m.to) {
        console.warn("[WS] Move reçu invalide:", payload);
        return;
      }
      boardRef.current?.applyMove(m);
    };

    on("room_created", handleRoomCreated);
    on("room_joined", handleRoomJoined);
    on("room_player_update", handlePlayerUpdate);
    on("move_piece", handleMove);

    return () => {
      // Optionnel si tu gères un leave côté serveur
      emit("leave_room", { roomId });
      off("room_created", handleRoomCreated);
      off("room_joined", handleRoomJoined);
      off("room_player_update", handlePlayerUpdate);
      off("move_piece", handleMove);
      clearGameUi(); // nettoie NavBar (plus de room en cours)
    };
  }, [roomId, connected, socket, emit, on, off, user?.username, setGameUi, clearGameUi]);

  // Quand la couleur est connue, publie dans le store pour NavBar
  useEffect(() => {
    if (color) setGameUi({ myColor: color });
  }, [color, setGameUi]);

  if (!roomId) return <Navigate to="/lobby" replace />;
  if (!connected || !color) {
    return (
      <div className="p-4 text-center text-white bg-black">
        Connexion à la partie <strong>{roomId}</strong>…
      </div>
    );
  }

  // Affichage propre des joueurs (compat objets / strings)
  const playersLabel = (players || [])
    .map((p) => (typeof p === "string" ? p : p?.username))
    .join(", ");

  return (
    <div className="flex flex-col w-full h-screen bg-black">
      <header className="flex items-center justify-between px-6 py-4 text-white">
        <div className="text-lg">Joueurs : {playersLabel}</div>
        <div className="text-2xl">{color === "black" ? "⚫" : "⚪"}</div>
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
            <Board ref={boardRef} socket={socket} roomId={roomId} color={color} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
