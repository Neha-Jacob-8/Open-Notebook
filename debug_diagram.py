import requests
import json

try:
    response = requests.post(
        "http://localhost:5055/api/diagrams/generate",
        json={
            "query": "photosynthesis",
            "context": "process of photosynthesis"
        }
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
