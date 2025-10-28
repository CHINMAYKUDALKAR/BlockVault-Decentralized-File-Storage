#!/bin/bash

# ===============================================
# BlockVault Stop Script
# Stops both Backend and Frontend servers
# ===============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo ""
echo -e "${RED}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║              🛑 Stopping BlockVault 🛑                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

print_info "Stopping services on ports 3000 and 5000..."

# Kill processes on port 3000 (Frontend)
if lsof -ti:3000 >/dev/null 2>&1; then
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    print_success "Frontend (port 3000) stopped"
else
    print_info "No process running on port 3000"
fi

# Kill processes on port 5000 (Backend)
if lsof -ti:5000 >/dev/null 2>&1; then
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    print_success "Backend (port 5000) stopped"
else
    print_info "No process running on port 5000"
fi

echo ""
print_success "All BlockVault services stopped"
echo ""

