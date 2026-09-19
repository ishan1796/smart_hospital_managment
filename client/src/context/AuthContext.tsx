import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsRole: (role: UserRole) => Promise<void>;
  registerPatient: (data: any) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  ADMIN: { email: "admin@hospital.com", pass: "password123" },
  DOCTOR: { email: "doctor@hospital.com", pass: "password123" },
  NURSE: { email: "nurse@hospital.com", pass: "password123" },
  PATIENT: { email: "patient@hospital.com", pass: "password123" },
  PHARMACY: { email: "pharmacy@hospital.com", pass: "password123" },
  LAB: { email: "lab@hospital.com", pass: "password123" },
  FINANCE: { email: "finance@hospital.com", pass: "password123" },
  HRMS: { email: "hrms@hospital.com", pass: "password123" },
  MESS: { email: "mess@hospital.com", pass: "password123" },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("aegis_token"));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("aegis_token");
      if (storedToken) {
        try {
          const res = await api.get("/auth/me");
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          localStorage.removeItem("aegis_token");
          localStorage.removeItem("aegis_user");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem("aegis_token", newToken);
      setToken(newToken);
      setUser(userData);
    }
  };

  const loginAsRole = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const registerPatient = async (data: any) => {
    const res = await api.post("/auth/register", data);
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem("aegis_token", newToken);
      setToken(newToken);
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem("aegis_token");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginAsRole,
        registerPatient,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
