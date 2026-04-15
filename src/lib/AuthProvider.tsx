"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { setAuthToken } from "../api/budgetApi";
import axios from "axios";

type User = { email: string; name?: string; role?: string } | null;

type AuthContextValue = {
  user: User;
  token: string | null;
  loginWithIdToken: (idToken: string, scope?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // hydrate from localStorage
    const saved = localStorage.getItem("wb:auth");
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        if (obj?.token) {
          setToken(obj.token);
          setAuthToken(obj.token);
        }
        if (obj?.user) setUser(obj.user);
      } catch (err) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      localStorage.setItem("wb:auth", JSON.stringify({ token, user }));
    } else {
      setAuthToken(null);
      localStorage.removeItem("wb:auth");
    }
  }, [token, user]);

  const loginWithIdToken = async (idToken: string, scope = "budget") => {
    // send to backend to exchange for app JWT
    const resp = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000"}/auth/google`,
      { idToken, scope },
    );
    const data = resp.data;
    const appToken = data.token;
    setToken(appToken);
    // set backend API auth header immediately to avoid race
    setAuthToken(appToken);
    setUser(data.user);

    // If there was a pending share token, accept it
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000"}/budgets/share/accept`,
        { token: appToken },
        { headers: { Authorization: `Bearer ${appToken}` } },
      );
    } catch (err) {
      console.error("Failed to accept share token after login", err);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loginWithIdToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
