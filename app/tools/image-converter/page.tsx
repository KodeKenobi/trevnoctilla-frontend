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
    "image converter, jpg converter, png converter, webp converter, gif converter, image resize, image quality, online image converter",
  openGraph: {
    title: "Image Converter - Convert Images to JPG, PNG, WEBP, GIF",
    description:
      "Convert images between all formats with resize and quality control. JPG, PNG, WEBP, GIF, and more.",
    type: "website",
  },
};

export default function ImageConverterRoute() {
  return (
    <Suspense fallback={<ImageConverterLoading />}>
      <ImageConverterPage />
    </Suspense>
  );
}
