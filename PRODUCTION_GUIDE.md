# 🚀 Production Mode Guide

This guide explains how to run Open Notebook in production mode for better performance.

## Quick Start (Windows PowerShell)

```powershell
# Make sure Docker is running and SurrealDB is up
docker-compose -f docker-compose.dev.yml up -d surrealdb

# Run the production startup script
.\start-production.ps1
```

## Manual Setup

### 1. Start SurrealDB

```powershell
docker-compose -f docker-compose.dev.yml up -d surrealdb
```

### 2. Build Frontend

```powershell
cd frontend
npm ci
npm run build
cd ..
```

### 3. Start Backend (Production)

```powershell
$env:API_RELOAD = "false"
uv run uvicorn api.main:app --host 0.0.0.0 --port 5055 --workers 2
```

### 4. Start Frontend (Production)

In a new terminal:

```powershell
cd frontend
$env:NODE_ENV = "production"
npm run start
```

## Access URLs

- **Frontend**: http://localhost:8502
- **API**: http://localhost:5055
- **SurrealDB**: http://localhost:8000

## Performance Improvements

### Production Mode Benefits

1. **Optimized Frontend**: Next.js builds are minified and optimized
2. **Multiple API Workers**: API runs with 2 workers for better concurrency
3. **No Hot Reload**: Removes development overhead
4. **Better Caching**: Static assets are properly cached
5. **Faster Knowledge Graph**: Improved extraction with better chunking

### Knowledge Graph Improvements

The knowledge graph has been enhanced with:

1. **Better Extraction Prompt**: Specialized for scientific/technical content
   - Focuses on core concepts, principles, equations
   - Higher accuracy for technical terminology
   - Better importance scoring

2. **Text Chunking**: Large documents are split into optimal chunks
   - Processes more content without truncation
   - Better extraction from long textbooks

3. **Enhanced Relationships**: More relationship types
   - `depends_on`: Dependencies between concepts
   - `measures`: Measurement relationships
   - `defines`: Definitions
   - `applies_to`: Applications
   - `derived_from`: Mathematical derivations
   - `governed_by`: Laws and principles

4. **Improved Visuals**:
   - Cleaner, more modern design
   - Better node sizing based on importance
   - Gradient backgrounds
   - Animated particles on highlighted connections
   - Better label readability
   - Mention badges for frequently referenced concepts

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# API Configuration
API_RELOAD=false
API_HOST=0.0.0.0
API_PORT=5055

# Frontend Configuration  
NODE_ENV=production
PORT=8502

# Database
SURREAL_URL=ws://localhost:8000/rpc
SURREAL_USER=root
SURREAL_PASS=root
SURREAL_NS=open_notebook
SURREAL_DB=open_notebook

# AI Model Configuration (add your keys)
OPENAI_API_KEY=your_key_here
# ... other model keys
```

## Rebuilding Knowledge Graph

To rebuild with the improved extraction:

1. Go to your notebook
2. Navigate to Knowledge Graph tab
3. Click "Rebuild Knowledge Graph"
4. Wait for processing (may take 2-5 minutes for large books)

The new system will:
- Extract more relevant concepts
- Create better relationships
- Assign accurate importance scores
- Generate cleaner visualizations

## Troubleshooting

### Frontend Build Errors

```powershell
# Clean and rebuild
cd frontend
Remove-Item -Recurse -Force .next, node_modules
npm install
npm run build
```

### API Not Starting

```powershell
# Check if port is in use
netstat -ano | findstr :5055

# Kill process if needed
taskkill /PID <PID> /F
```

### SurrealDB Issues

```powershell
# Restart SurrealDB
docker-compose -f docker-compose.dev.yml restart surrealdb

# Check logs
docker-compose -f docker-compose.dev.yml logs surrealdb
```

## Performance Tuning

### For Large Knowledge Graphs (>100 nodes)

Edit `frontend/src/app/(dashboard)/knowledge-graph/components/KnowledgeGraphViewer.tsx`:

```typescript
// Increase cooling time for better layout
cooldownTicks={200}  // Default: 150

// Adjust forces
d3Force={{
  charge: { strength: -150 },  // More repulsion
  link: { distance: 100 },     // Longer links
  center: { strength: 0.05 }   // Less centering
}}
```

### API Workers

For more powerful machines, increase workers:

```powershell
uv run uvicorn api.main:app --host 0.0.0.0 --port 5055 --workers 4
```

## Docker Production Deployment

For containerized production:

```powershell
docker-compose -f docker-compose.full.yml up -d
```

This runs everything in optimized production containers.
