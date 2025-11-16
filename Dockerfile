FROM python:3.11-slim

# Install system dependencies including FFmpeg and git (for submodule initialization)
# Updated for Railway build context - using justpdf-backend/ prefix
# Force rebuild - Railway cache issue
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the entire repo first
COPY . /tmp/repo
WORKDIR /tmp/repo

# Debug: Show what's in the repo
RUN echo "=== Contents of /tmp/repo ===" && \
    ls -la /tmp/repo && \
    echo "=== Checking for trevnoctilla-backend ===" && \
    if [ -d "trevnoctilla-backend" ]; then \
        echo "trevnoctilla-backend directory exists"; \
        ls -la trevnoctilla-backend/ | head -20; \
    else \
        echo "trevnoctilla-backend directory NOT found"; \
        if [ -f .gitmodules ]; then \
            echo "Found .gitmodules, attempting to initialize submodules..."; \
            git submodule update --init --recursive || echo "Submodule init failed"; \
        else \
            echo "No .gitmodules file found"; \
        fi; \
        if [ ! -d "trevnoctilla-backend" ]; then \
            echo "ERROR: trevnoctilla-backend directory still not found after submodule init!"; \
            exit 1; \
        fi; \
    fi

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

# Copy application code
RUN cp -r /tmp/repo/trevnoctilla-backend/* . && \
    cp -r /tmp/repo/trevnoctilla-backend/.[!.]* . 2>/dev/null || true

# Create necessary directories
RUN mkdir -p uploads edited saved_html converted_videos converted_audio

# Make start script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 5000

# Run the application using start script
CMD ["./start.sh"]
