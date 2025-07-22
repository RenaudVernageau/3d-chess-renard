// frontend/src/hooks/useAuth.js
import { createContext, useContext, useState } from "react";
import { login as apiLogin, register as apiRegister } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token    = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const email    = localStorage.getItem("email");
    const avatar   = localStorage.getItem("avatar");
    return token && username
      ? { username, token, email, avatar }
      : null;
  });

  // Appelle POST /api/auth/login
  const login = async ({ username, password }) => {
    // Le back doit renvoyer { token, userId, email, avatar }
    const { token, userId, email, avatar } = await apiLogin({ username, password });

    localStorage.setItem("token",    token);
    localStorage.setItem("username", username);
    localStorage.setItem("email",    email);
    localStorage.setItem("avatar",   avatar);

    setUser({ username, token, email, avatar });
    return { userId, token };
  };

  // Appelle POST /api/auth/register
  const register = async ({ username, email, password, avatar }) => {
    // Le back doit renvoyer { userId, token, email, avatar }
    const { userId, token, email: e, avatar: a } = await apiRegister({
      username,
      email,
      password,
      avatar,
    });

    // Si tu veux auto‑logguer à l’inscription, on stocke tout de suite
    localStorage.setItem("token",    token);
    localStorage.setItem("username", username);
    localStorage.setItem("email",    e);
    localStorage.setItem("avatar",   a);

    setUser({ username, token, email: e, avatar: a });
    return { userId, token };
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("avatar");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
