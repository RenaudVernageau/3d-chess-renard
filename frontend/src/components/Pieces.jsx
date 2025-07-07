// src/components/Pieces.jsx
import React, { useMemo } from 'react'
import { useGLTF }        from '@react-three/drei'
import { Box3, Vector3, Color } from 'three'

const DESIRED_HEIGHT  = 0.8
const PLATE_THICKNESS = 0.1

// Mapping lettre → nom de fichier
const TYPE_MAP = {
  p: 'pawn',
  r: 'rook',
  n: 'knight',
  b: 'bishop',
  q: 'queen',
  k: 'king',
}

// Échelles relatives par type
const TYPE_SCALES = {
  pawn:   1.0,
  rook:   0.9,
  knight: 0.9,
  bishop: 1.1,
  queen:  1.2,
  king:   1.3,
}

// Décalages pour alignement Y
const TYPE_OFFSETS = {
  pawn:   [0, -0.15, 0],
  rook:   [0,  0.02, 0],
  knight: [0,  0.05, 0],
  bishop: [0, -0.04, 0],
  queen:  [0, -0.03, 0],
  king:   [0,  0.26, 0],
}

export default function Pieces({ type, color = 'w', position = [0,0,0] }) {
  // 1) Nom de fichier
  const key  = TYPE_MAP[type] || type
  const { scene } = useGLTF(`/models/${key}.glb`)
  const mesh = useMemo(() => scene.clone(true), [scene])

  // 2) Uniformisation de la hauteur
  const baseScale = useMemo(() => {
    const box  = new Box3().setFromObject(mesh)
    const size = box.getSize(new Vector3())
    return size.y > 0 ? DESIRED_HEIGHT / size.y : 1
  }, [mesh])

  // 3) Échelle relative
  const typeScale  = TYPE_SCALES[key] || 1
  const finalScale = baseScale * typeScale

  // 4) Offset Y de base
  const baseYOffset = useMemo(() => {
    const box    = new Box3().setFromObject(mesh)
    const height = box.getSize(new Vector3()).y * finalScale
    return PLATE_THICKNESS / 2 + height / 2
  }, [mesh, finalScale])

  // 5) Décalage manuel
  const [ox, oy, oz] = TYPE_OFFSETS[key] || [0, 0, 0]

  // 6) Matériau plus traditionnel
  useMemo(() => {
    mesh.traverse(node => {
      if (node.isMesh) {
        node.material = node.material.clone()
        // Couleurs plus sourdes, noirs un peu moins sombre
        node.material.color = new Color(color === 'w' ? '#c0c0c0' : '#2a2a2a')
        node.material.metalness = 0.05
        node.material.roughness = 0.98
        node.material.clearcoat = 0.0
        node.material.envMapIntensity = 0.1
      }
    })
  }, [mesh, color])

  return (
    <primitive
      object={mesh}
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
