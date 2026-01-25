import asyncio
import sys
import os
from dotenv import load_dotenv
from open_notebook.domain.models import Model
from open_notebook.graphs.utils import provision_langchain_model

load_dotenv()

async def test_model():
    print(f"GOOGLE_API_KEY present: {'GOOGLE_API_KEY' in os.environ}")
    print(f"OPENAI_API_KEY present: {'OPENAI_API_KEY' in os.environ}")
    print(f"ANTHROPIC_API_KEY present: {'ANTHROPIC_API_KEY' in os.environ}")
    print(f"GROQ_API_KEY present: {'GROQ_API_KEY' in os.environ}")
    
    model_id = "model:6v1wm5b0flugzxmrk2y9"
    print(f"Testing model ID: {model_id}")
    
    try:
        model = await Model.get(model_id)
        print(f"Model found in DB: {model.name} ({model.provider})")
        
        print("Provisioning LangChain model...")
        lc_model = await provision_langchain_model("test content", model_id, "chat")
        print(f"LangChain model created: {lc_model}")
        
        print("Invoking model...")
        response = await lc_model.ainvoke("Hello, are you working?")
        print(f"Response: {response.content}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_model())
