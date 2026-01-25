import requests
import json

BASE_URL = "http://127.0.0.1:5055/api"

print("=" * 70)
print(" CONFIGURING LLAMA 70B FOR RESEARCH LAB")
print("=" * 70)

# Check API
try:
    health = requests.get("http://127.0.0.1:5055/health", timeout=2)
    print("\n✓ API server is running")
except:
    print("\n❌ API server is not running!")
    exit(1)

# Get models
print("\n📋 Fetching available models...")
response = requests.get(f"{BASE_URL}/models")
models = response.json()
language_models = [m for m in models if m.get('type') == 'language']

print(f"✓ Found {len(language_models)} language models")

# Find Llama 70B
llama_70b = None
for model in language_models:
    if '70b' in model['name'].lower() or 'llama-3.3' in model['name'].lower():
        llama_70b = model
        break

if llama_70b:
    print(f"\n✓ Found Llama 70B model:")
    print(f"  Name: {llama_70b['name']}")
    print(f"  ID: {llama_70b['id']}")
    print(f"  Provider: {llama_70b['provider']}")
else:
    print("\n⚠️  Llama 70B not found, using first available model")
    llama_70b = language_models[0]
    print(f"  Name: {llama_70b['name']}")
    print(f"  ID: {llama_70b['id']}")

# Configure defaults
print("\n🔧 Configuring default models...")
update_payload = {
    "default_chat_model": llama_70b['id'],
    "default_tools_model": llama_70b['id'],
    "default_transformation_model": llama_70b['id']
}

update_response = requests.put(
    f"{BASE_URL}/models/defaults",
    json=update_payload
)

if update_response.status_code == 200:
    print("✅ Configuration updated successfully!")
else:
    print(f"⚠️  Status: {update_response.status_code}")
    print(update_response.text)

# Verify
print("\n📊 Verifying configuration...")
verify_response = requests.get(f"{BASE_URL}/models/defaults")
if verify_response.status_code == 200:
    config = verify_response.json()
    print(f"✓ Chat Model: {config.get('default_chat_model')}")
    print(f"✓ Tools Model: {config.get('default_tools_model')}")
    print(f"✓ Transformation Model: {config.get('default_transformation_model')}")

# Test research
print("\n" + "=" * 70)
print(" TESTING RESEARCH FUNCTIONALITY")
print("=" * 70)

print("\n📝 Running research query...")
print("Query: 'What are the key arguments for and against renewable energy?'\n")

try:
    research_response = requests.post(
        f"{BASE_URL}/research/quick",
        json={"query": "What are the key arguments for and against renewable energy adoption?"},
        timeout=150
    )
    
    if research_response.status_code == 200:
        result = research_response.json()
        print("=" * 70)
        print("✅ RESEARCH COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        print(f"\n📊 Research Type: {result['research_type']}")
        print(f"📚 Sources Used: {len(result['citations'])}")
        print(f"📄 Report Length: {len(result['final_report'])} characters")
        
        print("\n" + "-" * 70)
        print("FINAL REPORT:")
        print("-" * 70)
        print(result['final_report'])
        print("-" * 70)
        
        print("\n" + "=" * 70)
        print("✅ EVERYTHING IS WORKING!")
        print("=" * 70)
        print(f"\n🎯 Your Research Lab is now using: {llama_70b['name']}")
        print(f"🚀 You can now use the Research Lab in the web interface!")
        print(f"🌐 Open: http://localhost:3000/research")
        
    else:
        print(f"❌ Research failed: {research_response.status_code}")
        print(research_response.text)
        
except requests.exceptions.Timeout:
    print("⏱️  Request timed out")
except Exception as e:
    print(f"❌ Error: {e}")
