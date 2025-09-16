import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, register as apiRegister } from "../api/auth";
import { getMe } from "../api/users";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { token, userId, username, email, avatar, role }
  const [ready, setReady] = useState(false);

  // ---- helpers ----
  const writeLocal = (u) => {
    if (!u) return;
    if (u.token)   localStorage.setItem("token", u.token);
    if (u.userId)  localStorage.setItem("userId", u.userId);
    if (u.username !== undefined) localStorage.setItem("username", u.username || "");
    if (u.email    !== undefined) localStorage.setItem("email",    u.email || "");
    if (u.avatar   !== undefined) localStorage.setItem("avatar",   u.avatar || "");
    if (u.role     !== undefined) localStorage.setItem("role",     u.role || "user");
  };

  const readLocal = () => {
    const token    = localStorage.getItem("token");
    const userId   = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    const email    = localStorage.getItem("email");
    const avatar   = localStorage.getItem("avatar");
    const role     = localStorage.getItem("role") || "user";
    return token && userId && username
      ? { token, userId, username, email, avatar, role }
      : null;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("avatar");
    localStorage.removeItem("role");
    setUser(null);
  };

  const hydrateFromApi = async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // pas connecté
    try {
      const me = await getMe(); // { id, username, email, avatar, role }
      if (me?.id) {
        const next = {
          token,
          userId: me.id,
          username: me.username || "",
          email: me.email || "",
          avatar: me.avatar || "",
          role: me.role || localStorage.getItem("role") || "user",
        };
        writeLocal(next);
        setUser(next);
      }
    } catch (e) {
      // token expiré -> on nettoie
      console.warn("[Auth] getMe failed, clearing session:", e?.message);
      logout();
    }
  };

  // Réhydratation + premier refresh réseau
  useEffect(() => {
    const local = readLocal();
    if (local) setUser(local);
    // Puis on tente de rafraîchir depuis l'API (profil à jour inter-devices)
    hydrateFromApi().finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rafraîchir si l’onglet redevient visible (utile sur mobile/suspension)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        hydrateFromApi();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Sync multi-onglets du même navigateur (facultatif)
  useEffect(() => {
    const onStorage = (e) => {
      if (!e) return;
      if (["token","userId","username","email","avatar","role"].includes(e.key)) {
        const local = readLocal();
        setUser(local);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = async ({ username, password }) => {
    const res = await apiLogin({ username, password });
    const next = {
      token:    res?.token || "",
      userId:   res?.userId || "",
      username: res?.username || username || "",
      email:    res?.email || "",
      avatar:   res?.avatar || "",
      role:     res?.role || "user",
    };
    writeLocal(next);
    setUser(next);
    // après login, on synchronise avec /users/me pour récupérer profil à jour
    hydrateFromApi();
    return next;
  };

  const register = async ({ username, email, password, avatar }) => {
    const res = await apiRegister({ username, email, password, avatar });
    const next = {
      token:    res?.token || "",
      userId:   res?.userId || "",
      username: res?.username || username || "",
      email:    res?.email || "",
      avatar:   res?.avatar || "",
      role:     res?.role || "user",
    };
    writeLocal(next);
    setUser(next);
    hydrateFromApi();
    return next;
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
