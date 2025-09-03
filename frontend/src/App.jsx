// src/App.jsx
import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./hooks/useAuth";
import NavBar from "./components/NavBar";
import Login from "./components/Login";
import Register from "./components/Register";
import Lobby from "./components/Lobby";
import { OwnProfile, UserProfile } from "./components/Profile";
import { UsersList } from "./components/UsersList";
import Experience from "./experience/Experience";
import MessagingPage from "./components/MessagingPage";
import { useGameUiStore } from "./store/useGameUiStore";

// PrivateRoute ne rend le composant que si l’utilisateur est authentifié
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { currentRoomId, myColor } = useGameUiStore();
  return (
    <AuthProvider>
      <Router>
        <NavBar
          roomId={currentRoomId || undefined}
          color={myColor || undefined}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
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
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <OwnProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <UsersList />
              </PrivateRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <PrivateRoute>
                <UserProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <PrivateRoute>
                <MessagingPage />
              </PrivateRoute>
            }
          />
          {/* Redirects */}
          <Route path="/play" element={<Navigate to="/lobby" replace />} />
          <Route path="/" element={<Navigate to="/lobby" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
