"""
Local probe for running FastAPI server on http://127.0.0.1:8000
- Connects strictly to localhost (127.0.0.1:8000)
- Zero external or Google Places network calls
- Never displays or logs raw configuration or API keys
- Reports status codes and boolean health flags only
"""
import urllib.request
import json
import sys

def check():
    print("=== Testing Local FastAPI Server Status ===")
    
    # 1. Health Endpoint
    try:
        req = urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=5)
        health_code = req.getcode()
        health_data = json.loads(req.read().decode())
        is_healthy = (health_data.get('status') == 'ok')
        live_enabled = bool(health_data.get('live_places_enabled'))
        
        print(f"Health Endpoint Status Code: {health_code}")
        print(f"Backend Is Healthy: {is_healthy}")
        print(f"Live Station Discovery Enabled (Backend key detected): {live_enabled}")
    except Exception as exc:
        print(f"Health Check Failed: {exc}")
        return

    # 2. Config Endpoint (Zero key exposure)
    try:
        req_cfg = urllib.request.urlopen('http://127.0.0.1:8000/api/config', timeout=5)
        cfg_code = req_cfg.getcode()
        cfg_data = json.loads(req_cfg.read().decode())
        has_browser_key = bool(cfg_data.get('has_browser_key'))
        live_cfg = bool(cfg_data.get('live_enabled'))
        
        print(f"Config Endpoint Status Code: {cfg_code}")
        print(f"Live Places Discovery Configured: {live_cfg}")
        print(f"Browser Key Configured on Backend: {has_browser_key}")
    except Exception as exc:
        print(f"Config Check Failed: {exc}")
        return
        
    print("===========================================")

if __name__ == '__main__':
    check()
