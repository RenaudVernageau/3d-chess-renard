// src/hooks/useAuth.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import * as authAPI from "../api/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);

  // Si vous stockez le token en localStorage :
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) setToken(t);
  }, []);

  const login = async ({ username, password }) => {
    const { token: newToken } = await authAPI.login({ username, password });
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  const register = async ({ username, password }) => {
    await authAPI.register({ username, password });
    // vous pouvez automatiquement faire login() après l’inscription
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// hook pour consommer le contexte
export function useAuth() {
  return useContext(AuthContext);
}
