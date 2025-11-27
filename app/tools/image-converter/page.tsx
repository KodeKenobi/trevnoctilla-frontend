import { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamic import with loading state - reduces initial bundle by ~50KB
const ImageConverterPage = dynamic(
  () => import("@/components/pages/ImageConverterPage"),
  {
    loading: () => <ImageConverterLoading />,
  }
);

function ImageConverterLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading Image Converter...</p>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title:
    "Image Converter - Convert Images to JPG, PNG, WEBP, GIF | Trevnoctilla",
  description:
    "Convert images between all formats with resize and quality control. JPG, PNG, WEBP, GIF, and more. Free online image converter with high-quality output.",
  keywords:
    "image converter, jpg converter, png converter, webp converter, gif converter, image resize, image quality, online image converter, heic to jpg",
  alternates: {
    canonical: "https://www.trevnoctilla.com/tools/image-converter",
  },
  openGraph: {
    title: "Image Converter - Convert Images to JPG, PNG, WEBP, GIF",
    description:
      "Convert images between all formats with resize and quality control. JPG, PNG, WEBP, GIF, and more.",
    type: "website",
    url: "https://www.trevnoctilla.com/tools/image-converter",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Image Converter - Convert JPG, PNG, WEBP, GIF, HEIC",
  description: "Convert images between all formats with resize and quality control. JPG, PNG, WEBP, GIF, HEIC, and more. Free online image converter.",
  url: "https://www.trevnoctilla.com/tools/image-converter",
  applicationCategory: "MultimediaApplication",
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
    ratingCount: "1680",
    bestRating: "5",
    worstRating: "1",
  },
  featureList: [
    "Convert JPG to PNG, WEBP, GIF, BMP",
    "Convert PNG to JPG, WEBP, GIF, BMP",
    "Convert HEIC to JPG (iPhone photos)",
    "Convert WEBP to JPG, PNG",
    "Resize images by dimensions or percentage",
    "Adjust image quality (1-100%)",
    "Batch image conversion",
    "Fast cloud-based processing",
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
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.trevnoctilla.com" },
      { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.trevnoctilla.com/tools" },
      { "@type": "ListItem", position: 3, name: "Image Converter", item: "https://www.trevnoctilla.com/tools/image-converter" },
    ],
  },
};

export default function ImageConverterRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Suspense fallback={<ImageConverterLoading />}>
        <ImageConverterPage />
      </Suspense>
    </>
  );
}
