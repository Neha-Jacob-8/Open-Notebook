"""Test query via API endpoint"""
import asyncio
import httpx


async def test():
    async with httpx.AsyncClient(timeout=60) as client:
        # Get notebooks
        response = await client.get("http://localhost:5055/api/notebooks")
        notebooks = response.json()
        print(f"Notebooks: {notebooks}")
        
        if notebooks:
            notebook_id = notebooks[0]['id']
            print(f"\nNotebook ID: {notebook_id}")
            
            # Get sources via notebook endpoint
            sources_response = await client.get(f"http://localhost:5055/api/notebooks/{notebook_id}/sources")
            print(f"\nSources response: {sources_response.status_code}")
            sources = sources_response.json()
            print(f"Sources: {len(sources) if sources else 0}")
            if sources:
                for s in sources[:3]:
                    print(f"  - {s.get('id')}: {s.get('title')}")


if __name__ == "__main__":
    asyncio.run(test())
