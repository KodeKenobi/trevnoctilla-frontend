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
  openGraph: {
    title: "Video Converter - Convert Videos to MP4, AVI, MOV, MKV",
    description:
      "Convert videos between all formats with compression and quality control. MP4, AVI, MOV, MKV, WEBM, and more.",
    type: "website",
  },
};

export default function VideoConverterRoute() {
  return (
    <Suspense fallback={<VideoConverterLoading />}>
      <VideoConverterPage />
    </Suspense>
  );
}
