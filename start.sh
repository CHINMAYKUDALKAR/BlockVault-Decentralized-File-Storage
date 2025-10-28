#!/bin/bash

# ===============================================
# BlockVault Startup Script
# Starts both Backend (Flask) and Frontend (React)
# ===============================================

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"
FRONTEND_DIR="$PROJECT_DIR/blockvault-frontend"
VENV_DIR="$PROJECT_DIR/venv"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║              🔐 BlockVault Startup 🔐                  ║"
    echo "║      Blockchain Legal Document Management System      ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    print_info "Shutting down services..."
    
    # Kill all background jobs started by this script
    kill $(jobs -p) 2>/dev/null
    
    # Also kill processes on ports 3000 and 5000
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    
    print_success "All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM EXIT

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to free a port
free_port() {
    local port=$1
    print_warning "Port $port is in use. Freeing it..."
    lsof -ti:$port | xargs kill -9 2>/dev/null
    sleep 1
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    print_info "Waiting for $name to start..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
            print_success "$name is ready!"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_error "$name failed to start after $max_attempts seconds"
    return 1
}

# ===============================================
# MAIN SCRIPT
# ===============================================

print_header

# Check prerequisites
print_info "Checking prerequisites..."

# Check Python virtual environment
if [ ! -d "$VENV_DIR" ]; then
    print_error "Virtual environment not found at $VENV_DIR"
    print_info "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
    source "$VENV_DIR/bin/activate"
    print_info "Installing Python dependencies..."
    pip install -r requirements.txt
else
    print_success "Virtual environment found"
fi

# Check frontend dependencies
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    print_error "Frontend dependencies not installed"
    print_info "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    cd "$PROJECT_DIR"
else
    print_success "Frontend dependencies found"
fi

# Check and free ports if needed
print_info "Checking ports..."

if check_port 5000; then
    free_port 5000
fi
if check_port 3000; then
    free_port 3000
fi

print_success "Ports 3000 and 5000 are free"

# ===============================================
# START BACKEND
# ===============================================

print_header
print_info "Starting Flask Backend..."
echo ""

cd "$PROJECT_DIR"
source "$VENV_DIR/bin/activate"

# Start backend in background
FLASK_ENV=development python app.py > backend.log 2>&1 &
BACKEND_PID=$!

print_info "Backend PID: $BACKEND_PID"
print_info "Backend logs: $PROJECT_DIR/backend.log"

# Wait for backend to be ready
wait_for_service "http://localhost:5000" "Backend (Flask)"

# ===============================================
# START FRONTEND
# ===============================================

print_info "Starting React Frontend..."
echo ""

cd "$FRONTEND_DIR"

# Start frontend in background (suppress browser auto-open)
BROWSER=none npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

print_info "Frontend PID: $FRONTEND_PID"
print_info "Frontend logs: $FRONTEND_DIR/frontend.log"

# Wait for frontend to be ready
wait_for_service "http://localhost:3000" "Frontend (React)"

# ===============================================
# SUCCESS MESSAGE
# ===============================================

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║          🎉 BlockVault Started Successfully! 🎉        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${CYAN}📱 Frontend:${NC}  http://localhost:3000"
echo -e "${CYAN}🔧 Backend:${NC}   http://localhost:5000"
echo ""
echo -e "${YELLOW}📊 Process Information:${NC}"
echo "   Backend PID:  $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}📋 Log Files:${NC}"
echo "   Backend:  $PROJECT_DIR/backend.log"
echo "   Frontend: $FRONTEND_DIR/frontend.log"
echo ""
echo -e "${YELLOW}🔍 Useful Commands:${NC}"
echo "   View backend logs:  tail -f backend.log"
echo "   View frontend logs: tail -f blockvault-frontend/frontend.log"
echo "   Check status:       lsof -i :3000 -i :5000"
echo ""
echo -e "${GREEN}✨ Ready to use! Open http://localhost:3000 in your browser${NC}"
echo ""
echo -e "${RED}Press Ctrl+C to stop all services${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Keep script running and wait for both processes
wait