// frontend/src/hooks/useAuth.js
import { createContext, useContext, useState } from 'react';
import { login as apiLogin, register as apiRegister } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token    = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    return token && username ? { username, token } : null;
  });

  // Appelle POST /api/auth/login
  const login = async ({ username, password }) => {
    const { token, userId } = await apiLogin({ username, password });
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    setUser({ username, token });
    return { userId, token };
  };

  // Appelle POST /api/auth/register
  const register = async ({ username, email, password, avatar }) => {
    // apiRegister doit envoyer { username, email, password, avatar }
    const { userId, token } = await apiRegister({
      username,
      email,
      password,
      avatar,
    });
    // on ne se loggue pas automatiquement ; on conserve le token renvoyé si besoin
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
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
