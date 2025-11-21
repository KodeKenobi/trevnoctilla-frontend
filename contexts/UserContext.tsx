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
  subscription_tier?: string;
  monthly_call_limit?: number;
  monthly_used?: number;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  refreshSessionSilently: () => Promise<boolean>;
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
    const startTime = Date.now();
    console.log(
      `[UserContext] checkAuthStatus START - ${new Date().toISOString()}`
    );

    // Use cached data immediately to avoid showing loading state
    const cachedUserData = localStorage.getItem("user_data");
    if (cachedUserData && !user) {
      try {
        const userData = JSON.parse(cachedUserData);
        console.log(
          `[UserContext] Using cached data immediately while fetching fresh data`
        );
        setUser(userData);
        setLoading(false);
      } catch (e) {
        console.error(`[UserContext] Failed to parse cached user data:`, e);
      }
    }

    try {
      // Always try to get fresh user data from backend profile endpoint
      // This ensures we get subscription_tier and other backend-specific fields
      const token = localStorage.getItem("auth_token");

      if (token) {
        console.log(
          `[UserContext] Token found, fetching profile... (${
            Date.now() - startTime
          }ms)`
        );
        try {
          const fetchStartTime = Date.now();
          const response = await fetch("/api/auth/profile", {
            headers: getAuthHeaders(token),
            signal: AbortSignal.timeout(30000), // 30 second timeout (increased to handle slow backend responses)
          });
          const fetchTime = Date.now() - fetchStartTime;
          console.log(
            `[UserContext] Profile fetch completed in ${fetchTime}ms, status: ${response.status}`
          );

          if (response.ok) {
            const userData = await response.json();
            const totalTime = Date.now() - startTime;
            console.log(
              `[UserContext] ✅ Profile data received in ${totalTime}ms:`,
              userData
            );
            console.log(
              "[UserContext] Subscription tier:",
              userData.subscription_tier || "not found"
            );
            // Store fresh user data
            localStorage.setItem("user_data", JSON.stringify(userData));
            setUser(userData);
            setLoading(false);
            console.log(
              `[UserContext] checkAuthStatus COMPLETE - ${
                Date.now() - startTime
              }ms total`
            );
            return;
          } else if (response.status === 404) {
            // User was deleted - log them out
            console.log(
              "❌ User not found in backend (404) - user was deleted. Logging out..."
            );
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_data");
            const { signOut } = await import("next-auth/react");
            await signOut({ redirect: true, callbackUrl: "/auth/login" });
            setUser(null);
            setLoading(false);
            return;
          } else {
            const totalTime = Date.now() - startTime;
            console.log(
              `[UserContext] ⚠️ Profile endpoint failed (${response.status}) after ${totalTime}ms, falling back to cached data or session`
            );
            // Try to use cached user data as fallback
            const cachedUserData = localStorage.getItem("user_data");
            if (cachedUserData) {
              try {
                const userData = JSON.parse(cachedUserData);
                console.log(
                  `[UserContext] Using cached user data as fallback:`,
                  userData
                );
                setUser(userData);
                setLoading(false);
                console.log(
                  `[UserContext] checkAuthStatus COMPLETE (cached fallback) - ${
                    Date.now() - startTime
                  }ms total`
                );
                return;
              } catch (e) {
                console.error(
                  `[UserContext] Failed to parse cached user data:`,
                  e
                );
              }
            }
          }
        } catch (profileError: any) {
          const totalTime = Date.now() - startTime;
          console.error(
            `[UserContext] ❌ Profile fetch error after ${totalTime}ms:`,
            profileError
          );
          if (
            profileError.name === "TimeoutError" ||
            profileError.name === "AbortError"
          ) {
            console.error(
              `[UserContext] ⏱️ Profile fetch TIMED OUT after ${totalTime}ms - using cached data`
            );
            // Use cached data if API times out
            const cachedUserData = localStorage.getItem("user_data");
            if (cachedUserData) {
              try {
                const userData = JSON.parse(cachedUserData);
                console.log(
                  `[UserContext] Using cached user data after timeout:`,
                  userData
                );
                setUser(userData);
                setLoading(false);
                console.log(
                  `[UserContext] checkAuthStatus COMPLETE (cached after timeout) - ${
                    Date.now() - startTime
                  }ms total`
                );
                return;
              } catch (e) {
                console.error(
                  `[UserContext] Failed to parse cached user data:`,
                  e
                );
              }
            }
          }
        }
      }

      // Fallback: If we have a NextAuth session, use it
      if (session?.user) {
        const totalTime = Date.now() - startTime;
        console.log(
          `[UserContext] Using NextAuth session after ${totalTime}ms:`,
          session.user
        );
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
            // Use endpoint to get backend token from NextAuth session
            // NOTE: This will return 404 if user was deleted (prevents resurrection)
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
                  subscription_tier:
                    (session.user as any)?.subscription_tier || "free",
                }),
              }
            );

            // If user not found (404), user was deleted - log them out
            if (tokenResponse.status === 404) {
              console.log(
                "❌ User not found in backend - user was deleted. Logging out..."
              );
              // Clear all auth data
              localStorage.removeItem("auth_token");
              localStorage.removeItem("user_data");
              // Sign out from NextAuth
              const { signOut } = await import("next-auth/react");
              await signOut({ redirect: true, callbackUrl: "/auth/login" });
              setUser(null);
              setLoading(false);
              return;
            }

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
        console.log(
          `[UserContext] checkAuthStatus COMPLETE (NextAuth) - ${
            Date.now() - startTime
          }ms total`
        );
        return;
      }

      // Fallback to localStorage token check (token already defined above)
      const totalTime = Date.now() - startTime;
      console.log(
        `[UserContext] ⚠️ No token and no session after ${totalTime}ms, checking localStorage...`
      );
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
      const totalTime = Date.now() - startTime;
      console.error(
        `[UserContext] ❌ Error checking auth status after ${totalTime}ms:`,
        error
      );
      // Don't remove token on network errors, just log
      console.log(
        "[UserContext] Network error during auth check, keeping token"
      );
      // Ensure loading is set to false even on error
      setLoading(false);
    } finally {
      const totalTime = Date.now() - startTime;
      console.log(
        `[UserContext] checkAuthStatus FINALLY - ${totalTime}ms total`
      );
      // Double-check loading is false
      if (loading) {
        console.warn(
          `[UserContext] ⚠️ Loading still true after ${totalTime}ms, forcing to false`
        );
        setLoading(false);
      }
      console.log("🔍 Setting loading to false");
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("🔐 Attempting login for:", email);
      const response = await fetch("/api/auth/login", {
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
    localStorage.removeItem("api_test_key");
    setUser(null);
    signOut({ callbackUrl: "/" });
  };

  /**
   * Silently refresh the user session by clearing tokens and fetching fresh user data
   * This is used after payment success to ensure the session reflects the new subscription tier
   * Returns true if successful, false otherwise
   */
  const refreshSessionSilently = async (): Promise<boolean> => {
    try {
      console.log("🔄 Starting silent session refresh...");

      // Get current user email before clearing tokens
      const currentUser = user;
      const currentEmail = currentUser?.email;
      const currentToken = localStorage.getItem("auth_token");

      if (!currentEmail && !currentToken) {
        console.warn("⚠️ Cannot refresh session: no email or token found");
        return false;
      }

      // Get email from session if not available from user state
      let emailToUse = currentEmail;
      if (!emailToUse) {
        try {
          const sessionResponse = await fetch("/api/auth/session");
          const session = await sessionResponse.json();
          emailToUse = session?.user?.email;
        } catch (error) {
          console.error("❌ Failed to get email from session:", error);
          return false;
        }
      }

      if (!emailToUse) {
        console.warn("⚠️ Cannot refresh session: no email found");
        return false;
      }

      console.log("🔄 Clearing current session data...");

      // Clear current tokens and user data (silently, no redirect)
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      setUser(null);

      // Sign out from NextAuth silently (without redirect)
      try {
        await signOut({ redirect: false });
      } catch (signOutError) {
        console.warn("⚠️ NextAuth signOut error (non-critical):", signOutError);
      }

      // Wait a moment for cleanup
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("🔄 Fetching fresh user data...");

      // Now fetch fresh user data using checkAuthStatus
      // This will use NextAuth session if available, or try to get a new token
      await checkAuthStatus();

      // Verify we got fresh user data
      const freshUser = user;
      if (freshUser && freshUser.email === emailToUse) {
        console.log(
          "✅ Silent session refresh completed - user data refreshed"
        );
        console.log("   New subscription tier:", freshUser.subscription_tier);
        return true;
      } else {
        console.warn(
          "⚠️ Silent session refresh completed but user data not updated"
        );
        return false;
      }
    } catch (error) {
      console.error("❌ Error during silent session refresh:", error);
      return false;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading: loading || status === "loading",
        login,
        logout,
        checkAuthStatus,
        refreshSessionSilently,
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
