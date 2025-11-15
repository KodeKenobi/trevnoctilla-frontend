import LandingPage from "@/components/pages/LandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trevnoctilla - Free Online File Conversion Tools",
  description:
    "Free PDF editor and file converter — merge, split, sign and edit PDFs online. Convert videos, audio, and images across all major formats with lightning-fast, professional results.",
  keywords:
    "file converter, video converter, audio converter, image converter, pdf tools, qr generator, online converter, free tools, file conversion",
  openGraph: {
    title: "Trevnoctilla - Free Online File Conversion Tools",
    description:
      "Free PDF editor and file converter — merge, split, sign and edit PDFs online. Convert videos, audio, and images across all major formats with lightning-fast, professional results.",
    type: "website",
  },
};

export default function Home() {
  return <LandingPage />;
}
