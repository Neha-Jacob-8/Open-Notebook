# 🚂 Railway Deployment Guide for Open Notebook

## Prerequisites

- A [Railway](https://railway.app/) account
- At least one AI API key (OpenAI, Anthropic, etc.)

## Quick Deploy

### Option 1: Deploy from GitHub (Recommended)

1. **Fork this repository** to your GitHub account

2. **Create a new Railway project:**
   - Go to [Railway](https://railway.app/)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your forked repository

3. **Configure Environment Variables:**
   
   Go to your Railway service → Variables tab and add:

   ```bash
   # Required Variables
   SURREAL_URL=ws://127.0.0.1:8000/rpc
   SURREAL_USER=root
   SURREAL_PASSWORD=root
   SURREAL_NAMESPACE=open_notebook
   SURREAL_DATABASE=production
   INTERNAL_API_URL=http://127.0.0.1:5055
   
   # Add your AI API key (at least one required)
   OPENAI_API_KEY=sk-your-key-here
   ```

4. **After first deployment, set the API_URL:**
   
   Once Railway generates your public URL (e.g., `https://your-app.up.railway.app`):
   
   ```bash
   API_URL=https://your-app.up.railway.app
   ```

5. **Configure Railway Settings:**
   - Go to Settings → Networking
   - Make sure port 8080 is exposed (Railway should auto-detect this)
   - Health check path: `/api/health`

6. **Redeploy** after adding the API_URL

### Option 2: Deploy with Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to project (or create new)
railway link

# Set environment variables
railway variables set SURREAL_URL=ws://127.0.0.1:8000/rpc
railway variables set SURREAL_USER=root
railway variables set SURREAL_PASSWORD=root
railway variables set SURREAL_NAMESPACE=open_notebook
railway variables set SURREAL_DATABASE=production
railway variables set INTERNAL_API_URL=http://127.0.0.1:5055
railway variables set OPENAI_API_KEY=sk-your-key-here

# Deploy
railway up

# Get your app URL
railway domain

# Set API_URL with your domain
railway variables set API_URL=https://your-app.up.railway.app
```

## Architecture

This deployment uses the **single-container** architecture:
- ✅ SurrealDB (embedded database)
- ✅ FastAPI backend (port 5055)
- ✅ Background worker
- ✅ Next.js frontend (port 8080)

All services run in one container managed by Supervisord.

## Troubleshooting

### Build Fails

**Issue:** Build timeout or memory issues

**Solution:** 
- Increase Railway instance size temporarily during build
- Or use pre-built Docker image:
  ```dockerfile
  FROM lfnovo/open_notebook:v1-latest-single
  ```

### Service Won't Start

**Issue:** Container restarts continuously

**Solution:** Check logs for:
1. Missing environment variables (especially `SURREAL_URL`)
2. Database connection errors
3. Frontend build issues

### Can't Access the App

**Issue:** Railway shows running but can't access

**Solution:**
1. Verify `API_URL` is set to your Railway domain
2. Check that port 8080 is exposed in Railway settings
3. Wait 2-3 minutes after deployment for all services to start

### Database Migration Errors

**Issue:** Migration fails on startup

**Solution:**
- Ensure all required migrations files exist (1-17)
- Check database connection settings
- View logs: `railway logs` or in Railway dashboard

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SURREAL_URL` | Yes | - | Database WebSocket URL |
| `SURREAL_USER` | Yes | - | Database username |
| `SURREAL_PASSWORD` | Yes | - | Database password |
| `SURREAL_NAMESPACE` | Yes | - | Database namespace |
| `SURREAL_DATABASE` | Yes | - | Database name |
| `INTERNAL_API_URL` | Yes | - | Internal API endpoint |
| `API_URL` | Yes | - | Public API URL (your Railway domain) |
| `OPENAI_API_KEY` | Yes* | - | OpenAI API key (*or another AI provider) |
| `ANTHROPIC_API_KEY` | No | - | Anthropic API key |
| `GOOGLE_API_KEY` | No | - | Google AI API key |
| `OPEN_NOTEBOOK_PASSWORD` | No | - | Optional app password protection |

## Persistent Data

Railway provides **ephemeral storage**, meaning:
- ⚠️ Database data will be lost on redeploys
- ⚠️ Uploaded files will be lost on redeploys

For production use, consider:
1. Using Railway's **Volume** feature for `/mydata` (database)
2. Using external storage (S3, Cloudinary) for uploads
3. Or deploying to a platform with persistent storage

## Performance Tips

1. **Start with Hobby plan** ($5/month) for testing
2. **Upgrade if needed** based on usage
3. **Monitor memory usage** - increase if services crash
4. **Use CDN** for faster frontend loading (Railway Pro)

## Cost Estimation

- **Hobby Plan**: ~$5-10/month (includes some usage)
- **Pro Plan**: ~$20-30/month (higher limits)
- Plus: AI API costs (pay per use)

Railway charges for:
- CPU time
- Memory usage
- Bandwidth

The single-container deployment is optimized to minimize costs.

## Support

- 📖 [Full Documentation](../README.md)
- 💬 [Discord Community](https://discord.gg/37XJPXfz2w)
- 🐛 [GitHub Issues](https://github.com/lfnovo/open-notebook/issues)
- 🚂 [Railway Docs](https://docs.railway.app/)

## Alternative Deployment Options

If Railway doesn't work for you, consider:

- **Docker** - Self-hosted on any VPS (DigitalOcean, Linode, etc.)
- **AWS ECS/Fargate** - Managed containers
- **Google Cloud Run** - Serverless containers
- **Azure Container Instances** - Pay-per-use containers
- **Fly.io** - Similar to Railway

See the main [Deployment Guide](../docs/deployment/index.md) for more options.
