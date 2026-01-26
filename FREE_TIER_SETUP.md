# 🆓 FREE TIER CONFIGURATION - Complete Guide

## Your Current Hardcoded Models (From migrations/7.surrealql)

I analyzed your codebase and found these hardcoded models:

### Podcast Features:
- **Outline Model**: `gpt-5-mini` (typo - should be `gpt-4o-mini`)
- **Transcript Model**: `gpt-5-mini` (typo - should be `gpt-4o-mini`)
- **TTS Model**: `gpt-4o-mini-tts`
- **Providers**: OpenAI

**Note**: `gpt-5-mini` is likely a typo in your migration file. OpenAI's model is called `gpt-4o-mini`.

---

## 🎯 100% FREE TIER STRATEGY

To run this project completely free, you need to use **ONLY free-tier providers with generous limits**:

### Best Free Providers (Confirmed Free Tiers):

1. **Groq** - BEST for FREE LLM
   - ✅ Completely FREE (generous rate limits)
   - ✅ Very fast inference
   - ✅ Models: `llama-3.1-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`
   - ✅ No credit card required

2. **Google Gemini** - BEST for embeddings & long context
   - ✅ FREE tier: 60 requests/minute
   - ✅ Models: `gemini-1.5-flash`, `gemini-1.5-pro` (1M context!)
   - ✅ Embeddings included FREE
   - ✅ No credit card required initially

3. **OpenAI** - NOT FREE (but you have credit)
   - ❌ Requires payment (but $5-18 free credit for new accounts)
   - ⚠️ `gpt-4o-mini` costs $0.15/1M input tokens, $0.60/1M output
   - ⚠️ TTS costs extra

---

## 📋 RAILWAY VARIABLES - 100% FREE CONFIGURATION

Copy these EXACT variables to your Railway dashboard:

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
API_URL=https://YOUR_RAILWAY_DOMAIN_HERE

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
# FREE TIER AI PROVIDERS
# ============================================

# Groq - FREE (Best for LLMs - Chat, Transformations)
# Get FREE key at: https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here

# Google Gemini - FREE (Best for Embeddings & Long Context)
# Get FREE key at: https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=your_google_gemini_key_here

# ============================================
# OPTIONAL: If you have OpenAI credit
# ============================================
# OPENAI_API_KEY=sk-your_key_if_you_have_credit

# ============================================
# DO NOT SET - These are paid services
# ============================================
# ANTHROPIC_API_KEY=  # Claude - PAID
# ELEVENLABS_API_KEY= # TTS - PAID
# MISTRAL_API_KEY=    # Mistral - PAID
# DEEPSEEK_API_KEY=   # DeepSeek - PAID
```

---

## ⚙️ CODE CHANGES REQUIRED

### Fix Migration 7 (Podcast Models)

Your migration file has `gpt-5-mini` which doesn't exist. You need to change it to use **FREE Groq models**:

**File**: `migrations/7.surrealql`

**Change these lines:**

```sql
-- BEFORE (Uses paid OpenAI):
outline_provider: "openai",
outline_model: "gpt-5-mini",  # ← This is wrong (gpt-5 doesn't exist)
transcript_provider: "openai", 
transcript_model: "gpt-5-mini",

-- AFTER (Uses FREE Groq):
outline_provider: "groq",
outline_model: "llama-3.1-8b-instant",  # ← Fast & FREE
transcript_provider: "groq", 
transcript_model: "llama-3.1-70b-versatile",  # ← Smart & FREE
```

**All 3 episode profiles need this change:**
1. `tech_discussion`
2. `solo_expert`
3. `business_analysis`

---

## 🎤 TTS (Text-to-Speech) Problem

**Issue**: Your migrations use `gpt-4o-mini-tts` which is **NOT FREE** and **DOESN'T EXIST** as a model name.

OpenAI TTS models are:
- `tts-1` (costs $15/1M characters)
- `tts-1-hd` (costs $30/1M characters)

### FREE TTS Options:

1. **Google Gemini MultiModal** (BEST FREE OPTION)
   - Use `gemini-1.5-flash` for audio generation
   - FREE tier included

2. **Disable TTS** (if you don't need podcasts)
   - Remove podcast functionality to stay 100% free

3. **Keep OpenAI TTS** (if you have credit)
   - Will use your free credit (~500K-1M characters)

### Recommended: Change to Google TTS (FREE)

**File**: `migrations/7.surrealql`

```sql
-- BEFORE (Paid OpenAI TTS):
tts_provider: "openai",
tts_model: "gpt-4o-mini-tts",  # ← Doesn't exist, costs money

