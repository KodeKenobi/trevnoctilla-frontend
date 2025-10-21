import type { Metadata } from "next";
import "./globals.css";
import LayoutClient from "@/components/layout/LayoutClient";
import { UserProvider } from "@/contexts/UserContext";
import { ViewProvider } from "@/contexts/ViewContext";
import { AlertProvider } from "@/contexts/AlertProvider";
import AuthProvider from "@/components/providers/AuthProvider";
import Script from "next/script";
// adConfig removed - using Google AdSense only

export const metadata: Metadata = {
  metadataBase: new URL("https://www.trevnoctilla.com"),
  title: "Trevnoctilla - Edit PDF for Free | Complete File Conversion Toolkit",
  description:
    "Free PDF editor and file converter — merge, split, sign and edit PDFs online. Convert videos, audio, and images across all major formats with lightning-fast, professional results.",
  keywords: [
    "edit PDF free",
    "PDF editor online",
    "free PDF tools",
    "video converter",
    "audio converter",
    "image converter",
    "PDF to Word",
    "PDF splitter",
    "PDF merger",
    "QR code generator",
    "file conversion",
    "online tools",
    "PDF signing",
    "PDF signature",
    "sign PDF online",
    "OCR text extraction",
    "PDF OCR",
    "text recognition",
    "PDF API",
    "file conversion API",
    "PDF processing",
    "document converter",
    "PDF watermark",
    "PDF compress",
    "merge PDF files",
    "split PDF",
    "Trevnoctilla",
  ],
  authors: [{ name: "Trevnoctilla" }],
  creator: "Trevnoctilla",
  publisher: "Trevnoctilla",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    monetag: "6a1c8e9c1dd41add268aac02d05eeaca",
    "google-site-verification": "your-google-verification-code-here",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.trevnoctilla.com",
    siteName: "Trevnoctilla",
    title:
      "Trevnoctilla - Edit PDF for Free | Complete File Conversion Toolkit",
    description:
      "Edit PDF for free with our powerful online PDF editor. Plus convert videos, audio, images, and more with professional-grade tools. No registration required - start editing PDFs instantly!",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Trevnoctilla - Edit PDF for Free",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Trevnoctilla - Edit PDF for Free | Complete File Conversion Toolkit",
    description:
      "Edit PDF for free with our powerful online PDF editor. Plus convert videos, audio, images, and more with professional-grade tools. No registration required - start editing PDFs instantly!",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/favicon.png", sizes: "180x180", type: "image/png" }],
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
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3267907607581065"
          crossorigin="anonymous"
        ></script>

        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/favicon.png" sizes="512x512" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Trevnoctilla",
              description:
                "Free PDF editor and file converter — merge, split, sign and edit PDFs online. Convert videos, audio, and images across all major formats with lightning-fast, professional results.",
              url: "https://www.trevnoctilla.com",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "PDF Editor",
                "PDF Signing",
                "OCR Text Extraction",
                "File Conversion",
                "PDF API",
                "Video Converter",
                "Audio Converter",
                "Image Converter",
                "PDF Processing",
                "Document Converter",
              ],
              author: {
                "@type": "Organization",
                name: "Trevnoctilla",
              },
            }),
          }}
        />
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
        <AuthProvider>
          <UserProvider>
            <ViewProvider>
              <AlertProvider>
                <LayoutClient>{children}</LayoutClient>
              </AlertProvider>
            </ViewProvider>
          </UserProvider>
        </AuthProvider>
        <Script
          id="propeller-ads"
          strategy="afterInteractive"
          src={PROPELLER_ADS_URL}
        />
      </body>
    </html>
  );
}
