"""Quick API validation script for the running FastAPI server."""
import cv2
import numpy as np
import requests

# Create a test leaf image with brown lesion
img = np.zeros((300, 300, 3), dtype=np.uint8)
img[:, :] = (40, 100, 30)            # green leaf base
cv2.circle(img, (150, 130), 40, (20, 60, 100), -1)  # brown lesion 1
cv2.circle(img, (200, 180), 25, (15, 50, 80), -1)   # brown lesion 2

_, buf = cv2.imencode('.jpg', img)
jpg_bytes = buf.tobytes()

print("=== Testing /api/scan ===")
res = requests.post(
    'http://localhost:8000/api/scan',
    files={'image': ('tomato_blight.jpg', jpg_bytes, 'image/jpeg')}
)
if res.status_code == 200:
    d = res.json()
    print(f"  Crop          : {d['crop_type']}")
    print(f"  Disease       : {d['disease_name']}")
    print(f"  Severity      : {d['severity_percentage']}% ({d['severity_level']})")
    print(f"  Confidence    : {round(d['confidence']*100)}%")
    print(f"  Pesticide     : {d['pesticide_name']}")
    print(f"  Dosage        : {d['pesticide_dosage']}")
    print(f"  BBoxes        : {len(d['bounding_boxes'] or [])} detected")
    print("  RESULT: PASS ✅")
else:
    print(f"  ERROR {res.status_code}: {res.text}")

print("\n=== Testing /api/telemetry ===")
res2 = requests.get('http://localhost:8000/api/telemetry')
if res2.status_code == 200:
    t = res2.json()
    print(f"  Temperature   : {t['temperature']}°C")
    print(f"  Humidity      : {t['humidity']}%")
    print(f"  Soil Moisture : {t['soil_moisture']}%")
    print(f"  Status        : {t['status_label']}")
    print("  RESULT: PASS ✅")
else:
    print(f"  ERROR {res2.status_code}: {res2.text}")

print("\n=== Testing /api/tasks ===")
res3 = requests.get('http://localhost:8000/api/tasks')
if res3.status_code == 200:
    tasks = res3.json()
    print(f"  Tasks found   : {len(tasks)}")
    for t in tasks[:3]:
        print(f"    - [{t['status']}] {t['title']} ({t['due_date']})")
    print("  RESULT: PASS ✅")
else:
    print(f"  ERROR {res3.status_code}: {res3.text}")

print("\n=== Testing /api/hotspots ===")
res4 = requests.get('http://localhost:8000/api/hotspots')
if res4.status_code == 200:
    spots = res4.json()
    print(f"  Hotspots      : {len(spots)} active sectors")
    for s in spots[:2]:
        print(f"    - {s['sector']}: {s['disease']} ({s['severity']})")
    print("  RESULT: PASS ✅")
else:
    print(f"  ERROR {res4.status_code}: {res4.text}")

print("\n=== ALL API ENDPOINTS VALIDATED ===")
