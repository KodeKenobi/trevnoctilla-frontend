#!/bin/bash
set -e

echo "=== STARTING TREVNOCTILLA PLATFORM ==="

# Get port from Railway (defaults to 3000 for frontend)
FRONTEND_PORT=${PORT:-3000}
BACKEND_PORT=5000

echo "Frontend Port: $FRONTEND_PORT"
echo "Backend Port: $BACKEND_PORT"

# Start Flask backend in background
echo "Starting Flask backend..."
cd /app
gunicorn --bind 0.0.0.0:$BACKEND_PORT --timeout 180 --workers 2 --access-logfile - --error-logfile - app:app &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
sleep 3

# Start Next.js frontend
echo "Starting Next.js frontend..."
cd /app
PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Wait for both processes
echo "✅ Both services started successfully!"
echo "Frontend: http://0.0.0.0:$FRONTEND_PORT"
echo "Backend: http://0.0.0.0:$BACKEND_PORT"

# Keep script running and forward signals
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait -n
exit $?
