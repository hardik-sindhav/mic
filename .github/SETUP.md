# GitHub Actions Setup Guide

## ✅ Quick Start (3 Minutes)

### Step 1: Push Files to GitHub
```bash
git add .github/
git add DEPLOYMENT.md
git commit -m "chore: add GitHub Actions CI/CD workflow"
git push origin main
```

### Step 2: Enable GitHub Pages
1. Go to your repo → **Settings** → **Pages**
2. Under "Build and deployment", select **GitHub Actions**
3. Click **Save**

### Step 3: Create Your First Deployment
Create a PR with any changes and merge to `main`:
1. The **CI workflow** runs on PR (builds & tests)
2. The **Deploy workflow** runs on merge (deploys to GitHub Pages)
3. View deployment status in **Actions** tab

---

## 📋 What Gets Deployed

### Frontend (Automatic ✅)
- **Built:** `npm run build` (Vite)
- **Deployed to:** GitHub Pages
- **URL:** `https://<your-username>.github.io/<repo-name>`
- **Triggered:** On any merge to `main`

### Backend (Manual Setup Required ⚙️)
- **Tested:** `node --check src/server.js`
- **Deploy:** Not configured yet
- **To deploy:** Follow [DEPLOYMENT.md](../DEPLOYMENT.md)

---

## 🔑 Adding GitHub Secrets (For Backend Deployment)

If you're deploying your backend using Render/Railway/Heroku:

1. **Go to:** Repo → Settings → Secrets and Variables → Actions
2. **Click:** New repository secret
3. **Add** secrets based on your choice:

### For Render:
- Name: `RENDER_DEPLOY_HOOK`
- Value: (get from Render dashboard)

### For Railway:
- Name: `RAILWAY_TOKEN`
- Name: `RAILWAY_PROJECT_ID`

### For Heroku:
- Name: `HEROKU_API_KEY`
- Name: `HEROKU_APP_NAME`
- Name: `HEROKU_EMAIL`

---

## 🚀 Backend Deployment (Choose One)

See [DEPLOYMENT.md](../DEPLOYMENT.md#backend-deployment-options) for:
- ✅ Render (FREE tier available)
- ✅ Railway (easy, $5/month)
- ✅ Heroku (standard, $7/month)
- ✅ AWS (scalable)
- ✅ VPS via SSH (full control)
- ✅ DigitalOcean (simple)

---

## 📊 Monitor Deployments

1. **Go to:** Actions tab in your repo
2. **Click** on the latest run
3. **Check** job status and logs
4. **Share** the status on your team

### Deployment URL
After frontend deploys:
```
https://<username>.github.io/<repo-name>
```

### Example
```
https://yourname.github.io/MIC
```

---

## 🐛 Troubleshooting

### ❌ "GitHub Pages source not found"
**Solution:** Go to Settings → Pages → Select "GitHub Actions"

### ❌ Build fails in GitHub but works locally
**Solution:** 
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ❌ Frontend doesn't update after deployment
**Solution:** 
- Wait 1-2 minutes
- Hard refresh: `Ctrl+Shift+R`
- Check Actions tab for errors

### ❌ Secrets not found error
**Solution:**
- Check secret name spelling (case-sensitive)
- Verify you're in correct repo
- Re-create the secret if unsure

---

## 📦 Files Added

```
.github/
├── workflows/
│   ├── ci.yml                      # CI/test on every push & PR
│   ├── deploy.yml                  # Auto-deploy on merge to main
│   └── backend-deploy-template.yml # Backend deployment options
DEPLOYMENT.md                        # Full deployment documentation
```

---

## 🎯 Next Steps

1. **Push & Test:** Make a test PR and merge
2. **Choose Backend Hosting:** Pick from options in DEPLOYMENT.md
3. **Configure Secrets:** Add credentials for your backend
4. **Verify Deployment:** Check Actions logs and live URL
5. **Optional:** Set custom domain for frontend (GitHub Pages settings)

---

## 📖 References

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- Deployment providers: [Render](https://render.com), [Railway](https://railway.app), [Heroku](https://heroku.com)

---

✨ **Your CI/CD pipeline is now ready to go!**
