# 🆓 FREE TIER - Railway Variables (Copy-Paste Ready)

## ⚡ QUICK SETUP

### Step 1: Get FREE API Keys

1. **Groq** (FREE LLM): https://console.groq.com/keys
2. **Gemini** (FREE Embeddings/TTS): https://makersuite.google.com/app/apikey

### Step 2: Set These in Railway Variables

```plaintext
SURREAL_URL=ws://127.0.0.1:8000/rpc
SURREAL_USER=root
SURREAL_PASSWORD=root
SURREAL_NAMESPACE=test
SURREAL_DATABASE=test
INTERNAL_API_URL=http://127.0.0.1:5055
API_URL=https://YOUR_RAILWAY_DOMAIN_HERE
SURREAL_COMMANDS_MAX_TASKS=5
SURREAL_COMMANDS_RETRY_ENABLED=true
SURREAL_COMMANDS_RETRY_MAX_ATTEMPTS=3
SURREAL_COMMANDS_RETRY_WAIT_STRATEGY=exponential_jitter
SURREAL_COMMANDS_RETRY_WAIT_MIN=1
SURREAL_COMMANDS_RETRY_WAIT_MAX=30
GROQ_API_KEY=paste_your_groq_key_here
GOOGLE_API_KEY=paste_your_gemini_key_here
```

### Step 3: Push Code

```powershell
git add .
git commit -m "Switch to 100% free tier models (Groq + Gemini)"
git push origin main
```

### Step 4: After Deploy

Update `API_URL` with your actual Railway domain.

---

## 🎯 WHAT CHANGED

### Podcast Models (Migration 18)

**Before (BROKEN & PAID):**
- Outline: `openai/gpt-5-mini` ← Model doesn't exist!
- Transcript: `openai/gpt-5-mini` ← Model doesn't exist!
- TTS: `openai/gpt-4o-mini-tts` ← Model doesn't exist!
- **Cost**: Would fail + $15-30/month if fixed

**After (FREE & WORKING):**
- Outline: `groq/llama-3.1-8b-instant` ← Fast, FREE
- Transcript: `groq/llama-3.1-70b-versatile` ← Smart, FREE
- TTS: `google/gemini-1.5-flash` ← FREE
- **Cost**: $0/month!

---

## 📊 FREE TIER LIMITS

| Provider | Free Limit | Good For |
|----------|-----------|----------|
| **Groq** | 30 req/min<br>~7000 req/day | Chat, Transformations, Podcasts |
| **Gemini** | 60 req/min<br>1500 req/day | Embeddings, Long Context, TTS |
| **Railway** | $5 credit/month | Hosting (costs $5-10/month) |

**Total Cost**: ~$5-10/month (just hosting!)

---

## ✅ Verification

After deploy, check logs for:
```
Migrations completed successfully. Database is now at version 18
```

Then test:
- ✅ Chat works with Groq
- ✅ Search works with Gemini embeddings
- ✅ Podcasts work with Groq + Gemini TTS

---

## 🆘 If It Fails

### "Migration 18 not found"
→ Make sure you committed `migrations/18.surrealql`

### "GROQ_API_KEY not set"
→ Get free key: https://console.groq.com/keys

### "GOOGLE_API_KEY not set"
→ Get free key: https://makersuite.google.com/app/apikey

### "Model not found"
→ Migration 18 probably didn't run. Check logs.

---

**Read `FREE_TIER_SETUP.md` for detailed explanation!**
