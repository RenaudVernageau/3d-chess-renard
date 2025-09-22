// src/experience/Experience.jsx
import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import useWebSocket from "../hooks/useWebSocket";
import Controls from "./Controls.jsx";
import Lights from "./Lights.jsx";
import Board from "../components/Board.jsx";
import MaterialPill from "../components/MaterialPill";
import { useGameUiStore } from "../store/useGameUiStore";

export default function Experience() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, connected, emit, on, off } = useWebSocket(user?.token);

  const [players, setPlayers] = useState([]);
  const [color, setColor] = useState(null);
  const [peerQuit, setPeerQuit] = useState(false);
  const [gameOver, setGameOver] = useState(null);
  const boardRef = useRef(null);

  const setGameUi   = useGameUiStore((s) => s.setGameUi);
  const leaveGame   = useGameUiStore((s) => s.leaveGame);
  const [quitting, setQuitting] = useState(false);

  const [rematchIncoming, setRematchIncoming] = useState(null);
  const [rematchPending, setRematchPending] = useState(false);
  const rematchTimerRef = useRef(null);

  const listenersAttached = useRef(false);
  const joinedOnceForRoom = useRef(false);
  const lastStateReqAt = useRef(0);
  const lastAppliedMoveCount = useRef(0);

  useEffect(() => {
    if (!roomId) return;
    setGameUi({ currentRoomId: roomId, isInGame: true });
    return () => {
      // On ne met PAS isInGame=false ici (sinon la bannière disparaît en changeant de page)
      lastAppliedMoveCount.current = 0;
    };
  }, [roomId, setGameUi]);

  const toNames = (arr) =>
    (Array.isArray(arr) ? arr : []).map((p) =>
      typeof p === "string" ? p : p?.username
    );

  const publishPlayers = (arr) => {
    setPlayers(arr);
    setGameUi({ players: toNames(arr) });
  };

  const sideToHumanColor = (side) =>
    side === "w" ? "white" : side === "b" ? "black" : undefined;

  useEffect(() => {
    if (!roomId || !connected || !socket) return;

    if (listenersAttached.current) {
      if (!joinedOnceForRoom.current) {
        emit("join_room", { roomId, username: user.username });
        joinedOnceForRoom.current = true;
        const now = Date.now();
        if (now - lastStateReqAt.current > 800) {
          emit("state_request", { roomId });
          lastStateReqAt.current = now;
        }
      }
      return;
    }

    const handleRoomCreated = ({ players: createdPlayers, yourColor, activeColor }) => {
      publishPlayers(createdPlayers);
      const names = toNames(createdPlayers);
      const fallback = names[0] === user.username ? "white" : "black";
      const myColor = yourColor || fallback;
      setColor((prev) => prev || myColor);
      setGameUi({ myColor: myColor });
      if (activeColor === "white" || "black") {
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
      if (activeColor === "white" || "black") {
        setGameUi({ turnColor: activeColor, myTurn: myColor === activeColor });
      }
    };

    const handlePlayerUpdate = ({ players: updatedPlayers }) => {
      publishPlayers(updatedPlayers);
    };

    const handleMove = (payload) => {
      const m = payload?.move ?? payload;
      if (!m || !m.from || !m.to) return;
      boardRef.current?.applyMove(m);
      lastAppliedMoveCount.current = lastAppliedMoveCount.current + 1;
    };

    const handleTurnUpdate = ({ activeColor }) => {
      if (activeColor !== "white" && activeColor !== "black") return;
      const myColorNow = useGameUiStore.getState().myColor || color;
      setGameUi({ turnColor: activeColor, myTurn: myColorNow === activeColor });
    };

    const handlePeerQuit = () => setPeerQuit(true);

    const handleServerError = (err) => {
      const msg = typeof err === "string" ? err : err?.error;
      if (msg === "Room not found") {
        emit("create_room_with_id", { roomId, username: user.username });
      }
    };

    const handleStateSync = (state) => {
      try {
        const moves = Array.isArray(state?.moves) ? state.moves : [];
        const fen = typeof state?.fen === "string" ? state.fen : null;

        if (fen && typeof boardRef.current?.loadFen === "function") {
          boardRef.current.loadFen(fen);
          lastAppliedMoveCount.current = moves.length;
          if (state?.turn) {
            const active = sideToHumanColor(state.turn);
            const myColorNow = useGameUiStore.getState().myColor || color;
            if (active) setGameUi({ turnColor: active, myTurn: myColorNow === active });
          }
          return;
        }
        const already = lastAppliedMoveCount.current || 0;
        if (moves.length > already && boardRef.current?.applyMove) {
          for (let i = already; i < moves.length; i++) {
            const m = moves[i];
            if (m && m.from && m.to) {
              boardRef.current.applyMove(m);
            }
          }
          lastAppliedMoveCount.current = moves.length;
        }
      } catch (e) {
        console.warn("[WS] state_sync apply error:", e);
      }
    };

    const handleGameSnapshot = (snap) => {
      try {
        const fen = typeof snap?.fen === "string" ? snap.fen : null;
        if (fen && typeof boardRef.current?.loadFen === "function") {
          boardRef.current.loadFen(fen);
        }
        if (snap?.turn) {
          const active = sideToHumanColor(snap.turn);
          const myColorNow = useGameUiStore.getState().myColor || color;
          if (active) setGameUi({ turnColor: active, myTurn: myColorNow === active });
        }
      } catch (e) {
        console.warn("[WS] game:snapshot apply error:", e);
      }
    };

    const handleGameOverServer = (payload) => {
      setGameOver(payload || { reason: "unknown", winner: null });
    };

    // ===== Rematch =====
    const handleRematchIncoming = (p) => {
      if (p?.toUserId !== user?.id && String(p?.toUserId) !== String(user?.id)) return;
      setRematchIncoming(p);
      clearTimeout(rematchTimerRef.current);
      rematchTimerRef.current = setTimeout(() => setRematchIncoming(null), 30000);
    };

    const handleRematchAccepted = ({ newRoomId }) => {
      setRematchPending(false);
      setRematchIncoming(null);
      if (newRoomId) {
        navigate(`/play/${newRoomId}?rematch=1`, { replace: true });
      }
    };

    const handleRematchDeclined = () => {
      setRematchPending(false);
      setRematchIncoming(null);
    };

    const handleRematchCancelled = () => {
      setRematchPending(false);
      setRematchIncoming(null);
    };

    on("room_created", handleRoomCreated);
    on("room_joined", handleRoomJoined);
    on("room_player_update", handlePlayerUpdate);
    on("move_piece", handleMove);
    on("turn_update", handleTurnUpdate);
    on("room_peer_quit", handlePeerQuit);
    on("state_sync", handleStateSync);
    on("game:snapshot", handleGameSnapshot);
    on("game_over", handleGameOverServer);
    on("error", handleServerError);

    on("rematch:incoming", handleRematchIncoming);
    on("rematch:accepted", handleRematchAccepted);
    on("rematch:declined", handleRematchDeclined);
    on("rematch:cancelled", handleRematchCancelled);

    listenersAttached.current = true;

    if (!joinedOnceForRoom.current) {
      emit("join_room", { roomId, username: user.username });
      joinedOnceForRoom.current = true;
      const now = Date.now();
      if (now - lastStateReqAt.current > 800) {
        emit("state_request", { roomId });
        lastStateReqAt.current = now;
      }
    }

    return () => {
      emit("leave_room", { roomId });
      off("room_created", handleRoomCreated);
      off("room_joined", handleRoomJoined);
      off("room_player_update", handlePlayerUpdate);
      off("move_piece", handleMove);
      off("turn_update", handleTurnUpdate);
      off("room_peer_quit", handlePeerQuit);
      off("state_sync", handleStateSync);
      off("game:snapshot", handleGameSnapshot);
      off("game_over", handleGameOverServer);
      off("error", handleServerError);

      off("rematch:incoming", handleRematchIncoming);
      off("rematch:accepted", handleRematchAccepted);
      off("rematch:declined", handleRematchDeclined);
      off("rematch:cancelled", handleRematchCancelled);

      listenersAttached.current = false;
      joinedOnceForRoom.current = false;
      clearTimeout(rematchTimerRef.current);
    };
  }, [roomId, connected, socket, emit, on, off, user?.username, user?.id, setGameUi, color, navigate]);

  useEffect(() => {
    if (color) setGameUi({ myColor: color });
  }, [color, setGameUi]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!roomId || !socket) return;
      joinedOnceForRoom.current = false;
      const now = Date.now();
      if (now - lastStateReqAt.current > 800) {
        emit("state_request", { roomId });
        lastStateReqAt.current = now;
      }
      emit("join_room", { roomId, username: user.username });
      joinedOnceForRoom.current = true;
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

  // Quit propre — on efface l'état AVANT tout et on invalide la session UI
  const handleQuitGame = () => {
    if (quitting) return;
    setQuitting(true);

    try {
      // invalide toute réactivité lobby pendant 1.5s (évite yo-yo)
      localStorage.setItem("ignoreRoomEventsUntil", String(Date.now() + 1500));

      // purge IMMEDIATE de l'état session (coupe NavBar/Resume/etc.)
      leaveGame();

      // notifications serveur (sans risque de rejoin côté client)
      if (roomId) {
        emit("room_quit", { roomId });
        emit("leave_room", { roomId });
      }
    } catch (_) {}

    clearTimeout(rematchTimerRef.current);

    // Redirection + reset du flag hasQuit pour permettre de recréer/rejoindre ensuite
    navigate("/lobby", { replace: true });
    setTimeout(() => useGameUiStore.setState({ hasQuit: false }), 50);
  };

  const handleGameOverLocal = (payload) => {
    setGameOver(payload || { reason: "unknown", winner: null });
  };

  const opponent = players.find((p) => String(p?.id) !== String(user?.id));
  const opponentId = opponent?.id;

  const rematchPrompt = rematchIncoming ? (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[92%] max-w-md rounded-2xl bg-stone-900 border border-stone-700 p-6 text-stone-100 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Rejouer une partie ?</h3>
        <p className="text-stone-300 mb-5">
          {players.find(p => String(p.id) === String(rematchIncoming.fromUserId))?.username || "Votre adversaire"} vous propose un rematch.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              emit("rematch:decline", { roomId, fromUserId: rematchIncoming.fromUserId, toUserId: user.id });
              setRematchIncoming(null);
            }}
            className="rounded-lg bg-stone-700 hover:bg-stone-600 active:scale-95 px-4 py-2 text-white transition"
          >
            Refuser
          </button>
          <button
            onClick={() => {
              emit("rematch:accept", { roomId, fromUserId: rematchIncoming.fromUserId, toUserId: user.id });
              setRematchIncoming(null);
            }}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 px-4 py-2 text-white transition"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const peerQuitModal = peerQuit ? (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[90%] max-w-md rounded-2xl bg-stone-900 border border-stone-700 p-6 text-stone-100 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Votre adversaire a quitté la partie</h3>
        <p className="text-stone-300 mb-5">
          La partie est terminée. Vous allez être redirigé vers le menu.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={handleQuitGame}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 px-4 py-2 text-white transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const gameOverModal = gameOver ? (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[92%] max-w-md rounded-2xl bg-stone-900 border border-stone-700 p-6 text-stone-100 shadow-xl">
        <h3 className="text-xl font-semibold mb-2">
          {gameOver.reason === "checkmate"
            ? "Échec et mat"
            : gameOver.reason === "stalemate"
            ? "Pat"
            : gameOver.reason === "threefold_repetition"
            ? "Nulle par triple répétition"
            : gameOver.reason === "fifty_move_rule"
            ? "Nulle (règle des 50 coups)"
            : gameOver.reason === "insufficient_material"
            ? "Nulle (matériel insuffisant)"
            : "Match nul"}
        </h3>

        <p className="text-stone-300 mb-5">
          {gameOver.winner
            ? `Victoire des ${gameOver.winner === "white" ? "Blancs" : "Noirs"}.`
            : "Merci d’avoir joué !"}
        </p>

        <div className="flex justify-between gap-3">
          {/* Rejouer */}
          <div className="flex items-center gap-2">
            {opponentId ? (
              rematchPending ? (
                <button
                  onClick={() => {
                    emit("rematch:cancel", { roomId, fromUserId: user.id, toUserId: opponentId });
                    setRematchPending(false);
                  }}
                  className="rounded-lg bg-stone-700 hover:bg-stone-600 active:scale-95 px-3 py-2 text-white transition"
                  title="Annuler la proposition"
                >
                  Annuler…
                </button>
              ) : (
                <button
                  onClick={() => {
                    emit("rematch:request", { roomId, fromUserId: user.id, toUserId: opponentId });
                    setRematchPending(true);
                  }}
                  className="rounded-lg bg-green-600 hover:bg-green-700 active:scale-95 px-3 py-2 text-white transition"
                >
                  Rejouer
                </button>
              )
            ) : null}
          </div>

          {/* Retour menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuitGame}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 px-4 py-2 text-white transition"
            >
              Retour au menu
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const quitButton = (
    <div className="absolute top-2 right-2 z-40">
      <button
        onClick={handleQuitGame}
        disabled={quitting}
        className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 px-3 py-1.5 text-sm text-white shadow transition"
        title="Quitter la partie et revenir au menu"
      >
        {quitting ? "Sortie…" : "Quitter la partie"}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-screen bg-black">
      <div className="flex-1 relative">
        <div className="absolute top-2 left-2 z-40 hidden md:block">
          <MaterialPill />
        </div>
        {quitButton}
        {peerQuitModal}
        {gameOverModal}
        {rematchPrompt}
        <Canvas
          flat
          shadows
          dpr={[1, 1.5]}
          camera={{ fov: 45, near: 0.1, far: 200 }}
          onCreated={({ gl }) => {
            const canvas = gl.getContext()?.canvas || gl.domElement;
            const prevent = (e) => { try { e.preventDefault(); } catch {} };
            canvas?.addEventListener("webglcontextlost", prevent, { passive: false });
          }}
        >
          <Controls isWhite={color === "white"} />
          <Lights />
          <Suspense fallback={null}>
            <Board
              ref={boardRef}
              socket={socket}
              roomId={roomId}
              color={color}
              disabled={!!gameOver}
              onGameOver={handleGameOverLocal}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
