// src/components/Board.jsx
import React, { useState, useMemo, useCallback, useEffect, Suspense } from "react"
import { OrbitControls } from "@react-three/drei"
import Lights from "../experience/Lights"
import useChess from "../hooks/useChess"
import Pieces from "./Pieces.jsx"
import AnimatedPiece from "./AnimatedPieces.jsx"

// Préchargement des sons (place tes fichiers dans public/sounds/)
const moveSelfUrl  = "/sounds/move-self.mp3"
const moveCheckUrl = "/sounds/move-check.mp3"
const captureUrl   = "/sounds/capture.mp3"
const castleUrl    = "/sounds/castle.mp3"
const gameEndUrl   = "/sounds/game-end.mp3"

const FILES = ["a","b","c","d","e","f","g","h"]
const getSquare = (r, c) => FILES[c] + (8 - r)

const lightColor = "#eeeed2"
const darkColor  = "#769656"

export default function Board() {
  const { board, positions, lastMove, move, getLegalMoves, chess } = useChess()
  const [selected, setSelected] = useState(null)

  // Précharge les Audio une fois
  const moveSelfSound  = useMemo(() => new Audio(moveSelfUrl), [])
  const moveCheckSound = useMemo(() => new Audio(moveCheckUrl), [])
  const captureSound   = useMemo(() => new Audio(captureUrl), [])
  const castleSound    = useMemo(() => new Audio(castleUrl), [])
  const gameEndSound   = useMemo(() => new Audio(gameEndUrl), [])

  // Détecte la fin de partie
  const gameOver = chess?.in_checkmate() || chess?.in_stalemate() || chess?.in_draw()

  // Joue le son approprié à chaque coup
  useEffect(() => {
    if (!lastMove) return
    const flags = lastMove.flags || ''
    if (flags.includes('c') || flags.includes('e')) {
      captureSound.currentTime = 0
      captureSound.play()
    } else if (flags.includes('k') || flags.includes('q')) {
      castleSound.currentTime = 0
      castleSound.play()
    } else if (lastMove.san?.includes('+')) {
      moveCheckSound.currentTime = 0
      moveCheckSound.play()
    } else {
      moveSelfSound.currentTime = 0
      moveSelfSound.play()
    }
  }, [lastMove, captureSound, castleSound, moveCheckSound, moveSelfSound])

  // Son de fin de partie
  useEffect(() => {
    if (gameOver) {
      gameEndSound.play()
    }
  }, [gameOver, gameEndSound])

  // Legal moves pour mise en surbrillance
  const legal = useMemo(
    () => selected ? getLegalMoves(selected) : [],
    [selected, getLegalMoves]
  )

  const handleClick = useCallback((r, c) => {
    const sq    = getSquare(r, c)
    const piece = board[r][c]
    if (!selected) {
      if (piece) setSelected(sq)
      return
    }
    if (sq === selected) {
      setSelected(null)
      return
    }
    if (legal.includes(sq)) {
      move({ from: selected, to: sq })
    }
    setSelected(null)
  }, [board, selected, legal, move])

  return (
    <group>
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

      {/* Damier cliquable */}
      {board.map((rowArr, r) =>
        rowArr.map((_, c) => {
          const sq        = getSquare(r, c)
          const isDark    = (r + c) % 2 === 1
          const highlight = sq === selected
          const canMove   = legal.includes(sq)
          let squareColor = isDark ? darkColor : lightColor
          if (highlight) squareColor = '#f7e26b'
          else if (canMove) squareColor = rowArr[c] ? '#ff6b6b' : '#f7e26b'

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

      {/* Pièces */}
      {positions.map((p, i) => {
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
