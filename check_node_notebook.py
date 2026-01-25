"""Check notebook_id on nodes"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo


async def check():
    # Check first few nodes
    nodes = await repo.query("SELECT id, label, notebook_id FROM concept_node LIMIT 5")
    print("=== CONCEPT NODES ===")
    for n in nodes:
        print(f"  {n.get('label')}: notebook_id = {n.get('notebook_id')}")
    
    # Get notebook ID
    notebooks = await repo.query("SELECT id FROM notebook LIMIT 1")
    notebook_id = notebooks[0].get('id') if notebooks else None
    print(f"\nNotebook ID: {notebook_id}")
    
    # Try find_by_notebook query
    print("\n=== Testing find_by_notebook query ===")
    query = f"SELECT * FROM concept_node WHERE notebook_id = $notebook_id"
    result = await repo.query(query, {"notebook_id": notebook_id})
    print(f"Found {len(result)} nodes with notebook_id = {notebook_id}")


if __name__ == "__main__":
    asyncio.run(check())
