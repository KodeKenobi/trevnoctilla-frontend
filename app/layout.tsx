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
  title: "Trevnoctilla - Free Online PDF Editor | Mobile Friendly Tools",
  description:
    "Free online PDF editor and file converter - no download, no signup, no credit card. Mobile-friendly. Convert videos, audio, images instantly in your browser.",
  keywords: [
    // High-volume primary keywords (what users actually search)
    "free pdf editor",
    "free online pdf editor",
    "edit pdf online for free",
    "edit pdf",
    "edit pdf for free",
    "edit pdf for free on mobile",
    "mobile pdf editor",
    "online mobile pdf editor",
    "pdf editor free",
    "online pdf editor",
    "pdf editor online",
    // Mobile-specific
    "mobile friendly pdf editor",
    "free pdf editor mobile",
    "mobile pdf editor free",
    "mobile pdf editor online free",
    "edit pdf on mobile",
    "edit pdf on phone",
    // No download/signup (unique differentiators)
    "online pdf editor no download",
    "no download pdf editor mobile",
    "online pdf tools no signup",
    "online file converter no signup",
    "no signup file converter mobile",
    // File converters
    "free video converter mobile",
    "mobile friendly file converter",
    "online audio converter free",
    "free image converter mobile",
    "free document converter mobile",
    "mobile friendly instant converter",
    "online instant converter free",
    // Additional tools
    "online tools no account mobile",
    "free online pdf editor mobile",
    // Brand
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
    title: "Trevnoctilla - Browser-Based File Converter | No Download Required",
    description:
      "Free browser-based PDF editor and file converter — no download, no signup. Convert videos, audio, images instantly in your web browser. Perfect for students, developers, and mobile users.",
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
    title: "Trevnoctilla - Browser-Based File Converter | No Download Required",
    description:
      "Free browser-based PDF editor and file converter — no download, no signup. Convert videos, audio, images instantly in your web browser. Perfect for students, developers, and mobile users.",
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
        {/* Critical Resource Hints - Limited to 4 most important for performance */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />

        {/* Favicon links */}
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

        {/* Structured Data - Critical for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Trevnoctilla",
              description:
                "Free online PDF editor and file converter - no download, no signup, no credit card. Mobile-friendly. Convert videos, audio, images instantly in your browser.",
              url: "https://www.trevnoctilla.com",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Browser PDF Editor",
                "Instant PDF Signing",
                "Browser OCR Text Extraction",
                "Instant File Conversion",
                "Browser PDF API",
                "Browser Video Converter",
                "Browser Audio Converter",
                "Browser Image Converter",
                "Cloud PDF Processing",
                "Browser Document Converter",
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

        {/* === NON-BLOCKING SCRIPTS - Loaded after page is interactive === */}

        {/* Ezoic initialization - lazyOnload for non-blocking */}
        <Script id="ezoic-init" strategy="lazyOnload">
          {`
            window.ezstandalone = window.ezstandalone || {};
            ezstandalone.cmd = ezstandalone.cmd || [];
            window._ezaq = window._ezaq || [];
          `}
        </Script>

        {/* Ezoic Scripts - lazyOnload */}
        <Script
          src="https://cmp.gatekeeperconsent.com/min.js"
          strategy="lazyOnload"
          data-cfasync="false"
        />
        <Script
          src="https://the.gatekeeperconsent.com/cmp.min.js"
          strategy="lazyOnload"
          data-cfasync="false"
        />
        <Script src="//www.ezojs.com/ezoic/sa.min.js" strategy="lazyOnload" />

        {/* Google AdSense - lazyOnload */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3267907607581065"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />

        {/* Google Analytics - afterInteractive for better tracking accuracy */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}');
          `}
        </Script>
      </body>
    </html>
  );
}
