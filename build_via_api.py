"""Build knowledge graph via API"""
import asyncio
import httpx


async def build_via_api():
    print("Building knowledge graph via API...")
    
    async with httpx.AsyncClient(timeout=300) as client:
        # First get notebook ID
        response = await client.get("http://localhost:5055/api/notebooks")
        notebooks = response.json()
        
        if not notebooks:
            print("No notebooks found!")
            return
        
        notebook_id = notebooks[0].get('id')
        print(f"Notebook: {notebook_id}")
        
        # Trigger build
        print("\nTriggering build...")
        build_response = await client.post(
            "http://localhost:5055/api/knowledge-graph/build",
            json={"notebook_id": notebook_id}
        )
        print(f"Build response: {build_response.status_code}")
        print(f"Response: {build_response.json()}")
        
        # Wait for build to complete
        print("\nWaiting for build to complete...")
        for i in range(60):  # Wait up to 2 minutes
            await asyncio.sleep(2)
            status_response = await client.get(
                f"http://localhost:5055/api/knowledge-graph/status/{notebook_id}"
            )
            status = status_response.json()
            print(f"Status: {status.get('build_status')} - nodes: {status.get('node_count')}, edges: {status.get('edge_count')}")
            
            if status.get('build_status') in ['completed', 'error']:
                break
        
        # Get the graph
        print("\nFetching graph data...")
        graph_response = await client.get(
            f"http://localhost:5055/api/knowledge-graph/{notebook_id}"
        )
        graph = graph_response.json()
        print(f"Graph: {len(graph.get('nodes', []))} nodes, {len(graph.get('links', []))} links")
        
        if graph.get('nodes'):
            print("\nSample nodes:")
            for node in graph.get('nodes', [])[:5]:
                print(f"  - {node.get('label')} ({node.get('type')})")


if __name__ == "__main__":
    asyncio.run(build_via_api())
