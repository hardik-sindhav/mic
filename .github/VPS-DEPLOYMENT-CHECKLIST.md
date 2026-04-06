# VPS Deployment Checklist

Quick reference for setting up VPS deployment with GitHub Actions.

## ✅ Pre-Deployment Checklist

### VPS Requirements
- [ ] VPS with Ubuntu 20.04+ (or similar Linux)
- [ ] SSH access to VPS
- [ ] VPS has public IP or domain
- [ ] Sufficient resources (1GB+ RAM, 10GB+ storage)

### Local Setup
- [ ] SSH key pair generated: `ssh-keygen -t ed25519 -f ~/.ssh/github-deploy -N ""`
- [ ] Can SSH to VPS without password: `ssh -i ~/.ssh/github-deploy root@VPS_IP`
- [ ] Repository pushed to GitHub main branch
- [ ] GitHub repository is public or you have Actions enabled

---

## 🔧 VPS Setup (Option A: Automated)

Run this one command on your VPS:

```bash
sudo bash -c 'cd /tmp && curl -O https://raw.githubusercontent.com/YOUR-USERNAME/MIC/main/setup-vps.sh && bash setup-vps.sh https://github.com/YOUR-USERNAME/MIC.git'
```

**Or manually from your repo:**

```bash
sudo bash /path/to/setup-vps.sh https://github.com/YOUR-USERNAME/MIC.git
```

---

## 🔧 VPS Setup (Option B: Manual - Step By Step)

Run on your VPS terminal:

```bash
# 1. Update system
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Git
sudo apt-get install -y git

# 4. Create app directory
sudo mkdir -p /var/www/mic-backend
sudo chown $USER:$USER /var/www/mic-backend
cd /var/www/mic-backend

# 5. Clone repository
git clone https://github.com/YOUR-USERNAME/MIC.git .

# 6. Install backend dependencies
cd backend
npm install

# 7. Create .env file
nano .env
# Paste your environment variables (see .env.example)
# Then: Ctrl+X → Y → Enter

# 8. Create systemd service
sudo tee /etc/systemd/system/mic-backend.service > /dev/null << EOF
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

[Install]
WantedBy=multi-user.target
EOF

# 9. Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable mic-backend
sudo systemctl start mic-backend

# 10. Verify it's running
sudo systemctl status mic-backend
```

---

## 🔐 Add GitHub Secrets

1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add each secret:

| Secret Name | Value | Example |
|---|---|---|
| `VPS_PRIVATE_KEY` | Content of `~/.ssh/github-deploy` | (run `cat ~/.ssh/github-deploy`) |
| `VPS_HOST` | Your VPS IP or domain | `123.45.67.89` or `vps.example.com` |
| `VPS_USER` | SSH username | `root` |
| `VPS_APP_PATH` | Backend app path | `/var/www/mic-backend` |

### Get Secret Values

On your local machine:

```bash
# 1. Private Key
cat ~/.ssh/github-deploy

# 2. VPS Host
# Your VPS IP address or domain

# 3. VPS User (on VPS)
ssh root@YOUR_VPS_IP "whoami"
# Usually returns: root

# 4. App Path (on VPS)
ssh root@YOUR_VPS_IP "pwd"
# Usually: /var/www/mic-backend
```

---

## ✅ Test Deployment

```bash
# 1. Make a change locally
cd your-repo
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify deployment"
git push

# 2. Create PR on GitHub
# - Go to repo → Pull requests → New pull request
# - Create pull request

# 3. Watch CI run in Actions tab

# 4. Merge PR
# - Click "Merge pull request"

# 5. Watch deployment complete
# - Go to Actions tab
# - See "Deploy on Merge" workflow running
# - Wait for ✅ completion

# 6. Verify on VPS
ssh root@YOUR_VPS_IP

# Check service
sudo systemctl status mic-backend

# Test API
curl http://localhost:5000/health

# View logs
sudo journalctl -u mic-backend -f
```

---

## 📊 Monitoring

### Daily Check

```bash
ssh root@YOUR_VPS_IP

# Is service running?
sudo systemctl status mic-backend

# Any errors in logs?
sudo journalctl -u mic-backend -n 20

# Disk space OK?
df -h
```

### Restart Service

```bash
ssh root@YOUR_VPS_IP
sudo systemctl restart mic-backend
```

### View Live Logs

```bash
ssh root@YOUR_VPS_IP
sudo journalctl -u mic-backend -f
```

---

## ❌ Troubleshooting

### "Cannot connect to VPS"
```bash
# Test SSH connection
ssh -i ~/.ssh/github-deploy root@YOUR_VPS_IP

# If fails, verify key is authorized on VPS
ssh root@YOUR_VPS_IP "grep github-deploy ~/.ssh/authorized_keys"

# Re-add if missing
ssh-copy-id -i ~/.ssh/github-deploy.pub root@YOUR_VPS_IP
```

### "Backend not restarting on deployment"
```bash
# Check service status
ssh root@YOUR_VPS_IP
sudo systemctl status mic-backend
sudo journalctl -u mic-backend -n 50

# Manually restart
sudo systemctl restart mic-backend
```

### "Deployment fails with permission denied"
```bash
# Verify key exists
ls -la ~/.ssh/github-deploy

# Verify public key on VPS
ssh -i ~/.ssh/github-deploy root@YOUR_VPS_IP "cat ~/.ssh/authorized_keys"

# If missing, add it
ssh-copy-id -i ~/.ssh/github-deploy.pub root@YOUR_VPS_IP
```

### "Environment variables not loaded"
```bash
# Check .env file on VPS
ssh root@YOUR_VPS_IP "cat /var/www/mic-backend/backend/.env"

# Verify all required variables are present
# If missing, update and restart:
# nano /var/www/mic-backend/backend/.env
# sudo systemctl restart mic-backend
```

---

## 📋 Files Reference

| File | Purpose |
|------|---------|
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | Deployment workflow |
| [`.github/VPS-SETUP.md`](.github/VPS-SETUP.md) | Detailed VPS guide |
| [`setup-vps.sh`](setup-vps.sh) | Automated VPS setup script |
| [`backend/.env.example`](backend/.env.example) | Environment variables template |

---

## 🎯 How It Works

```
Developer pushes to GitHub
        ↓
GitHub Actions runs CI tests
        ↓
PR is merged to main
        ↓
GitHub Actions deployment triggered
        ↓
Connect to VPS via SSH
        ↓
Pull latest code: git pull
        ↓
Reinstall dependencies: npm ci
        ↓
Restart service: systemctl restart mic-backend
        ↓
✅ Backend updated & running
        ↓
Frontend also deployed to GitHub Pages
```

---

## 🚀 Quick Commands

```bash
# Generate SSH key for deployment
ssh-keygen -t ed25519 -f ~/.ssh/github-deploy -N ""

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github-deploy.pub root@YOUR_VPS_IP

# Test SSH connection (should work without password)
ssh -i ~/.ssh/github-deploy root@YOUR_VPS_IP "echo OK"

# View key to add to GitHub Secrets
cat ~/.ssh/github-deploy

# SSH to VPS
ssh root@YOUR_VPS_IP

# Check backend status
sudo systemctl status mic-backend

# View backend logs
sudo journalctl -u mic-backend -f

# Restart backend
sudo systemctl restart mic-backend
```

---

## ✨ You're Set!

Once complete:
1. ✅ Every push to main triggers automatic deployment
2. ✅ Frontend goes to GitHub Pages
3. ✅ Backend goes to your VPS
4. ✅ No manual deployment needed!

---

**Documentation:** [VPS-SETUP.md](.github/VPS-SETUP.md)  
**Main Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
