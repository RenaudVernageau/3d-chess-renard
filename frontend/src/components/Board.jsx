// src/components/Board.jsx
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  Suspense,
  forwardRef,
  useImperativeHandle
} from "react";
import { useSpring, a } from "@react-spring/three";
import Controls from "../experience/Controls";
import Lights from "../experience/Lights";
import useChess from "../hooks/useChess";
import Pieces from "./Pieces.jsx";
import AnimatedPieces from "./AnimatedPieces.jsx";

// Sons (public/sounds/…)
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
  if (!square) return [0, 0, 0];
  const file = square[0];
  const rank = parseInt(square[1], 10);
  const col = FILES.indexOf(file);
  const row = 8 - rank;
  return [col - 3.5, 0.12, row - 3.5];
};

export default forwardRef(function Board({ socket, roomId }, ref) {
  const {
    board,
    positions,
    lastMove,
    move,
    getLegalMoves,
    turn,
    gameOver,
  } = useChess();
  const [selected, setSelected] = useState(null);

  // Expose applyMove for external calls (e.g. from WS)
  useImperativeHandle(ref, () => ({
    applyMove: ({ from, to }) => {
      move({ from, to });
    },
  }));

  // Précharge des sons
  const moveSelfSound = useMemo(() => new Audio(moveSelfUrl), []);
  const moveCheckSound = useMemo(() => new Audio(moveCheckUrl), []);
  const captureSound = useMemo(() => new Audio(captureUrl), []);
  const castleSound = useMemo(() => new Audio(castleUrl), []);
  const gameEndSound = useMemo(() => new Audio(gameEndUrl), []);

  // Joue le son à chaque coup
  useEffect(() => {
    if (!lastMove) return;
    if (lastMove.san?.includes("+")) {
      moveCheckSound.currentTime = 0;
      moveCheckSound.play();
      return;
    }
    const flags = lastMove.flags || "";
    if (flags.includes("c") || flags.includes("e")) {
      captureSound.currentTime = 0;
      captureSound.play();
      return;
    }
    if (flags.includes("k") || flags.includes("q")) {
      castleSound.currentTime = 0;
      castleSound.play();
      return;
    }
    moveSelfSound.currentTime = 0;
    moveSelfSound.play();
  }, [lastMove]);

  // Son de fin de partie
  useEffect(() => {
    if (gameOver) {
      gameEndSound.currentTime = 0;
      gameEndSound.play();
    }
  }, [gameOver]);

  // Coups légaux pour la sélection courante
  const legal = useMemo(
    () => (selected ? getLegalMoves(selected) : []),
    [selected, getLegalMoves]
  );

  // Échec + case du roi adverse
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

  // Animation pulsing pour échec
  const { scale: checkScale } = useSpring({
    to: { scale: isCheck ? 1.1 : 0 },
    from: { scale: 0 },
    reset: true,
    loop: isCheck,
    config: { duration: 800 },
  });

  // Gestion du clic améliorée + émission WS
  const handleClick = useCallback(
    (r, c) => {
      const sq = getSquare(r, c);
      const piece = board[r][c];

      // 1) Si on clique sur l'une de nos pièces
      if (piece && piece.color === turn) {
        setSelected(sq);
        return;
      }

      // 2) Si rien n'est sélectionné
      if (!selected) return;

      // 3) Cliquer sur la même case désélectionne
      if (sq === selected) {
        setSelected(null);
        return;
      }

      // 4) Si c'est un coup légal
      if (legal.includes(sq)) {
        // Appliquer localement
        move({ from: selected, to: sq });
        // Envoyer au serveur pour diffusion
        socket.emit("move_piece", {
          roomId,
          move: { from: selected, to: sq },
        });
      }

      // 5) Toujours désélectionner ensuite
      setSelected(null);
    },
    [board, selected, legal, move, turn, socket, roomId]
  );

  return (
    <group>
      <Controls />
      <Lights />

      {/* Socle sous le plateau */}
      <mesh receiveShadow position={[0, -0.16, 0]}>
        <boxGeometry args={[8.4, 0.3, 8.4]} />
        <meshStandardMaterial
          color="#111111"
          metalness={0.2}
          roughness={0.8}
          envMapIntensity={0.2}
        />
      </mesh>

      {/* Damier */}
      {board.map((rowArr, r) =>
        rowArr.map((_, c) => {
          const sq = getSquare(r, c);
          const isDark = (r + c) % 2 === 1;
          const highlight = sq === selected;
          const canMove = legal.includes(sq);
          let color = isDark ? darkColor : lightColor;
          if (highlight) color = "#f7e26b";
          else if (canMove) color = rowArr[c] ? "#ff6b6b" : "#f7e26b";
          return (
            <mesh
              key={`${r}-${c}`}
              position={[c - 3.5, 0, r - 3.5]}
              receiveShadow
              castShadow
              onClick={() => handleClick(r, c)}
            >
              <boxGeometry args={[1, 0.2, 1]} />
              <meshStandardMaterial color={color} />
            </mesh>
          );
        })
      )}

      {/* Highlight échec */}
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

      {/* Pièces */}
      {positions.map((p, i) => {
        const sq = getSquare(p.y, p.x);
        return (
          <Suspense key={i} fallback={null}>
            {lastMove?.to === sq ? (
              <AnimatedPieces from={lastMove.from} to={lastMove.to}>
                <Pieces
                  type={p.type}
                  color={p.color}
                  position={[p.x - 3.5, 0, p.y - 3.5]}
                  rotation={[0, -Math.PI / 2, 0]}
                />
              </AnimatedPieces>
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
