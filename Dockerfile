FROM python:3.11-slim

# Install system dependencies including FFmpeg, git, Node.js, and build tools for pycairo
# Updated for Railway build context - using justpdf-backend/ prefix
# Force rebuild - Railway cache issue
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    gcc \
    python3-dev \
    pkg-config \
    libcairo2-dev \
    libnspr4 \
    libnss3 \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the entire repo first
COPY . /tmp/repo
WORKDIR /tmp/repo

# Check if trevnoctilla-backend exists and is populated, if not clone it
RUN if [ -d "trevnoctilla-backend" ]; then \
        echo "trevnoctilla-backend directory exists"; \
        if [ -z "$(ls -A trevnoctilla-backend)" ]; then \
            echo "trevnoctilla-backend is empty, cloning repository..."; \
            rm -rf trevnoctilla-backend; \
            git clone https://github.com/KodeKenobi/justpdf-backend.git trevnoctilla-backend; \
        else \
            echo "trevnoctilla-backend is populated"; \
        fi; \
    else \
        echo "trevnoctilla-backend directory NOT found, cloning repository..."; \
        git clone https://github.com/KodeKenobi/justpdf-backend.git trevnoctilla-backend; \
    fi && \
    echo "=== Verifying trevnoctilla-backend contents ===" && \
    ls -la trevnoctilla-backend/ | head -20

# Copy requirements and install Python dependencies
# Handle both root-level and trevnoctilla-backend/ build contexts
WORKDIR /app
RUN if [ ! -f "/tmp/repo/trevnoctilla-backend/requirements.txt" ]; then \
        echo "ERROR: requirements.txt not found in trevnoctilla-backend!"; \
        echo "Contents of trevnoctilla-backend:"; \
        ls -la /tmp/repo/trevnoctilla-backend/ || echo "Directory doesn't exist"; \
        exit 1; \
    fi && \
    cp /tmp/repo/trevnoctilla-backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers (needed for HTML to PDF conversion)
RUN playwright install chromium || true

# Copy application code
RUN cp -r /tmp/repo/trevnoctilla-backend/* . && \
    cp -r /tmp/repo/trevnoctilla-backend/.[!.]* . 2>/dev/null || true

# Create necessary directories
RUN mkdir -p uploads edited saved_html converted_videos converted_audio

# Make start scripts executable
RUN chmod +x start.sh

# Install Node.js dependencies and build Next.js frontend
WORKDIR /tmp/repo
RUN if [ -f "package.json" ]; then \
        if [ -f "pnpm-lock.yaml" ]; then \
            pnpm install --frozen-lockfile; \
        else \
            echo "WARNING: pnpm-lock.yaml not found, installing without frozen-lockfile"; \
            pnpm install; \
        fi && \
        pnpm run build; \
    else \
        echo "WARNING: package.json not found, skipping frontend build"; \
    fi

# Copy built Next.js app and necessary files to /app
WORKDIR /app
RUN if [ -f "/tmp/repo/package.json" ]; then \
        cp /tmp/repo/package.json /app/ && \
        cp /tmp/repo/package-lock.json /app/ 2>/dev/null || cp /tmp/repo/pnpm-lock.yaml /app/ 2>/dev/null || true && \
        cp /tmp/repo/next.config.js /app/ 2>/dev/null || true && \
        cp /tmp/repo/next-env.d.ts /app/ 2>/dev/null || true && \
        cp /tmp/repo/tsconfig.json /app/ 2>/dev/null || true && \
        cp /tmp/repo/middleware.ts /app/ 2>/dev/null || true && \
        cp -r /tmp/repo/.next /app/ 2>/dev/null || true && \
        cp -r /tmp/repo/public /app/ 2>/dev/null || true && \
        cp -r /tmp/repo/app /app/ 2>/dev/null || true && \
        cp -r /tmp/repo/components /app/ 2>/dev/null || true && \
        cp -r /tmp/repo/lib /app/ 2>/dev/null || true && \
        cp -r /tmp/repo/contexts /app/ 2>/dev/null || true && \
        cp -r /tmp/repo/hooks /app/ 2>/dev/null || true && \
        cp -r /tmp/repo/types /app/ 2>/dev/null || true && \
        cp -r /tmp/repo/node_modules /app/ 2>/dev/null || true; \
    fi

# Expose port (Next.js)
EXPOSE 3000

# Run Next.js only (backend is deployed separately)
CMD ["npm", "start"]
