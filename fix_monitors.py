"""
Fix monitors by creating them directly in the database
"""
import asyncio
from datetime import datetime
from open_notebook.database.repository import repo

async def main():
    print("📊 Creating monitors directly in database...")
    
    # Get sources with URLs
    sources = await repo.query("SELECT id, title, asset FROM source WHERE asset.url != '' AND asset.url != NONE LIMIT 10")
    print(f"Found {len(sources)} sources with URLs")
    
    for source in sources:
        source_id = source.get('id')
        title = source.get('title', 'Unknown')
        url = source.get('asset', {}).get('url', '') if source.get('asset') else ''
        
        print(f"\n  Source: {title}")
        print(f"  ID: {source_id}")
        print(f"  URL: {url[:50]}..." if url else "  URL: (none)")
        
        if not url or url == '':
            print("  ⏭️ Skipping - no URL")
            continue
            
        # Check if monitor already exists
        existing = await repo.query(
            "SELECT * FROM source_monitor WHERE source_id = $source_id LIMIT 1",
            {"source_id": source_id}
        )
        
        if existing:
            print("  ℹ️ Monitor already exists")
            continue
        
        # Create monitor directly
        monitor_data = {
            "source_id": source_id,
            "enabled": True,
            "check_frequency": "daily",
            "last_checked_at": None,
            "last_content_hash": None,
            "consecutive_failures": 0,
        }
        
        result = await repo.create("source_monitor", monitor_data)
        print(f"  ✅ Created monitor: {result.get('id') if isinstance(result, dict) else result}")
    
    # Show all monitors
    print("\n📋 All monitors:")
    monitors = await repo.query("SELECT * FROM source_monitor")
    for mon in monitors:
        print(f"  - {mon.get('id')}: source={mon.get('source_id')}, enabled={mon.get('enabled')}")
    
    print(f"\n✨ Total monitors: {len(monitors)}")

if __name__ == "__main__":
    asyncio.run(main())
