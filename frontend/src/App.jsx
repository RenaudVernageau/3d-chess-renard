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

// Protected Route: only accessible when logged in
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
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
            path="/play/:roomId"
            element={
              <PrivateRoute>
                <Experience />
              </PrivateRoute>
            }
          />
          {/* Redirect root to login if not auth, else lobby */}
          <Route
            path="/"
            element={<Navigate to="/lobby" replace />}
          />
          {/* Catch-all: if auth go to lobby, else login */}
          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
