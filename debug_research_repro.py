import requests
import time
import json
import sys

BASE_URL = "http://127.0.0.1:5055/api"

def test_research_flow():
    print("1. Starting research task...")
    try:
        response = requests.post(
            f"{BASE_URL}/research/start",
            json={
                "query": "What are the key arguments for and against renewable energy adoption?",
                "research_type": "deep_dive"
            }
        )
        response.raise_for_status()
        data = response.json()
        task_id = data["task_id"]
        print(f"   Task started. ID: {task_id}")
    except Exception as e:
        print(f"   Failed to start task: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"   Response: {e.response.text}")
        return

    print("\n2. Polling status...")
    start_time = time.time()
    while True:
        try:
            status_response = requests.get(f"{BASE_URL}/research/status/{task_id}")
            status_response.raise_for_status()
            status_data = status_response.json()
            
            status = status_data["status"]
            step = status_data.get("current_step", "Unknown")
            percent = status_data.get("progress_percent", 0)
            
            print(f"   Status: {status} | Step: {step} | Progress: {percent}%")
            
            if status == "completed":
                print("\n3. Task completed!")
                break
            elif status == "error":
                print(f"\n3. Task failed: {status_data.get('message')}")
                break
            
            if time.time() - start_time > 60:  # 60s timeout for debug
                print("\n3. Timeout waiting for completion")
                break
                
            time.sleep(2)
        except Exception as e:
            print(f"   Error polling status: {e}")
            break

    if status == "completed":
        print("\n4. Fetching results...")
        try:
            result_response = requests.get(f"{BASE_URL}/research/result/{task_id}")
            result_response.raise_for_status()
            result = result_response.json()
            print("\nResult Summary:")
            print(f"Findings length: {len(result.get('scholar_findings', ''))}")
            print(f"Report length: {len(result.get('final_report', ''))}")
        except Exception as e:
            print(f"   Failed to fetch result: {e}")

if __name__ == "__main__":
    test_research_flow()
