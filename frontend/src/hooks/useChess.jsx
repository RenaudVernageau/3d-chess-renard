// src/hooks/useChess.jsx
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Chess } from "chess.js";

const TYPE_MAP = {
  p: "pawn",
  r: "rook",
  n: "knight",
  b: "bishop",
  q: "queen",
  k: "king",
};

export default function useChess() {
  // 1️⃣ Instance persistante de chess.js
  const chessRef = useRef(new Chess());
  const chess = chessRef.current;

  // 2️⃣ State React pour board 2D et dernier coup
  const [board, setBoard] = useState(chess.board());
  const [lastMove, setLastMove] = useState(null);

  // 3️⃣ Synchronisation du state à partir de chess.js
  const sync = useCallback(
    (move) => {
      setBoard(chess.board());
      setLastMove(move || null);
    },
    [chess]
  );

  // 4️⃣ Fonction pour jouer un coup et synchroniser
  const move = useCallback(
    ({ from, to }) => {
      // compose l’objet coup de façon conditionnelle
      const moveConfig = { from, to };

      // si c’est un pion qui arrive en promotion (rank 1 ou 8), on ajoute promotion
      if (from[1] === "7" && to[1] === "8") {
        moveConfig.promotion = "q";
      }
      if (from[1] === "2" && to[1] === "1") {
        moveConfig.promotion = "q";
      }
      // utilise moveConfig au lieu d'une promotion forcée
      const m = chess.move(moveConfig);
      if (m) sync(m);
    },
    [chess, sync]
  );

  // 5️⃣ Helper pour récupérer les coups légaux d’une case
  const getLegalMoves = useCallback(
    (square) => {
      return chess.moves({ square, verbose: true }).map((m) => m.to);
    },
    [chess]
  );

  // 6️⃣ Au montage, on reset l’échiquier
  useEffect(() => {
    chess.reset();
    sync(null);
  }, [chess, sync]);

  // 7️⃣ Liste des positions flat pour affichage rapide
  const positions = useMemo(() => {
    return board
      .flatMap((rowArr, row) =>
        rowArr.map((p, col) => {
          if (!p) return null;
          return {
            type: TYPE_MAP[p.type],
            color: p.color,
            x: col,
            y: row,
          };
        })
      )
      .filter(Boolean);
  }, [board]);

  return {
    board,
    positions,
    lastMove,
    move,
    getLegalMoves,
  };
}
