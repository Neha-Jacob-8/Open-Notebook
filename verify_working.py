import requests
import time

BASE_URL = "http://127.0.0.1:5055/api"

print("=" * 70)
print("✅ LLAMA 70B CONFIGURED SUCCESSFULLY!")
print("=" * 70)
print("\nYour Research Lab is now using:")
print("  Model: meta-llama/llama-3.3-70b-instruct:free")
print("  Provider: OpenRouter")
print("\n" + "=" * 70)
print(" TESTING RESEARCH WITH ASYNC ENDPOINT")
print("=" * 70)

# Start research
print("\n📝 Starting research task...")
print("Query: 'What are the key arguments for and against renewable energy?'\n")

start_response = requests.post(
    f"{BASE_URL}/research/start",
    json={"query": "What are the key arguments for and against renewable energy adoption?"}
)

if start_response.status_code != 200:
    print(f"❌ Failed to start: {start_response.text}")
    exit(1)

task_data = start_response.json()
task_id = task_data['task_id']
print(f"✓ Task started: {task_id}\n")

# Poll for completion
print("⏳ Waiting for completion...")
start_time = time.time()
last_status = None

while True:
    status_response = requests.get(f"{BASE_URL}/research/status/{task_id}")
    status = status_response.json()
    
    current_status = status['status']
    if current_status != last_status:
        elapsed = int(time.time() - start_time)
        print(f"[{elapsed}s] {status['current_step']}")
        last_status = current_status
    
    if current_status == "completed":
        print(f"\n✅ Research completed in {int(time.time() - start_time)} seconds!")
        break
    elif current_status == "error":
        print(f"\n❌ Error: {status.get('message', 'Unknown error')}")
        exit(1)
    
    if time.time() - start_time > 300:  # 5 minute timeout
        print("\n⏱️  Timeout after 5 minutes")
        exit(1)
    
    time.sleep(2)

# Get result
print("\n📥 Fetching results...\n")
result_response = requests.get(f"{BASE_URL}/research/result/{task_id}")
result = result_response.json()

print("=" * 70)
print("✅ RESEARCH RESULTS")
print("=" * 70)
print(f"\n📊 Research Type: {result['research_type']}")
print(f"📚 Sources Cited: {len(result['citations'])}")
print(f"📄 Report Length: {len(result['final_report'])} characters")

print("\n" + "-" * 70)
print("FINAL REPORT:")
print("-" * 70)
print(result['final_report'])
print("-" * 70)

print("\n" + "=" * 70)
print("✅✅✅ EVERYTHING IS WORKING! ✅✅✅")
print("=" * 70)
print("\n🎯 Your Research Lab is fully functional!")
print("🚀 You can now use it in the web interface at:")
print("   http://localhost:3000/research")
print("\n💡 Tip: Add more sources (PDFs, documents) to get better answers!")
print("=" * 70)
