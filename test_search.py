"""Test reference query directly via API's database context"""
import asyncio
import httpx


async def test():
    async with httpx.AsyncClient(timeout=60) as client:
        # Get notebooks via search which uses raw database queries
        response = await client.get("http://localhost:5055/api/search", params={"q": "lech", "type": "source"})
        print(f"Search status: {response.status_code}")
        print(f"Search response: {response.text[:500] if response.text else 'empty'}")


if __name__ == "__main__":
    asyncio.run(test())
