// frontend/src/hooks/useAuth.js
import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    return token && username ? { username, token } : null;
  });

  // Effect pour rediriger ou rafraîchir si besoin peut être ajouté ici

  const login = async ({ username, password }) => {
    const { token, userId } = await apiLogin({ username, password });
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    setUser({ username, token });
    return { userId, token };
  };

  const register = async ({ username, password }) => {
    const { userId, token } = await apiRegister({ username, password });
    // On ne loggue pas automatiquement, on peut rediriger vers /login
    return { userId, token };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
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
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
