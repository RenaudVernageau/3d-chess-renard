// src/components/Lobby.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Lobby() {
  const nav = useNavigate();
  return (
    <div style={{ padding: 20 }}>
      <h1>Lobby</h1>
      <button onClick={() => nav("/play")}>
        Entrer dans la partie 3D
      </button>
    </div>
  );
}
