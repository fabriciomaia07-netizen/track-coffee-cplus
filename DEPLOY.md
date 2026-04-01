# C+ Track Coffee — Deploy Guide

## 1. Supabase Setup

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to Switzerland (e.g., **West EU / Frankfurt**)
3. Save your **project password** securely

### 1.2 Run Database Migration
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire content of `supabase/migrations/001_schema.sql` and paste it
4. Click **Run** — this creates all tables, triggers, and security policies

### 1.3 Create Storage Bucket
1. Go to **Storage** in the Supabase dashboard
2. Click **New Bucket**
3. Name: `labels`
4. Check **Public bucket**
5. Click **Create**

### 1.4 Get Your Keys
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under Project API keys)

---

## 2. GitHub Setup

### 2.1 Create Repository
Open your terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial commit: C+ Track Coffee app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/track-coffee.git
git push -u origin main
```

> Replace `YOUR_USERNAME` with your GitHub username. Create the repo on github.com first (without README).

---

## 3. Railway Deployment

### 3.1 Connect to Railway
1. Go to [railway.app](https://railway.app) and log in with GitHub
2. Click **New Project** → **Deploy from GitHub Repo**
3. Select your `track-coffee` repository
4. Railway will auto-detect it as a Next.js project

### 3.2 Configure Environment Variables
In your Railway project, go to **Variables** and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key
```

### 3.3 Configure Build Settings
Railway usually auto-detects these, but verify:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `/` (leave default)

### 3.4 Generate Domain
1. Go to **Settings** → **Networking**
2. Click **Generate Domain** to get a `*.up.railway.app` URL
3. Or add your own custom domain

### 3.5 Deploy
Railway will automatically deploy when you push to GitHub. Your app will be live at the generated URL.

---

## 4. Create Your First Admin User

1. Open your deployed app URL
2. Click **Create Account**
3. Fill in your name, email, password
4. Select your store (Interlaken or Montreux)
5. Select role: **Admin**
6. Log in — you're ready!

---

## 5. Import Existing Coffee Inventory

1. Log in to the app
2. Go to **Green Beans** → **Import Excel**
3. Upload your `.xlsx` file with columns:
   - Origin (or Origem)
   - Variety (or Variedade)
   - Process (or Processo)
   - Quantity (or Quantidade) — in kg
   - Purchase Date (or Data)
   - Supplier (or Fornecedor)

---

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous API key |
