import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Extend the built-in session types
declare module "next-auth" {
  interface User {
    id: string;
    role: "user" | "admin" | "super_admin";
    is_active: boolean;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "user" | "admin" | "super_admin";
      is_active: boolean;
    };
  }
}

// Auth options configuration
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        console.log(
          "🔐 NextAuth: Attempting authentication for:",
          credentials.email
        );

        try {
          // Get API base URL (use localhost for development, production URL for production)
          // If NEXT_PUBLIC_API_BASE_URL is explicitly set, use it
          // Otherwise, use localhost for development, production URL for production
          const apiBaseUrl = (() => {
            if (process.env.NEXT_PUBLIC_API_BASE_URL) {
              console.log("🔧 NextAuth: Using NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
              return process.env.NEXT_PUBLIC_API_BASE_URL;
            }
            const isProduction = process.env.NODE_ENV === "production";
            const url = isProduction
              ? "https://web-production-737b.up.railway.app"
              : "http://localhost:5000";
            console.log(`🔧 NextAuth: NODE_ENV: ${process.env.NODE_ENV || "undefined"}, Using base URL: ${url}`);
            return url;
          })();
          
          console.log("🔐 NextAuth: Using API base URL:", apiBaseUrl);

          // Call backend API to verify credentials
          const response = await fetch(`${apiBaseUrl}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            console.log("❌ NextAuth: Backend authentication failed");
            return null;
          }

          const data = await response.json();

          if (data.user && data.access_token) {
            console.log("✅ NextAuth: Authentication successful");
            return {
              id: data.user.id?.toString() || data.user.email,
              email: data.user.email,
              name: data.user.email,
              role: data.user.role || "user",
              is_active: data.user.is_active !== false,
            };
          }

          console.log("❌ NextAuth: Invalid response from backend");
          return null;
        } catch (error) {
          console.error("❌ NextAuth: Error during authentication:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("🔐 NextAuth JWT: User data:", user);
        token.id = user.id;
        token.role = user.role;
        token.is_active = user.is_active;
      }
      console.log("🔐 NextAuth JWT: Token:", token);
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "user" | "admin" | "super_admin";
        session.user.is_active = token.is_active as boolean;
      }
      console.log("🔐 NextAuth Session: Session:", session);
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
