import { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamic import with loading state - reduces initial bundle by ~40KB
const QRGeneratorPage = dynamic(
  () => import("@/components/pages/QRGeneratorPage"),
  {
    loading: () => <QRGeneratorLoading />,
  }
);

function QRGeneratorLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading QR Generator...</p>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title:
    "QR Code Generator - Create QR Codes for URLs, Text, WiFi | Trevnoctilla",
  description:
    "Generate QR codes for URLs, text, WiFi, contact info, and more. Free online QR code generator with customizable design and high-quality output.",
  keywords:
    "qr code generator, qr code creator, qr code maker, qr code for url, qr code for wifi, qr code for text, online qr generator",
  openGraph: {
    title: "QR Code Generator - Create QR Codes for URLs, Text, WiFi",
    description:
      "Generate QR codes for URLs, text, WiFi, contact info, and more. Free online QR code generator.",
    type: "website",
  },
};

export default function QRGeneratorRoute() {
  return (
    <Suspense fallback={<QRGeneratorLoading />}>
      <QRGeneratorPage />
    </Suspense>
  );
}
