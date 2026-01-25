"""
Simple script to check if sources and monitors exist
"""
import asyncio
from open_notebook.database.repository import repo

async def main():
    print("📊 Checking sources...")
    sources = await repo.query("SELECT * FROM source LIMIT 10")
    print(f"Found {len(sources)} sources")
    for src in sources[:5]:
        print(f"  - {src.get('title', 'Unknown')}")
    
    print("\n📋 Checking monitors...")
    monitors = await repo.query("SELECT * FROM source_monitor")
    print(f"Found {len(monitors)} monitors")
    for mon in monitors[:5]:
        print(f"  - Source ID: {mon.get('source_id')}, Frequency: {mon.get('check_frequency')}")

if __name__ == "__main__":
    asyncio.run(main())
