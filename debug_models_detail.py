import asyncio
import sys
from dotenv import load_dotenv

load_dotenv()

from open_notebook.domain.models import Model, DefaultModels

async def list_models():
    print("=== GOOGLE MODEL ID ===")
    models = await Model.get_all()
    for m in models:
        if m.provider == "google" and m.type == "language":
            print(f"{m.id}")
            print(f"{m.name}")
            break

if __name__ == "__main__":
    # Fix for Windows asyncio loop policy
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(list_models())
