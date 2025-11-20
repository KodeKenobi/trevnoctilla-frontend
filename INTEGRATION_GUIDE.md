# API Integration Guide

## Complete Flow: Sign Up → Get API Key → Use in Your App

### Step 1: User Authentication (Frontend)

Users sign up and log in through your website using NextAuth:

```typescript
// Your app - login flow
import { signIn } from "next-auth/react";

// User logs in
await signIn("credentials", {
  email: "user@example.com",
  password: "password123",
  redirect: false,
});
```

### Step 2: Generate API Key (One-time setup)

After login, user generates API key from dashboard:

1. Navigate to `/dashboard`
2. Go to Settings tab
3. Generate new API key
4. Copy the key (e.g., `jpk_abc123xyz456...`)

**OR** programmatically via API:

```javascript
// Generate API key programmatically
// Use relative URL - Next.js rewrites proxy to backend (Railway URL is hidden)
const response = await fetch("/api/client/keys", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_BACKEND_JWT_TOKEN", // From login
  },
  body: JSON.stringify({
    name: "My App Key",
    rate_limit: 1000,
  }),
});

const { key } = await response.json();
// Store this key securely: key = 'jpk_abc123xyz456...'
```

### Step 3: Use API in Your Application

#### Example: PDF Text Extraction Website

**Frontend (React/Next.js):**

```tsx
"use client";

import { useState } from "react";

export default function PDFTextExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Your API key - store this securely (env variable or user setting)
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "your-api-key-here";

  const handleExtractText = async () => {
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Use relative URL - Next.js rewrites proxy to backend (Railway URL is hidden)
      const response = await fetch("/api/v1/convert/pdf-extract-text", {
        method: "POST",
        headers: {
          "X-API-Key": API_KEY, // Your API key here
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Response structure:
      // {
      //   "job_id": "...",
      //   "status": "completed",
      //   "message": "Text extracted successfully",
      //   "text": "Actual extracted text...",
      //   "text_length": 1523,
      //   "processing_time": 1.058
      // }

      setExtractedText(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract text");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">PDF Text Extractor</h1>

      <div className="mb-4">
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border rounded p-2"
        />
        <button
          onClick={handleExtractText}
          disabled={loading || !file}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Extracting..." : "Extract Text"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {extractedText && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Extracted Text:</h2>
          <div className="border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap">{extractedText}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Backend (Node.js/Express):**

```javascript
const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });
const API_KEY = process.env.TREVNOCTILLA_API_KEY; // Store in environment variables
// Use your frontend domain - Next.js rewrites proxy to backend (Railway URL is hidden)
const API_BASE_URL = process.env.TREVNOCTILLA_API_BASE_URL || "https://trevnoctilla.com";

app.post("/extract-pdf-text", upload.single("pdf"), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));

    const response = await fetch(
      `${API_BASE_URL}/api/v1/convert/pdf-extract-text`,
      {
        method: "POST",
        headers: {
          "X-API-Key": API_KEY,
        },
        body: formData,
      }
    );

    const data = await response.json();

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (data.status === "completed") {
      res.json({
        success: true,
        text: data.text,
        textLength: data.text_length,
        processingTime: data.processing_time,
      });
    } else {
      res.status(500).json({ error: "Extraction failed" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

**Python Backend:**

```python
from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)
API_KEY = os.environ.get('TREVNOCTILLA_API_KEY')
# Use your frontend domain - Next.js rewrites proxy to backend (Railway URL is hidden)
API_BASE_URL = os.environ.get('TREVNOCTILLA_API_BASE_URL', 'https://trevnoctilla.com')

@app.route('/extract-pdf-text', methods=['POST'])
def extract_pdf_text():
    if 'pdf' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['pdf']

    # Forward to Trevnoctilla API
    files = {'file': (file.filename, file.stream, 'application/pdf')}
    headers = {'X-API-Key': API_KEY}

    response = requests.post(
        f'{API_BASE_URL}/api/v1/convert/pdf-extract-text',
        files=files,
        headers=headers
    )

    data = response.json()

    if data.get('status') == 'completed':
        return jsonify({
            'success': True,
            'text': data.get('text'),
            'text_length': data.get('text_length'),
            'processing_time': data.get('processing_time')
        })
    else:
        return jsonify({'error': 'Extraction failed'}), 500

if __name__ == '__main__':
    app.run(port=3000)
```

### Step 4: Response Handling

All endpoints return consistent structure:

**Success Response:**

```json
{
  "job_id": "uuid-here",
  "status": "completed",
  "message": "Text extracted successfully",
  "text": "Actual text content...",
  "text_length": 1523,
  "processing_time": 1.058
}
```

**Error Response:**

```json
{
  "error": "API key required"
}
```

### Security Best Practices

1. **Store API key securely:**

   - Never commit to git
   - Use environment variables
   - For client-side: Consider a backend proxy

2. **Backend Proxy (Recommended for client apps):**

   ```javascript
   // Your backend endpoint (hides API key)
   app.post("/api/extract-text", async (req, res) => {
     // Validate user session
     if (!req.session.user) {
       return res.status(401).json({ error: "Unauthorized" });
     }

     // Forward to Trevnoctilla API with your API key
     // Use your frontend domain - Next.js rewrites proxy to backend
     const apiBaseUrl = process.env.TREVNOCTILLA_API_BASE_URL || "https://trevnoctilla.com";
     const response = await fetch(
       `${apiBaseUrl}/api/v1/convert/pdf-extract-text`,
       {
         method: "POST",
         headers: {
           "X-API-Key": process.env.TREVNOCTILLA_API_KEY, // Hidden from client
         },
         body: req.body,
       }
     );

     const data = await response.json();
     res.json(data);
   });
   ```

3. **Rate Limiting:**
   - Default: 1,000 requests/hour per API key
   - Monitor usage in dashboard
   - Handle 429 responses gracefully

### Complete Integration Checklist

- [ ] User signs up/logs in
- [ ] Generate API key from dashboard
- [ ] Store API key securely (env variable)
- [ ] Make API requests with `X-API-Key` header
- [ ] Handle success responses (extract `text`, `image_base64`, `pdf_base64`, etc.)
- [ ] Handle errors (401, 429, 500)
- [ ] Display extracted content to user
- [ ] Implement rate limiting/retry logic

### Other Use Cases

**Image Conversion:**

```javascript
const formData = new FormData();
formData.append("file", imageFile);
formData.append("output_format", "png");

// Use your frontend domain - Next.js rewrites proxy to backend
const apiBaseUrl = process.env.TREVNOCTILLA_API_BASE_URL || "https://trevnoctilla.com";
const response = await fetch(
  `${apiBaseUrl}/api/v1/convert/image`,
  {
    method: "POST",
    headers: { "X-API-Key": API_KEY },
    body: formData,
  }
);

const data = await response.json();
// data.image_base64 contains base64 encoded image
// Convert to image: <img src={`data:image/png;base64,${data.image_base64}`} />
```

**QR Code Generation:**

```javascript
// Use your frontend domain - Next.js rewrites proxy to backend
const apiBaseUrl = process.env.TREVNOCTILLA_API_BASE_URL || "https://trevnoctilla.com";
const response = await fetch(
  `${apiBaseUrl}/api/v1/convert/qr-generate`,
  {
    method: "POST",
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: "https://yourwebsite.com",
      size: "medium",
      format: "png",
    }),
  }
);

const data = await response.json();
// data.image_base64 contains QR code
```
