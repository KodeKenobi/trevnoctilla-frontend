import { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamic import with loading state - reduces initial bundle by ~100KB
const PDFTools = dynamic(
  () => import("@/components/pages/tools/pdf-tools/PDFTools"),
  {
    loading: () => <PDFToolsLoading />,
  }
);

function PDFToolsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading PDF Tools...</p>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "PDF Tools - Extract Text, Merge, Split, Sign PDFs | Trevnoctilla",
  description:
    "Comprehensive PDF processing: extract text/images, merge, split, sign, watermark, and compress PDFs. Free online PDF tools with advanced features.",
  keywords:
    "pdf tools, pdf extractor, pdf merger, pdf splitter, pdf signature, pdf watermark, pdf compressor, pdf editor, online pdf tools",
  alternates: {
    canonical: "https://www.trevnoctilla.com/tools/pdf-tools",
  },
  openGraph: {
    title: "PDF Tools - Extract Text, Merge, Split, Sign PDFs",
    description:
      "Comprehensive PDF processing: extract text/images, merge, split, sign, watermark, and compress PDFs.",
    type: "website",
    url: "https://www.trevnoctilla.com/tools/pdf-tools",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PDF Tools - Merge, Split, Compress, Sign PDFs",
  description:
    "Comprehensive PDF processing: extract text/images, merge, split, sign, watermark, and compress PDFs. Free online PDF tools.",
  url: "https://www.trevnoctilla.com/tools/pdf-tools",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "Merge multiple PDFs into one",
    "Split PDF into individual pages",
    "Extract text from PDF with OCR",
    "Extract images from PDF",
    "Add digital signatures",
    "Add watermarks",
    "Compress PDF files",
    "Convert PDF to Word",
    "Convert Word to PDF",
    "Convert PDF to Images",
  ],
  screenshot: "https://www.trevnoctilla.com/logo.png",
  softwareVersion: "1.0",
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
        name: "PDF Tools",
        item: "https://www.trevnoctilla.com/tools/pdf-tools",
      },
    ],
  },
};

export default function PDFToolsRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Suspense fallback={<PDFToolsLoading />}>
        <PDFTools />
      </Suspense>
    </>
  );
}
