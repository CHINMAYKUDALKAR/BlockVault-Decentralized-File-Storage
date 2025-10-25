#!/bin/bash

# BlockVault Startup Script
# This script starts both the backend (Flask) and frontend (React) servers

PROJECT_DIR="/Users/chinmaykudalkar/Desktop/capBlock/BlockVault"
FRONTEND_DIR="$PROJECT_DIR/blockvault-frontend"

echo "🚀 Starting BlockVault..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if virtual environment exists
if [ ! -d "/Users/chinmaykudalkar/env1" ]; then
    echo "❌ Virtual environment not found at /Users/chinmaykudalkar/env1"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "❌ Frontend dependencies not installed. Please run: cd blockvault-frontend && npm install"
    exit 1
fi

# Start backend
echo "🐍 Starting Flask backend on port 5000..."
cd "$PROJECT_DIR"
source /Users/chinmaykudalkar/env1/bin/activate
python app.py > backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "⚛️  Starting React frontend on port 3000..."
cd "$FRONTEND_DIR"
npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Services started successfully!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo "📋 Logs: backend.log & frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for both processes
wait