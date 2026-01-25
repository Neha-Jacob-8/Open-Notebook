"""Test with full error output"""
import asyncio
import sys
import traceback
from dotenv import load_dotenv
load_dotenv()

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from open_notebook.graphs.utils import provision_langchain_model


async def test():
    print("Testing model provisioning...")
    
    prompt = "Extract concepts from: Hello world"
    
    try:
        model = await provision_langchain_model(
            prompt,
            None,
            "transformation",
            max_tokens=3000
        )
        print(f"Model created successfully: {type(model)}")
        
        print("\nInvoking model...")
        response = await model.ainvoke(prompt)
        print(f"Response type: {type(response)}")
        content = response.content if hasattr(response, 'content') else str(response)
        print(f"Response content (first 200 chars): {content[:200]}")
        print("\nSUCCESS!")
        
    except Exception as e:
        print(f"\n=== ERROR ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)[:500]}")
        print(f"\n=== FULL TRACEBACK ===")
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test())
