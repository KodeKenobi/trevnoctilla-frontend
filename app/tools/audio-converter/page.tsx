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
  openGraph: {
    title: "Audio Converter - Convert Audio to MP3, WAV, AAC, FLAC",
    description:
      "Convert audio between all formats with bitrate and quality control. MP3, WAV, AAC, FLAC, OGG, and more.",
    type: "website",
  },
};

export default function AudioConverterRoute() {
  return (
    <Suspense fallback={<AudioConverterLoading />}>
      <AudioConverterPage />
    </Suspense>
  );
}
