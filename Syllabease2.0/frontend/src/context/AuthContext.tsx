import React, { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";

interface User {
  id: number;
  faculty_id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  prefix: string;
  suffix: string;
  signature?: string;  // ✅ add this line 
  user_roles: {
    role: { name: string };
    entity_type: string;
    entity_id: number;
  }[];
}

interface AuthContextType {
  user: User | null;
  access: string | null;
  refresh: string | null;
  login: (userData: any) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null); 
  const [hasRestored, setHasRestored] = useState(false);
 
  // 🔹 Restore session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAccess = localStorage.getItem("access");
    const storedRefresh = localStorage.getItem("refresh"); 

    // ✅ Only restore if all exist and access token seems valid
    if (storedUser && storedAccess && storedRefresh) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.id && storedAccess.length > 10) {
          setUser(parsedUser);
          setAccess(storedAccess);
          setRefresh(storedRefresh);
        } else {
          localStorage.clear();
        }
      } catch {
        localStorage.clear();
      }
    }
    
    setHasRestored(true);
  }, []);

  // Auto-redirect if already logged in and tries to access /login
  useEffect(() => {
    if (!hasRestored) return;

    if (user && window.location.pathname === "/login") {
      const role = localStorage.getItem("activeRole");
      if (role) {
        navigate(`/${role.toLowerCase()}`);
      } else {
        navigate("/choose-role");
      }
    }
  }, [user, hasRestored, navigate]);

  // 🔹 Login handler
  const login = (data: any) => {
    try { 
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
      setAccess(data.access);
      setRefresh(data.refresh);

      const roles = data.user.user_roles || [];
 
      if (roles.length === 0) {
        toast.error("Your account has no assigned roles. Please contact an administrator.");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        setUser(null);
        setAccess(null);
        setRefresh(null);
        navigate("/login");
        return;
      }

      // ✅ Multiple roles → choose role screen
      if (roles.length > 1) {
        navigate("/choose-role");
        return;
      }

      // ✅ Single role → go directly to dashboard
      const role = roles[0].role.name;
      localStorage.setItem("activeRole", role.toLowerCase());
      navigate(`/${role.toLowerCase()}`);
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An unexpected error occurred during login.");
    }
  };

  // 🔹 Logout handler
  const logout = async () => {
    try {
      if (refresh) {
        await api.post("/logout/", { refresh });
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.clear();
      setUser(null);
      setAccess(null);
      setRefresh(null);
      navigate("/login");
    }
  };


  return (
    <AuthContext.Provider value={{ user, access, refresh, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
