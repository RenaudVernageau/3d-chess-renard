// src/experience/Lights.jsx
import React from 'react'
import { Environment } from '@react-three/drei'

export default function Lights() {
  return (
    <>
      {/* Subtle HDRI pour réflexions douces sans surexposition */}
      <Environment preset="forest" background={false} blur={1} intensity={0.6} />

      {/* Hemispherical light pour un éclairage global doux */}
      <hemisphereLight
        skyColor="#555555"
        groundColor="#111111"
        intensity={0.25}
      />

      {/* Lumière principale chaude, faible intensité pour éviter les hotspots */}
      <directionalLight
        color="#fff6e0"
        intensity={0.4}
        position={[4, 8, 4]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />

      {/* Rim light subtil pour souligner les contours */}
      <directionalLight
        color="#666677"
        intensity={0.1}
        position={[-4, 4, -4]}
      />

      {/* Spot léger central pour un léger halo d'ambiance */}
      <spotLight
        color="#ffffff"
        intensity={0.05}
        position={[0, 12, 0]}
        angle={Math.PI / 12}
        penumbra={0.8}
        decay={2}
        distance={20}
      />
    </>
  )
}
