#!/bin/bash

# VPS Automated Setup Script
# This script automates the initial VPS setup for MIC Backend
# Run on your VPS: bash setup-vps.sh

set -e

echo "🚀 MIC Backend VPS Setup Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Please run as root (use: sudo bash setup-vps.sh)${NC}"
  exit 1
fi

# Variables
APP_PATH="/var/www/mic-backend"
GITHUB_REPO="${1:-}"
BACKEND_PORT="5000"

# Function to print colored output
print_status() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

# Step 1: Update system
print_info "Step 1: Updating system packages..."
apt-get update
apt-get upgrade -y
print_status "System updated"

# Step 2: Install Node.js
print_info "Step 2: Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  print_status "Node.js installed: $(node --version)"
else
  print_status "Node.js already installed: $(node --version)"
fi

# Step 3: Install Git
print_info "Step 3: Installing Git..."
apt-get install -y git
print_status "Git installed: $(git --version)"

# Step 4: Create application directory
print_info "Step 4: Creating application directory..."
mkdir -p "$APP_PATH"
print_status "Directory created: $APP_PATH"

# Step 5: Clone repository
if [ -z "$GITHUB_REPO" ]; then
  print_error "GitHub repository URL not provided"
  echo "Usage: sudo bash setup-vps.sh https://github.com/YOUR-USERNAME/MIC.git"
  exit 1
fi

print_info "Step 5: Cloning repository..."
if [ ! -d "$APP_PATH/.git" ]; then
  git clone "$GITHUB_REPO" "$APP_PATH"
  print_status "Repository cloned"
else
  print_status "Repository already exists"
fi

# Step 6: Install backend dependencies
print_info "Step 6: Installing backend dependencies..."
cd "$APP_PATH/backend"
npm install
print_status "Dependencies installed"

# Step 7: Create .env file
print_info "Step 7: Checking for .env file..."
if [ ! -f "$APP_PATH/backend/.env" ]; then
  print_error ".env file not found"
  echo "Please create $APP_PATH/backend/.env with required variables:"
  echo "  NODE_ENV=production"
  echo "  DATABASE_URL=mongodb+srv://..."
  echo "  JWT_SECRET=your-secret"
  echo "  PORT=$BACKEND_PORT"
  echo ""
  read -p "Press Enter after .env is created..."
  
  if [ ! -f "$APP_PATH/backend/.env" ]; then
    print_error ".env file still not found. Setup cannot continue."
    exit 1
  fi
else
  print_status ".env file exists"
fi

# Step 8: Create systemd service
print_info "Step 8: Creating systemd service..."
cat > /etc/systemd/system/mic-backend.service << EOF
[Unit]
Description=MIC Backend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_PATH/backend
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable mic-backend
print_status "Systemd service created and enabled"

# Step 9: Start the service
print_info "Step 9: Starting backend service..."
systemctl start mic-backend
sleep 2

if systemctl is-active --quiet mic-backend; then
  print_status "Backend service is running!"
else
  print_error "Backend service failed to start"
  echo "Check logs with: sudo journalctl -u mic-backend -n 50"
  exit 1
fi

# Step 10: Configure Git for deployments
print_info "Step 10: Configuring Git..."
cd "$APP_PATH"
git config user.email "deployment@example.com"
git config user.name "Deployment Bot"
print_status "Git configured"

# Print summary
echo ""
echo "========================================"
echo -e "${GREEN}✓ VPS Setup Complete!${NC}"
echo "========================================"
echo ""
echo "📍 Application Path: $APP_PATH"
echo "🔧 Backend Port: $BACKEND_PORT"
echo ""
echo "Next steps:"
echo "1. Verify backend is running:"
echo "   sudo systemctl status mic-backend"
echo ""
echo "2. Test the API:"
echo "   curl http://localhost:$BACKEND_PORT/health"
echo ""
echo "3. View logs:"
echo "   sudo journalctl -u mic-backend -f"
echo ""
echo "4. Add your VPS SSH key to GitHub:"
echo "   - Generate: ssh-keygen -t ed25519 -f ~/.ssh/github-deploy -N \"\""
echo "   - Add to GitHub Secrets as VPS_PRIVATE_KEY"
echo "   - For instructions, see: $APP_PATH/.github/VPS-SETUP.md"
echo ""
