"""Minimal test to capture exact error"""
import asyncio
import traceback
from dotenv import load_dotenv
load_dotenv()

from open_notebook.graphs.utils import provision_langchain_model


async def test():
    print("Testing model provisioning...")
    
    prompt = "Extract concepts from: Hello world"
    
    try:
        model = await provision_langchain_model(
            prompt,
            None,  # model_id
            "transformation",
            max_tokens=3000
        )
        print(f"Model created: {model}")
        
        # Try to invoke
        print("Invoking model...")
        response = await model.ainvoke(prompt)
        print(f"Response: {response.content[:200] if response.content else 'No content'}")
        
    except Exception as e:
        print(f"\nERROR: {e}")
        print("\nFull traceback:")
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test())
