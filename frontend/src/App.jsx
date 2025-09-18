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
import CapturedStrip from "./components/CapturedStrip";

// NEW
import Footer from "./components/Footer";
import Legal from "./pages/Legal";

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

function AppShell() {
  const { currentRoomId, myColor } = useGameUiStore();
  const location = useLocation();
  const onPlayRoute = location.pathname.startsWith("/play/");

  return (
    <div
      className={`min-h-screen flex flex-col ${
        onPlayRoute ? "bg-black" : "bg-gradient-to-b from-white to-stone-100"
      }`}
    >
      <NavBar roomId={currentRoomId || undefined} color={myColor || undefined} />
      <CapturedStrip />

      {/* Zone de contenu – on laisse une marge basse quand le footer est visible */}
      <div className={`${onPlayRoute ? "" : "pb-14"} flex-1`}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Legal */}
          <Route path="/legal" element={<Legal />} />

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
      </div>

      {/* Spacer + footer fixe (masqué pendant la 3D) */}
      {!onPlayRoute && <Footer />}
    </div>
  );
}

export default function App() {
  // normalisation hash
  useEffect(() => {
    const hasHash = !!window.location.hash;
    const path = window.location.pathname;
    if (!hasHash && path && path !== "/") {
      const next = `/#${path}${window.location.search || ""}`;
      window.location.replace(next);
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}
