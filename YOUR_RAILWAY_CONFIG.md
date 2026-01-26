# 🚂 Your Railway Configuration - Ready to Deploy

## Your Current Setup Analysis

Based on your existing Railway variables, your configuration uses:
- ✅ **Database**: `test` namespace and database (not production)
- ✅ **Multiple AI Providers**: Gemini (Google), Groq, Llama
- ✅ **Worker Configuration**: 5 concurrent tasks with retry logic
- ✅ **Proper retry settings**: Exponential jitter for reliability

## STEP 1: Current Railway Variables (What You Already Have)

These are already set in your Railway deployment:

```bash
# Database - Already Configured ✅
SURREAL_URL=ws://localhost:8000/rpc              # ⚠️ NEEDS FIX (see below)
SURREAL_USER=root
SURREAL_PASSWORD=root
SURREAL_NAMESPACE=test
SURREAL_DATABASE=test

# API URL - Already Configured ✅
API_URL=http://localhost:5055                    # ⚠️ NEEDS UPDATE (see below)

# Worker & Retry - Already Configured ✅
SURREAL_COMMANDS_MAX_TASKS=5
SURREAL_COMMANDS_RETRY_ENABLED=true
SURREAL_COMMANDS_RETRY_MAX_ATTEMPTS=3
SURREAL_COMMANDS_RETRY_WAIT_STRATEGY=exponential_jitter
SURREAL_COMMANDS_RETRY_WAIT_MIN=1
SURREAL_COMMANDS_RETRY_WAIT_MAX=30
```

## STEP 2: Critical Fixes Needed

### Fix 1: Change `localhost` to `127.0.0.1` for SURREAL_URL

**In Railway Dashboard → Variables:**

❌ **Current (WRONG):**
```bash
SURREAL_URL=ws://localhost:8000/rpc
```

✅ **Change to (CORRECT):**
```bash
SURREAL_URL=ws://127.0.0.1:8000/rpc
```

**Why?** Railway's container networking requires `127.0.0.1` instead of `localhost`.

### Fix 2: Add INTERNAL_API_URL

**Add this new variable in Railway:**
```bash
INTERNAL_API_URL=http://127.0.0.1:5055
```

**Why?** Next.js needs this for server-side API proxying.

### Fix 3: Update API_URL to Your Railway Domain

**After your first successful deploy:**

❌ **Current:**
```bash
API_URL=http://localhost:5055
```

✅ **Change to YOUR Railway domain:**
```bash
API_URL=https://your-app-production-xxxx.up.railway.app
```

**How to find your Railway domain:**
1. Go to Railway Dashboard → Your Service
2. Look at the "Deployments" tab
3. Copy the domain (e.g., `https://se-production-1234.up.railway.app`)
4. Paste it as the API_URL value (without `/api` at the end)

## STEP 3: Add Your AI API Keys

You mentioned using **Gemini, Groq, and Llama**. Add these variables:

### For Google Gemini (Required)
```bash
GOOGLE_API_KEY=your_actual_gemini_api_key
```
Get it at: https://makersuite.google.com/app/apikey

### For Groq (Required)
```bash
GROQ_API_KEY=your_actual_groq_api_key
```
Get it at: https://console.groq.com/keys

### For Llama via Ollama (If applicable)
If you're running Ollama somewhere accessible:
```bash
OLLAMA_API_BASE=http://your-ollama-host:11434
```

**OR** if using Llama via Groq (most common):
- No extra configuration needed - Groq provides Llama models

### Optional: Other Providers
If you want to add more providers later:
```bash
# OpenAI (optional)
OPENAI_API_KEY=sk-your_key

# Anthropic Claude (optional)
ANTHROPIC_API_KEY=sk-ant-your_key

# Mistral (optional)
MISTRAL_API_KEY=your_key
```

## STEP 4: Complete Railway Variables List

Copy this EXACT configuration to Railway:

```bash
# ============================================
# DATABASE (Keep as-is)
# ============================================
SURREAL_URL=ws://127.0.0.1:8000/rpc
SURREAL_USER=root
SURREAL_PASSWORD=root
SURREAL_NAMESPACE=test
SURREAL_DATABASE=test

# ============================================
# API CONFIGURATION
# ============================================
INTERNAL_API_URL=http://127.0.0.1:5055
API_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app

# ============================================
# WORKER & RETRY (Keep as-is)
# ============================================
SURREAL_COMMANDS_MAX_TASKS=5
SURREAL_COMMANDS_RETRY_ENABLED=true
SURREAL_COMMANDS_RETRY_MAX_ATTEMPTS=3
SURREAL_COMMANDS_RETRY_WAIT_STRATEGY=exponential_jitter
SURREAL_COMMANDS_RETRY_WAIT_MIN=1
SURREAL_COMMANDS_RETRY_WAIT_MAX=30

# ============================================
# AI PROVIDERS (ADD YOUR KEYS)
# ============================================
GOOGLE_API_KEY=your_actual_gemini_key
GROQ_API_KEY=your_actual_groq_key

# Optional: If using Ollama for Llama
# OLLAMA_API_BASE=http://your-ollama-host:11434

# Optional: Other providers
# OPENAI_API_KEY=sk-your_key
# ANTHROPIC_API_KEY=sk-ant-your_key
```

