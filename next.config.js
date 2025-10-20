const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "web-production-737b.up.railway.app", "web-production-ef253.up.railway.app"],
    unoptimized: true, // Disable image optimization for static files
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@/lib': path.resolve(__dirname, 'lib'),
    };
    return config;
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL || "https://web-production-737b.up.railway.app";

    return [
      {
        source: "/api/upload",
        destination: `${backendUrl}/`,
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
        source: "/save_html/:path*",
        destination: `${backendUrl}/save_html/:path*`,
      },
      {
        source: "/cleanup_session/:path*",
        destination: `${backendUrl}/cleanup_session/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
