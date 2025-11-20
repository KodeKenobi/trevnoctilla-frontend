import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Set NEXTAUTH_URL if not already set (required for NextAuth)
if (!process.env.NEXTAUTH_URL) {
  const port = process.env.PORT || "3000";
  process.env.NEXTAUTH_URL = `http://localhost:${port}`;
}

// Set NEXTAUTH_SECRET if not already set (required for NextAuth)
// This must be set before NextAuth is initialized
if (!process.env.NEXTAUTH_SECRET) {
  // Generate a random secret for development
  // In production, this should be set as an environment variable
  process.env.NEXTAUTH_SECRET = "development-secret-key-change-in-production";
  console.warn(
    "[NextAuth] NEXTAUTH_SECRET not set, using development fallback"
  );
}

// Initialize NextAuth handler
let handler: ReturnType<typeof NextAuth>;

try {
  handler = NextAuth(authOptions);
} catch (error) {
  console.error("[NextAuth] Failed to initialize:", error);
  throw error;
}

export { handler as GET, handler as POST };
