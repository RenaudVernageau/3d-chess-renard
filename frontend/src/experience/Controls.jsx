// src/experience/Controls.jsx

import { OrbitControls } from '@react-three/drei'

export default function Controls() {
  return (
    <OrbitControls
      makeDefault
      enableDamping
      // Empêche la vue sous le plateau
      minPolarAngle={Math.PI / 6}  // 30°
      maxPolarAngle={Math.PI / 2}  // 90°
      // Interdire le pan (déplacement latéral de la camera)
      enablePan={false}
      // Ajuste la vitesse de zoom / rotation
      zoomSpeed={0.6}
      rotateSpeed={0.8}
    />
  )
}
