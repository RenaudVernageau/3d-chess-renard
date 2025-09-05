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

  const [players, setPlayers] = useState([]);
  const [color, setColor] = useState(null); // "white" | "black"
  const [turn, setTurn]   = useState("white"); // tour courant
  const boardRef = useRef(null);

  const setGameUi = useGameUiStore((s) => s.setGameUi);
  // const clearGameUi = useGameUiStore((s) => s.clearGameUi);

  // publie (turn,myTurn) vers la NavBar dès qu'on connaît
  useEffect(() => {
    if (!color || !turn) return;
    setGameUi({ turnColor: turn, myTurn: color === turn });
  }, [color, turn, setGameUi]);

  useEffect(() => {
    if (!roomId || !connected || !socket) return;

    // expose l'ID de room et l'état "en jeu"
    setGameUi({ currentRoomId: roomId, isInGame: true });

    // Rejoindre la room
    emit("join_room", { roomId, username: user.username });

    const toNames = (arr) =>
      (Array.isArray(arr) ? arr : []).map((p) =>
        typeof p === "string" ? p : p?.username
      );

    const publishPlayers = (arr) => {
      const names = toNames(arr);
      setPlayers(arr);
      setGameUi({ players: names });
    };

    const handleRoomCreated = ({ players: createdPlayers, yourColor, activeColor }) => {
      publishPlayers(createdPlayers);
      // couleur du joueur
      setColor((prev) => {
        if (yourColor) return yourColor;
        if (prev) return prev;
        const names = toNames(createdPlayers);
        const isWhite = names[0] === user.username;
        return isWhite ? "white" : "black";
      });
      // tour courant si dispo, sinon par défaut "white"
      if (activeColor === "white" || activeColor === "black") setTurn(activeColor);
      else setTurn("white");
    };

    const handleRoomJoined = ({ players: joinedPlayers, yourColor, activeColor }) => {
      publishPlayers(joinedPlayers);
      setColor((prev) => {
        if (yourColor) return yourColor;
        if (prev) return prev;
        const names = toNames(joinedPlayers);
        const isWhite = names[0] === user.username;
        return isWhite ? "white" : "black";
      });
      if (activeColor === "white" || activeColor === "black") setTurn(activeColor);
      else setTurn("white");
    };

    const handlePlayerUpdate = ({ players: updatedPlayers }) => {
      publishPlayers(updatedPlayers);
    };

    // Si le serveur émet explicitement le tour
    const handleTurnUpdate = ({ activeColor }) => {
      if (activeColor === "white" || activeColor === "black") {
        setTurn(activeColor);
      }
    };

    // Accepte { move, color } ou move direct
    const handleMove = (payload) => {
      const m = payload?.move ?? payload;
      if (!m || !m.from || !m.to) return;
      boardRef.current?.applyMove(m);
      // bascule locale du tour (si le serveur n’émet pas turn_update)
      setTurn((prev) => (prev === "white" ? "black" : "white"));
    };

    on("room_created", handleRoomCreated);
    on("room_joined", handleRoomJoined);
    on("room_player_update", handlePlayerUpdate);
    on("turn_update", handleTurnUpdate);     // optionnel, si back l'envoie
    on("move_piece", handleMove);

    return () => {
      emit("leave_room", { roomId });

      off("room_created", handleRoomCreated);
      off("room_joined", handleRoomJoined);
      off("room_player_update", handlePlayerUpdate);
      off("turn_update", handleTurnUpdate);
      off("move_piece", handleMove);

      // on quitte l'état "en jeu", mais on garde currentRoomId pour Resume Game
      setGameUi({ isInGame: false, players: [], myColor: undefined });
    };
  }, [roomId, connected, socket, emit, on, off, user?.username, setGameUi]);

  // Publie la couleur (pour l'icône ⚪/⚫ de la NavBar)
  useEffect(() => {
    if (color) setGameUi({ myColor: color });
  }, [color, setGameUi]);

  // Rejoindre si l’onglet redevient visible (cas iOS/suspension)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (roomId && socket) {
        emit("join_room", { roomId, username: user.username });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [roomId, socket, emit, user?.username]);

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
