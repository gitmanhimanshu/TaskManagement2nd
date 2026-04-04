# 🚂 Railway Deployment Guide

Complete guide to deploy your Task Management Backend on Railway.

## 📋 Prerequisites

1. Railway account (https://railway.app)
2. GitHub account
3. Your code pushed to GitHub repository

---

## 🗄️ Step 1: Create PostgreSQL Database on Railway

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Provision PostgreSQL"**
4. Wait for database to be created
5. Click on PostgreSQL service
6. Go to **"Variables"** tab
7. Copy the **DATABASE_URL** (you'll need this later)

---

## 🚀 Step 2: Deploy Backend

### Option A: Deploy from GitHub (Recommended)

1. In Railway dashboard, click **"New"** → **"GitHub Repo"**
2. Connect your GitHub account if not connected
3. Select your repository
4. Select the **backend** folder as root directory
5. Railway will auto-detect Node.js and start building

### Option B: Deploy using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
cd backend
railway init

# Link to your project
railway link

# Deploy
railway up
```

---

## ⚙️ Step 3: Configure Environment Variables

In Railway dashboard, go to your backend service → **Variables** tab and add:

### Required Variables:

```env
# Server
PORT=5000
NODE_ENV=production

# Database (from PostgreSQL service)
DATABASE_URL=postgresql://postgres:password@host:port/database

# JWT Secrets (generate strong random strings)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this-to-random-string
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-to-random-string
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS (your frontend URL)
CORS_ORIGIN=https://your-frontend-url.vercel.app

# Frontend URL (for email links)
FRONTEND_URL=https://your-frontend-url.vercel.app

# Email (Brevo API)
BREVO_API_KEY=your-brevo-api-key-here
BREVO_API_URL=https://api.brevo.com/v3/smtp/email
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Task Management System
```

### 💡 Tips:
- Click **"Add Reference"** to link DATABASE_URL from PostgreSQL service
- Generate strong JWT secrets using: `openssl rand -base64 32`
- Update CORS_ORIGIN after deploying frontend

---

## 🔗 Step 4: Link Database to Backend

1. In Railway dashboard, click on your backend service
2. Go to **"Settings"** tab
3. Scroll to **"Service Variables"**
4. Click **"Add Variable Reference"**
5. Select your PostgreSQL service
6. Choose **DATABASE_URL**
7. Click **"Add"**

This automatically connects your backend to the database.

---

## 🏗️ Step 5: Verify Build & Deploy

### Check Build Logs:
1. Click on your backend service
2. Go to **"Deployments"** tab
3. Click on latest deployment
4. Check **"Build Logs"** and **"Deploy Logs"**

### Expected Build Steps:
```
✓ Installing dependencies
✓ Running npm install
✓ Generating Prisma Client
✓ Building TypeScript
✓ Running migrations
✓ Starting server
```

### Verify Deployment:
1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Copy your backend URL (e.g., `https://your-app.up.railway.app`)
4. Test: `https://your-app.up.railway.app/health`

---

## 🔍 Step 6: Run Database Migrations

Railway automatically runs migrations on deploy, but if needed manually:

### Using Railway CLI:
```bash
railway run npx prisma migrate deploy
```

### Using Railway Dashboard:
1. Go to backend service
2. Click **"Settings"** → **"Deploy"**
3. Add to **"Custom Start Command"**:
```
npx prisma migrate deploy && npm start
```

---

## 🧪 Step 7: Test Your API

Test these endpoints:

### Health Check:
```bash
curl https://your-app.up.railway.app/health
```

### Register (Create Company):
```bash
curl -X POST https://your-app.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "company_name": "My Company",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Login:
```bash
curl -X POST https://your-app.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

---

## 🐛 Troubleshooting

### Issue: Build Fails

**Check:**
- `package.json` has correct scripts
- `tsconfig.json` exists
- All dependencies are in `package.json`

**Solution:**
```bash
# Locally test build
npm install
npm run build
npm start
```

### Issue: Database Connection Error

**Check:**
- DATABASE_URL is set correctly
- PostgreSQL service is running
- Database is linked to backend service

**Solution:**
1. Go to PostgreSQL service → Variables
2. Copy DATABASE_URL
3. Paste in backend service variables

### Issue: Migrations Not Running

**Check Deploy Logs:**
```
Looking for: "Running migrations..."
```

**Manual Fix:**
```bash
railway run npx prisma migrate deploy
```

### Issue: CORS Error

**Check:**
- CORS_ORIGIN matches your frontend URL exactly
- No trailing slash in URL
- Protocol (https://) is included

**Fix:**
```env
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Issue: 502 Bad Gateway

**Check:**
- Server is listening on correct PORT
- PORT environment variable is set
- Server starts successfully in logs

**Fix in `src/index.ts`:**
```typescript
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
```

---

## 📊 Monitoring

### View Logs:
1. Go to backend service
2. Click **"Deployments"**
3. Select latest deployment
4. View **"Deploy Logs"**

### Check Metrics:
1. Go to backend service
2. Click **"Metrics"** tab
3. Monitor:
   - CPU usage
   - Memory usage
   - Network traffic

### Set Up Alerts:
1. Go to **"Settings"** → **"Webhooks"**
2. Add webhook URL for deployment notifications

---

## 🔄 Continuous Deployment

Railway automatically deploys when you push to GitHub:

1. Make changes to your code
2. Commit and push to GitHub:
```bash
git add .
git commit -m "Update backend"
git push origin main
```
3. Railway detects changes and auto-deploys
4. Check deployment status in dashboard

---

## 💰 Pricing

**Free Tier:**
- $5 free credit per month
- Enough for small projects
- Automatic sleep after inactivity

**Paid Plans:**
- Pay as you go
- $0.000463 per GB-hour
- No sleep mode

---

## 🎯 Next Steps

1. ✅ Deploy backend on Railway
2. ✅ Get backend URL
3. ✅ Deploy frontend on Vercel
4. ✅ Update CORS_ORIGIN in Railway
5. ✅ Update NEXT_PUBLIC_API_URL in Vercel
6. ✅ Test complete application

---

## 📝 Important URLs

After deployment, save these:

- **Backend URL**: `https://your-app.up.railway.app`
- **Database URL**: (in Railway PostgreSQL variables)
- **Railway Dashboard**: `https://railway.app/project/your-project-id`

---

## 🆘 Support

**Railway Documentation:**
- https://docs.railway.app

**Railway Discord:**
- https://discord.gg/railway

**Common Issues:**
- https://docs.railway.app/troubleshoot/fixing-common-errors

---

## ✅ Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Backend deployed from GitHub
- [ ] All environment variables set
- [ ] Database linked to backend
- [ ] Migrations ran successfully
- [ ] Domain generated
- [ ] Health endpoint working
- [ ] API endpoints tested
- [ ] CORS configured
- [ ] Logs checked for errors

---

**🎉 Congratulations! Your backend is now live on Railway!**

Next: Deploy frontend on Vercel and connect it to your Railway backend.
