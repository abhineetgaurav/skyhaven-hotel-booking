import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, getToken, setToken, clearToken } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [ready, setReady] = useState(false);

  const loadWishlist = useCallback(async () => {
    try { setWishlist((await apiFetch("/wishlist")).map(r => r._id)); } catch { setWishlist([]); }
  }, []);

  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    apiFetch("/auth/me")
      .then(async d => { setUser(d.user); await loadWishlist(); })
      .catch(() => clearToken())
      .finally(() => setReady(true));
  }, [loadWishlist]);

  const login = useCallback(async (email, password) => {
    const d = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setToken(d.token); setUser(d.user); await loadWishlist(); return d.user;
  }, [loadWishlist]);

  const signup = useCallback(async (name, email, password) => {
    const d = await apiFetch("/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) });
    setToken(d.token); setUser(d.user); setWishlist([]); return d.user;
  }, []);

  const logout = useCallback(() => { clearToken(); setUser(null); setWishlist([]); }, []);

  const toggleWishlist = useCallback(async roomId => {
    const d = await apiFetch(`/wishlist/${roomId}`, { method: "POST" });
    setWishlist(d.wishlist);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, wishlist, login, signup, logout, toggleWishlist, reloadWishlist: loadWishlist }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
