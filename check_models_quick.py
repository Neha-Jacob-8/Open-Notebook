import asyncio
from open_notebook.domain.models import DefaultModels, Model

async def check_models():
    print("Checking default models configuration...")
    try:
        defaults = await DefaultModels.get_instance()
        print("\nDefault Models:")
        print(f"  Chat: {defaults.default_chat_model}")
        print(f"  Tools: {defaults.default_tools_model}")
        print(f"  Transformation: {defaults.default_transformation_model}")
        print(f"  Large Context: {defaults.large_context_model}")
        print(f"  Embedding: {defaults.default_embedding_model}")
        
        print("\n\nAll available language models:")
        models = await Model.get_models_by_type("language")
        for model in models:
            print(f"  - {model.id}: {model.name} ({model.provider})")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_models())
