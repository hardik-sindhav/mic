# VPS Deployment Setup Guide

## Overview

This guide walks you through deploying your backend to a VPS using GitHub Actions via SSH.

**What happens on each merge to main:**
1. GitHub Actions tests and builds your backend
2. SSH connects to your VPS
3. Pulls latest code using Git
4. Reinstalls dependencies
5. Restarts the Node.js service
6. Verifies deployment success

---

## Prerequisites

Before starting, ensure you have:
- ✅ VPS with Ubuntu 20.04+ (or similar Linux)
- ✅ SSH access to your VPS
- ✅ Git installed on VPS
- ✅ Node.js 18+ installed on VPS
- ✅ MongoDB connection string (local or cloud)
- ✅ Application code cloned on VPS

---

## 🔧 Step 1: VPS Setup (One-Time)

### 1.1 Create Application Directory

SSH into your VPS and run:

```bash
ssh root@your-vps-ip

# Create app directory
sudo mkdir -p /var/www/mic-backend
sudo chown $USER:$USER /var/www/mic-backend
cd /var/www/mic-backend

# Clone your repository
git clone https://github.com/YOUR-USERNAME/MIC.git .
# or if using SSH:
# git clone git@github.com:YOUR-USERNAME/MIC.git .
```

### 1.2 Install Dependencies

```bash
cd /var/www/mic-backend/backend

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install npm dependencies
npm install
```

### 1.3 Set Environment Variables

Create `.env` file:

```bash
nano /var/www/mic-backend/backend/.env
```

Add your production environment variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-32-chars-min
CORS_ORIGIN=https://your-frontend-domain.com
LOG_LEVEL=info
```

**Save:** Press `Ctrl+X` → `Y` → `Enter`

### 1.4 Create Systemd Service

Create a service file for automatic restarts:

```bash
sudo nano /etc/systemd/system/mic-backend.service
```

Paste this content (update paths if different):

```ini
[Unit]
Description=MIC Backend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/mic-backend/backend
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mic-backend
sudo systemctl start mic-backend

# Verify it's running
sudo systemctl status mic-backend
```

**Expected output:**
```
● mic-backend.service - MIC Backend Service
   Loaded: loaded (/etc/systemd/system/mic-backend.service; enabled; vendor preset: enabled)
   Active: active (running) since ...
```

### 1.5 Configure Git Auto-Pull

Allow GitHub Actions to pull code without password/key:

```bash
# If not already done, configure git
cd /var/www/mic-backend
git config user.email "deployment@example.com"
git config user.name "Deployment Bot"

# Set git to store credentials
git config --global credential.helper store
```

---

## 🔐 Step 2: Generate SSH Keys (GitHub Actions)

### 2.1 On Your Local Machine

Generate an SSH key pair for deployment:

```bash
# Generate key (no passphrase - GitHub Actions needs non-interactive auth)
ssh-keygen -t ed25519 -f ~/.ssh/github-deploy -N ""

# Or if ed25519 not available:
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-deploy -N ""

# View the private key (you'll need this next)
cat ~/.ssh/github-deploy
```

### 2.2 Add Public Key to VPS

Copy the public key to your VPS:

```bash
# Option A: If you have local SSH access to VPS
ssh-copy-id -i ~/.ssh/github-deploy.pub root@your-vps-ip

# Option B: Manually (SSH to VPS)
ssh root@your-vps-ip

# Add public key to authorized_keys
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_CONTENT_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
exit
```

### 2.3 Test SSH Connection

Test the key works:

```bash
ssh -i ~/.ssh/github-deploy root@your-vps-ip "echo 'SSH connection successful'"
```

**Expected:** Should connect without password prompt

---

## 🔑 Step 3: Add GitHub Secrets

### 3.1 Get Required Values

In your VPS terminal, collect these values:

```bash
# 1. Get public IP or domain
hostname -I
# or use your domain: example.com

# 2. Get current user
whoami
# usually 'root'

# 3. Get application path
pwd
# usually /var/www/mic-backend
```

### 3.2 Add Secrets to GitHub

1. Go to: **Repository** → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add each:

| Name | Value |
|------|-------|
| `VPS_PRIVATE_KEY` | Content of `~/.ssh/github-deploy` (the PRIVATE key) |
| `VPS_HOST` | Your VPS IP or domain (e.g., `123.45.67.89`) |
| `VPS_USER` | SSH user (usually `root`) |
| `VPS_APP_PATH` | Application path (e.g., `/var/www/mic-backend`) |

**Example for VPS_PRIVATE_KEY:**
```bash
cat ~/.ssh/github-deploy | xclip -selection clipboard
# Then paste in GitHub
```

---

## ✅ Step 4: Test Deployment

### 4.1 Make a Test Commit

```bash
cd your-local-repo
# Make any small change
echo "# Test" >> README.md
git add README.md
git commit -m "test: trigger deployment"
git push
```

### 4.2 Create a PR

1. Go to GitHub → **Pull requests** → **New pull request**
2. Select your branch
3. Click **Create pull request**
4. Review the CI workflow in **Actions** tab

### 4.3 Merge and Deploy

1. Click **Merge pull request** on GitHub
2. Go to **Actions** tab
3. Watch the **Deploy on Merge** workflow
4. Check logs:
   - ✅ Frontend deployed to GitHub Pages
   - ✅ Backend deployed to VPS

### 4.4 Verify Backend is Running

Check your VPS:

```bash
ssh root@your-vps-ip

