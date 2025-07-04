// src/hooks/useChess.jsx
import { useMemo, useRef } from 'react'
import { Chess } from 'chess.js'

const TYPE_MAP = {
  p: 'pawn',
  r: 'rook',
  n: 'knight',
  b: 'bishop',
  q: 'queen',
  k: 'king',
}

export default function useChess() {
  // Instance persistante de chess.js
  const chessRef = useRef(new Chess())
  const chess = chessRef.current

  // positions initiales et mises à jour si on bouge plus tard
  const positions = useMemo(() => {
    return chess
      .board()        // Array[8][8]
      .flat()         // 64 éléments
      .map((p, idx) => {
        if (!p) return null
        const x = idx % 8
        const y = Math.floor(idx / 8)
        return {
          type:  TYPE_MAP[p.type],
          color: p.color,
          x, y
        }
      })
      .filter(Boolean)
  }, [chess])

  return { positions, chess }
}
