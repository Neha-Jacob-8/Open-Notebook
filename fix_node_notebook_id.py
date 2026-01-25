"""Fix notebook_id on existing nodes"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo


async def fix():
    # Get notebook ID
    notebooks = await repo.query("SELECT id FROM notebook LIMIT 1")
    notebook_id = notebooks[0].get('id') if notebooks else None
    print(f"Notebook ID: {notebook_id}")
    
    # Update all nodes to have the correct notebook_id
    print("\nUpdating all concept_node records with notebook_id...")
    result = await repo.query(
        "UPDATE concept_node SET notebook_id = $notebook_id",
        {"notebook_id": notebook_id}
    )
    print(f"Updated {len(result) if result else 0} nodes")
    
    # Verify
    nodes = await repo.query("SELECT id, label, notebook_id FROM concept_node WHERE notebook_id = $notebook_id LIMIT 5", {"notebook_id": notebook_id})
    print(f"\nVerification: Found {len(nodes)} nodes with correct notebook_id")
    for n in nodes:
        print(f"  - {n.get('label')}: {n.get('notebook_id')}")


if __name__ == "__main__":
    asyncio.run(fix())