-- AFTER (FREE Google TTS):
tts_provider: "google",
tts_model: "gemini-1.5-flash",  # ← FREE
```

---

## 🔧 EXACT CHANGES TO MAKE

### Step 1: Update Migration File

**File**: `c:\sem6-real\studyrocket\notebookllm\open-notebook\migrations\18.surrealql` (create NEW migration)

```sql
-- Migration 18: Switch to FREE tier models (Groq + Gemini)

-- Update all episode profiles to use FREE Groq models
UPDATE episode_profile:tech_discussion SET
    outline_provider = "groq",
    outline_model = "llama-3.1-8b-instant",
    transcript_provider = "groq",
    transcript_model = "llama-3.1-70b-versatile";

UPDATE episode_profile:solo_expert SET
    outline_provider = "groq",
    outline_model = "llama-3.1-8b-instant",
    transcript_provider = "groq",
    transcript_model = "llama-3.1-70b-versatile";

UPDATE episode_profile:business_analysis SET
    outline_provider = "groq",
    outline_model = "llama-3.1-8b-instant",
    transcript_provider = "groq",
    transcript_model = "llama-3.1-70b-versatile";

-- Update all speaker profiles to use FREE Google TTS
UPDATE speaker_profile:tech_experts SET
    tts_provider = "google",
    tts_model = "gemini-1.5-flash";

UPDATE speaker_profile:solo_expert SET
    tts_provider = "google",
    tts_model = "gemini-1.5-flash";

UPDATE speaker_profile:business_panel SET
    tts_provider = "google",
    tts_model = "gemini-1.5-flash";
```

**File**: `c:\sem6-real\studyrocket\notebookllm\open-notebook\migrations\18_down.surrealql`

```sql
-- Migration 18 Down: Revert to original OpenAI models

UPDATE episode_profile:tech_discussion SET
    outline_provider = "openai",
    outline_model = "gpt-4o-mini",
    transcript_provider = "openai",
    transcript_model = "gpt-4o-mini";

UPDATE episode_profile:solo_expert SET
    outline_provider = "openai",
    outline_model = "gpt-4o-mini",
    transcript_provider = "openai",
    transcript_model = "gpt-4o-mini";

UPDATE episode_profile:business_analysis SET
    outline_provider = "openai",
    outline_model = "gpt-4o-mini",
    transcript_provider = "openai",
    transcript_model = "gpt-4o-mini";

UPDATE speaker_profile:tech_experts SET
    tts_provider = "openai",
    tts_model = "tts-1";

UPDATE speaker_profile:solo_expert SET
    tts_provider = "openai",
    tts_model = "tts-1";

UPDATE speaker_profile:business_panel SET
    tts_provider = "openai",
    tts_model = "tts-1";
```

### Step 2: Register Migration 18

**File**: `open_notebook/database/async_migrate.py`

Add migration 18 to the list (after line with migration 17):

```python
AsyncMigration.from_file("migrations/18.surrealql"),

