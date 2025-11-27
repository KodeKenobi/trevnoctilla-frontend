import LandingPage from "@/components/pages/LandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trevnoctilla - Free Online File Conversion Tools",
  description:
    "Free PDF editor and file converter — merge, split, sign and edit PDFs online. Convert videos, audio, and images across all major formats with lightning-fast, professional results.",
  keywords:
    "file converter, video converter, audio converter, image converter, pdf tools, qr generator, online converter, free tools, file conversion",
  alternates: {
    canonical: "https://www.trevnoctilla.com",
  },
  openGraph: {
    title: "Trevnoctilla - Free Online File Conversion Tools",
    description:
      "Free PDF editor and file converter — merge, split, sign and edit PDFs online. Convert videos, audio, and images across all major formats with lightning-fast, professional results.",
    type: "website",
    url: "https://www.trevnoctilla.com",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.trevnoctilla.com/#website",
      url: "https://www.trevnoctilla.com",
      name: "Trevnoctilla",
      description:
        "Free PDF editor and file converter — merge, split, sign and edit PDFs online.",
      publisher: { "@id": "https://www.trevnoctilla.com/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://www.trevnoctilla.com/tools?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://www.trevnoctilla.com/#organization",
      name: "Trevnoctilla",
      url: "https://www.trevnoctilla.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.trevnoctilla.com/logo.png",
        width: 512,
        height: 512,
      },
      sameAs: [],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@trevnoctilla.com",
        url: "https://www.trevnoctilla.com/contact",
      },
    },
    {
      "@type": "WebApplication",
      "@id": "https://www.trevnoctilla.com/#webapp",
      name: "Trevnoctilla File Converter",
      url: "https://www.trevnoctilla.com",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "PDF Merge",
        "PDF Split",
        "PDF Compress",
        "PDF to Word",
        "PDF Signing",
        "Video Conversion",
        "Audio Conversion",
        "Image Conversion",
        "QR Code Generation",
      ],
      screenshot: "https://www.trevnoctilla.com/logo.png",
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPage />
    </>
  );
}
