"""
Debug script to check ALL sources in database
"""
import asyncio
import sys
from dotenv import load_dotenv
load_dotenv()

from loguru import logger
logger.remove()
logger.add(sys.stderr, level="INFO")

from open_notebook.database.repository import repo


async def check_all_sources():
    """Check all sources in the database"""
    
    # Get ALL sources regardless of notebook
    logger.info("=== ALL SOURCES IN DATABASE ===")
    sources = await repo.query("SELECT * FROM source")
    
    if not sources:
        logger.error("No sources found in database at all!")
        return
    
    print(f"\nFound {len(sources)} total sources:\n")
    
    for s in sources:
        s_id = s.get('id', 'unknown')
        title = s.get('title', 'Untitled')[:50] if s.get('title') else 'Untitled'
        s_type = s.get('type', 'unknown')
        notebook = s.get('notebook')
        status = s.get('processing_status', 'unknown')
        
        full_text = s.get('full_text')
        content = s.get('content')
        
        text_len = len(full_text) if full_text else 0
        content_len = len(content) if content else 0
        
        has_text = "✅" if text_len > 0 else "❌"
        
        print(f"{has_text} Source: {s_id}")
        print(f"   Title: {title}")
        print(f"   Type: {s_type}")
        print(f"   Notebook: {notebook}")
        print(f"   Status: {status}")
        print(f"   full_text: {text_len} chars")
        print(f"   content: {content_len} chars")
        print()
    
    # Also check notebooks
    print("\n=== ALL NOTEBOOKS ===\n")
    notebooks = await repo.query("SELECT * FROM notebook")
    for nb in notebooks:
        print(f"📓 {nb.get('id')}: {nb.get('name', 'Unnamed')}")


if __name__ == "__main__":
    asyncio.run(check_all_sources())
