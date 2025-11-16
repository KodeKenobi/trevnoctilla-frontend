FROM python:3.11-slim

# Install system dependencies including FFmpeg
# Updated for Railway build context - using justpdf-backend/ prefix
# Force rebuild - Railway cache issue
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
# Handle both root-level and trevnoctilla-backend/ build contexts
COPY trevnoctilla-backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY trevnoctilla-backend/ .

# Create necessary directories
RUN mkdir -p uploads edited saved_html converted_videos converted_audio

# Make start script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 5000

# Run the application using start script
CMD ["./start.sh"]
