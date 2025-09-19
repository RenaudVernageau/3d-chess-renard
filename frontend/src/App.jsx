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
import Footer from "./components/Footer";
import Login from "./components/Login";
import Register from "./components/Register";
import Lobby from "./components/Lobby";
import { OwnProfile, UserProfile } from "./components/Profile";
import UsersList from "./components/UsersList";
import Experience from "./experience/Experience";
import MessagingPage from "./components/MessagingPage";
import { useGameUiStore } from "./store/useGameUiStore";

// Overlays
import CapturedStrip from "./components/CapturedStrip";

function PrivateRoute({ children }) {
  const { ready, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!ready) {
    return <div className="p-4 text-center text-white bg-black">Loading…</div>;
  }
  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}

function AppRoutes() {
  const { currentRoomId, myColor } = useGameUiStore();
  const location = useLocation();

  // ✅ Masquer le footer pendant la partie
  const hideFooter = location.pathname.startsWith("/play/");

  return (
    <>
      <NavBar
        roomId={currentRoomId || undefined}
        color={myColor || undefined}
      />
      <CapturedStrip />

      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
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

      {/* ✅ Footer visible partout sauf dans Experience */}
      {!hideFooter && <Footer />}
    </>
  );
}

export default function App() {
  // normalisation hash SANS hard reload
  useEffect(() => {
    const hasHash = !!window.location.hash;
    const path = window.location.pathname;
    if (!hasHash && path && path !== "/") {
      // ⬇️ évite un rechargement complet et donc la perte du store
      window.location.hash = `#${path}${window.location.search || ""}`;
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
