import requests
import json

API_URL = "http://localhost:5055/api"
NOTEBOOK_ID = "notebook:f1jodat25ruahw23qu9c"
EXISTING_SESSION_ID = "chat_session:7ep08ifcupoc4ayyjwg9"

def test_chat(session_id, label):
    print(f"\n--- TESTING {label} SESSION [{session_id}] ---")
    try:
        response = requests.post(
            f"{API_URL}/chat/execute",
            json={
                "session_id": session_id,
                "message": "Hello",
                "context": {"sources": {}, "notes": {}}
            }
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def create_session():
    print("\n--- CREATING NEW SESSION ---")
    try:
        response = requests.post(
            f"{API_URL}/chat/sessions",
            json={"notebook_id": NOTEBOOK_ID, "title": "Test Session"}
        )
        if response.status_code == 200:
            session_id = response.json()['id']
            print(f"Created session: {session_id}")
            return session_id
        else:
            print(f"Failed to create session: {response.text}")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    # Test existing session
    test_chat(EXISTING_SESSION_ID, "EXISTING")
    
    # Create and test new session
    new_session_id = create_session()
    if new_session_id:
        test_chat(new_session_id, "NEW")
