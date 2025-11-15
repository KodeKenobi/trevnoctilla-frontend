import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Auth options configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("[NextAuth] Missing credentials");
          return null;
        }

        try {
          // Get API base URL (use localhost for development, production URL for production)
          // If NEXT_PUBLIC_API_BASE_URL is explicitly set, use it
          // Otherwise, use localhost for development, production URL for production
          const apiBaseUrl = (() => {
            if (process.env.NEXT_PUBLIC_API_BASE_URL) {
              return process.env.NEXT_PUBLIC_API_BASE_URL;
            }
            const isProduction = process.env.NODE_ENV === "production";
            return isProduction
              ? "https://web-production-737b.up.railway.app"
              : "http://localhost:5000";
          })();

          console.log(`[NextAuth] Attempting login for: ${credentials.email}`);
          console.log(`[NextAuth] API Base URL: ${apiBaseUrl}`);

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

          const responseText = await response.text();
          console.log(`[NextAuth] Response status: ${response.status}`);
          console.log(
            `[NextAuth] Response body: ${responseText.substring(0, 200)}`
          );

          if (!response.ok) {
            console.error(
              `[NextAuth] Backend auth failed: ${response.status} - ${responseText}`
            );
            return null;
          }

          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error(`[NextAuth] Failed to parse response: ${parseError}`);
            return null;
          }

          if (data.user && data.access_token) {
            console.log(
              `[NextAuth] Authentication successful for: ${data.user.email}`
            );
            return {
              id: data.user.id?.toString() || data.user.email,
              email: data.user.email,
              name: data.user.email,
              role: data.user.role || "user",
              is_active: data.user.is_active !== false,
              subscription_tier: data.user.subscription_tier || "free",
            };
          }

          console.error(`[NextAuth] Invalid response structure:`, data);
          return null;
        } catch (error) {
          console.error("[NextAuth] Error during authentication:", error);
          if (error instanceof Error) {
            console.error("[NextAuth] Error message:", error.message);
            console.error("[NextAuth] Error stack:", error.stack);
          }
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
        console.log(`[NextAuth JWT] Setting user data for: ${user.email}`);
        token.id = user.id;
        token.role = user.role;
        token.is_active = user.is_active;
        token.subscription_tier = (user as any).subscription_tier || "free";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "user" | "admin" | "super_admin";
        session.user.is_active = token.is_active as boolean;
        (session.user as any).subscription_tier =
          (token.subscription_tier as string) || "free";
        console.log(
          `[NextAuth Session] Session created for: ${
            session.user.email
          } (tier: ${(session.user as any).subscription_tier})`
        );
      }
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
