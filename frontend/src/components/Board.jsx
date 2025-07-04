// src/components/Board.jsx
import React from 'react'
import useChess from '../hooks/useChess'
import Pieces from './Pieces.jsx'

const lightColor = '#eeeed2'
const darkColor  = '#769656'

export default function Board() {
  const { positions } = useChess()
  return (
    <group>
      {/* Damier classique */}
      {Array.from({ length: 8 }).flatMap((_, row) =>
        Array.from({ length: 8 }).map((__, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[col - 3.5, 0, row - 3.5]}
            receiveShadow
          >
            <boxGeometry args={[1, 0.1, 1]} />
            <meshStandardMaterial
              color={(row + col) % 2 ? darkColor : lightColor}
            />
          </mesh>
        ))
      )}

      {/* Pièces, X/Z seulement */}
      {positions.map(p => (
        <Pieces
          key={`${p.type}-${p.color}-${p.x}-${p.y}`}
          type={p.type}
          color={p.color}
          position={[p.x - 3.5, 0, p.y - 3.5]}
          rotation={[0, - Math.PI/2, 0]}
        />
      ))}
    </group>
  )
}
