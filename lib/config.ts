// API Configuration
export const API_CONFIG = {
  // Always point to hosted API by default; allow override via env
  BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    // TEMPORARY: Using localhost for testing zoom fix. Change back to Railway URL when done.
    "http://localhost:5000", // Change back to "https://web-production-737b.up.railway.app" after testing
  // "https://web-production-737b.up.railway.app",

  // API endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      PROFILE: "/auth/profile",
      RESET_PASSWORD: "/auth/reset-password",
      CHANGE_PASSWORD: "/auth/change-password",
    },
    // File conversion endpoints
    CONVERSION: {
      PDF_TO_IMAGES: "/convert/pdf-to-images",
      IMAGES_TO_PDF: "/convert/images-to-pdf",
      PDF_MERGE: "/convert/pdf-merge",
      PDF_SPLIT: "/convert/pdf-split",
      PDF_SIGN: "/convert/pdf-sign",
      PDF_EDIT: "/convert/pdf-edit",
      PDF_WATERMARK: "/convert/pdf-watermark",
      PDF_EXTRACT_TEXT: "/convert/pdf-extract-text",
      PDF_EXTRACT_IMAGES: "/convert/pdf-extract-images",
      PDF_TO_HTML: "/convert_pdf_to_word",
      VIDEO_CONVERT: "/convert/video",
      AUDIO_CONVERT: "/convert/audio",
      IMAGE_CONVERT: "/convert/image",
      QR_GENERATE: "/convert/qr-generate",
    },
    // Admin endpoints
    ADMIN: {
      USERS: "/admin/users",
      ANALYTICS: "/admin/analytics",
      SETTINGS: "/admin/settings",
    },
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};
