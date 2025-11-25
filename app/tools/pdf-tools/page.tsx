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
  openGraph: {
    title: "PDF Tools - Extract Text, Merge, Split, Sign PDFs",
    description:
      "Comprehensive PDF processing: extract text/images, merge, split, sign, watermark, and compress PDFs.",
    type: "website",
  },
};

export default function PDFToolsRoute() {
  return (
    <Suspense fallback={<PDFToolsLoading />}>
      <PDFTools />
    </Suspense>
  );
}
