// src/experience/Controls.jsx
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect } from "react";

export default function Controls({ isWhite }) {
  const { camera } = useThree();

  useEffect(() => {
    // Déplace la caméra selon la couleur
    if (isWhite) {
      camera.position.set(4, 8, 10);
      camera.lookAt(4, 0, 4);
    } else {
      camera.position.set(4, 8, -10);
      camera.lookAt(4, 0, 4);
    }
  }, [isWhite, camera]);

  return (
    <OrbitControls
      makeDefault
      enableDamping
      enablePan={false}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2}
      zoomSpeed={0.2}
      rotateSpeed={0.2}
    />
  );
}
