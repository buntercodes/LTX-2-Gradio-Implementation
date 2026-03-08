import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_fastapi():
    print("Testing API Status...")
    try:
        resp = requests.get(f"{BASE_URL}/system/status")
        print("Status Check:", resp.json())
    except requests.exceptions.ConnectionError:
        print("Error: FastAPI server is not running at http://127.0.0.1:8000")
        sys.exit(1)

    print("\nSimulating Generation Pipeline...")
    # Since we can't reliably load the actual 96GB models in a quick CI test script without real paths,
    # we'll just test if the endpoint validation functions.
    payload = {
        "prompt": "Test video prompt",
        "num_frames": 121,
        "use_custom_resolution": False
    }

    resp = requests.post(f"{BASE_URL}/generate", json=payload)
    print("Generate Post Response:", resp.status_code, resp.text)
    
    # We expect a 400 since the pipeline isn't loaded:
    if resp.status_code == 400 and "Pipeline not loaded" in resp.text:
        print("PASS: System correctly blocked generation without models loaded.")
    else:
        print("FAIL: Expected 400 Pipeline not loaded, got:", resp.status_code)

if __name__ == "__main__":
    test_fastapi()
