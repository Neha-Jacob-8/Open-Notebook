"""Check notebook source count from API"""
import asyncio
import httpx


async def test():
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.get("http://localhost:5055/api/notebooks")
        notebooks = response.json()
        
        for nb in notebooks:
            print(f"Notebook: {nb['id']}")
            print(f"  Name: {nb['name']}")
            print(f"  Source count: {nb.get('source_count', 'N/A')}")
            print(f"  Note count: {nb.get('note_count', 'N/A')}")


if __name__ == "__main__":
    asyncio.run(test())
