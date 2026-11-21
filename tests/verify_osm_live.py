"""
Test script for live OpenStreetMap & Overpass integration on running server http://127.0.0.1:8000
"""
import urllib.request
import json

def test():
    print("=== Testing Live GridSathi AI OpenStreetMap Backend ===")

    # 1. Health
    req = urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=5)
    health = json.loads(req.read().decode())
    print(f"Health Status: {req.getcode()} | Provider: {health.get('provider')} | Zero Keys Required: {health.get('zero_keys_required')}")

    # 2. Config
    req_cfg = urllib.request.urlopen("http://127.0.0.1:8000/api/config", timeout=5)
    cfg = json.loads(req_cfg.read().decode())
    print(f"Config Status: {req_cfg.getcode()} | Live Enabled: {cfg.get('live_enabled')} | Requires Keys: {cfg.get('requires_keys')}")

    # 3. Locations (Hyderabad)
    req_loc = urllib.request.urlopen("http://127.0.0.1:8000/api/locations?q=Hyderabad", timeout=5)
    loc = json.loads(req_loc.read().decode())
    print(f"Locations Status: {req_loc.getcode()} | Mode: {loc.get('mode')} | Found: {len(loc.get('locations', []))} locations")
    if loc.get("locations"):
        print(f" - First location: {loc['locations'][0].get('label')}")

    # 4. Stations (Hyderabad) via Overpass API
    print("Querying Overpass API for EV stations in Hyderabad...")
    req_stn = urllib.request.urlopen("http://127.0.0.1:8000/api/stations?city=Hyderabad", timeout=20)
    stn = json.loads(req_stn.read().decode())
    print(f"Stations Status: {req_stn.getcode()} | Mode: {stn.get('mode')}")
    print(f"Total Stations Discovered: {stn.get('total')}")
    print(f"Message: {stn.get('message')}")
    
    stations = stn.get("stations", [])
    if stations:
        print("\n--- Sample Discovered OpenStreetMap Stations ---")
        for i, s in enumerate(stations[:5]):
            print(f"{i+1}. {s.get('name')}")
            print(f"   Address: {s.get('address')}")
            print(f"   Operator: {s.get('operator') or 'Unspecified'} | Capacity: {s.get('capacity') or 'N/A'}")
            print(f"   Coordinates: ({s.get('lat')}, {s.get('lng')})")
            print(f"   Directions: {s.get('maps_url')}")
    print("=======================================================")

if __name__ == '__main__':
    test()
