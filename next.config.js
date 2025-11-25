const path = require("path");

// Set NEXTAUTH_URL for NextAuth if not already set
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

// Set NEXTAUTH_SECRET for NextAuth if not already set
// In production runtime, this MUST be set as an environment variable in Railway
// During build, Railway env vars may not be available, so we use a fallback
// The runtime check happens in app/api/auth/[...nextauth]/route.ts
if (!process.env.NEXTAUTH_SECRET) {
  // Use fallback during build (Railway env vars available at runtime)
  process.env.NEXTAUTH_SECRET = "development-secret-key-change-in-production";
  // Only warn in development, not during build (to reduce noise)
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[NextAuth] Using development NEXTAUTH_SECRET. Set NEXTAUTH_SECRET in production!"
    );
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "localhost",
      "web-production-737b.up.railway.app",
      "web-production-ef253.up.railway.app",
    ],
    unoptimized: false, // Enable image optimization for better performance
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  // Compress output
  compress: true,
  // Optimize production builds
  swcMinify: true,
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
      "@/lib": path.resolve(__dirname, "lib"),
    };
    return config;
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL || "https://web-production-737b.up.railway.app";

    return [
      // File upload and processing
      {
        source: "/api/upload",
        destination: `${backendUrl}/api/upload`,
      },
      {
        source: "/convert/:path*",
        destination: `${backendUrl}/convert/:path*`,
      },
      {
        source: "/editor/:path*",
        destination: `${backendUrl}/editor/:path*`,
      },
      {
        source: "/api/pdf_info/:path*",
        destination: `${backendUrl}/api/pdf_info/:path*`,
      },
      {
        source: "/api/pdf_thumbnail/:path*",
        destination: `${backendUrl}/api/pdf_thumbnail/:path*`,
      },
      {
        source: "/view_html/:path*",
        destination: `${backendUrl}/view_html/:path*`,
      },
      {
        source: "/download_converted/:path*",
        destination: `${backendUrl}/download_converted/:path*`,
      },
      {
        source: "/preview_html/:path*",
        destination: `${backendUrl}/preview_html/:path*`,
      },
      {
        source: "/save_html/:path*",
        destination: `${backendUrl}/save_html/:path*`,
      },
      {
        source: "/cleanup_session/:path*",
        destination: `${backendUrl}/cleanup_session/:path*`,
      },
      // PDF operations
      {
        source: "/get_page_count",
        destination: `${backendUrl}/get_page_count`,
      },
      {
        source: "/pdf_preview",
        destination: `${backendUrl}/pdf_preview`,
      },
      {
        source: "/split_pdf",
        destination: `${backendUrl}/split_pdf`,
      },
      {
        source: "/download_split/:path*",
        destination: `${backendUrl}/download_split/:path*`,
      },
      {
        source: "/view_split/:path*",
        destination: `${backendUrl}/view_split/:path*`,
      },
      {
        source: "/extract_text",
        destination: `${backendUrl}/extract_text`,
      },
      {
        source: "/extract_images",
        destination: `${backendUrl}/extract_images`,
      },
      {
        source: "/merge_pdfs",
        destination: `${backendUrl}/merge_pdfs`,
      },
      {
        source: "/download_merged/:path*",
        destination: `${backendUrl}/download_merged/:path*`,
      },
      {
        source: "/add_signature",
        destination: `${backendUrl}/add_signature`,
      },
      {
        source: "/add_watermark",
        destination: `${backendUrl}/add_watermark`,
      },
      {
        source: "/download_watermarked/:path*",
        destination: `${backendUrl}/download_watermarked/:path*`,
      },
      {
        source: "/download_signed/:path*",
        destination: `${backendUrl}/download_signed/:path*`,
      },
      {
        source: "/save_edits/:path*",
        destination: `${backendUrl}/save_edits/:path*`,
      },
      {
        source: "/download_pdf/:path*",
        destination: `${backendUrl}/download_pdf/:path*`,
      },
      {
        source: "/download_edited/:path*",
        destination: `${backendUrl}/download_edited/:path*`,
      },
      {
        source: "/download_images/:path*",
        destination: `${backendUrl}/download_images/:path*`,
      },
      // Conversion endpoints
      {
        source: "/convert_pdf_to_word",
        destination: `${backendUrl}/convert_pdf_to_word`,
      },
      {
        source: "/convert_word_to_pdf",
        destination: `${backendUrl}/convert_word_to_pdf`,
      },
      {
        source: "/convert_html_to_pdf",
        destination: `${backendUrl}/convert_html_to_pdf`,
      },
      {
        source: "/convert_image_to_pdf",
        destination: `${backendUrl}/convert_image_to_pdf`,
      },
      {
        source: "/convert_pdf_to_images",
        destination: `${backendUrl}/convert_pdf_to_images`,
      },
      {
        source: "/convert_pdf_to_html",
        destination: `${backendUrl}/convert_pdf_to_html`,
      },
      {
        source: "/compress_pdf",
        destination: `${backendUrl}/compress_pdf`,
      },
      {
        source: "/download_compressed/:path*",
        destination: `${backendUrl}/download_compressed/:path*`,
      },
      {
        source: "/save_edit_fill_sign/:path*",
        destination: `${backendUrl}/save_edit_fill_sign/:path*`,
      },
      // Video/Audio conversion
      {
        source: "/convert-video",
        destination: `${backendUrl}/convert-video`,
      },
      {
        source: "/conversion_progress/:path*",
        destination: `${backendUrl}/conversion_progress/:path*`,
      },
      {
        source: "/video-progress/:path*",
        destination: `${backendUrl}/video-progress/:path*`,
      },
      {
        source: "/download_converted_video/:path*",
        destination: `${backendUrl}/download_converted_video/:path*`,
      },
      {
        source: "/download-video/:path*",
        destination: `${backendUrl}/download-video/:path*`,
      },
      {
        source: "/cancel_conversion/:path*",
        destination: `${backendUrl}/cancel_conversion/:path*`,
      },
      {
        source: "/convert-audio",
        destination: `${backendUrl}/convert-audio`,
      },
      {
        source: "/download_converted_audio/:path*",
        destination: `${backendUrl}/download_converted_audio/:path*`,
      },
      {
        source: "/convert-image",
        destination: `${backendUrl}/convert-image`,
      },
      {
        source: "/generate-qr",
        destination: `${backendUrl}/generate-qr`,
      },
      {
        source: "/download/:path*",
        destination: `${backendUrl}/download/:path*`,
      },
      // Cleanup
      {
        source: "/cleanup-file",
        destination: `${backendUrl}/cleanup-file`,
      },
      {
        source: "/cleanup-session",
        destination: `${backendUrl}/cleanup-session`,
      },
      {
        source: "/cleanup-all",
        destination: `${backendUrl}/cleanup-all`,
      },
      // Auth endpoints
      {
        source: "/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
      // API v1 endpoints
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      // Client API endpoints
      {
        source: "/api/client/:path*",
        destination: `${backendUrl}/api/client/:path*`,
      },
      // Admin API endpoints
      {
        source: "/api/admin/:path*",
        destination: `${backendUrl}/api/admin/:path*`,
      },
      // Payment API endpoints
      {
        source: "/api/payment/:path*",
        destination: `${backendUrl}/api/payment/:path*`,
      },
      // Analytics API endpoints
      {
        source: "/api/analytics/:path*",
        destination: `${backendUrl}/api/analytics/:path*`,
      },
      // Health check
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
      // Test endpoints (for development)
      {
        source: "/test/:path*",
        destination: `${backendUrl}/test/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/ads.txt",
        destination: "https://srv.adstxtmanager.com/19390/trevnoctilla.com",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
