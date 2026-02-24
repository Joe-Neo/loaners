import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../api";

interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: "staff" | "admin";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isKioskMode: boolean;
  enterKiosk: () => void;
  exitKiosk: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isKioskMode, setIsKioskMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.me()
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // Restore kiosk mode from session
    const kiosk = sessionStorage.getItem("kioskMode");
    if (kiosk === "true") setIsKioskMode(true);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.staff);
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("kioskMode");
    setUser(null);
    setIsKioskMode(false);
  };

  const enterKiosk = () => {
    setIsKioskMode(true);
    sessionStorage.setItem("kioskMode", "true");
  };

  const exitKiosk = async (password: string): Promise<boolean> => {
    if (!user) return false;
    try {
      await api.login(user.username, password);
      setIsKioskMode(false);
      sessionStorage.removeItem("kioskMode");
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === "admin",
        isKioskMode,
        enterKiosk,
        exitKiosk,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
