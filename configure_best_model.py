import asyncio
from open_notebook.domain.models import DefaultModels, Model, model_manager

async def check_and_configure_models():
    print("=" * 60)
    print("CHECKING CURRENT MODEL CONFIGURATION")
    print("=" * 60)
    
    try:
        # Get all language models
        print("\n📋 Available Language Models:")
        models = await Model.get_models_by_type("language")
        
        if not models:
            print("  ⚠️  No language models found!")
            return
        
        for i, model in enumerate(models, 1):
            print(f"\n  {i}. Model ID: {model.id}")
            print(f"     Name: {model.name}")
            print(f"     Provider: {model.provider}")
        
        # Get current defaults
        print("\n" + "=" * 60)
        print("CURRENT DEFAULT MODELS")
        print("=" * 60)
        
        defaults = await DefaultModels.get_instance()
        print(f"\n  Chat Model: {defaults.default_chat_model}")
        print(f"  Tools Model: {defaults.default_tools_model}")
        print(f"  Transformation Model: {defaults.default_transformation_model}")
        print(f"  Large Context Model: {defaults.large_context_model}")
        
        # Find Llama 70B model
        print("\n" + "=" * 60)
        print("LOOKING FOR LLAMA 70B MODEL")
        print("=" * 60)
        
        llama_70b = None
        for model in models:
            if "70b" in model.name.lower() or "llama" in model.name.lower():
                print(f"\n  ✓ Found: {model.name} (ID: {model.id})")
                llama_70b = model
                break
        
        if not llama_70b:
            # Just use the first available model
            llama_70b = models[0]
            print(f"\n  ℹ️  No Llama 70B found, using: {llama_70b.name} (ID: {llama_70b.id})")
        
        # Update defaults to use the best model
        print("\n" + "=" * 60)
        print("CONFIGURING DEFAULT MODELS")
        print("=" * 60)
        
        defaults.default_chat_model = llama_70b.id
        defaults.default_tools_model = llama_70b.id
        defaults.default_transformation_model = llama_70b.id
        
        await defaults.save()
        
        print(f"\n  ✅ All default models set to: {llama_70b.name}")
        print(f"     Model ID: {llama_70b.id}")
        
        # Verify the update
        print("\n" + "=" * 60)
        print("VERIFYING CONFIGURATION")
        print("=" * 60)
        
        updated_defaults = await DefaultModels.get_instance()
        print(f"\n  Chat Model: {updated_defaults.default_chat_model}")
        print(f"  Tools Model: {updated_defaults.default_tools_model}")
        print(f"  Transformation: {updated_defaults.default_transformation_model}")
        
        # Test model provisioning
        print("\n" + "=" * 60)
        print("TESTING MODEL PROVISIONING")
        print("=" * 60)
        
        test_model = await model_manager.get_default_model("tools")
        print(f"\n  ✅ Successfully loaded tools model: {test_model}")
        
        print("\n" + "=" * 60)
        print("✅ CONFIGURATION COMPLETE!")
        print("=" * 60)
        print("\nYour Research Lab is now configured to use:")
        print(f"  {llama_70b.name} ({llama_70b.provider})")
        print("\nYou can now test the research functionality!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_and_configure_models())
