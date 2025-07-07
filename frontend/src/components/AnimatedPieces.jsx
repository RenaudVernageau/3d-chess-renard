// src/components/AnimatedPiece.jsx
/// <reference types="@react-three/fiber" />
import React, { useMemo } from 'react'
import { useSpring, a } from '@react-spring/three'

// Fichiers "a" à "h" pour transformer notation → [x, z]
const FILES = ['a','b','c','d','e','f','g','h']

/** Convertit une notation d’échiquier ("e4") en coordonnées [x, z] */
function squareToPosition(square) {
  const file = square[0]
  const rank = parseInt(square[1], 10)
  const col  = FILES.indexOf(file)
  const row  = 8 - rank
  // retourne seulement X et Z
  return [col - 3.5, row - 3.5]
}

/**
 * Anime une pièce entre deux cases, uniquement sur X/Z.
 * Les enfants (<Pieces>) doivent gérer leur Y via leur propre position prop.
 * @param {{ from: string, to: string, children: React.ReactNode }} props
 */
export default function AnimatedPiece({ from, to, children }) {
  // Calcule les positions 2D
  const [fromX, fromZ] = useMemo(() => squareToPosition(from), [from])
  const [toX,   toZ]   = useMemo(() => squareToPosition(to),   [to])

  // Spring sur la 3D (X, Y=0, Z)
  const { position } = useSpring({
    from:  { position: [fromX, 0, fromZ] },
    to:    { position: [toX,   0, toZ]   },
    
    config: { mass: 1, tension: 210, friction: 20, clamp: true },
  })

  return (
    <a.group position={position}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { position: [0, 0, 0] })
      )}
    </a.group>
  )
}
