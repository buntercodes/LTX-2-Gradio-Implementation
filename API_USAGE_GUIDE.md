# <p align="center">🎬 LTX-2.3 | API Usage & Testing Guide</p>
<p align="center"><i>Comprehensive Guide for Professional Video Generation API</i></p>

---

<p align="center">
  <img src="https://img.shields.io/badge/LTX--2.3-Latest-blueviolet?style=for-the-badge" alt="LTX-2.3">
  <img src="https://img.shields.io/badge/API-FastAPI-05998b?style=for-the-badge" alt="FastAPI">
  <img src="https://img.shields.io/badge/Status-Online-green?style=for-the-badge" alt="Online">
  <img src="https://img.shields.io/badge/Testing-Automated_Ready-yellow?style=for-the-badge" alt="Automated">
</p>

---

## ⚡ 1. Fast Track: Interactive Swagger UI
The easiest way to test the API is via the **interactive documentation**:

- **URL**: `http://localhost:8000/docs`
- **Utility**: Test every endpoint directly from the browser with real JSON payloads.

---

## 🏗️ 2. Core API Endpoints

### ✅ 2.1 System Readiness
Verify the **Blackwell Optimized Pipeline** is loaded before starting.
- **Endpoint**: `GET /api/v1/system/status`

```bash
# cURL Check
curl http://localhost:8000/api/v1/system/status
```

---

### 🚀 2.2 Submit Generation Task
Queue a new video task to the **GPU Background Worker**.
- **Endpoint**: `POST /api/v1/generate`

```json
{
  "prompt": "An astronaut riding a horse on Mars at golden hour, high-fidelity.",
  "seed": 42,
  "resolution_preset": "1280 × 768   (720p Landscape)",
  "num_frames": 121,
  "frame_rate": 24.0,
  "enhance_prompt": true
}
```

```bash
# cURL Submission
curl -X POST http://localhost:8000/api/v1/generate \
     -H "Content-Type: application/json" \
     -d @payload.json
```

---

### 📊 2.3 Task Status & Progress
Poll the status of your task. It will move through: `queued` ➔ `processing` ➔ `completed`.
- **Endpoint**: `GET /api/v1/tasks/{task_id}`

```bash
# cURL Status Poll
curl http://localhost:8000/api/v1/tasks/your-task-id
```

---

### 📁 2.4 Video Retrieval
Once **Completed**, access your file via the dedicated static stream:
- **URL Pattern**: `http://localhost:8000/videos/ltx2.3_{task_id}.mp4`

---

### ❌ 2.5 Real-Time Cancellation
Stop a generation task immediately if the user exits or the prompt is rejected.
- **Endpoint**: `DELETE /api/v1/tasks/{task_id}`

```bash
# cURL Cancellation
curl -X DELETE http://localhost:8000/api/v1/tasks/your-task-id
```

---

## 🐍 3. Automated Python Test Suite
Run this complete integration script to verify every stage of the pipeline automatically.

```python
import requests
import time

BASE_URL = "http://localhost:8000/api/v1"

def run_integration_test():
    # 1. Start Generate
    print("🚀 Queuing 41-frame test video...")
    payload = {"prompt": "A crystal galaxy forming in deep space.", "num_frames": 41}
    resp = requests.post(f"{BASE_URL}/generate", json=payload)
    task_id = resp.json()["task_id"]
    print(f"✅ Created Task: {task_id}")

    # 2. Sequential Polling
    while True:
        res = requests.get(f"{BASE_URL}/tasks/{task_id}").json()
        print(f"⏳ [{res['status'].upper()}] Progress: {res['progress']*100:.1f}% | {res['message']}")
        
        if res["status"] == "completed":
            print(f"🎉 SUCCESS! Stream URL: http://localhost:8000{res['video_url']}")
            break
        elif res["status"] in ["failed", "canceled"]:
            print(f"❌ Aborted: {res['message']}")
            break
            
        time.sleep(2)

if __name__ == "__main__":
    run_integration_test()
```

---

## 💎 4. Performance Tuning (96GB Blackwell)

| Preset | Resolution | VRAM Cost (Est.) | Time (41f) |
| :--- | :--- | :--- | :--- |
| **720p Landscape** | 1280 x 768 | 12GB | ~15s |
| **1080p Landscape** | 1920 x 1088 | 18GB | ~35s |
| **Square Small** | 768 x 768 | 8GB | ~8s |

---

<p align="center">
  <b>Professional LTX-2.3 API Environment</b>
</p>
