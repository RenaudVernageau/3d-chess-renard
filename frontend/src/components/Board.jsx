// src/components/Board.jsx
import React, {
  useState,
  useMemo,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
  Suspense,
} from "react";
import { useSpring, a } from "@react-spring/three";
import useChess from "../hooks/useChess";
import Pieces from "./Pieces.jsx";
import AnimatedPiece from "./AnimatedPieces.jsx";
import Lights from "../experience/Lights.jsx";

const moveSelfUrl = "/sounds/move-self.mp3";
const moveCheckUrl = "/sounds/move-check.mp3";
const captureUrl = "/sounds/capture.mp3";
const castleUrl = "/sounds/castle.mp3";
const gameEndUrl = "/sounds/game-end.mp3";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const lightColor = "#c4c0bd";
const darkColor = "#2e2b2a";

const getSquare = (r, c) => FILES[c] + (8 - r);
const squareToPosition = (square) => {
  const file = square[0];
  const rank = parseInt(square[1], 10);
  const col = FILES.indexOf(file);
  const row = 8 - rank;
  return [col - 3.5, 0.12, row - 3.5];
};

export default forwardRef(function Board({ socket, roomId, color }, ref) {
  const { board, positions, lastMove, move, getLegalMoves, turn, gameOver } =
    useChess();
  const [selected, setSelected] = useState(null);

  // ✅ Interpréteur pour appliquer un move WebSocket
  // Accepte { from, to } OU { move: { from, to } }
  const applyMove = useCallback(
    (payload) => {
      const m = payload?.move ?? payload;
      const from = m?.from;
      const to = m?.to;

      if (!from || !to) {
        console.warn("[Board] ❌ Move incomplet ou invalide:", payload);
        return;
      }

      // Applique le coup côté client
      try {
        move({ from, to });
      } catch (e) {
        console.warn("[Board] move() a rejeté le coup:", { from, to }, e);
      }
    },
    [move]
  );

  // Expose la méthode à l’extérieur via la ref
  useImperativeHandle(ref, () => ({ applyMove }));

  // 🔊 Sons
  const moveSelfSound = useMemo(() => new Audio(moveSelfUrl), []);
  const moveCheckSound = useMemo(() => new Audio(moveCheckUrl), []);
  const captureSound = useMemo(() => new Audio(captureUrl), []);
  const castleSound = useMemo(() => new Audio(castleUrl), []);
  const gameEndSound = useMemo(() => new Audio(gameEndUrl), []);

  useEffect(() => {
    if (!lastMove) return;
    try {
      if (lastMove.san?.includes("+")) moveCheckSound.play();
      else if (lastMove.flags?.includes("c") || lastMove.flags?.includes("e"))
        captureSound.play();
      else if (lastMove.flags?.includes("k") || lastMove.flags?.includes("q"))
        castleSound.play();
      else moveSelfSound.play();
    } catch {
      /* ignore autoplay restrictions */
    }
  }, [lastMove, moveCheckSound, captureSound, castleSound, moveSelfSound]);

  useEffect(() => {
    if (gameOver) {
      try {
        gameEndSound.play();
      } catch {}
    }
  }, [gameOver, gameEndSound]);

  const legal = useMemo(
    () => (selected ? getLegalMoves(selected) : []),
    [selected, getLegalMoves]
  );

  const handleClick = useCallback(
    (r, c) => {
      // Respect du tour local
      const myTurn = color === "white" ? "w" : "b";
      if (turn !== myTurn) return;

      const sq = getSquare(r, c);
      const piece = board[r][c];

      // Sélection de ses propres pièces
      if (!selected) {
        if (piece && piece.color === myTurn) {
          setSelected(sq);
        }
        return;
      }

      // Désélection
      if (sq === selected) {
        setSelected(null);
        return;
      }

      // Coup légal (move ou capture)
      if (legal.includes(sq)) {
        // Applique localement
        try {
          move({ from: selected, to: sq });
        } catch (e) {
          console.warn("[Board] move() local a échoué:", { from: selected, to: sq }, e);
          setSelected(null);
          return;
        }

        // Diffuse via WS
        if (socket && roomId) {
          const payload = { roomId, move: { from: selected, to: sq }, color };
          // console.log("[Board] emit move_piece", payload);
          socket.emit("move_piece", payload);
        }
      }

      setSelected(null);
    },
    [board, selected, legal, move, turn, socket, roomId, color]
  );

  // Mise en évidence du roi en échec
  const isCheck = lastMove?.san?.includes("+");
  const checkSquare = useMemo(() => {
    if (!isCheck) return null;
    const opponent = lastMove.color === "w" ? "b" : "w";
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p?.type === "k" && p.color === opponent) {
          return getSquare(r, c);
        }
      }
    }
    return null;
  }, [isCheck, lastMove, board]);

  const { scale: checkScale } = useSpring({
    to: { scale: isCheck ? 1.1 : 0 },
    from: { scale: 0 },
    reset: true,
    loop: isCheck,
    config: { duration: 800 },
  });

  return (
    <group>
      <Lights />

      <mesh receiveShadow position={[0, -0.16, 0]}>
        <boxGeometry args={[8.4, 0.3, 8.4]} />
        <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.8} />
      </mesh>

      {board.map((rowArr, r) =>
        rowArr.map((_, c) => {
          const sq = getSquare(r, c);
          const dark = (r + c) % 2 === 1;
          let col = dark ? darkColor : lightColor;
          if (sq === selected) col = "#f7e26b";
          else if (legal.includes(sq)) col = rowArr[c] ? "#ff6b6b" : "#f7e26b";
          return (
            <mesh
              key={`${r}-${c}`}
              position={[c - 3.5, 0, r - 3.5]}
              onClick={() => handleClick(r, c)}
              receiveShadow
              castShadow
            >
              <boxGeometry args={[1, 0.2, 1]} />
              <meshStandardMaterial color={col} />
            </mesh>
          );
        })
      )}

      {checkSquare && (
        <a.mesh position={squareToPosition(checkSquare)} scale={checkScale}>
          <torusGeometry args={[0.7, 0.05, 16, 100]} />
          <meshStandardMaterial
            color="red"
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </a.mesh>
      )}

      {positions.map((p, i) => {
        const sq = getSquare(p.y, p.x);
        return (
          <Suspense key={i} fallback={null}>
            {lastMove?.to === sq ? (
              <AnimatedPiece from={lastMove.from} to={lastMove.to}>
                <Pieces
                  type={p.type}
                  color={p.color}
                  position={[p.x - 3.5, 0, p.y - 3.5]}
                  rotation={[0, -Math.PI / 2, 0]}
                />
              </AnimatedPiece>
            ) : (
              <Pieces
                type={p.type}
                color={p.color}
                position={[p.x - 3.5, 0, p.y - 3.5]}
                rotation={[0, -Math.PI / 2, 0]}
              />
            )}
          </Suspense>
        );
      })}
    </group>
  );
});
