import requests
import json
import sys

API_URL = "http://localhost:5055/api"

def create_model(name, provider, model_type):
    print(f"Creating model: {name} ({provider}) - {model_type}")
    try:
        response = requests.post(
            f"{API_URL}/models",
            json={
                "name": name,
                "provider": provider,
                "type": model_type
            }
        )
        if response.status_code == 200:
            print(f"✅ Successfully created model: {response.json()['id']}")
            return response.json()['id']
        elif response.status_code == 400 and "already exists" in response.text:
            print(f"⚠️ Model already exists, fetching ID...")
            # Fetch all models to find the ID
            models = requests.get(f"{API_URL}/models").json()
            for m in models:
                if m['name'] == name and m['provider'] == provider:
                    return m['id']
        else:
            print(f"❌ Failed to create model: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def set_defaults(chat_model_id, embedding_model_id):
    print(f"Setting defaults - Chat: {chat_model_id}, Embedding: {embedding_model_id}")
    try:
        payload = {}
        if chat_model_id:
            payload["default_chat_model"] = chat_model_id
            payload["default_transformation_model"] = chat_model_id
        if embedding_model_id:
            payload["default_embedding_model"] = embedding_model_id
            
        response = requests.put(
            f"{API_URL}/models/defaults",
            json=payload
        )
        if response.status_code == 200:
            print("✅ Successfully updated default models")
        else:
            print(f"❌ Failed to update defaults: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    # 1. Create Google Chat Model (gemini-2.5-flash)
    chat_model_id = create_model("gemini-2.5-flash", "google", "language")
    
    # 2. Create Google Embedding Model (text-embedding-004)
    embedding_model_id = create_model("text-embedding-004", "google", "embedding")
    
    # 3. Set Defaults
    if chat_model_id and embedding_model_id:
        set_defaults(chat_model_id, embedding_model_id)
    else:
        print("❌ Could not proceed with setting defaults due to missing model IDs")

if __name__ == "__main__":
    main()
