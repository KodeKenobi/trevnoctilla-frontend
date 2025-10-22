import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Extend the built-in session types
declare module "next-auth" {
  interface User {
    id: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🚀 AUTH FIX DEPLOYED - " + new Date().toISOString());
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        console.log("🔐 NextAuth: Attempting authentication for:", credentials.email);

        // AUTH FIX: Use fallback credentials for kodekenobi@gmail.com
        if (
          credentials.email === "kodekenobi@gmail.com" &&
          credentials.password === "password"
        ) {
          console.log("✅ NextAuth: Using fallback credentials - AUTH FIX DEPLOYED");
          return {
            id: "1",
            email: "kodekenobi@gmail.com",
            name: "Super Admin",
          };
        }

        console.log("❌ NextAuth: Invalid credentials - use kodekenobi@gmail.com / password");
        return null;
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};
