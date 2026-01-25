"""
Setup monitoring demo - Add sample sources with monitors
"""
import asyncio
from datetime import datetime
from open_notebook.domain.notebook import Source, Asset
from open_notebook.services.auto_update_service import auto_update_service

async def setup_demo_sources():
    """Create demo sources with monitoring enabled."""
    
    demo_sources = [
        {
            "url": "https://github.blog/changelog/",
            "title": "GitHub Changelog",
            "full_text": "GitHub Changelog - Track new features and improvements",
            "frequency": "daily"
        },
        {
            "url": "https://www.python.org/downloads/",
            "title": "Python Downloads",
            "full_text": "Python Downloads - Get the latest Python version",
            "frequency": "weekly"
        },
        {
            "url": "https://code.visualstudio.com/updates",
            "title": "VS Code Updates",
            "full_text": "VS Code Updates - New features and fixes",
            "frequency": "daily"
        },
    ]
    
    print("🚀 Setting up monitoring demo...")
    print()
    
    for source_data in demo_sources:
        # Create asset with URL
        asset = Asset(url=source_data["url"])
        
        # Create source
        source = Source(
            asset=asset,
            title=source_data["title"],
            full_text=source_data["full_text"],
        )
        await source.save()
        print(f"✅ Created source: {source.title}")
        print(f"   URL: {source_data['url']}")
        print(f"   ID: {source.id}")
        
        # Create monitor for this source
        monitor = await auto_update_service.create_monitor(
            source_id=source.id,
            check_frequency=source_data["frequency"],
            enabled=True
        )
        print(f"   📊 Monitor enabled: {monitor.check_frequency} checks")
        print()
    
    print("✨ Demo setup complete!")
    print()
    print("📍 Next steps:")
    print("1. Go to http://localhost:3000/updates")
    print("2. Click 'Check Now' to trigger monitoring")
    print("3. The system will check all 3 sources for updates")
    print()

if __name__ == "__main__":
    asyncio.run(setup_demo_sources())
