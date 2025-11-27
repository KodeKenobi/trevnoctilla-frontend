import { Metadata } from "next";
import ApiDocsClient from "./ApiDocsClient";

export const metadata: Metadata = {
  title: "API Documentation - File Processing APIs | Trevnoctilla",
  description: "Comprehensive API documentation for Trevnoctilla's file processing APIs. Convert PDFs, videos, images, and audio with our powerful REST APIs.",
  keywords: "API documentation, file processing API, PDF API, video converter API, image API, REST API, developer API",
  alternates: {
    canonical: "https://www.trevnoctilla.com/api-docs",
  },
  openGraph: {
    title: "API Documentation - File Processing APIs | Trevnoctilla",
    description: "Comprehensive API documentation for Trevnoctilla's file processing APIs. Convert PDFs, videos, images, and audio with our powerful REST APIs.",
    type: "website",
    url: "https://www.trevnoctilla.com/api-docs",
  },
};

export default function ApiDocsPage() {
  return <ApiDocsClient />;
}

