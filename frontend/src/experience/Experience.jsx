// src/experience/Experience.jsx
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Controls from "./Controls.jsx";
import Lights from "./Lights.jsx";
import Board from "../components/Board.jsx";


export default function Experience() {
  return (
    <div className="flex flex-col w-full h-screen">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 shadow-md">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          3D Chess
        </h1>
        
      </header>

      {/* 3D canvas */}
      <div className="flex-1">
        <Canvas
          flat
          shadows
          camera={{ fov: 45, near: 0.1, far: 200, position: [4, 8, 10] }}
        >
          {/* Controls: rotate, zoom, pan */}
          <Controls />

          {/* Scene lights */}
          <Lights />

          {/* Chess board & pieces */}
          <Suspense fallback={null}>
            <Board />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
