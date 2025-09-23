import React, { useEffect, useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
  useNavigate,
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
import Legal from "./pages/Legal";

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

/**
 * Garde de route pour synchroniser l'URL /play/:roomId avec le store.
 * - Si l'URL a un roomId et que le store n'a pas (ou différent) -> on set le store.
 * - Si pas de roomId -> on redirige au lobby.
 */
function RequireRoom({ children }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const currentRoomId = useGameUiStore((s) => s.currentRoomId);
  const setCurrentRoomId = useGameUiStore((s) => s.setCurrentRoomId);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!roomId) {
      navigate("/lobby", { replace: true });
      return;
    }
    if (currentRoomId !== roomId) {
      // On aligne le store sur l'URL (reset des captures par défaut -> OK au démarrage)
      setCurrentRoomId(roomId);
    }
    // petit délai pour éviter un flash avant synchro
    setSynced(true);
  }, [roomId, currentRoomId, setCurrentRoomId, navigate]);

  if (!roomId) return null;     // redirection en cours
  if (!synced) return null;     // attend 1 tick de synchro
  return children;
}

function AppRoutes() {
  const { currentRoomId, myColor } = useGameUiStore();
  const location = useLocation();

  // ✅ Masquer le footer pendant la partie ET sur la page Messages
  const path = location.pathname;
  const hideFooter = path.startsWith("/play/") || path.startsWith("/messages");

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
              <RequireRoom>
                <Experience />
              </RequireRoom>
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
