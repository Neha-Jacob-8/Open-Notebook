# 🚀 FINAL RAILWAY VARIABLES - Ready to Deploy

## Copy ALL of these to Railway Dashboard → Variables

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
GROQ_API_KEY=<YOUR_GROQ_KEY_HERE>
GOOGLE_API_KEY=<YOUR_GEMINI_KEY_HERE>
```

## After First Deploy

Once you get your Railway domain (like `https://se-production-xxxx.up.railway.app`):

```plaintext
API_URL=https://your-actual-railway-domain.up.railway.app
```

---

## ✅ What Will Work

With these keys, these features will work:

- ✅ **Chat** - Using Groq Llama models
- ✅ **Transformations** - Using Groq Llama models  
- ✅ **Embeddings/Search** - Using Gemini embeddings
- ✅ **Long Context** - Using Gemini 1.5 Pro (1M tokens!)
- ✅ **Insights** - Using Groq models
- ✅ **Knowledge Graph** - Using embeddings
- ✅ **Document Upload** - Using embeddings for vectorization

## ⏸️ What You'll Set Up Later

- ⏸️ **Podcasts** - You'll configure this later (needs TTS setup)

---

## 🚀 Deploy Now

```powershell
git add .
git commit -m "Add FREE tier config with Groq + Gemini API keys"
git push origin main
```

Railway will auto-deploy and everything except podcasts will work! 🎉
