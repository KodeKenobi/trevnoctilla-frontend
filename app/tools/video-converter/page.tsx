import { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamic import with loading state - reduces initial bundle by ~80KB
const VideoConverterPage = dynamic(
  () => import("@/components/pages/VideoConverterPage"),
  {
    loading: () => <VideoConverterLoading />,
  }
);

function VideoConverterLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading Video Converter...</p>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title:
    "Video Converter - Convert Videos to MP4, AVI, MOV, MKV | Trevnoctilla",
  description:
    "Convert videos between all formats with compression and quality control. MP4, AVI, MOV, MKV, WEBM, and more. Free online video converter with high-quality output.",
  keywords:
    "video converter, mp4 converter, avi converter, mov converter, mkv converter, webm converter, video compression, video quality, online video converter",
  alternates: {
    canonical: "https://www.trevnoctilla.com/tools/video-converter",
  },
  openGraph: {
    title: "Video Converter - Convert Videos to MP4, AVI, MOV, MKV",
    description:
      "Convert videos between all formats with compression and quality control. MP4, AVI, MOV, MKV, WEBM, and more.",
    type: "website",
    url: "https://www.trevnoctilla.com/tools/video-converter",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Video Converter - Convert MP4, AVI, MOV, MKV, WEBM",
  description:
    "Convert videos between all formats with compression and quality control. MP4, AVI, MOV, MKV, WEBM, and more. Free online video converter.",
  url: "https://www.trevnoctilla.com/tools/video-converter",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "Convert MP4 to AVI, MOV, MKV, WEBM",
    "Convert AVI to MP4, MOV, MKV, WEBM",
    "Convert MOV to MP4, AVI, MKV, WEBM",
    "Adjust video quality and bitrate",
    "Compress videos without losing quality",
    "Support for 4K and HD videos",
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
        name: "Video Converter",
        item: "https://www.trevnoctilla.com/tools/video-converter",
      },
    ],
  },
};

export default function VideoConverterRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Suspense fallback={<VideoConverterLoading />}>
        <VideoConverterPage />
      </Suspense>
    </>
  );
}
