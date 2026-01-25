"""Check model configuration from database"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo


async def check_models():
    print("=== CONFIGURED MODELS ===")
    models = await repo.query("SELECT * FROM model")
    if models:
        for m in models:
            print(f"\nModel: {m.get('id')}")
            print(f"  Name: {m.get('name')}")
            print(f"  Provider: {m.get('provider')}")
            print(f"  Type: {m.get('type')}")
    else:
        print("No models configured!")
    
    print("\n=== DEFAULT MODELS ===")
    defaults = await repo.query("SELECT * FROM open_notebook:default_models")
    if defaults:
        for d in defaults:
            print(f"Default chat: {d.get('default_chat_model')}")
            print(f"Default transformation: {d.get('default_transformation_model')}")
            print(f"Default tools: {d.get('default_tools_model')}")
            print(f"Large context: {d.get('large_context_model')}")
    else:
        print("No defaults configured!")


if __name__ == "__main__":
    asyncio.run(check_models())
