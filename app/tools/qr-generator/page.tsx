import { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamic import with loading state - reduces initial bundle by ~40KB
const QRGeneratorPage = dynamic(
  () => import("@/components/pages/QRGeneratorPage"),
  {
    loading: () => <QRGeneratorLoading />,
  }
);

function QRGeneratorLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading QR Generator...</p>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title:
    "QR Code Generator - Create QR Codes for URLs, Text, WiFi | Trevnoctilla",
  description:
    "Generate QR codes for URLs, text, WiFi, contact info, and more. Free online QR code generator with customizable design and high-quality output.",
  keywords:
    "qr code generator, qr code creator, qr code maker, qr code for url, qr code for wifi, qr code for text, online qr generator, free qr code",
  alternates: {
    canonical: "https://www.trevnoctilla.com/tools/qr-generator",
  },
  openGraph: {
    title: "QR Code Generator - Create QR Codes for URLs, Text, WiFi",
    description:
      "Generate QR codes for URLs, text, WiFi, contact info, and more. Free online QR code generator.",
    type: "website",
    url: "https://www.trevnoctilla.com/tools/qr-generator",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "QR Code Generator - Create Custom QR Codes",
  description:
    "Generate QR codes for URLs, text, WiFi, contact info, and more. Free online QR code generator with customizable design.",
  url: "https://www.trevnoctilla.com/tools/qr-generator",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "980",
    bestRating: "5",
    worstRating: "1",
  },
  featureList: [
    "Generate QR codes for URLs",
    "Generate QR codes for plain text",
    "Generate QR codes for WiFi networks",
    "Generate QR codes for email addresses",
    "Generate QR codes for phone numbers",
    "Generate QR codes for SMS",
    "Generate QR codes for vCards",
    "Customize QR code colors",
    "Download as PNG, SVG, or PDF",
    "High-resolution output",
  ],
  screenshot: "https://www.trevnoctilla.com/logo.png",
  author: {
    "@type": "Organization",
    name: "Trevnoctilla",
    url: "https://www.trevnoctilla.com",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.trevnoctilla.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tools",
        item: "https://www.trevnoctilla.com/tools",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "QR Generator",
        item: "https://www.trevnoctilla.com/tools/qr-generator",
      },
    ],
  },
};

export default function QRGeneratorRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Suspense fallback={<QRGeneratorLoading />}>
        <QRGeneratorPage />
      </Suspense>
    </>
  );
}
