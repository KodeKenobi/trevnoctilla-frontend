import type { Metadata } from "next";
import "./globals.css";
import LayoutClient from "@/components/layout/LayoutClient";
import { UserProvider } from "@/contexts/UserContext";
import { ViewProvider } from "@/contexts/ViewContext";
import { AlertProvider } from "@/contexts/AlertProvider";
import Script from "next/script";
import { PROPELLER_ADS_URL } from "../lib/adConfig";

export const metadata: Metadata = {
  title: "Trevnoctilla - Complete PDF Toolkit",
  description:
    "Transform, edit, and optimize your PDFs with professional-grade tools in a sleek, modern interface.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/favicon.png" sizes="512x512" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log("🔍 Favicon debugging:");
              console.log("Current origin:", window.location.origin);
              console.log("Favicon.png URL:", window.location.origin + "/favicon.png");
              console.log("Logo.png URL:", window.location.origin + "/logo.png");
              
              // Test if files exist
              fetch("/favicon.png")
                .then(response => console.log("✅ Favicon.png status:", response.status))
                .catch(error => console.error("❌ Favicon.png error:", error));
                
              fetch("/logo.png")
                .then(response => console.log("✅ Logo.png status:", response.status))
                .catch(error => console.error("❌ Logo.png error:", error));
            `,
          }}
        />
      </head>
      <body>
        <UserProvider>
          <ViewProvider>
            <AlertProvider>
              <LayoutClient>{children}</LayoutClient>
            </AlertProvider>
          </ViewProvider>
        </UserProvider>
        <Script
          id="propeller-ads"
          strategy="afterInteractive"
          src={PROPELLER_ADS_URL}
        />
      </body>
    </html>
  );
}
