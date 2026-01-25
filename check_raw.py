"""Check raw database tables"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo


async def check_raw():
    print("=== RAW concept_node TABLE ===")
    nodes = await repo.query("SELECT * FROM concept_node")
    print(f"Raw nodes: {nodes}")
    
    print("\n=== RAW concept_edge TABLE ===")
    edges = await repo.query("SELECT * FROM concept_edge")
    print(f"Raw edges: {edges}")
    
    print("\n=== RAW knowledge_graph_meta TABLE ===")
    metas = await repo.query("SELECT * FROM knowledge_graph_meta")
    print(f"Raw meta: {metas}")


if __name__ == "__main__":
    asyncio.run(check_raw())
