"""Force update notebook_id using MERGE"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo


async def force_fix():
    notebook_id = "notebook:f1jodat25ruahw23qu9c"
    
    # Get all node IDs
    nodes = await repo.query("SELECT id FROM concept_node")
    print(f"Found {len(nodes)} nodes to update")
    
    # Update each node individually
    for n in nodes:
        node_id = n.get('id')
        await repo.query(
            f"UPDATE {node_id} MERGE {{ notebook_id: '{notebook_id}' }}"
        )
    
    print("Updated all nodes")
    
    # Verify
    result = await repo.query(f"SELECT id, label, notebook_id FROM concept_node WHERE notebook_id = '{notebook_id}' LIMIT 5")
    print(f"\nVerification: {len(result)} nodes found with notebook_id")
    for r in result:
        print(f"  - {r.get('label')}: {r.get('notebook_id')}")


if __name__ == "__main__":
    asyncio.run(force_fix())
