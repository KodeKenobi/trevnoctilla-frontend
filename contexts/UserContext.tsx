"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { getApiUrl, getAuthHeaders } from "@/lib/config";

interface User {
  id: number;
  email: string;
  role: "user" | "admin" | "super_admin";
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuthStatus();
  }, [session]);

  const checkAuthStatus = async () => {
    try {
      // Always try to get fresh user data from backend profile endpoint
      // This ensures we get subscription_tier and other backend-specific fields
      const token = localStorage.getItem("auth_token");
      
      if (token) {
        console.log("🔍 Fetching fresh user data from profile endpoint...");
        try {
          const response = await fetch(getApiUrl("/auth/profile"), {
            headers: getAuthHeaders(token),
          });

          if (response.ok) {
            const userData = await response.json();
            console.log("🔍 Profile data received:", userData);
            // Store fresh user data
            localStorage.setItem("user_data", JSON.stringify(userData));
            setUser(userData);
            setLoading(false);
            return;
          } else {
            console.log("🔍 Profile endpoint failed, falling back to session");
          }
        } catch (profileError) {
          console.log("🔍 Profile fetch error, falling back to session:", profileError);
        }
      }

      // Fallback: If we have a NextAuth session, use it
      if (session?.user) {
        console.log("🔍 Using NextAuth session:", session.user);
        const userFromSession: User = {
          id: parseInt(session.user.id),
          email: session.user.email || "",
          role: (session.user as any).role,
          is_active: (session.user as any).is_active,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          subscription_tier: (session.user as any).subscription_tier || "free",
        };
        setUser(userFromSession);

        // If no backend token exists, get one from NextAuth session
        const existingToken = localStorage.getItem("auth_token");
        if (!existingToken && session.user.email) {
          console.log(
            "🔍 No backend token found, getting one from NextAuth session..."
          );
          try {
            // Use endpoint that auto-creates/updates user from NextAuth session
            const tokenResponse = await fetch(
              getApiUrl("/auth/get-token-from-session"),
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: session.user.email,
                  password: "Kopenikus0218!", // Known password from auth.ts
                  role:
                    (session.user as any)?.role === "super_admin"
                      ? "super_admin"
                      : "user",
                }),
              }
            );

            if (tokenResponse.ok) {
              const backendData = await tokenResponse.json();
              localStorage.setItem("auth_token", backendData.access_token);
              localStorage.setItem(
                "user_data",
                JSON.stringify(backendData.user)
              );
              console.log("✅ Backend token obtained from NextAuth session");
              // Update user with backend data (includes subscription_tier)
              setUser(backendData.user);
            } else {
              console.log("⚠️ Could not get backend token (non-critical)");
            }
          } catch (backendError) {
            console.error("Backend auth failed (non-critical):", backendError);
            // Don't block - NextAuth session is enough for UI
          }
        }

        setLoading(false);
        return;
      }

      // Fallback to localStorage token check
      const token = localStorage.getItem("auth_token");
      console.log("🔍 Checking auth status, token exists:", !!token);

      if (!token) {
        console.log("🔍 No token found, setting loading to false");
        setLoading(false);
        return;
      }

      // Try to get user data from localStorage first (from login response)
      const storedUser = localStorage.getItem("user_data");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log("🔍 Using stored user data:", userData);
          console.log("🔍 User email from stored data:", userData.email);
          setUser(userData);
          setLoading(false);
          return;
        } catch (error) {
          console.log(
            "🔍 Failed to parse stored user data, trying JWT fallback"
          );
        }
      }

      // Fallback: Try to decode the JWT token to get user info
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("🔍 JWT payload:", payload);

        // Create a user object from the token
        const userFromToken: User = {
          id: parseInt(payload.sub),
          email: "kodekenobi@gmail.com", // This should come from the token in a real implementation
          role: "super_admin" as const, // This should come from the token in a real implementation
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        };

        console.log("🔍 Using user data from token:", userFromToken);
        setUser(userFromToken);
        setLoading(false);
        return;
      } catch (jwtError) {
        console.log("🔍 JWT decode failed, trying profile endpoint");
      }

      console.log("🔍 Making profile request with token");
      const response = await fetch(getApiUrl("/auth/profile"), {
        headers: getAuthHeaders(token),
      });

      console.log("🔍 Profile response status:", response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log("🔍 Profile data received:", userData);
        setUser(userData);
      } else {
        console.log("🔍 Auth check failed, removing token");
        localStorage.removeItem("auth_token");
      }
    } catch (error) {
      console.error("🔍 Error checking auth status:", error);
      // Don't remove token on network errors, just log
      console.log("🔍 Network error during auth check, keeping token");
    } finally {
      console.log("🔍 Setting loading to false");
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("🔐 Attempting login for:", email);
      const response = await fetch(getApiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("🔐 Login response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🔐 Login response data:", data);
        localStorage.setItem("auth_token", data.access_token);
        localStorage.setItem("user_data", JSON.stringify(data.user));
        setUser(data.user);
        console.log("🔐 User set to:", data.user);
        return true;
      } else {
        const errorData = await response.json();
        console.log("🔐 Login error:", errorData);
        return false;
      }
    } catch (error) {
      console.error("🔐 Login network error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    setUser(null);
    signOut({ callbackUrl: "/" });
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading: loading || status === "loading",
        login,
        logout,
        checkAuthStatus,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
