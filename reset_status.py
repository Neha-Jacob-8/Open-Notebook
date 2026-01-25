"""Reset knowledge graph status to valid value and rebuild"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo


async def reset_and_check():
    """Reset knowledge graph status to valid 'pending' value"""
    
    # Get all knowledge graph metadata
    print("=== CHECKING KNOWLEDGE GRAPH META ===")
    metas = await repo.query("SELECT * FROM knowledge_graph_meta")
    
    if metas:
        for meta in metas:
            print(f"Meta: {meta}")
            status = meta.get('build_status')
            if status not in ['pending', 'building', 'completed', 'error']:
                print(f"Invalid status '{status}' - fixing to 'pending'...")
                meta_id = meta.get('id')
                await repo.update(meta_id, {"build_status": "pending", "error_message": None})
                print("Fixed!")
    else:
        print("No knowledge graph meta found")
    
    # Verify fix
    print("\n=== VERIFICATION ===")
    metas = await repo.query("SELECT * FROM knowledge_graph_meta")
    for meta in metas:
        print(f"Status now: {meta.get('build_status')}")


if __name__ == "__main__":
    asyncio.run(reset_and_check())
