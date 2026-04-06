# Deployment Documentation

This document explains how to set up and configure GitHub Actions for automatic deployment of the MIC project.

## Overview

The project uses GitHub Actions to:
- ✅ Run CI checks on every push and PR
- ✅ Automatically build and test both frontend and backend
- ✅ Deploy frontend to GitHub Pages on merge to main
- 🔧 Deploy backend (configurable)

## Files Structure

```
.github/
├── workflows/
│   ├── ci.yml          # Continuous Integration workflow
│   └── deploy.yml      # Deployment workflow
```

## How It Works

### 1. CI Workflow (`ci.yml`)

**Triggers:** Push to `main` or `develop`, and all Pull Requests

**Steps:**
- Installs dependencies
- Runs ESLint on frontend
- Builds frontend (Vite)
- Validates backend syntax
- Tests with Node 18.x and 20.x

**No manual setup required** - activates automatically when files are pushed.

### 2. Deployment Workflow (`deploy.yml`)

**Triggers:** Push to `main` branch only (after PR merge)

**Steps:**
1. **Frontend Deployment**
   - Installs dependencies
   - Builds frontend with Vite
   - Deploys to GitHub Pages
   - Accessible at: `https://<username>.github.io/<repo-name>`

2. **Backend Deployment**
   - Installs dependencies
   - Validates syntax
   - Ready for your custom deployment

## Setup Instructions

### Step 1: Enable GitHub Pages

1. Go to your repository → **Settings**
2. Scroll to **Pages** section
3. Under "Build and deployment":
   - Source: Select **GitHub Actions**
   - Click Save

### Step 2: Configure Backend Deployment

The workflow currently only verifies the backend. To deploy, choose your hosting provider:

#### Option A: Deploy to Render

```yaml
# Add to .github/workflows/deploy.yml in the build-backend job

- name: Deploy to Render
  run: |
    curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

**Setup:**
1. Create a Render account at https://render.com
2. Create a new Web Service pointing to your backend repo
3. Get the deploy hook URL from Render
4. Add secret: `RENDER_DEPLOY_HOOK`

#### Option B: Deploy to Railway

```yaml
- name: Deploy to Railway
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  run: |
    npm install -g @railway/cli
    railway link ${{ secrets.RAILWAY_PROJECT_ID }}
    railway deploy
```

**Setup:**
1. Create a Railway account at https://railway.app
2. Deploy your backend app
3. Get your project ID and API token
4. Add secrets: `RAILWAY_TOKEN`, `RAILWAY_PROJECT_ID`

#### Option C: Deploy to Heroku

```yaml
- name: Deploy to Heroku
  env:
    HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
  run: |
    npm install -g heroku
    heroku login
    git remote set-url heroku https://git.heroku.com/${{ secrets.HEROKU_APP_NAME }}.git
    git push heroku main:main
```

**Setup:**
1. Create Heroku account at https://heroku.com
2. Create a new app
3. Get API key from Account Settings
4. Add secrets: `HEROKU_API_KEY`, `HEROKU_APP_NAME`

#### Option D: Deploy to AWS with Docker

```yaml
- name: Build and push Docker image
  run: |
    docker build -t my-app backend/
    docker tag my-app:latest ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/my-app:latest
    docker push ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/my-app:latest

- name: Deploy to EC2
  run: |
    ssh -i /tmp/ec2-key ec2-user@${{ secrets.EC2_HOST }} 'cd /app && docker pull ...'
```

#### Option E: SSH Deploy to VPS

```yaml
- name: Deploy to VPS
  env:
    DEPLOY_KEY: ${{ secrets.VPS_DEPLOY_KEY }}
  run: |
    mkdir -p ~/.ssh
    echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
    ssh -i ~/.ssh/deploy_key user@${{ secrets.VPS_HOST }} 'cd /app && git pull && npm install && npm start'
```

### Step 3: Add GitHub Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add your credentials based on chosen deployment option

**Example for Render:**
- Name: `RENDER_DEPLOY_HOOK`
- Value: Your Render webhook URL

### Step 4: Environment Variables

Create `.env.example` at project root:

**Frontend (.env.example):**
```
VITE_API_URL=https://your-api-domain.com
VITE_ENV=production
```

**Backend (.env.example):**
```
NODE_ENV=production
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

For CI/CD, add these as GitHub Secrets and reference in workflow.

## Custom Domain for GitHub Pages

To use a custom domain:

1. In `.github/workflows/deploy.yml`, uncomment the `cname` line:
```yaml
cname: yourdomainhere.com
```

2. In your domain registrar, add a CNAME record:
```
CNAME: yourusername.github.io
```

3. Verify domain in repository Settings → Pages

## Monitoring Deployments

### View Workflow Status

1. Go to repository → **Actions** tab
2. Click on the workflow run to see details
3. Check individual job logs

### Deployment Logs

- **Frontend:** Check GitHub Pages deployment logs in Actions tab
- **Backend:** Check your hosting provider's logs

## Troubleshooting

### Frontend build fails
```bash
# Check locally
cd admin_panel
npm ci
npm run build
```

### Node version mismatch
- Workflow uses Node 18.x and 20.x (latest)
- Backend requires Node >=18.0.0
- Update your local Node version if needed

### Secrets not found
- Verify secret names in GitHub match those in workflow
- Check that you're in the right repository
- Secrets are case-sensitive

### GitHub Pages not updating
- Wait 1-2 minutes after deployment completes
- Hard refresh browser (Ctrl+Shift+R)
- Check "Settings" → "Pages" → Source is "GitHub Actions"

## Environment-Specific Configuration

### Production (.env.production)
```
VITE_API_URL=https://api.yourdomain.com
MONGODB_URI=prod_connection_string
```

### Staging (.env.staging)
```
VITE_API_URL=https://staging-api.yourdomain.com
MONGODB_URI=staging_connection_string
```

Add to workflow if needed:
```yaml
- name: Load environment
  run: cp .env.${{ github.ref_name }} .env
```

## Best Practices

✅ **DO:**
- Keep secrets in GitHub Secrets, never in code
- Test locally before pushing
- Use meaningful commit messages
- Create PRs for feature branches before merge
- Regularly update dependencies

❌ **DON'T:**
- Commit `.env` files
- Hardcode API keys or credentials
- Force push to main
- Skip CI checks
- Merge PRs without review

## Next Steps

1. Push this setup to your GitHub repository
2. Go to repository Settings → Pages
3. Choose your backend deployment option
4. Add required secrets
5. Create a PR and merge to test the deployment

## Support

For issues:
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Test build locally
4. Check provider-specific documentation

---

**Last Updated:** April 2026
**Project:** MIC Admin Panel
