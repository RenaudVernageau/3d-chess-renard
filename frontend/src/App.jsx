// frontend/src/App.jsx
import React, { useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
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

// 🔹 overlays (nouveaux composants très discrets)
import MaterialPill from "./components/MaterialPill";
import CapturedStrip from "./components/CapturedStrip";

// PrivateRoute attend la réhydratation et mémorise la destination
function PrivateRoute({ children }) {
  const { ready, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="p-4 text-center text-white bg-black">
        Loading…
      </div>
    );
  }

  return isAuthenticated
    ? children
    : <Navigate to="/login" replace state={{ from: location }} />;
}

export default function App() {
  // 🔧 Normalise l'URL si on arrive sans hash (ex: /play/1234) pour éviter /play/...#/play/...
  useEffect(() => {
    const hasHash = !!window.location.hash;
    const path = window.location.pathname;
    if (!hasHash && path && path !== "/") {
      const next = `/#${path}${window.location.search || ""}`;
      window.location.replace(next);
    }
  }, []);

  const { currentRoomId, myColor } = useGameUiStore();
  return (
    <AuthProvider>
      <Router>
        <NavBar
          roomId={currentRoomId || undefined}
          color={myColor || undefined}
        />
        {/* Overlays épurés, positionnés en fixed et indépendants du routing */}
        <MaterialPill />
        <CapturedStrip />

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
