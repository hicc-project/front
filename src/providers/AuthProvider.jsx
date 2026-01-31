// src/providers/AuthProvider.jsx
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "accessToken";
const USERNAME_KEY = "authUsername";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [username, setUsername] = useState(() => localStorage.getItem(USERNAME_KEY) || "");

  const isAuthed = !!token;

  const setAuth = useCallback((nextToken, nextUsername) => {
    const t = nextToken || "";
    const u = nextUsername || "";
    setToken(t);
    setUsername(u);
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
    if (u) localStorage.setItem(USERNAME_KEY, u);
    else localStorage.removeItem(USERNAME_KEY);
  }, []);

  const logout = useCallback(() => {
    setAuth("", "");
  }, [setAuth]);

  const value = useMemo(
    () => ({ token, username, isAuthed, setAuth, logout }),
    [token, username, isAuthed, setAuth, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
