"""Check if graph data exists in database"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo
from open_notebook.domain.knowledge_graph import KnowledgeGraph, ConceptNode, ConceptEdge


async def check():
    # Get notebook
    notebooks = await repo.query("SELECT id, name FROM notebook LIMIT 1")
    if not notebooks:
        print("No notebooks!")
        return
    
    notebook_id = notebooks[0].get('id')
    print(f"Notebook: {notebook_id}")
    
    # Check concept nodes
    print("\n=== CONCEPT NODES ===")
    nodes = await repo.query("SELECT * FROM concept_node")
    print(f"Total nodes in DB: {len(nodes) if nodes else 0}")
    if nodes:
        for n in nodes[:5]:
            print(f"  - {n.get('label')} ({n.get('type')})")
    
    # Check concept edges
    print("\n=== CONCEPT EDGES ===")
    edges = await repo.query("SELECT * FROM concept_edge")
    print(f"Total edges in DB: {len(edges) if edges else 0}")
    
    # Check meta
    print("\n=== KNOWLEDGE GRAPH META ===")
    metas = await repo.query("SELECT * FROM knowledge_graph_meta")
    for m in metas:
        print(f"Meta: node_count={m.get('node_count')}, edge_count={m.get('edge_count')}, status={m.get('build_status')}")
    
    # Try loading via the KnowledgeGraph class
    print("\n=== LOADING VIA KnowledgeGraph.load() ===")
    try:
        kg = await KnowledgeGraph.load(notebook_id)
        print(f"Loaded: {len(kg.nodes)} nodes, {len(kg.edges)} edges")
        if kg.nodes:
            print("Nodes:")
            for n in kg.nodes[:5]:
                print(f"  - {n.label} ({n.type})")
    except Exception as e:
        print(f"Error loading: {e}")


if __name__ == "__main__":
    asyncio.run(check())