# Method 1: Check service status
sudo systemctl status mic-backend

# Method 2: Test API endpoint
curl http://localhost:5000/health

# Method 3: Check logs
sudo journalctl -u mic-backend -f
```

---

## 🔄 Workflow: Day-to-Day Development

### Deploying New Code

1. **Create feature branch:**
   ```bash
   git checkout -b feature/my-feature
   # Make your changes
   git push -u origin feature/my-feature
   ```

2. **Create PR:** GitHub → New Pull Request

3. **Wait for CI:** GitHub Actions tests your code (Auto)

4. **Review & Merge:** Approve the PR and merge to main

5. **Auto Deploy:** 
   - ✅ Frontend redeploys to GitHub Pages
   - ✅ Backend redeploys to VPS (5-10 seconds)

You're done! No manual deployment needed.

---

## 🛠️ Troubleshooting

### ❌ "Permission denied (publickey)"

**Problem:** SSH key doesn't work

**Solution:**
```bash
# Verify key exists locally
ls -la ~/.ssh/github-deploy

# Verify public key on VPS
ssh root@your-vps-ip "grep github-deploy ~/.ssh/authorized_keys"

# Re-add if missing
ssh-copy-id -i ~/.ssh/github-deploy.pub root@your-vps-ip
```

### ❌ "Git command not found"

**Problem:** Git not installed on VPS

**Solution:**
```bash
ssh root@your-vps-ip
sudo apt-get update
sudo apt-get install -y git
```

### ❌ Backend service not restarting

**Problem:** Deployment succeeds but backend doesn't update

**Solution:**
```bash
ssh root@your-vps-ip

# Check service status
sudo systemctl status mic-backend

# View recent logs
sudo journalctl -u mic-backend -n 50

# Manually restart
sudo systemctl restart mic-backend

# Check if Node.js is running
ps aux | grep node
```

### ❌ Environment variables not loading

**Problem:** App crashes with "DATABASE_URL is required"

**Solution:**
```bash
# Check .env file on VPS
cat /var/www/mic-backend/backend/.env

# Verify systemd service has access
sudo cat /var/www/mic-backend/backend/.env

# If still issues, add env vars to systemd service
sudo nano /etc/systemd/system/mic-backend.service
# Add under [Service]:
# Environment="DATABASE_URL=mongodb+str://..."
# Environment="JWT_SECRET=..."

sudo systemctl daemon-reload
sudo systemctl restart mic-backend
```

### ❌ GitHub Actions fails with "Host key verification failed"

**Problem:** SSH connection times out

**Solution:**
The workflow adds hosts automatically. If issues persist:
```bash
# Manually add VPS key from your local machine
ssh -i ~/.ssh/github-deploy -o StrictHostKeyChecking=accept-new root@your-vps-ip "echo OK"
```

### ❌ deployment "Access denied" on GitHub Actions

**Problem:** Secrets not configured

**Solution:**
1. Double-check secret names are EXACT (case-sensitive):
   - `VPS_PRIVATE_KEY` ✅
   - `vps_private_key` ❌
2. Re-create the secret if unsure
3. Try a new deployment

---

## 📊 Monitoring Your VPS

### Check Service Status

```bash
# On your VPS
sudo systemctl status mic-backend

# View recent logs
sudo journalctl -u mic-backend -f

# Check memory usage
free -h

# Check disk usage
df -h
```

### Set Up Log Rotation (Optional)

```bash
sudo nano /etc/logrotate.d/mic-backend
```

Add:
```
/var/log/mic-backend.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 root root
}
```

---

## 🚀 Advanced: Update Deployment Script

If you need custom deployment steps, edit the GitHub Actions workflow:

**File:** [`.github/workflows/deploy.yml`](../../workflows/deploy.yml)

In the "Deploy to VPS" step, modify the `DEPLOY_SCRIPT` section:

```bash
ssh -i ~/.ssh/vps_deploy_key $VPS_USER@$VPS_HOST << 'DEPLOY_SCRIPT'
  set -e
  cd $VPS_APP_PATH
  
  # Add custom commands here:
  # - Run database migrations
  # - Build/compile assets
  # - Run tests
  # - etc.
  
  git pull origin main
  npm ci
  sudo systemctl restart mic-backend
DEPLOY_SCRIPT
```

---

## 🔐 Security Best Practices

✅ **DO:**
- Keep VPS_PRIVATE_KEY secret (never commit to repo)
- Use strong SSH key (ed25519 or RSA 4096)
- Limit SSH access to GitHub Actions IPs (optional)
- Regularly rotate SSH keys
- Use firewall to restrict ports

❌ **DON'T:**
- Commit SSH keys to repository
- Use weak passwords for VPS
- Leave unnecessary ports open
- Share SSH keys in Slack/Email
- Use same key for multiple services

---

## 📚 Next Steps

1. ✅ Complete all VPS setup steps above
2. ✅ Add GitHub Secrets
3. ✅ Make a test deployment
4. ✅ Verify backend is running
5. ✅ Monitor logs for issues
6. Check [DEPLOYMENT.md](../DEPLOYMENT.md) for frontend customization

---

## 📞 Need Help?

- Check GitHub Actions logs: Repository → Actions → Latest run
- View VPS logs: `sudo journalctl -u mic-backend -f`
- Test SSH manually: `ssh -i ~/.ssh/github-deploy root@your-vps-ip`
- Check this guide for troubleshooting section

---

**Last Updated:** April 2026  
**Project:** MIC Admin Panel
