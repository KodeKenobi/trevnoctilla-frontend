import { NextAuthOptions } from "next-auth";
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
          
          return null;
        }

        try {
          const apiBaseUrl = (() => {
            if (process.env.NEXT_PUBLIC_API_BASE_URL) {
              return process.env.NEXT_PUBLIC_API_BASE_URL;
            }
            const isProduction = process.env.NODE_ENV === "production";
            return isProduction
              ? "https://web-production-737b.up.railway.app"
              : "http://localhost:5000";
          })();

          
          

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
          
          `);

          if (!response.ok) {
            
            return null;
          }

          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            
            return null;
          }

          if (data.user && data.access_token) {
            
            return {
              id: data.user.id?.toString() || data.user.email,
              email: data.user.email,
              name: data.user.email,
              role: data.user.role || "user",
              is_active: data.user.is_active !== false,
              subscription_tier: data.user.subscription_tier || "free",
            };
          }

          
          return null;
        } catch (error) {
          
          if (error instanceof Error) {
            
            
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
        (session as any).accessToken = (token.accessToken as string) || null; // Store backend JWT token in session (may be null)
        console.log(
          `NextAuth Session: Session created for: ${
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
  debug: process.env.NODE_ENV === "development",
};

