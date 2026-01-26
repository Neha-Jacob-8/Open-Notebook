# 🎯 Railway Quick Fix - Copy & Paste Ready

## Variables to CHANGE in Railway Dashboard

### 1. Fix SURREAL_URL (CRITICAL)
```bash
# ❌ Remove or change this:
SURREAL_URL=ws://localhost:8000/rpc

# ✅ Use this instead:
SURREAL_URL=ws://127.0.0.1:8000/rpc
```

### 2. Add INTERNAL_API_URL (CRITICAL)
```bash
# ✅ Add this new variable:
INTERNAL_API_URL=http://127.0.0.1:5055
```

### 3. Update API_URL After First Deploy
```bash
# ❌ Current:
API_URL=http://localhost:5055

# ✅ Change to YOUR Railway domain (after you get it):
API_URL=https://your-app-production-xxxx.up.railway.app
```

## Variables to ADD in Railway Dashboard

### 4. Add Your AI API Keys
```bash
# Google Gemini (Required for your setup)
GOOGLE_API_KEY=paste_your_gemini_key_here

# Groq (Required for your setup)
GROQ_API_KEY=paste_your_groq_key_here

# If using Ollama for Llama models (Optional)
OLLAMA_API_BASE=http://your-ollama-host:11434
```

## Variables to KEEP (Don't Change)

These are already correct in your Railway:
```bash
✅ SURREAL_USER=root
✅ SURREAL_PASSWORD=root
✅ SURREAL_NAMESPACE=test
✅ SURREAL_DATABASE=test
✅ SURREAL_COMMANDS_MAX_TASKS=5
✅ SURREAL_COMMANDS_RETRY_ENABLED=true
✅ SURREAL_COMMANDS_RETRY_MAX_ATTEMPTS=3
✅ SURREAL_COMMANDS_RETRY_WAIT_STRATEGY=exponential_jitter
✅ SURREAL_COMMANDS_RETRY_WAIT_MIN=1
✅ SURREAL_COMMANDS_RETRY_WAIT_MAX=30
```

## Complete Variable List for Railway

Copy this entire block and set in Railway Variables:

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
GOOGLE_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

## Deployment Steps

1. **Update Railway Variables** (see above)
2. **Push Code**:
   ```powershell
   git add .
   git commit -m "Fix Railway config and add migrations 15-17"
   git push origin main
   ```
3. **Wait for Deploy** (Railway auto-deploys from GitHub)
4. **Get Railway Domain** from Railway Dashboard
5. **Update API_URL** with your actual domain
6. **Verify** at `https://your-domain/api/health`

## That's It!

Your deployment should work after these changes. 

Questions? Read `YOUR_RAILWAY_CONFIG.md` for detailed explanations.
