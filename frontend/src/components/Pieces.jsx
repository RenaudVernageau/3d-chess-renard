// src/components/Pieces.jsx
import React, { useMemo } from 'react'
import { useGLTF }        from '@react-three/drei'
import { Box3, Vector3, Color } from 'three'

const DESIRED_HEIGHT  = 0.8
const PLATE_THICKNESS = 0.1

const TYPE_SCALES = {
  pawn:   1.0,
  rook:   0.9,
  knight: 0.9,
  bishop: 1.1,
  queen:  1.2,
  king:   1.3,
}

// ** Nouveauté : décalages position par type ** 
const TYPE_OFFSETS = {
  pawn:   [0, -0.15, 0],
  rook:   [0, 0.02, 0],
  knight: [0, 0.05, 0],
  bishop: [0, - 0.04, 0],  // on remonte un peu le fou
  queen:  [0, -0.03, 0],  // on remonte un peu la reine
  king:   [0, 0.26, 0],  // on remonte un peu le roi
}

export default function Pieces({ type, color = 'w', position = [0,0,0] }) {
  const { scene } = useGLTF(`/models/${type}.glb`)
  const mesh       = useMemo(() => scene.clone(true), [scene])

  // 1) uniformise la hauteur
  const baseScale = useMemo(() => {
    const box  = new Box3().setFromObject(mesh)
    const size = box.getSize(new Vector3())
    return size.y > 0 ? DESIRED_HEIGHT / size.y : 1
  }, [mesh])

  // 2) scale relatif par type
  const typeScale  = TYPE_SCALES[type] || 1
  const finalScale = baseScale * typeScale

  // 3) calcul hauteur après scale pour le Y de base
  const baseYOffset = useMemo(() => {
    const box    = new Box3().setFromObject(mesh)
    const height = box.getSize(new Vector3()).y * finalScale
    return PLATE_THICKNESS/2 + height/2
  }, [mesh, finalScale])

  // 4) décalage manuel par type
  const [ox, oy, oz] = TYPE_OFFSETS[type] || [0,0,0]

  // 5) override couleur
  useMemo(() => {
    mesh.traverse(n => {
      if (n.isMesh) {
        n.material       = n.material.clone()
        n.material.color = new Color(color==='w'?'#eeeeee':'#222222')
      }
    })
  }, [mesh, color])

  return (
    <primitive
      object={mesh}
      // on ajoute ox, oy, oz à la position finale
      position={[
        position[0] + ox,
        baseYOffset + oy,
        position[2] + oz
      ]}
      scale={[finalScale, finalScale, finalScale]}
      rotation={[0, -Math.PI/2, 0]}
      castShadow
      receiveShadow
    />
  )
}
