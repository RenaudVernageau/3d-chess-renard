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
        if (m.captured && m.captured !== "k") {
          applyCapture({
            by: m.color, // 'w' | 'b' = qui a capturé
            piece: m.captured,
            from: m.from,
            to: m.to,
          });
        }
        sync(m);
        return m;
      } else {
        return null;
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

  /**
   * Détermine précisément la raison de fin avec chess.js v10
   * reasons: 'checkmate' | 'stalemate' | 'threefold_repetition' | 'insufficient_material' | 'fifty_move_rule' | 'draw'
   */
  const getEndStatus = useCallback(() => {
    if (!chess.isGameOver()) return { over: false };

    if (chess.isCheckmate()) {
      // Après un coup légal, chess.turn() = camp qui DOIT jouer (donc le perdant)
      const loser = chess.turn(); // 'w' | 'b'
      const winner = loser === "w" ? "black" : "white";
      return { over: true, reason: "checkmate", winner };
    }

    if (chess.isStalemate())            return { over: true, reason: "stalemate" };
    if (chess.isThreefoldRepetition())  return { over: true, reason: "threefold_repetition" };
    if (chess.isInsufficientMaterial()) return { over: true, reason: "insufficient_material" };

    // Si on est en nulle mais pas les cas ci-dessus, c’est (quasi) la règle des 50 coups
    if (chess.isDraw())                 return { over: true, reason: "fifty_move_rule" };

    return { over: true, reason: "draw" }; // fallback
  }, [chess]);

  return {
    board,
    positions,
    lastMove,
    move,
    getLegalMoves,
    turn,
    gameOver,
    getEndStatus, // ⬅️ exporté
  };
}
