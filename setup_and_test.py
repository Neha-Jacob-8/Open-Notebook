import requests
import json

BASE_URL = "http://127.0.0.1:5055/api"

def check_and_configure_models():
    print("=" * 60)
    print("CHECKING CURRENT MODEL CONFIGURATION")
    print("=" * 60)
    
    try:
        # Get all models
        print("\n📋 Fetching available models...")
        response = requests.get(f"{BASE_URL}/models")
        
        if response.status_code != 200:
            print(f"❌ Failed to get models: {response.status_code}")
            print(response.text)
            return
        
        models = response.json()
        language_models = [m for m in models if m.get('type') == 'language']
        
        if not language_models:
            print("⚠️  No language models found!")
            return
        
        print(f"\n✓ Found {len(language_models)} language models:")
        for i, model in enumerate(language_models, 1):
            print(f"\n  {i}. Name: {model['name']}")
            print(f"     ID: {model['id']}")
            print(f"     Provider: {model['provider']}")
        
        # Find Llama 70B or best model
        print("\n" + "=" * 60)
        print("SELECTING BEST MODEL")
        print("=" * 60)
        
        best_model = None
        for model in language_models:
            name_lower = model['name'].lower()
            if '70b' in name_lower or 'llama-3.1:70b' in name_lower:
                best_model = model
                print(f"\n  ✓ Found Llama 70B: {model['name']}")
                break
        
        if not best_model:
            # Look for any llama model
            for model in language_models:
                if 'llama' in model['name'].lower():
                    best_model = model
                    print(f"\n  ✓ Found Llama model: {model['name']}")
                    break
        
        if not best_model:
            # Just use first available
            best_model = language_models[0]
            print(f"\n  ℹ️  Using first available: {best_model['name']}")
        
        # Get current config
        print("\n" + "=" * 60)
        print("CURRENT CONFIGURATION")
        print("=" * 60)
        
        config_response = requests.get(f"{BASE_URL}/config")
        if config_response.status_code == 200:
            config = config_response.json()
            defaults = config.get('default_models', {})
            print(f"\n  Chat Model: {defaults.get('default_chat_model', 'Not set')}")
            print(f"  Tools Model: {defaults.get('default_tools_model', 'Not set')}")
        
        # Update configuration
        print("\n" + "=" * 60)
        print("UPDATING CONFIGURATION")
        print("=" * 60)
        
        update_payload = {
            "default_models": {
                "default_chat_model": best_model['id'],
                "default_tools_model": best_model['id'],
                "default_transformation_model": best_model['id']
            }
        }
        
        print(f"\n  Setting all default models to: {best_model['name']}")
        print(f"  Model ID: {best_model['id']}")
        
        update_response = requests.put(
            f"{BASE_URL}/config",
            json=update_payload
        )
        
        if update_response.status_code in [200, 204]:
            print(f"\n  ✅ Configuration updated successfully!")
        else:
            print(f"\n  ⚠️  Update response: {update_response.status_code}")
            print(f"  {update_response.text}")
        
        # Verify
        print("\n" + "=" * 60)
        print("VERIFYING CONFIGURATION")
        print("=" * 60)
        
        verify_response = requests.get(f"{BASE_URL}/config")
        if verify_response.status_code == 200:
            verify_config = verify_response.json()
            verify_defaults = verify_config.get('default_models', {})
            print(f"\n  ✓ Chat Model: {verify_defaults.get('default_chat_model')}")
            print(f"  ✓ Tools Model: {verify_defaults.get('default_tools_model')}")
        
        print("\n" + "=" * 60)
        print("✅ CONFIGURATION COMPLETE!")
        print("=" * 60)
        print(f"\n🚀 Research Lab is now configured with:")
        print(f"   {best_model['name']} ({best_model['provider']})")
        print(f"\n   Model ID: {best_model['id']}")
        
        return best_model
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_research():
    print("\n\n" + "=" * 60)
    print("TESTING RESEARCH FUNCTIONALITY")
    print("=" * 60)
    
    try:
        print("\n📝 Sending research query...")
        print("   Query: 'What are the key arguments for and against renewable energy adoption?'")
        
        response = requests.post(
            f"{BASE_URL}/research/quick",
            json={
                "query": "What are the key arguments for and against renewable energy adoption?"
            },
            timeout=150
        )
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ RESEARCH COMPLETED SUCCESSFULLY!")
            print(f"\n📊 Results:")
            print(f"   Task ID: {result['task_id']}")
            print(f"   Research Type: {result['research_type']}")
            print(f"   Citations: {len(result['citations'])} sources")
            
            print(f"\n📄 Final Report (first 800 characters):")
            print("   " + "-" * 56)
            report_preview = result['final_report'][:800].replace('\n', '\n   ')
            print(f"   {report_preview}")
            if len(result['final_report']) > 800:
                print(f"   ... ({len(result['final_report']) - 800} more characters)")
            print("   " + "-" * 56)
            
            return True
        else:
            print(f"\n❌ Research failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("\n⏱️  Request timed out (took longer than 2.5 minutes)")
        return False
    except Exception as e:
        print(f"\n❌ Error during research: {e}")
        return False

if __name__ == "__main__":
    # Check if API is running
    try:
        health = requests.get("http://127.0.0.1:5055/health", timeout=2)
        print("✓ API server is running\n")
    except:
        print("❌ API server is not running!")
        print("   Please ensure the backend is running in the other window.")
        exit(1)
    
    # Configure models
    best_model = check_and_configure_models()
    
    if best_model:
        # Test research
        test_research()
