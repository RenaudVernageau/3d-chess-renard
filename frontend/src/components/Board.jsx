// src/components/Board.jsx
import React, { useState, useMemo, useCallback, Suspense } from 'react'
import { OrbitControls } from '@react-three/drei'
import Lights from '../experience/Lights'
import useChess from '../hooks/useChess'
import Pieces from './Pieces.jsx'
import AnimatedPiece from './AnimatedPieces.jsx'

const FILES = ['a','b','c','d','e','f','g','h']
const getSquare = (r, c) => FILES[c] + (8 - r)

const lightColor = '#eeeed2'
const darkColor  = '#769656'

export default function Board() {
  const { board, positions, lastMove, move, getLegalMoves } = useChess()
  const [selected, setSelected] = useState(null)

  // Cases vers lesquelles on peut bouger depuis `selected`
  const legal = useMemo(
    () => selected ? getLegalMoves(selected) : [],
    [selected, getLegalMoves]
  )

  const handleClick = useCallback((r, c) => {
    const sq    = getSquare(r, c)
    const piece = board[r][c]

    if (!selected) {
      // Sélection d’une pièce
      if (piece) setSelected(sq)
      return
    }
    if (sq === selected) {
      // Désélection
      setSelected(null)
      return
    }
    // Jouer le coup si légal
    if (legal.includes(sq)) {
      move({ from: selected, to: sq })
    }
    setSelected(null)
  }, [board, selected, legal, move])

  return (
    <group>
      {/* Caméra + contrôles */}
      <OrbitControls
        makeDefault
        minPolarAngle={Math.PI/6}
        maxPolarAngle={Math.PI/2}
        enablePan={false}
      />
      <Lights />

      {/* Socle sous le plateau */}
      <mesh receiveShadow position={[0, -0.16, 0]}>
        <boxGeometry args={[8.8, 0.3, 8.8]} />
        <meshStandardMaterial color="#1a1818" />
      </mesh>

      {/* 1) Le damier cliquable */}
      {board.map((rowArr, r) =>
        rowArr.map((_, c) => {
          const sq        = getSquare(r, c)
          const isDark    = (r + c) % 2 === 1
          const highlight = sq === selected
          const canMove   = legal.includes(sq)
          let squareColor = isDark ? darkColor : lightColor
          if (highlight) squareColor = '#f7e26b'
          else if (canMove) squareColor = rowArr[c] 
            ? '#ff6b6b'  // capture
            : '#f7e26b'  // simple déplacement

          return (
            <mesh
              key={`square-${r}-${c}`}
              position={[c - 3.5, 0, r - 3.5]}
              receiveShadow
              castShadow
              onClick={() => handleClick(r, c)}
            >
              <boxGeometry args={[1, 0.2, 1]} />
              <meshStandardMaterial color={squareColor} />
            </mesh>
          )
        })
      )}

      {/* 2) Les pièces (flat list via positions) */}
      {positions.map((p,i) => {
        const sq = getSquare(p.y, p.x)
        return (
          <Suspense key={i} fallback={null}>
            {lastMove?.to === sq ? (
              <AnimatedPiece from={lastMove.from} to={lastMove.to}>
                <Pieces
                  type={p.type}
                  color={p.color}
                  position={[p.x - 3.5, 0, p.y - 3.5]}
                  rotation={[0, -Math.PI/2, 0]}
                />
              </AnimatedPiece>
            ) : (
              <Pieces
                type={p.type}
                color={p.color}
                position={[p.x - 3.5, 0, p.y - 3.5]}
                rotation={[0, -Math.PI/2, 0]}
              />
            )}
          </Suspense>
        )
      })}
    </group>
  )
}