## STEP 5: Deploy Order

### A. Before Redeploying - Set These First:
1. ✅ Change `SURREAL_URL` to use `127.0.0.1`
2. ✅ Add `INTERNAL_API_URL=http://127.0.0.1:5055`
3. ✅ Add `GOOGLE_API_KEY` (your Gemini key)
4. ✅ Add `GROQ_API_KEY` (your Groq key)
5. ⏸️ Keep `API_URL` as is for now (update after deploy)

### B. Push Code Changes:
```powershell
cd c:\sem6-real\studyrocket\notebookllm\open-notebook
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main
```

### C. After Successful Deploy:
1. ✅ Copy your Railway domain
2. ✅ Update `API_URL` to your Railway domain
3. ✅ Railway will auto-redeploy

## STEP 6: Verification Checklist

After deployment completes, verify:

- [ ] Service shows "RUNNING" in Railway
- [ ] Check logs: "Application startup complete"
- [ ] Check logs: "Migrations completed successfully. Database is now at version 17"
- [ ] Visit `https://your-domain.up.railway.app/` → Should load UI
- [ ] Visit `https://your-domain.up.railway.app/api/health` → Should return `{"status":"ok"}`
- [ ] Try creating a notebook in the UI
- [ ] Test AI features (chat, generation)

## Common Issues Specific to Your Setup

### Issue: "Database Connection Failed"
**Cause:** Using `localhost` instead of `127.0.0.1`
**Solution:** Change `SURREAL_URL=ws://127.0.0.1:8000/rpc`

### Issue: "Unable to Connect to API Server"
**Cause:** `INTERNAL_API_URL` not set or `API_URL` pointing to localhost
**Solution:** 
- Set `INTERNAL_API_URL=http://127.0.0.1:5055`
- Set `API_URL=https://your-railway-domain.up.railway.app`

### Issue: "AI Model Not Available"
**Cause:** API keys not set or incorrect
**Solution:**
- Verify `GOOGLE_API_KEY` is set correctly
- Verify `GROQ_API_KEY` is set correctly
- Check API key validity at provider dashboards

### Issue: "Migrations Stuck at Version 14"
**Cause:** Code changes not deployed
**Solution:**
- Ensure you pushed the latest code with migrations 15-17
- Check Railway logs for migration errors
- Verify all migration files exist in the repo

## Model Configuration by Provider

Based on your setup, here's which models you can use:

### Via Gemini (GOOGLE_API_KEY)
- ✅ `gemini-pro` - General purpose
- ✅ `gemini-pro-vision` - Image understanding
- ✅ `gemini-1.5-pro` - Long context (1M tokens)
- ✅ `gemini-1.5-flash` - Fast & efficient
- ✅ Text embeddings via Gemini

### Via Groq (GROQ_API_KEY)
- ✅ `llama-3.1-70b-versatile` - Best Llama model
- ✅ `llama-3.1-8b-instant` - Fast Llama
- ✅ `llama3-70b-8192` - Older Llama version
- ✅ `mixtral-8x7b-32768` - Mixtral model
- ✅ `gemma2-9b-it` - Google's Gemma

### Via Ollama (if configured)
- ✅ Any locally installed model
- ✅ `llama3:latest`, `llama3.1:latest`
- ✅ `mistral:latest`, `mixtral:latest`
- ✅ Custom models

## Cost Estimation for Your Setup

### Gemini (Google)
- **Free Tier**: 60 requests/minute
- **Paid**: $0.50 per 1M input tokens (very affordable)
- **Best for**: Long context, embeddings, general use

### Groq
- **Free Tier**: Generous free tier
- **Paid**: Very competitive pricing
- **Best for**: Fast inference, Llama models

### Total Monthly Cost (Estimated)
- **Light use** (testing): $0-5/month
- **Medium use** (regular): $10-30/month
- **Heavy use** (production): $50-100/month

Plus Railway hosting: ~$5-10/month

## Next Steps

1. **Update variables** in Railway as shown above
2. **Push code** to GitHub
3. **Wait for deploy** (5-10 minutes)
4. **Update API_URL** with your Railway domain
5. **Test all features** with your AI providers

## Support

If you encounter issues:
1. Check Railway logs: Dashboard → Deployments → View Logs
2. Look for specific error messages
3. Verify all environment variables are set
4. Test API keys at provider dashboards
5. Join Discord for help: https://discord.gg/37XJPXfz2w

---

**Your setup is nearly perfect!** Just make the three fixes above (127.0.0.1, INTERNAL_API_URL, and API_URL) and add your AI keys, then you're good to go! 🚀
