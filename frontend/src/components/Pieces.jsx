// src/components/Pieces.jsx
import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Box3, Vector3, Color } from 'three'

const DESIRED_HEIGHT    = 0.8
const PLATE_THICKNESS   = 0.1

// Ajustements Y manuels par type pour rattraper l'origine dans le .glb
const TYPE_Y_OFFSETS = {
  pawn:   - 0.15,    // déjà correct
  rook:   0.022,    // déjà correct
  knight: 0.05,    // déjà correct
  bishop: - 0.04, // léger décollage car base trop creuse
  queen:  - 0.025, // un poil plus haut
  king:   0.205, // idem
}

export default function Pieces({ type, color = 'w', position = [0, 0, 0], rotation }) {
  const { scene } = useGLTF(`/models/${type}.glb`)
  const mesh = useMemo(() => scene.clone(true), [scene])

  // 1) calcul scale comme avant
  const scale = useMemo(() => {
    const box = new Box3().setFromObject(mesh)
    const size = box.getSize(new Vector3())
    return size.y > 0 ? DESIRED_HEIGHT / size.y : 1
  }, [mesh])

  // 2) calcul de l’offset Y de base pour toucher le plateau
  const baseYOffset = useMemo(() => {
    const box = new Box3().setFromObject(mesh)
    const height = box.getSize(new Vector3()).y * scale
    return PLATE_THICKNESS / 2 + height / 2
  }, [mesh, scale])

  // 3) on récupère le petit correctif par type
  const extraYOffset = TYPE_Y_OFFSETS[type] || 0

  // 4) override couleur
  useMemo(() => {
    mesh.traverse(node => {
      if (node.isMesh) {
        node.material = node.material.clone()
        node.material.color = new Color(color === 'w' ? '#eeeeee' : '#222222')
      }
    })
  }, [mesh, color])

  return (
    <primitive
      object={mesh}
      position={[
        position[0],
        // baseYOffset + correction manuelle
        baseYOffset + extraYOffset,
        position[2]
      ]}
      scale={[scale, scale, scale]}
      rotation={rotation}
      castShadow
      receiveShadow
    />
  )
}
