import type { Metadata } from "next";
import "./globals.css";
import LayoutClient from "@/components/layout/LayoutClient";
import { UserProvider } from "@/contexts/UserContext";
import { ViewProvider } from "@/contexts/ViewContext";
import { AlertProvider } from "@/contexts/AlertProvider";
import { MonetizationProvider } from "@/contexts/MonetizationProvider";
import AuthProvider from "@/components/providers/AuthProvider";
import Script from "next/script";

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
    "google-site-verification": "v3OpUgQr5DG7MSb3pzlkM_MpddSuZHJVyCGicmfCbFg",
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
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
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
        {/* Resource Hints - Preconnect to third-party domains (excluding Ezoic) */}
        <link
          rel="preconnect"
          href="https://pagead2.googlesyndication.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link
          rel="preconnect"
          href="https://www.googletagmanager.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link
          rel="preconnect"
          href="https://www.payfast.co.za"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://www.payfast.co.za" />
        <link
          rel="preconnect"
          href="https://sandbox.payfast.co.za"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://sandbox.payfast.co.za" />

        {/* Ezoic Privacy Scripts */}
        <script
          src="https://cmp.gatekeeperconsent.com/min.js"
          data-cfasync="false"
        ></script>
        <script
          src="https://the.gatekeeperconsent.com/cmp.min.js"
          data-cfasync="false"
        ></script>

        {/* Ezoic Header Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.ezstandalone = window.ezstandalone || {};
              ezstandalone.cmd = ezstandalone.cmd || [];
              window._ezaq = window._ezaq || [];
            `,
          }}
        />
        <script async src="//www.ezojs.com/ezoic/sa.min.js"></script>

        {/* Google AdSense - Defer loading */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3267907607581065"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />

        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png" />
        <link
          rel="icon"
          href="/icons/icon-192.png"
          sizes="192x192"
          type="image/png"
        />
        <link
          rel="icon"
          href="/icons/icon-512.png"
          sizes="512x512"
          type="image/png"
        />
        <link rel="apple-touch-icon" href="/favicon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />

        {/* Preload critical resources */}
        <link rel="preload" href="/globals.css" as="style" />
        <link rel="preload" href="/favicon.ico" as="image" />

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
      </head>
      <body>
        <AuthProvider>
          <UserProvider>
            <ViewProvider>
              <AlertProvider>
                <MonetizationProvider>
                  <LayoutClient>{children}</LayoutClient>
                </MonetizationProvider>
              </AlertProvider>
            </ViewProvider>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
