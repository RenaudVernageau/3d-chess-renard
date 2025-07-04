import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Lights from "./Lights.jsx";
import Board from "../components/Board.jsx";
import { OrbitControls } from "@react-three/drei";
import Controls from "./Controls.jsx";

export default function Experience() {
  return (
    <>
      <Canvas
        flat
        camera={{
          fov: 45,
          near: 0.1,
          far: 200,
          position: [4, 8, 10],
        }}
      >
        <Controls />
        <Lights />
        <Suspense fallback={null}>
          <Board />
        </Suspense>
      </Canvas>
    </>
  );
}
