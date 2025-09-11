// src/hooks/useAuth.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, register as apiRegister } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { userId, username, token, email, avatar|avatarUrl }
  const [ready, setReady] = useState(false);

  // Réhydratation au montage
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

  // Sync multi-onglets
  useEffect(() => {
    const onStorage = () => {
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
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Helper pour appliquer un user partiel (ex: après update profil)
  const updateUser = (partial = {}) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(partial || {}) };
      // normalise avatar/URL
      const avatarUrl = next.avatarUrl || next.avatar || "";
      localStorage.setItem("username", next.username || "");
      localStorage.setItem("email",    next.email || "");
      localStorage.setItem("avatar",   avatarUrl || "");
      return { ...next, avatar: avatarUrl }; // garde "avatar" pour compat NavBar etc.
    });
  };

  // Connexion
  const login = async ({ username, password }) => {
    const result = await apiLogin({ username, password });
    const {
      token,
      userId,
      email,
      avatar,
      avatarUrl,
      username: unameFromApi,
    } = result || {};
    const finalUsername = unameFromApi || username || "";

    localStorage.setItem("token",    token || "");
    localStorage.setItem("userId",   userId || "");
    localStorage.setItem("username", finalUsername);
    localStorage.setItem("email",    email || "");
    localStorage.setItem("avatar",   avatarUrl || avatar || "");

    const next = {
      userId,
      username: finalUsername,
      token,
      email,
      avatar: avatarUrl || avatar || "",
      avatarUrl: avatarUrl || avatar || "",
    };
    setUser(next);
    return next;
  };

  // Inscription (auto-login)
  const register = async ({ username, email, password, avatar }) => {
    const result = await apiRegister({ username, email, password, avatar });
    const {
      token,
      userId,
      email: e,
      avatar: a,
      avatarUrl,
      username: unameFromApi,
    } = result || {};

    const finalUsername = unameFromApi || username || "";
    const finalAvatar = avatarUrl || a || "";

    localStorage.setItem("token",    token || "");
    localStorage.setItem("userId",   userId || "");
    localStorage.setItem("username", finalUsername);
    localStorage.setItem("email",    e || "");
    localStorage.setItem("avatar",   finalAvatar);

    const next = { userId, username: finalUsername, token, email: e, avatar: finalAvatar, avatarUrl: finalAvatar };
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
    <AuthContext.Provider value={{ user, token, isAuthenticated, ready, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
