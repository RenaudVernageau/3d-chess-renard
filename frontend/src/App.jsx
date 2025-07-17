// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./hooks/useAuth";

import NavBar from "./components/NavBar";
import Login from "./components/Login";
import Register from "./components/Register";
import Lobby from "./components/Lobby";
import Experience from "./experience/Experience";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Toujours afficher la NavBar */}
        <NavBar />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/lobby"
            element={
              <PrivateRoute>
                <Lobby />
              </PrivateRoute>
            }
          />

          <Route
            path="/play"
            element={
              <PrivateRoute>
                <Experience />
              </PrivateRoute>
            }
          />

          {/* Redirige tout autre URL vers le lobby */}
          <Route path="*" element={<Navigate to="/lobby" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
