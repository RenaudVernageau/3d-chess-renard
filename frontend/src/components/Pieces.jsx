// src/components/Pieces.jsx
import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export default function Pieces({
  type,
  color = 'w',
  position = [0, 0, 0],
  scale = 1
}) {
  // charge le fichier unique selon le type
  const gltf = useGLTF(`/models/${type}.glb`)

  // clone la scène et override la couleur
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true)
    cloned.traverse(node => {
      if (node.isMesh) {
        node.material = node.material.clone()
        node.material.color = new THREE.Color(
          color === 'w' ? '#eeeeee' : '#222222'
        )
        node.material.needsUpdate = true
      }
    })
    return cloned
  }, [gltf, color])

  return (
    <primitive
      object={scene}
      position={position}
      scale={scale * 0.2}
      castShadow
      receiveShadow
    />
  )
}
