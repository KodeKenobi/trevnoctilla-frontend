import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Create response
    const response = NextResponse.next();

    // Security Headers
    // Content Security Policy - Allow Ezoic scripts but restrict others
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cmp.gatekeeperconsent.com https://the.gatekeeperconsent.com https://www.ezojs.com https://pagead2.googlesyndication.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.railway.app https://*.trevnoctilla.com https://www.payfast.co.za https://sandbox.payfast.co.za https://www.googletagmanager.com https://www.google-analytics.com",
      "frame-src 'self' https://www.payfast.co.za https://sandbox.payfast.co.za",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    response.headers.set("Content-Security-Policy", csp);

    // Strict Transport Security
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );

    // Cross-Origin-Opener-Policy
    response.headers.set(
      "Cross-Origin-Opener-Policy",
      "same-origin-allow-popups"
    );

    // Cross-Origin-Embedder-Policy
    response.headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");

    // X-Frame-Options (backup for older browsers)
    response.headers.set("X-Frame-Options", "SAMEORIGIN");

    // X-Content-Type-Options
    response.headers.set("X-Content-Type-Options", "nosniff");

    // Referrer-Policy
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions-Policy
    response.headers.set(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=(self)"
    );

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const publicRoutes = [
          "/",
          "/auth/login",
          "/auth/register",
          "/auth/reset-password",
          "/privacy",
          "/terms",
          "/cookies",
          "/tools",
          "/api-docs",
        ];
        const isPublicRoute = publicRoutes.some((route) =>
          req.nextUrl.pathname.startsWith(route)
        );

        // Allow all API routes (including analytics)
        const isApiRoute = req.nextUrl.pathname.startsWith("/api/");

        if (isPublicRoute || isApiRoute) {
          return true;
        }

        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/enterprise/:path*",
    "/api/protected/:path*",
    // Apply security headers to all routes except analytics API routes
    "/((?!_next/static|_next/image|favicon.ico|api/analytics).*)",
  ],
};
