"""
Add monitors to existing sources via API
"""
import requests
import json

API_BASE = "http://127.0.0.1:5055/api"

# First, let's get existing sources
print("📊 Fetching existing sources...")
response = requests.get(f"{API_BASE}/sources?limit=10")
if response.status_code == 200:
    sources = response.json().get('sources', [])
    print(f"✅ Found {len(sources)} sources\n")
    
    if len(sources) == 0:
        print("⚠️  No sources found. Let me create some demo sources first...")
        
        # Create demo sources
        demo_sources = [
            {
                "asset": {"url": "https://github.blog/changelog/"},
                "title": "GitHub Changelog",
                "full_text": "GitHub Changelog - Track new features and improvements"
            },
            {
                "asset": {"url": "https://www.python.org/downloads/"},
                "title": "Python Downloads",
                "full_text": "Python Downloads - Get the latest Python version"
            },
            {
                "asset": {"url": "https://code.visualstudio.com/updates"},
                "title": "VS Code Updates", 
                "full_text": "VS Code Updates - New features and fixes"
            }
        ]
        
        sources = []
        for source_data in demo_sources:
            print(f"Creating source: {source_data['title']}...")
            response = requests.post(f"{API_BASE}/sources", json=source_data)
            if response.status_code in [200, 201]:
                source = response.json()
                sources.append(source)
                print(f"  ✅ Created: {source.get('id')}")
            else:
                print(f"  ❌ Failed: {response.status_code} - {response.text}")
        print()
    
    # Now create monitors for the sources
    print("📊 Creating monitors for sources...\n")
    frequencies = ["daily", "weekly", "daily"]
    
    for idx, source in enumerate(sources[:3]):  # Only first 3 sources
        source_id = source.get('id')
        title = source.get('title', 'Untitled')
        frequency = frequencies[idx] if idx < len(frequencies) else "daily"
        
        monitor_data = {
            "source_id": source_id,
            "check_frequency": frequency,
            "enabled": True
        }
        
        print(f"Creating monitor for: {title}")
        print(f"  Source ID: {source_id}")
        print(f"  Frequency: {frequency}")
        
        response = requests.post(f"{API_BASE}/monitoring/monitors", json=monitor_data)
        
        if response.status_code in [200, 201]:
            monitor = response.json()
            print(f"  ✅ Monitor created successfully!")
        else:
            print(f"  ❌ Failed: {response.status_code}")
            print(f"  Error: {response.text}")
        print()
    
    print("✨ Setup complete!")
    print()
    print("📍 Next steps:")
    print("1. Refresh the Source Updates page: http://localhost:3000/updates")
    print("2. You should now see monitors in the 'Monitors' tab")
    print("3. Click 'Check Now' to trigger a monitoring check")
    
else:
    print(f"❌ Failed to fetch sources: {response.status_code}")
    print(response.text)
