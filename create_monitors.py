"""
Create monitors via API
"""
import requests

API_BASE = "http://127.0.0.1:5055/api"

print("📊 Fetching existing sources...")
response = requests.get(f"{API_BASE}/sources")
if response.status_code == 200:
    sources = response.json()
    print(f"✅ Found {len(sources)} sources\n")
    
    # Find URL-based sources
    url_sources = [s for s in sources if s.get('asset') and s.get('asset').get('url')]
    print(f"📍 Sources with URLs: {len(url_sources)}")
    
    for source in url_sources:
        source_id = source.get('id')
        title = source.get('title', 'Untitled')
        url = source.get('asset', {}).get('url', '')
        
        print(f"\n  Source: {title}")
        print(f"  ID: {source_id}")
        print(f"  URL: {url[:50]}..." if len(url) > 50 else f"  URL: {url}")
        
        if not url:
            print("  ⏭️ Skipping - empty URL")
            continue
        
        # Create monitor
        monitor_data = {
            "source_id": source_id,
            "check_frequency": "daily",
            "enabled": True
        }
        
        print(f"  Creating monitor...")
        resp = requests.post(f"{API_BASE}/monitoring/monitors", json=monitor_data)
        
        if resp.status_code in [200, 201]:
            print(f"  ✅ Monitor created!")
        else:
            print(f"  ❌ Failed: {resp.status_code}")
            print(f"     Error: {resp.text[:100]}...")
    
    # Check monitors
    print("\n📋 Checking monitors...")
    resp = requests.get(f"{API_BASE}/monitoring/monitors")
    if resp.status_code == 200:
        monitors = resp.json()
        print(f"Total monitors: {len(monitors)}")
        for m in monitors:
            print(f"  - {m.get('source_id')}: enabled={m.get('enabled')}, freq={m.get('check_frequency')}")
    
else:
    print(f"❌ Failed to fetch sources: {response.status_code}")
    print(response.text)
