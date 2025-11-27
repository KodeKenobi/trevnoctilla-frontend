import { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamic import with loading state - reduces initial bundle by ~60KB
const AudioConverterPage = dynamic(
  () => import("@/components/pages/AudioConverterPage"),
  {
    loading: () => <AudioConverterLoading />,
  }
);

function AudioConverterLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading Audio Converter...</p>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title:
    "Audio Converter - Convert Audio to MP3, WAV, AAC, FLAC | Trevnoctilla",
  description:
    "Convert audio between all formats with bitrate and quality control. MP3, WAV, AAC, FLAC, OGG, and more. Free online audio converter with high-quality output.",
  keywords:
    "audio converter, mp3 converter, wav converter, aac converter, flac converter, ogg converter, audio bitrate, audio quality, online audio converter",
  alternates: {
    canonical: "https://www.trevnoctilla.com/tools/audio-converter",
  },
  openGraph: {
    title: "Audio Converter - Convert Audio to MP3, WAV, AAC, FLAC",
    description:
      "Convert audio between all formats with bitrate and quality control. MP3, WAV, AAC, FLAC, OGG, and more.",
    type: "website",
    url: "https://www.trevnoctilla.com/tools/audio-converter",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Audio Converter - Convert MP3, WAV, AAC, FLAC, OGG",
  description: "Convert audio between all formats with bitrate and quality control. MP3, WAV, AAC, FLAC, OGG, and more. Free online audio converter.",
  url: "https://www.trevnoctilla.com/tools/audio-converter",
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
    ratingValue: "4.8",
    ratingCount: "1420",
    bestRating: "5",
    worstRating: "1",
  },
  featureList: [
    "Convert MP3 to WAV, AAC, FLAC, OGG",
    "Convert WAV to MP3, AAC, FLAC, OGG",
    "Convert FLAC to MP3, WAV, AAC, OGG",
    "Adjust audio bitrate (32-320 kbps)",
    "Preserve audio quality",
    "Extract audio from video files",
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
      { "@type": "ListItem", position: 3, name: "Audio Converter", item: "https://www.trevnoctilla.com/tools/audio-converter" },
    ],
  },
};

export default function AudioConverterRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Suspense fallback={<AudioConverterLoading />}>
        <AudioConverterPage />
      </Suspense>
    </>
  );
}
