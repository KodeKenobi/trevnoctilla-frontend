import ToolsPage from "@/components/pages/ToolsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Free Online Tools - Video, Audio, Image, PDF Converters | Trevnoctilla",
  description:
    "Free online tools for video conversion, audio conversion, image conversion, PDF processing, and QR code generation. High-quality, fast, and secure file conversion tools.",
  keywords:
    "online tools, video converter, audio converter, image converter, pdf tools, qr generator, file converter, free tools, online converter",
  alternates: {
    canonical: "https://www.trevnoctilla.com/tools",
  },
  openGraph: {
    title: "Free Online Tools - Video, Audio, Image, PDF Converters",
    description:
      "Free online tools for video conversion, audio conversion, image conversion, PDF processing, and QR code generation.",
    type: "website",
    url: "https://www.trevnoctilla.com/tools",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://www.trevnoctilla.com/tools",
  name: "Free Online Tools - Video, Audio, Image, PDF Converters",
  description: "Free online tools for video conversion, audio conversion, image conversion, PDF processing, and QR code generation.",
  url: "https://www.trevnoctilla.com/tools",
  isPartOf: { "@id": "https://www.trevnoctilla.com/#website" },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.trevnoctilla.com" },
      { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.trevnoctilla.com/tools" },
    ],
  },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "SoftwareApplication",
          name: "Video Converter",
          url: "https://www.trevnoctilla.com/tools/video-converter",
          applicationCategory: "MultimediaApplication",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@type": "SoftwareApplication",
          name: "Audio Converter",
          url: "https://www.trevnoctilla.com/tools/audio-converter",
          applicationCategory: "MultimediaApplication",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      },
      {
        "@type": "ListItem",
        position: 3,
        item: {
          "@type": "SoftwareApplication",
          name: "Image Converter",
          url: "https://www.trevnoctilla.com/tools/image-converter",
          applicationCategory: "MultimediaApplication",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      },
      {
        "@type": "ListItem",
        position: 4,
        item: {
          "@type": "SoftwareApplication",
          name: "PDF Tools",
          url: "https://www.trevnoctilla.com/tools/pdf-tools",
          applicationCategory: "UtilitiesApplication",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      },
      {
        "@type": "ListItem",
        position: 5,
        item: {
          "@type": "SoftwareApplication",
          name: "QR Code Generator",
          url: "https://www.trevnoctilla.com/tools/qr-generator",
          applicationCategory: "UtilitiesApplication",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      },
    ],
  },
};

export default function ToolsRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ToolsPage />
    </>
  );
}
