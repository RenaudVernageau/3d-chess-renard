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
  const [peerQuit, setPeerQuit] = useState(false); // ⬅️ adversaire a quitté
  const boardRef = useRef(null);

  const setGameUi = useGameUiStore((s) => s.setGameUi);
  // on garde clearGameUi commenté pour conserver currentRoomId tant qu'on n'a pas cliqué "Quitter"
  // const clearGameUi = useGameUiStore((s) => s.clearGameUi);

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

    // ⬅️ l'adversaire a quitté : on affiche une popup et on quittera vers le menu
    const handlePeerQuit = () => {
      setPeerQuit(true);
    };

    on("room_created", handleRoomCreated);
    on("room_joined", handleRoomJoined);
    on("room_player_update", handlePlayerUpdate);
    on("move_piece", handleMove);
    on("room_peer_quit", handlePeerQuit);

    return () => {
      emit("leave_room", { roomId });

      off("room_created", handleRoomCreated);
      off("room_joined", handleRoomJoined);
      off("room_player_update", handlePlayerUpdate);
      off("move_piece", handleMove);
      off("room_peer_quit", handlePeerQuit);

      // on garde currentRoomId pour le bouton "Resume game" si on change de page sans quitter
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

  // ⛳️ quitter volontairement : on informe le serveur, on nettoie le store et on retourne lobby
  const handleQuitGame = () => {
    if (roomId) {
      emit("room_quit", { roomId });
    }
    // Nettoie complètement l'état de partie (on ne veut plus "Resume game")
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
              // on quitte nous aussi côté client
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

  // Bouton "Quitter la partie" (overlay en haut à droite)
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
