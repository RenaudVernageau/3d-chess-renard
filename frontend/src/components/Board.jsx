// src/components/Board.jsx
import React from 'react'

const lightColor = '#eeeed2'
const darkColor  = '#769656'

export default function Board() {
  return (
    <group>
      {Array.from({ length: 8 }).flatMap((_, row) =>
        Array.from({ length: 8 }).map((__, col) => {
          const isDark = (row + col) % 2 === 1
          return (
            <mesh
              key={`${row}-${col}`}
              position={[col - 3.5, 0, row - 3.5]}
              receiveShadow
            >
              <boxGeometry args={[1, 0.1, 1]} />
              <meshStandardMaterial
                color={isDark ? darkColor : lightColor}
              />
            </mesh>
          )
        })
      )}
    </group>
  )
}
