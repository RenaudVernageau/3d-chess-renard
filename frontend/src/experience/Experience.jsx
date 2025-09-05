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

    // ——— Handlers ———

    const handleRoomCreated = ({ players: createdPlayers, yourColor, activeColor }) => {
      publishPlayers(createdPlayers);

      // Déterminer MA couleur (source prioritaire: yourColor)
      const names = toNames(createdPlayers);
      const fallback = names[0] === user.username ? "white" : "black";
      const myColor = yourColor || fallback;

      setColor((prev) => prev || myColor);
      setGameUi({ myColor: myColor });

      // Initialiser l'indication de tour si fournie par le serveur
      if (activeColor === "white" || activeColor === "black") {
        setGameUi({ turnColor: activeColor, myTurn: myColor === activeColor });
      }
    };

    const handleRoomJoined = ({ players: joinedPlayers, yourColor, activeColor }) => {
      publishPlayers(joinedPlayers);

      const names = toNames(joinedPlayers);
      const fallback = names[0] === user.username ? "white" : "black";
      const myColor = yourColor || fallback;

      setColor((prev) => prev || myColor);
      setGameUi({ myColor: myColor });

      if (activeColor === "white" || activeColor === "black") {
        setGameUi({ turnColor: activeColor, myTurn: myColor === activeColor });
      }
    };

    const handlePlayerUpdate = ({ players: updatedPlayers }) => {
      publishPlayers(updatedPlayers);
    };

    // Accepte { move, color } ou move direct (on NE toggle PAS le tour ici)
    const handleMove = (payload) => {
      const m = payload?.move ?? payload;
      if (!m || !m.from || !m.to) return;
      boardRef.current?.applyMove(m);
    };

    // MAJ du tour côté serveur
    const handleTurnUpdate = ({ activeColor }) => {
      if (activeColor !== "white" && activeColor !== "black") return;
      const myColorNow = useGameUiStore.getState().myColor || color;
      setGameUi({ turnColor: activeColor, myTurn: myColorNow === activeColor });
    };

    // Adversaire a quitté
    const handlePeerQuit = () => setPeerQuit(true);

    // Gestion erreurs (fallback: créer la room si join_room échoue)
    const handleServerError = (err) => {
      const msg = typeof err === "string" ? err : err?.error;
      if (msg === "Room not found") {
        emit("create_room_with_id", { roomId, username: user.username });
      }
    };

    // 1) Attacher les listeners AVANT d'émettre join_room
    on("room_created", handleRoomCreated);
    on("room_joined", handleRoomJoined);
    on("room_player_update", handlePlayerUpdate);
    on("move_piece", handleMove);
    on("turn_update", handleTurnUpdate);
    on("room_peer_quit", handlePeerQuit);
    on("error", handleServerError);

    // 2) Rejoindre la room
    emit("join_room", { roomId, username: user.username });

    // 3) Sécu (si dispo côté back)
    const safety = setTimeout(() => emit("state_request", { roomId }), 800);

    return () => {
      clearTimeout(safety);
      emit("leave_room", { roomId });

      off("room_created", handleRoomCreated);
      off("room_joined", handleRoomJoined);
      off("room_player_update", handlePlayerUpdate);
      off("move_piece", handleMove);
      off("turn_update", handleTurnUpdate);
      off("room_peer_quit", handlePeerQuit);
      off("error", handleServerError);

      // On garde currentRoomId pour "Resume game" si on quitte la page sans quitter la partie
      setGameUi({ isInGame: false, players: [], myColor: undefined });
    };
  }, [roomId, connected, socket, emit, on, off, user?.username, setGameUi, color]);

  // Publie la couleur (pour l'icône ⚪/⚫ de la NavBar si set ailleurs)
  useEffect(() => {
    if (color) setGameUi({ myColor: color });
  }, [color, setGameUi]);

  // Rejoindre si l’onglet redevient visible (cas iOS/suspension)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (roomId && socket) {
        emit("join_room", { roomId, username: user.username });
        // Optionnel: resync d'état si supporté
        emit("state_request", { roomId });
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
      turnColor: undefined,
      myTurn: undefined,
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
                turnColor: undefined,
                myTurn: undefined,
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
