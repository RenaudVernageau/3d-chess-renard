// src/experience/Experience.jsx
import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import useWebSocket from "../hooks/useWebSocket";
import Controls from "./Controls.jsx";
import Lights from "./Lights.jsx";
import Board from "../components/Board.jsx";
import { useGameUiStore } from "../store/useGameUiStore";

export default function Experience() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, connected, emit, on, off } = useWebSocket(user?.token);

  const [players, setPlayers] = useState([]);
  const [color, setColor] = useState(null); // "white" | "black"
  const [peerQuit, setPeerQuit] = useState(false);
  const boardRef = useRef(null);

  const setGameUi = useGameUiStore((s) => s.setGameUi);

  useEffect(() => {
    if (!roomId || !connected || !socket) return;

    // Expose l'ID et l'état "en jeu"
    setGameUi({ currentRoomId: roomId, isInGame: true });

    const toNames = (arr) =>
      (Array.isArray(arr) ? arr : []).map((p) =>
        typeof p === "string" ? p : p?.username
      );

    const publishPlayers = (arr) => {
      const names = toNames(arr);
      setPlayers(arr);
      setGameUi({ players: names });
    };

    const handleRoomCreated = ({ players: createdPlayers, yourColor }) => {
      publishPlayers(createdPlayers);
      setColor((prev) => {
        if (yourColor) return yourColor;
        if (prev) return prev;
        const names = toNames(createdPlayers);
        const isWhite = names[0] === user.username;
        return isWhite ? "white" : "black";
      });
    };

    const handleRoomJoined = ({ players: joinedPlayers, yourColor }) => {
      publishPlayers(joinedPlayers);
      setColor((prev) => {
        if (yourColor) return yourColor;
        if (prev) return prev;
        const names = toNames(joinedPlayers);
        const isWhite = names[0] === user.username;
        return isWhite ? "white" : "black";
      });
    };

    const handlePlayerUpdate = ({ players: updatedPlayers }) => {
      publishPlayers(updatedPlayers);
    };

    // Accepte { move, color } ou move direct
    const handleMove = (payload) => {
      const m = payload?.move ?? payload;
      if (!m || !m.from || !m.to) return;
      boardRef.current?.applyMove(m);
    };

    // Adversaire a quitté
    const handlePeerQuit = () => setPeerQuit(true);

    // ⚠️ Gestion des erreurs serveur (ex: Room not found)
    const handleServerError = (err) => {
      const msg = typeof err === "string" ? err : err?.error;
      if (msg === "Room not found") {
        // ➜ on crée la room avec cet ID puis on rejoindra via room_created
        emit("create_room_with_id", { roomId, username: user.username });
      }
    };

    // 1) Attacher les listeners AVANT d'émettre join_room
    on("room_created", handleRoomCreated);
    on("room_joined", handleRoomJoined);
    on("room_player_update", handlePlayerUpdate);
    on("move_piece", handleMove);
    on("room_peer_quit", handlePeerQuit);
    on("error", handleServerError);

    // 2) Maintenant seulement, rejoindre la room
    emit("join_room", { roomId, username: user.username });

    // 3) Sécu : si rien ne revient, on peut demander un état (si le back supporte)
    const safety = setTimeout(() => emit("state_request", { roomId }), 800);

    return () => {
      clearTimeout(safety);
      emit("leave_room", { roomId });

      off("room_created", handleRoomCreated);
      off("room_joined", handleRoomJoined);
      off("room_player_update", handlePlayerUpdate);
      off("move_piece", handleMove);
      off("room_peer_quit", handlePeerQuit);
      off("error", handleServerError);

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

  // Quitter volontairement
  const handleQuitGame = () => {
    if (roomId) emit("room_quit", { roomId });
    setGameUi({
      currentRoomId: null,
      myColor: undefined,
      players: [],
      isInGame: false,
    });
    navigate("/lobby", { replace: true });
  };

  // Popup "l'adversaire a quitté"
  const peerQuitModal = peerQuit ? (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[90%] max-w-md rounded-2xl bg-stone-900 border border-stone-700 p-6 text-stone-100 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Votre adversaire a quitté la partie</h3>
        <p className="text-stone-300 mb-5">
          La partie est terminée. Vous allez être redirigé vers le menu.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setGameUi({
                currentRoomId: null,
                myColor: undefined,
                players: [],
                isInGame: false,
              });
              navigate("/lobby", { replace: true });
            }}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 px-4 py-2 text-white transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // Bouton "Quitter la partie"
  const quitButton = (
    <div className="absolute top-2 right-2 z-40">
      <button
        onClick={handleQuitGame}
        className="rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 px-3 py-1.5 text-sm text-white shadow transition"
        title="Quitter la partie et revenir au menu"
      >
        Quitter la partie
      </button>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-screen bg-black">
      <div className="flex-1 relative">
        {quitButton}
        {peerQuitModal}
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
