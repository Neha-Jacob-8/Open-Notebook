# 🚀 Quick Start Guide - Open Notebook with Improved Knowledge Graph

## Project Overview

**Open Notebook** is a privacy-focused, open-source alternative to Google's Notebook LM. It allows you to:
- 📚 Organize multi-modal content (PDFs, videos, audio, web pages)
- 🤖 Use multiple AI models (OpenAI, Anthropic, Ollama, etc.)
- 🎙️ Generate professional podcasts
- 🔍 Search intelligently across all content
- 💬 Chat with context
- **🕸️ Visualize knowledge graphs** (NOW IMPROVED!)

## 🎯 What Was Fixed

### The Problem
The knowledge graph was generating data but displaying only small, unlabeled blue dots that were not useful for users.

### The Solution
Complete redesign of the graph visualization with:
- ✅ **Clear node labels** with readable text
- ✅ **Visual hierarchy** showing importance
- ✅ **Rich hover cards** with full details
- ✅ **Relationship labels** on connections
- ✅ **Statistics dashboard** with metrics
- ✅ **Professional dark theme** with high contrast
- ✅ **Interactive controls** (zoom, pan, drag)

## 🏃 How to Run the Project

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker (optional, for production)

### Option 1: Development Mode (Recommended)

#### 1. Start the Backend API
```powershell
# Navigate to project root
cd c:\sem6-real\studyrocket\notebookllm\open-notebook

# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies (first time only)
pip install -e .

# Run the API server
python run_api.py
```

The API will start on: `http://localhost:5055`

#### 2. Start the Frontend
```powershell
# Open a new terminal
cd c:\sem6-real\studyrocket\notebookllm\open-notebook\frontend

# Install dependencies (first time only)
npm install

# Run the development server
npm run dev
```

The frontend will start on: `http://localhost:3000`

### Option 2: Docker (Production-like)

```powershell
# Navigate to project root
cd c:\sem6-real\studyrocket\notebookllm\open-notebook

# Build and start with docker-compose
docker-compose -f docker-compose.single.yml up --build
```

Access the app at: `http://localhost:8502`

## 📊 Using the Knowledge Graph

### Step 1: Create a Notebook
1. Open the app in your browser
2. Click "New Notebook"
3. Add sources (PDFs, web pages, text files)

### Step 2: Build the Knowledge Graph
1. Navigate to "Knowledge Graph" in the sidebar
2. Select your notebook from the dropdown
3. Click "Build Graph" button
4. Wait for the build to complete (status will show "Completed")

### Step 3: Explore the Graph
- **Hover over nodes** to see details
- **Click nodes** to see all connections
- **Drag nodes** to reposition them
- **Scroll** to zoom in/out
- **Use zoom controls** on the right side
- **Check statistics** at the top

## 🎨 Understanding the Visualization

### Node Colors
- 🔵 **Blue** - Concepts (ideas, theories, principles)
- 🟣 **Purple** - People (individuals, characters)
- 🟠 **Orange** - Events (occurrences, happenings)
- 🟢 **Green** - Places (locations, geographic areas)
- 🔴 **Red** - Organizations (companies, institutions)

### Node Size
- Larger nodes = More important or frequently mentioned
- Number inside = Mention count (if 3+)

### Connections
- Arrows show relationship direction
- Hover to see relationship type (is_a, part_of, causes, etc.)
- Particles flow along edges when hovering

## 🔧 Configuration

### AI Models
Configure in the Settings page:
- Select your preferred AI provider
- Add API keys
- Choose models for different tasks

### Knowledge Graph Settings
- Model selection for graph building
- Rebuild graph after adding new sources
- Delete and rebuild if needed

## 📁 Project Structure

```
open-notebook/
├── frontend/                 # Next.js React frontend
│   ├── src/
│   │   ├── app/
│   │   │   └── (dashboard)/
│   │   │       └── knowledge-graph/  # Graph feature
│   │   └── lib/
│   │       ├── api/         # API client
│   │       ├── hooks/       # React hooks
│   │       └── types/       # TypeScript types
│   └── package.json
├── open_notebook/           # Python backend
│   ├── domain/             # Data models
│   ├── services/           # Business logic
│   └── graphs/             # LLM prompts
├── api/                     # FastAPI routes
│   └── routers/
│       └── knowledge_graph.py
└── README.md
```

## 🐛 Troubleshooting

### Graph not displaying?
1. Check if notebook has sources with text content
2. Ensure graph build completed successfully
3. Refresh the page
4. Check browser console for errors

### Nodes too small?
- Use zoom controls
- Click "Fit to View" button
- The improved version should show much larger nodes

### No relationships showing?
- The AI model needs to extract relationships
- Try rebuilding with a different model
- Ensure source content has clear relationships

### Backend not starting?
1. Check if SurrealDB is running
2. Verify environment variables
3. Check logs in terminal

### Frontend not starting?
1. Ensure Node.js is installed
2. Run `npm install` to install dependencies
3. Check for port conflicts

## 📚 Additional Resources

- [Full README](./README.md) - Complete documentation
- [Configuration Guide](./CONFIGURATION.md) - Setup details
- [Knowledge Graph Improvements](./KNOWLEDGE_GRAPH_IMPROVEMENTS.md) - Technical details
- [Discord Community](https://discord.gg/37XJPXfz2w) - Get help and share ideas

## 🎯 Key Features to Try

1. **Multi-source notebooks** - Combine PDFs, web pages, and notes
2. **AI chat** - Ask questions about your sources
3. **Podcast generation** - Create audio summaries
4. **Knowledge graph** - Visualize concepts and relationships (improved!)
5. **Search** - Find information across all sources
6. **Transformations** - Custom processing workflows

## ⚡ Performance Tips

- Start with smaller notebooks (5-10 sources) for faster graph builds
- Use local LLM models (Ollama) for privacy and cost savings
- Build graphs incrementally as you add sources
- Use the "Fit to View" button if graph is too large

## 🎓 Next Steps

1. **Explore existing features** - Chat, search, podcast generation
2. **Customize prompts** - Adjust how the AI extracts concepts
3. **Try different models** - Compare results from different AI providers
4. **Share feedback** - Join Discord and suggest improvements
5. **Contribute** - The project is open source!

## 💡 Tips for Better Graphs

1. **Quality sources** - Use well-structured documents
2. **Clear content** - Texts with explicit relationships work best
3. **Right model** - GPT-4, Claude, or similar for best extraction
4. **Iterative building** - Add sources gradually
5. **Explore thoroughly** - Hover and click to discover connections

---

**Status**: ✅ Ready to use
**Version**: v1.0+ with knowledge graph improvements
**Last Updated**: January 22, 2026

Enjoy exploring your knowledge with beautiful, useful visualizations! 🎉
