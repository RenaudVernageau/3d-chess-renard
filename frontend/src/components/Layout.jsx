// src/components/Layout.jsx
import React from 'react'
import NavBar from './NavBar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">{children}</main>
    </div>
  )
}
