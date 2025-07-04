// src/experience/Lights.jsx
import React from 'react'

export default function Lights() {
  return (
    <>
      {/* 1) Soleil lointain (DirectionalLight) */}
      <directionalLight
        color="#ffffff"
        intensity={2}             // un peu plus qu’avant
        position={[8, 15, 8]}     // reculé pour adoucir l’angle
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* 2) Puits de lumière vraiment puissant */}
      <spotLight
        color="#ffffff"
        intensity={15}            // beaucoup de puissance
        position={[0, 20, 0]}     // très haut pour couvrir proprement
        angle={Math.PI / 10}      // 18° de cône, assez fin
        penumbra={0.8}            // bordure très douce
        decay={1}                 // chute plus lente pour un cône plus uniforme
        distance={40}             // étend le cône plus loin
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
      />

      {/* 3) Ambiance de base */}
      <ambientLight
        color="#ffffff"
        intensity={0.3}
      />
    </>
  )
}
