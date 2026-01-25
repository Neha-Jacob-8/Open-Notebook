"""Test monitor creation after schema fix."""
import httpx

def test_create_monitor():
    """Test creating a monitor via API."""
    # First, get the sources to find one with a URL
    resp = httpx.get("http://localhost:5055/api/sources")
    print(f"GET sources: {resp.status_code}")
    
    if resp.status_code != 200:
        print(f"Failed to get sources: {resp.text}")
        return
    
    sources = resp.json()
    web_sources = [s for s in sources if s.get("asset", {}).get("url")]
    
    if not web_sources:
        print("No web sources found")
        return
    
    source = web_sources[0]
    source_id = source["id"]
    source_title = source.get("title", "Unknown")
    print(f"Using source: {source_title} ({source_id})")
    
    # Create a monitor
    payload = {
        "source_id": source_id,
        "check_frequency": "daily",
        "enabled": True
    }
    
    resp = httpx.post(
        "http://localhost:5055/api/monitoring/monitors",
        json=payload,
        timeout=30.0
    )
    
    print(f"\nPOST monitors: {resp.status_code}")
    print(f"Response: {resp.text[:500] if len(resp.text) > 500 else resp.text}")
    
    if resp.status_code in [200, 201]:
        print("\n✅ Monitor created successfully!")
        # List monitors to verify
        resp2 = httpx.get("http://localhost:5055/api/monitoring/monitors")
        print(f"\nGET monitors: {resp2.status_code}")
        monitors = resp2.json()
        print(f"Total monitors: {len(monitors)}")
        for m in monitors[:3]:
            print(f"  - {m.get('id')}: source={m.get('source_id')}, freq={m.get('check_frequency')}")
    else:
        print("\n❌ Monitor creation failed")

if __name__ == "__main__":
    test_create_monitor()
