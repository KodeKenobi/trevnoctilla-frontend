import { Metadata } from "next";
import FeaturesClient from "./FeaturesClient";

export const metadata: Metadata = {
  title: "Features - Free PDF Editor & File Conversion Tools | Trevnoctilla",
  description:
    "Explore all features of Trevnoctilla: Edit PDFs online free, merge & split PDFs, add digital signatures, convert videos, audio & images. Browser-based tools with no installation required.",
  keywords: [
    "online PDF editor features",
    "free pdf editing tools",
    "browser pdf tools",
    "pdf merge features",
    "pdf split online",
    "digital signature pdf",
    "video converter features",
    "audio converter online",
    "image conversion tools",
    "file converter features",
    "pdf processing features",
    "document editing online",
    "pdf compression",
    "pdf watermark",
    "ocr text extraction",
    "qr code generator",
  ].join(", "),
  alternates: {
    canonical: "https://www.trevnoctilla.com/features",
  },
  openGraph: {
    title: "Features - Free PDF Editor & File Conversion Tools",
    description:
      "All-in-one file toolkit: Edit PDFs, merge, split, sign, convert videos, audio & images. 100% free, no registration.",
    type: "website",
    url: "https://www.trevnoctilla.com/features",
  },
  twitter: {
    card: "summary_large_image",
    title: "Features - Free PDF Editor & File Conversion Tools",
    description:
      "All-in-one file toolkit: Edit PDFs, merge, split, sign, convert videos, audio & images. 100% free, no registration.",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.trevnoctilla.com/features",
      name: "Features - Free PDF Editor & File Conversion Tools",
      description:
        "Complete feature list for Trevnoctilla's free online PDF editor and file conversion tools.",
      url: "https://www.trevnoctilla.com/features",
      isPartOf: { "@id": "https://www.trevnoctilla.com/#website" },
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
            name: "Features",
            item: "https://www.trevnoctilla.com/features",
          },
        ],
      },
    },
    {
      "@type": "ItemList",
      name: "Trevnoctilla Features",
      description: "Complete list of features available in Trevnoctilla",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "Thing",
            name: "PDF Editor",
            description: "Edit PDF files directly in your browser - add text, images, annotations",
          },
        },
        {
          "@type": "ListItem",
          position: 2,
          item: {
            "@type": "Thing",
            name: "PDF Merge & Split",
            description: "Combine multiple PDFs into one or split PDFs into separate files",
          },
        },
        {
          "@type": "ListItem",
          position: 3,
          item: {
            "@type": "Thing",
            name: "Digital Signatures",
            description: "Add legally binding digital signatures to PDF documents",
          },
        },
        {
          "@type": "ListItem",
          position: 4,
          item: {
            "@type": "Thing",
            name: "Video Converter",
            description: "Convert videos between MP4, AVI, MOV, MKV, WebM and more",
          },
        },
        {
          "@type": "ListItem",
          position: 5,
          item: {
            "@type": "Thing",
            name: "Audio Converter",
            description: "Convert audio files between MP3, WAV, FLAC, AAC, OGG and more",
          },
        },
        {
          "@type": "ListItem",
          position: 6,
          item: {
            "@type": "Thing",
            name: "Image Converter",
            description: "Convert images between JPG, PNG, WebP, GIF, BMP and more",
          },
        },
      ],
    },
  ],
};

export default function FeaturesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <FeaturesClient />
    </>
  );
}

