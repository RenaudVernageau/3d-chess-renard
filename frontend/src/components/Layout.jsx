// src/components/Layout.jsx
import React from 'react'
import NavBar from './NavBar'
import { useGameUiStore } from "./store/useGameUiStore";

export default function Layout({ children }) {
  const { currentRoomId, myColor } = useGameUiStore();
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar roomId={currentRoomId || undefined} color={myColor || undefined} />
      <main className="flex-grow">{children}</main>
    </div>
  )
}
