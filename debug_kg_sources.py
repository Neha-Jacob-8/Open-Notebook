import asyncio
import os
import sys
sys.path.insert(0, '.')

# Load env from .env file
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo
from open_notebook.services.knowledge_graph_service import knowledge_graph_service

async def test_extraction():
    science_id = 'notebook:f1jodat25ruahw23qu9c'
    
    print(f"OPENROUTER_API_KEY set: {bool(os.getenv('OPENROUTER_API_KEY'))}")
    
    # Get one source
    query = """
        SELECT 
            in.id AS id, 
            in.title AS title, 
            in.full_text AS full_text
        FROM reference 
        WHERE out = type::thing($notebook_id)
        LIMIT 1
    """
    sources = await repo.query(query, {'notebook_id': science_id})
    
    if not sources:
        print("No sources found!")
        return
    
    source = sources[0]
    print(f"Testing with source: {source.get('title')}")
    print(f"Text length: {len(source.get('full_text', ''))}")
    
    # Try to extract concepts
    text = source.get('full_text', '')[:5000]  # Limit to first 5000 chars
    source_id = source.get('id')
    
    print("\nExtracting concepts...")
    try:
        result = await knowledge_graph_service.extract_concepts_from_text(text, source_id, None)
        print(f"Entities: {len(result.get('entities', []))}")
        print(f"Relationships: {len(result.get('relationships', []))}")
        if result.get('entities'):
            print("\nSample entities:")
            for e in result.get('entities', [])[:3]:
                print(f"  - {e}")
    except Exception as e:
        print(f"Extraction failed: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(test_extraction())