# In down_migrations:
AsyncMigration.from_file("migrations/18_down.surrealql"),
```

---

## 📊 FREE TIER LIMITS

### Groq (LLM)
- **Rate Limit**: 30 requests/minute
- **Daily**: Generous (thousands of requests)
- **Models**: Llama 3.1 70B, Llama 3.1 8B, Mixtral
- **Context**: 8K-128K tokens depending on model
- **Cost**: $0 (100% FREE)

### Google Gemini (Embeddings + LLM + TTS)
- **Rate Limit**: 60 requests/minute (FREE tier)
- **Daily**: 1,500 requests/day (FREE tier)
- **Models**: Gemini 1.5 Flash, Gemini 1.5 Pro
- **Context**: Up to 1 MILLION tokens!
- **Cost**: $0 (FREE tier, then pay-as-you-go)

### Railway Hosting
- **Free**: $5 credit/month (hobby plan)
- **Usage**: ~$5-10/month for this app
- **Result**: First month FREE, then ~$5-10/month

---

## 🎯 MODEL USAGE BY FEATURE

Based on my analysis, here's what each feature uses:

| Feature | Current Model | FREE Alternative |
|---------|--------------|------------------|
| **Chat** | User-selected | Groq: `llama-3.1-70b-versatile` |
| **Transformations** | User-selected | Groq: `llama-3.1-70b-versatile` |
| **Embeddings** | User-selected | Gemini: `text-embedding-004` |
| **Large Context** | User-selected | Gemini: `gemini-1.5-pro` (1M context!) |
| **Podcast Outline** | `gpt-5-mini` (broken) | Groq: `llama-3.1-8b-instant` |
| **Podcast Transcript** | `gpt-5-mini` (broken) | Groq: `llama-3.1-70b-versatile` |
| **TTS (Podcast Audio)** | `gpt-4o-mini-tts` (doesn't exist) | Google: `gemini-1.5-flash` |
| **Search** | Embeddings model | Gemini: `text-embedding-004` |
| **Insights** | Transformation model | Groq: `llama-3.1-70b-versatile` |

---

## ✅ DEPLOYMENT CHECKLIST

### Before Pushing Code:

- [ ] Create `migrations/18.surrealql` (use FREE models)
- [ ] Create `migrations/18_down.surrealql` (rollback)
- [ ] Update `async_migrate.py` to include migration 18
- [ ] Get FREE Groq API key from https://console.groq.com/keys
- [ ] Get FREE Gemini API key from https://makersuite.google.com/app/apikey

### Railway Variables:

- [ ] Set `GROQ_API_KEY` (your FREE key)
- [ ] Set `GOOGLE_API_KEY` (your FREE key)
- [ ] Set `SURREAL_URL=ws://127.0.0.1:8000/rpc` (not localhost!)
- [ ] Set `INTERNAL_API_URL=http://127.0.0.1:5055`
- [ ] Keep all retry/worker settings as-is
- [ ] **DO NOT** set `OPENAI_API_KEY` (unless you have credit)

### After Deploy:

- [ ] Check logs for "Migrations completed successfully. Database is now at version 18"
- [ ] Test chat with Groq models
- [ ] Test embeddings with Gemini
- [ ] Test podcast generation (if needed)
- [ ] Monitor FREE tier usage in Groq/Gemini dashboards

---

## 💰 COST BREAKDOWN

### Monthly Costs (FREE TIER):

| Service | Cost |
|---------|------|
| **Groq LLM** | $0 (FREE) |
| **Gemini API** | $0 (FREE tier) |
| **Railway Hosting** | $5-10/month |
| **Domain** (optional) | $10-15/year |
| **Total** | **$5-10/month** |

### If You Exceed FREE Tiers:

- **Groq**: Still free (very generous limits)
- **Gemini**: $0.35 per 1M tokens (very cheap)
- **Worst case**: $10-20/month total

---

## 🚨 WARNINGS

1. **`gpt-5-mini` doesn't exist** - This will cause errors if OpenAI is called
2. **`gpt-4o-mini-tts` doesn't exist** - TTS will fail without migration
3. **Migration 18 is REQUIRED** - Old data uses broken model names
4. **Test locally first** - Run migrations on local DB before Railway

---

## 🎉 BENEFITS OF FREE TIER SETUP

✅ **$0/month for AI** (only pay for Railway hosting)
✅ **Fast inference** with Groq (faster than OpenAI!)
✅ **1M token context** with Gemini (vs 128K for GPT-4)
✅ **No credit card needed** for Groq/Gemini free tiers
✅ **Scalable** - Upgrade to paid tiers if needed later

---

## 📞 SUPPORT

Get your FREE API keys:
- 🔥 **Groq**: https://console.groq.com/keys
- 🌟 **Gemini**: https://makersuite.google.com/app/apikey

Questions? Check the main docs or Discord!
