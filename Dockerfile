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

# Copy the entire repo first to initialize submodules
COPY . /tmp/repo
WORKDIR /tmp/repo

# Initialize git submodules if .gitmodules exists
RUN if [ -f .gitmodules ]; then \
        git submodule update --init --recursive || true; \
    fi

# Copy requirements and install Python dependencies
# Handle both root-level and trevnoctilla-backend/ build contexts
WORKDIR /app
RUN cp /tmp/repo/trevnoctilla-backend/requirements.txt requirements.txt
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
