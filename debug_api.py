"""Debug API sources"""
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
            
            # Try different endpoints
            print("\n--- Testing /sources endpoint ---")
            try:
                resp = await client.get(f"http://localhost:5055/api/notebooks/{notebook_id}/sources")
                print(f"Status: {resp.status_code}")
                print(f"Response type: {type(resp.json())}")
                print(f"Response: {resp.text[:500]}")
            except Exception as e:
                print(f"Error: {e}")
            
            # Try sources list
            print("\n--- Testing /sources ---")
            try:
                resp = await client.get(f"http://localhost:5055/api/sources")
                print(f"Status: {resp.status_code}")
                data = resp.json()
                print(f"Response type: {type(data)}")
                if isinstance(data, list):
                    print(f"Sources: {len(data)}")
                    for s in data[:3]:
                        print(f"  - {s}")
                else:
                    print(f"Response: {resp.text[:500]}")
            except Exception as e:
                print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(test())
