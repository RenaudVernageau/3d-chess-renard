// src/hooks/useChess.jsx
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Chess } from "chess.js";
import { useGameUiStore } from "../store/useGameUiStore";

const TYPE_MAP = {
  p: "pawn",
  r: "rook",
  n: "knight",
  b: "bishop",
  q: "queen",
  k: "king",
};

export default function useChess() {
  // Instance persistante de chess.js
  const chessRef = useRef(new Chess());
  const chess = chessRef.current;

  // accès direct au store (on évite de redéclarer des setters dans la boucle)
  const applyCapture = useGameUiStore((s) => s.applyCapture);
  const resetCaptures = useGameUiStore((s) => s.resetCaptures);

  // State React pour board 2D et dernier coup
  const [board, setBoard] = useState(chess.board());
  const [lastMove, setLastMove] = useState(null);

  // Synchronisation du state à partir de chess.js
  const sync = useCallback(
    (move) => {
      setBoard(chess.board());
      setLastMove(move || null);
    },
    [chess]
  );

  // Fonction pour jouer un coup et synchroniser
  const move = useCallback(
    ({ from, to, promotion }) => {
      const moveConfig = { from, to };
      // promotions rapides (si ton UI ne gère pas encore la sélection)
      if (promotion) moveConfig.promotion = promotion;
      else if (from[1] === "7" && to[1] === "8") moveConfig.promotion = "q";
      else if (from[1] === "2" && to[1] === "1") moveConfig.promotion = "q";

      const m = chess.move(moveConfig); // m est "verbose" par défaut avec chess.js v10+
      if (m) {
        // Détection capture côté client (V1)
        // m.captured ∈ {'p','n','b','r','q','k'} si capture
        if (m.captured && m.captured !== "k") {
          // m.color = 'w'|'b' pour le côté qui a JOUÉ (donc qui a capturé)
          applyCapture({
            by: m.color,
            piece: m.captured,
            from: m.from,
            to: m.to,
          });
        }
        sync(m);
        return m; // 🔁 retourne le coup joué
      } else {
        return null; // 🔁 explicite quand le coup est invalide
      }
    },
    [chess, sync, applyCapture]
  );

  // Helper pour récupérer les coups légaux d’une case
  const getLegalMoves = useCallback(
    (square) => {
      return chess.moves({ square, verbose: true }).map((m) => m.to);
    },
    [chess]
  );

  // Au montage, on reset l’échiquier et les captures locales
  useEffect(() => {
    chess.reset();
    resetCaptures();
    sync(null);
  }, [chess, sync, resetCaptures]);

  // Positions flat pour affichage
  const positions = useMemo(
    () =>
      board
        .flatMap((rowArr, row) =>
          rowArr.map((p, col) =>
            p
              ? { type: TYPE_MAP[p.type], color: p.color, x: col, y: row }
              : null
          )
        )
        .filter(Boolean),
    [board]
  );

  // Fin de partie ?
  const gameOver = chess.isGameOver();

  // Whose turn is it? "w" or "b"
  const turn = chess.turn();

  return {
    board,
    positions,
    lastMove,
    move,
    getLegalMoves,
    turn,
    gameOver,
  };
}
