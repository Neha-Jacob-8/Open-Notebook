# 🌐 Run Open Notebook Locally with Public Access (100% FREE!)

## Quick Start - 3 Steps

### Step 1: Install Cloudflare Tunnel (One-time setup)

```powershell
# Download cloudflared for Windows
winget install --id Cloudflare.cloudflared
```

Or download from: https://github.com/cloudflare/cloudflared/releases/latest

### Step 2: Start Your App

```powershell
# Navigate to project directory
cd c:\sem6-real\studyrocket\notebookllm\open-notebook

# Copy environment file
Copy-Item .env.local .env

# Start with Docker (RECOMMENDED - Everything in one container)
docker-compose -f docker-compose.single.yml up
```

**OR** start without Docker:

```powershell
# Terminal 1: Start SurrealDB
surreal start --log info --user root --pass root file:data/mydatabase.db

# Terminal 2: Start API
uv run uvicorn api.main:app --host 0.0.0.0 --port 5055

# Terminal 3: Start Worker
uv run surreal-commands-worker --import-modules commands

# Terminal 4: Start Frontend
cd frontend
npm run dev
```

### Step 3: Create Public Tunnel

Open a NEW terminal and run:

```powershell
# For port 8080 (Docker) or 3000 (dev mode)
cloudflared tunnel --url http://localhost:8080
```

**You'll get a public URL like:**
```
https://random-words-1234.trycloudflare.com
```

✅ **Share this URL with anyone!** It works from anywhere in the world!

---

## 🎯 Usage

**When running:**
1. Your app runs on your PC
2. Cloudflare Tunnel gives you a public URL
3. Anyone can access it from anywhere
4. Data is stored locally on your PC

**To stop:**
- Press `Ctrl+C` in the cloudflared terminal to stop the tunnel
- Press `Ctrl+C` in Docker or other terminals to stop the app

---

## 🔄 Restart Later

Just run these 2 commands again:

```powershell
# Terminal 1: Start app
docker-compose -f docker-compose.single.yml up

# Terminal 2: Start tunnel (you'll get a NEW URL)
cloudflared tunnel --url http://localhost:8080
```

---

## 🎁 Bonus: Get a PERMANENT URL (FREE!)

Instead of random URLs, get your own subdomain:

1. **Sign up** at https://dash.cloudflare.com (free account)
2. **Create named tunnel**:
   ```powershell
   cloudflared tunnel login
   cloudflared tunnel create my-notebook
   cloudflared tunnel route dns my-notebook my-notebook.yourdomain.com
   ```
3. **Start with permanent URL**:
   ```powershell
   cloudflared tunnel run my-notebook
   ```

Now you have `https://my-notebook.yourdomain.com` forever!

---

## 💰 Cost Comparison

| Option | Cost | RAM | Uptime |
|--------|------|-----|--------|
| **Local + Tunnel** | **$0/month** | Unlimited | When PC is on |
| Railway | $5-10/month | 8GB | 24/7 |
| Render | Out of memory | 512MB | 24/7 |

---

## ✨ Features

- ✅ 100% FREE forever
- ✅ No credit card needed
- ✅ Unlimited RAM (your PC's RAM)
- ✅ Fast (your hardware)
- ✅ Public URL works worldwide
- ✅ All features work (Chat, Search, Insights, etc.)
- ✅ FREE AI models (Groq + Gemini)

---

## 🆘 Troubleshooting

**If Docker doesn't work:**
- Use the manual startup (4 terminals)
- Frontend runs on port 3000 in dev mode
- Use: `cloudflared tunnel --url http://localhost:3000`

**If tunnel disconnects:**
- Just restart the cloudflared command
- You'll get a new URL (or use permanent URL setup)

**If you want 24/7 hosting:**
- Leave your PC running with the app + tunnel
- Or use Railway ($5/month) with all the fixes we made

---

## 🚀 You're All Set!

Run the commands above and you'll have a public website in 2 minutes! 🎉
