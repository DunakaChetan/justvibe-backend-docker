# Deploy Backend to Render - Step by Step Guide

This guide will walk you through deploying your JustVibe backend to Render using Supabase as the database.

## Prerequisites

1. **GitHub Account** - Backend code pushed to GitHub (separate repository or folder)
2. **Render Account** - Sign up at [render.com](https://render.com) (free tier available)
3. **Supabase Account** - Already set up with project URL and service role key

---

## Step 1: Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** → This is your `SUPABASE_URL`
   - **service_role key** (secret) → This is your `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **Keep service_role key secret!**

---

## Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Choose **"Sign up with GitHub"**
4. Authorize Render to access your GitHub account

---

## Step 3: Deploy Web Service

### 3.1 Create New Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - Click **"Connect GitHub"** if not connected
   - Select your backend repository (or repository with backend folder)

### 3.2 Configure Service

**Settings:**
- **Name:** `justvibe-backend`
- **Region:** Choose closest to your users
- **Branch:** `main`
- **Root Directory:** Leave empty if backend is root, or enter folder name (e.g., `JustVibe Backend`)
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** Free (for testing) or Starter ($7/month)

### 3.3 Set Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

| Variable | Value |
|----------|-------|
| `PORT` | Leave empty (auto-set) or `10000` |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` (update after frontend deploy) |
| `SUPABASE_URL` | Your Supabase Project URL (from Step 1) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key (from Step 1) |
| `JWT_SECRET` | Generate random string: `openssl rand -base64 32` |
| `NODE_ENV` | `production` |

### 3.4 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. Copy your backend URL (e.g., `https://justvibe-backend.onrender.com`)

---

## Step 4: Test Your Backend

1. Visit: `https://your-backend.onrender.com/health`
   - Should return: `{"status":"OK","message":"JustVibe Backend is running"}`

2. Check logs in Render dashboard → **Logs** tab

3. **Save your backend URL** - you'll need it for frontend configuration

---

## Step 5: Update CORS After Frontend Deploy

After deploying frontend to Vercel:

1. Go to Render service → **Environment** tab
2. Edit `CORS_ORIGIN` → Set to your Vercel frontend URL
3. Click **"Save Changes"** (auto-redeploys)

---

## Step 6: Automatic Deployments

Render auto-deploys on every push to `main` branch.

To update:
```bash
git add .
git commit -m "Update backend"
git push origin main
```

---

## Troubleshooting

**Build fails:**
- Check `package.json` is correct
- Verify all dependencies are listed
- Check Render build logs

**Service crashes:**
- Check **Logs** tab for errors
- Verify all environment variables are set
- Ensure Supabase credentials are correct

**CORS errors:**
- Update `CORS_ORIGIN` with your Vercel frontend URL
- Check backend logs

**Slow first request (Free tier):**
- Free tier spins down after 15 min inactivity
- First request takes 30-60 seconds
- Upgrade to Starter ($7/month) for always-on

---

## Environment Variables Summary

| Variable | Description |
|----------|-------------|
| `PORT` | Auto-set by Render |
| `CORS_ORIGIN` | Your Vercel frontend URL |
| `SUPABASE_URL` | From Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Dashboard → Settings → API |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` |
| `NODE_ENV` | `production` |

---

## Next Steps

1. ✅ Backend deployed
2. 📝 Deploy frontend (see `DEPLOY_FRONTEND_VERCEL.md`)
3. 🔄 Update `CORS_ORIGIN` with frontend URL
4. 🎉 Done!

**Backend URL:** `https://your-backend.onrender.com`

