import requests
import time
import json

BASE_URL = "http://127.0.0.1:5055/api"

def test_quick_research():
    print("Testing Quick Research endpoint...")
    try:
        print("\nSending request...")
        response = requests.post(
            f"{BASE_URL}/research/quick",
            json={
                "query": "What are the key arguments for and against renewable energy adoption?"
            },
            timeout=150  # 2.5 minutes timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ SUCCESS!")
            print(f"\nTask ID: {result['task_id']}")
            print(f"Research Type: {result['research_type']}")
            print(f"\nFinal Report Preview (first 500 chars):")
            print(result['final_report'][:500])
            print(f"\n... (total length: {len(result['final_report'])} characters)")
            print(f"\nCitations: {len(result['citations'])} sources")
            return True
        else:
            print(f"\n❌ FAILED with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("\n⏱️ Request timed out (took longer than 2.5 minutes)")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return False

if __name__ == "__main__":
    # First check if API is running
    try:
        health_check = requests.get("http://127.0.0.1:5055/health", timeout=2)
        print("✓ API server is running\n")
    except:
        print("❌ API server is not running. Please start it first with: python run_api.py")
        exit(1)
    
    test_quick_research()
