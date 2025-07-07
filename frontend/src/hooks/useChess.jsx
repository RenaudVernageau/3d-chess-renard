// src/hooks/useChess.jsx
import { useRef, useState, useEffect, useMemo, useCallback } from "react"
import { Chess } from "chess.js"

const TYPE_MAP = {
  p: "pawn",
  r: "rook",
  n: "knight",
  b: "bishop",
  q: "queen",
  k: "king",
}

export default function useChess() {
  // Instance persistante de chess.js
  const chessRef = useRef(new Chess())
  const chess = chessRef.current

  // State React pour board 2D et dernier coup
  const [board, setBoard] = useState(chess.board())
  const [lastMove, setLastMove] = useState(null)

  // Synchronisation du state à partir de chess.js
  const sync = useCallback(
    (move) => {
      setBoard(chess.board())
      setLastMove(move || null)
    },
    [chess]
  )

  // Fonction pour jouer un coup et synchroniser
  const move = useCallback(
    ({ from, to }) => {
      const moveConfig = { from, to }
      // promotion uniquement pour pion
      if (from[1] === "7" && to[1] === "8") moveConfig.promotion = "q"
      if (from[1] === "2" && to[1] === "1") moveConfig.promotion = "q"
      const m = chess.move(moveConfig)
      if (m) sync(m)
    },
    [chess, sync]
  )

  // Helper pour récupérer les coups légaux d’une case
  const getLegalMoves = useCallback(
    (square) => {
      return chess.moves({ square, verbose: true }).map((m) => m.to)
    },
    [chess]
  )

  // Au montage, on reset l’échiquier
  useEffect(() => {
    chess.reset()
    sync(null)
  }, [chess, sync])

  // Positions flat pour affichage
  const positions = useMemo(
    () =>
      board.flatMap((rowArr, row) =>
        rowArr.map((p, col) =>
          p
            ? { type: TYPE_MAP[p.type], color: p.color, x: col, y: row }
            : null
        )
      ).filter(Boolean),
    [board]
  )

  // Flag fin de partie (checkmate, draw, stalemate) via méthode à jour
  const gameOver = chess.isGameOver()

  return {
    board,
    positions,
    lastMove,
    move,
    getLegalMoves,
    gameOver,
  }
}
