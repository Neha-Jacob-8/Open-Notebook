# 🚀 Railway Deployment Quick Checklist

## Pre-Deployment
- [ ] Fork repository to your GitHub account
- [ ] Have at least one AI API key ready (OpenAI, Anthropic, etc.)
- [ ] Have Railway account created

## Step 1: Push Code
```bash
git add .
git commit -m "Add Railway deployment fixes"
git push origin main
```

## Step 2: Create Railway Project
- [ ] Go to https://railway.app/
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose your forked repository
- [ ] Railway will start building automatically

## Step 3: Set Environment Variables (CRITICAL!)

Go to Railway → Your Service → Variables tab

### Required Variables (Set BEFORE first successful deploy):
```bash
SURREAL_URL=ws://127.0.0.1:8000/rpc
SURREAL_USER=root
SURREAL_PASSWORD=root
SURREAL_NAMESPACE=open_notebook
SURREAL_DATABASE=production
INTERNAL_API_URL=http://127.0.0.1:5055
OPENAI_API_KEY=sk-your-actual-openai-key
```

- [ ] All required variables set
- [ ] Wait for build to complete
- [ ] Note your Railway domain (e.g., `https://yourapp-production.up.railway.app`)

## Step 4: Set API_URL (AFTER getting domain)
```bash
API_URL=https://yourapp-production.up.railway.app
```

- [ ] API_URL variable added with YOUR actual Railway domain
- [ ] Redeploy triggered (automatic after adding variable)

## Step 5: Configure Railway Settings
- [ ] Go to Settings → Networking
- [ ] Verify port 8080 is exposed (should auto-detect)
- [ ] Health check path: `/api/health`

## Step 6: Verify Deployment

### Check These URLs:
- [ ] `https://yourapp.up.railway.app/` → Should show Open Notebook UI
- [ ] `https://yourapp.up.railway.app/api/health` → Should return `{"status":"ok"}`
- [ ] `https://yourapp.up.railway.app/api/docs` → Should show API documentation

### Check Railway Logs:
- [ ] All 4 services started: surrealdb, api, worker, frontend
- [ ] No error messages (warnings are OK)
- [ ] Migrations completed successfully
- [ ] Frontend shows "Ready in XXms"

## Step 7: Test Functionality
- [ ] Create a new notebook
- [ ] Upload a test document
- [ ] Try chat functionality
- [ ] Generate a podcast (optional)

## Common Issues & Quick Fixes

### ❌ Build Timeout
**Solution:** Upgrade to Railway Hobby plan ($5/month) for longer build times

### ❌ Services Keep Restarting
**Solution:** Check environment variables are set correctly, especially `SURREAL_URL`

### ❌ Frontend Can't Connect to API
**Solution:** Ensure `API_URL` is set to your actual Railway domain (with https://)

### ❌ Out of Memory
**Solution:** Upgrade Railway plan (single container needs ~2GB RAM)

### ❌ "Database Connection Failed"
**Solution:** 
1. Check `SURREAL_URL=ws://127.0.0.1:8000/rpc` (note: 127.0.0.1, not localhost)
2. Verify SurrealDB service is running in logs

## Environment Variables Checklist

### Required (App Won't Work Without These):
- [ ] `SURREAL_URL`
- [ ] `SURREAL_USER`
- [ ] `SURREAL_PASSWORD`
- [ ] `SURREAL_NAMESPACE`
- [ ] `SURREAL_DATABASE`
- [ ] `INTERNAL_API_URL`
- [ ] `API_URL` (add after first deploy)
- [ ] At least one AI API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)

### Optional (Add As Needed):
- [ ] `ANTHROPIC_API_KEY` - For Claude models
- [ ] `GOOGLE_API_KEY` - For Gemini models
- [ ] `GROQ_API_KEY` - For Groq models
- [ ] `MISTRAL_API_KEY` - For Mistral models
- [ ] `OPEN_NOTEBOOK_PASSWORD` - For password protection
- [ ] `FIRECRAWL_API_KEY` - For enhanced web scraping
- [ ] `JINA_API_KEY` - For advanced embeddings

## Success Indicators

Your deployment is successful when you see in Railway logs:
```
✓ Ready in XXXms
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:5055
Migrations completed successfully. Database is now at version 17
All services entered RUNNING state
```

## Cost Estimation

**Railway Hobby Plan**: ~$5-10/month
- Includes $5 usage credit
- Covers single container deployment
- Sufficient for testing and small-scale use

**Plus AI API Costs**: Pay-per-use
- OpenAI: ~$0.002-0.06 per 1K tokens
- Anthropic: Similar pricing
- Varies by model and usage

## Support

Need help?
- 📖 Read [RAILWAY.md](./RAILWAY.md) for detailed guide
- 💬 Join [Discord](https://discord.gg/37XJPXfz2w)
- 🐛 Report [GitHub Issues](https://github.com/PremKxmar/se/issues)

---

## After Successful Deployment

1. **Bookmark your Railway app URL**
2. **Set up volume** (in Railway) for `/mydata` to persist database
3. **Monitor usage** in Railway dashboard
4. **Configure more AI providers** as needed
5. **Secure with password** by setting `OPEN_NOTEBOOK_PASSWORD`

## Development Workflow

To update your deployed app:
1. Make changes locally
2. Test with `docker compose up` or `npm run dev`
3. Commit and push to GitHub
4. Railway auto-deploys (if enabled)
5. Verify in Railway logs

---

**Pro Tip:** Copy this checklist and check off items as you complete them!
