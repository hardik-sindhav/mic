# VPS Node.js Setup Verification

Your VPS has **Node.js 20.19.5** installed ✅

## Compatibility Status

| Component | Required | Your Version | Status |
|-----------|----------|--------------|--------|
| Node.js | >=18.0.0 | 20.19.5 | ✅ Compatible |
| NPM | - | (bundled) | ✅ Ready |
| Backend | Node 18+ | 20.19.5 | ✅ Ready |
| GitHub Actions | Node 20.x | 20.19.5 | ✅ Perfect Match |

## Verify Installation

SSH to your VPS and run these commands to confirm:

```bash
# Check Node version
node --version
# Should show: v20.19.5

# Check NPM version
npm --version

# Verify Node is working
node -e "console.log('✅ Node.js is working correctly')"

# Check system resources
free -h
df -h
```

## Next Steps on VPS

If you haven't run the setup script yet:

```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# Download and run setup (if first time)
curl -O https://raw.githubusercontent.com/YOUR-USERNAME/MIC/main/setup-vps.sh
sudo bash setup-vps.sh https://github.com/YOUR-USERNAME/MIC.git api.mic.xfinai.cloud admin.mic.xfinai.cloud
```

Or if you cloned the repo already:

```bash
# From your repo directory
cd /var/www/mic-backend
sudo bash setup-vps.sh https://github.com/YOUR-USERNAME/MIC.git
```

## Verify Backend Service

After setup, check if your backend is running:

```bash
# Check service status
sudo systemctl status mic-backend

# If not running, start it
sudo systemctl start mic-backend

# Check logs
sudo journalctl -u mic-backend -n 20

# Test if backend is listening on port 5000
curl http://localhost:5000/health
```

## Check All Services

```bash
# List all services running
sudo systemctl status mic-backend
sudo systemctl status nginx

# View Nginx config
sudo nginx -t

# Check listening ports
sudo netstat -tulpn | grep LISTEN
# Should show:
# - Node.js on port 5000
# - Nginx on ports 80, 443
```

## Your VPS is Ready! ✅

**Node Version:** 20.19.5 (Perfect!)
**Status:** Ready for deployment
**Next:** Configure DNS records and add GitHub secrets

See [CUSTOM-DOMAINS-SETUP.md](CUSTOM-DOMAINS-SETUP.md) for next steps.
