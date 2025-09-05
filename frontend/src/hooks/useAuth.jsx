// src/hooks/useAuth.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, register as apiRegister } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);  // { userId, username, token, email, avatar }
  const [ready, setReady] = useState(false);

  // Réhydratation robuste au montage
  useEffect(() => {
    try {
      const token    = localStorage.getItem("token");
      const userId   = localStorage.getItem("userId");
      const username = localStorage.getItem("username");
      const email    = localStorage.getItem("email");
      const avatar   = localStorage.getItem("avatar");

      if (token && userId && username) {
        setUser({ userId, username, token, email, avatar });
      } else {
        setUser(null);
      }
    } finally {
      setReady(true);
    }
  }, []);

  // Synchronisation multi-onglets (facultative mais safe)
  useEffect(() => {
    const onStorage = (e) => {
      if (!e) return;
      if (["token", "userId", "username", "email", "avatar"].includes(e.key)) {
        const token    = localStorage.getItem("token");
        const userId   = localStorage.getItem("userId");
        const username = localStorage.getItem("username");
        const email    = localStorage.getItem("email");
        const avatar   = localStorage.getItem("avatar");
        if (token && userId && username) {
          setUser({ userId, username, token, email, avatar });
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Connexion
  const login = async ({ username, password }) => {
    const { token, userId, email, avatar } = await apiLogin({ username, password });
    localStorage.setItem("token",    token);
    localStorage.setItem("userId",   userId);
    localStorage.setItem("username", username);
    localStorage.setItem("email",    email || "");
    localStorage.setItem("avatar",   avatar || "");
    const next = { userId, username, token, email, avatar };
    setUser(next);
    return next;
  };

  // Inscription (auto-login)
  const register = async ({ username, email, password, avatar }) => {
    const { userId, token, email: e, avatar: a } = await apiRegister({ username, email, password, avatar });
    localStorage.setItem("token",    token);
    localStorage.setItem("userId",   userId);
    localStorage.setItem("username", username);
    localStorage.setItem("email",    e || "");
    localStorage.setItem("avatar",   a || "");
    const next = { userId, username, token, email: e, avatar: a };
    setUser(next);
    return next;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("avatar");
    setUser(null);
  };

  const token = user?.token || null;
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
