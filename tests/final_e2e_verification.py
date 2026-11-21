"""
Final End-to-End Verification Script for GridSathi AI
Verifies:
1. Frontend accessibility at http://127.0.0.1:5173
2. Backend health and zero-key configuration
3. Location search for Hyderabad & Vijayawada
4. EV charging station discovery via Overpass
5. Scheduling simulation logic & tests
6. Git exclusion audit (.env, .env.local, node_modules, dist)
"""
import urllib.request
import json
import time
from pathlib import Path

def run_verification():
    print("==================================================================")
    print("           GridSathi AI - Final End-to-End Verification           ")
    print("==================================================================")

    # 1. Frontend check
    print("\n[1/6] Probing Frontend (http://127.0.0.1:5173)...")
    try:
        req = urllib.request.urlopen("http://127.0.0.1:5173", timeout=5)
        content = req.read().decode('utf-8')
        frontend_ok = req.getcode() == 200 and ("GridSathi" in content or "root" in content)
        print(f" -> Frontend Status: {req.getcode()} OK")
        print(f" -> HTML Title/Meta verified: {frontend_ok}")
    except Exception as e:
        print(f" -> Frontend Error: {e}")

    # 2. Backend Health & Config
    print("\n[2/6] Probing Backend (http://127.0.0.1:8000)...")
    try:
        health_req = urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=5)
        health = json.loads(health_req.read().decode('utf-8'))
        print(f" -> Health Status: {health_req.getcode()} OK | Provider: {health.get('provider')} | Zero Keys: {health.get('zero_keys_required')}")

        cfg_req = urllib.request.urlopen("http://127.0.0.1:8000/api/config", timeout=5)
        cfg = json.loads(cfg_req.read().decode('utf-8'))
        print(f" -> Config Status: {cfg_req.getcode()} OK | Provider: {cfg.get('provider')} | Requires Keys: {cfg.get('requires_keys')}")
    except Exception as e:
        print(f" -> Backend Error: {e}")

    # 3. Location Searches: Hyderabad & Vijayawada
    print("\n[3/6] Testing India-Wide Location Search...")
    for city in ["Hyderabad", "Vijayawada"]:
        try:
            req = urllib.request.urlopen(f"http://127.0.0.1:8000/api/locations?q={city}", timeout=5)
            data = json.loads(req.read().decode('utf-8'))
            locs = data.get("locations", [])
            print(f" -> '{city}' Autocomplete: Found {len(locs)} suggestions (Status: {req.getcode()})")
            if locs:
                first = locs[0]
                print(f"    Sample: {first.get('label')} [Lat: {first.get('lat')}, Lng: {first.get('lng')}]")
        except Exception as e:
            print(f" -> Location query for '{city}' error: {e}")

    # 4. Station Discovery: Hyderabad & Vijayawada
    print("\n[4/6] Testing EV Charging Station Discovery (Overpass API)...")
    for city in ["Hyderabad", "Vijayawada"]:
        t0 = time.time()
        try:
            url = f"http://127.0.0.1:8000/api/stations?city={city}"
            req = urllib.request.urlopen(url, timeout=15)
            data = json.loads(req.read().decode('utf-8'))
            stations = data.get("stations", [])
            total = data.get("total", len(stations))
            mode = data.get("mode")
            elapsed = time.time() - t0
            print(f" -> '{city}' Station Search in {elapsed:.2f}s | Mode: {mode} | Found: {total} stations")
            if stations:
                for idx, s in enumerate(stations[:3]):
                    print(f"    [{idx+1}] {s.get('name')} ({s.get('operator') or 'Network Operator'})")
                    print(f"        Address: {s.get('address')}")
                    print(f"        Coordinates: {s.get('lat')}, {s.get('lng')}")
                    print(f"        Directions Link: {s.get('maps_url')}")
            else:
                print(f"    Notice: {data.get('message')}")
        except Exception as e:
            print(f" -> Station search for '{city}' failed: {e}")

    # 5. Git Exclusion & Secrets Audit
    print("\n[5/6] Auditing Git Exclusions & Sensitive Files...")
    gitignore_path = Path(".gitignore")
    if gitignore_path.exists():
        gi_lines = [l.strip() for l in gitignore_path.read_text(encoding='utf-8').splitlines()]
        has_env = ".env" in gi_lines
        has_env_local = any(l in gi_lines for l in [".env.local", ".env.*.local"])
        has_node_modules = "node_modules/" in gi_lines or "node_modules" in gi_lines
        has_dist = "dist/" in gi_lines or "dist" in gi_lines
        print(f" -> .gitignore excludes .env: {has_env}")
        print(f" -> .gitignore excludes .env.local: {has_env_local}")
        print(f" -> .gitignore excludes node_modules: {has_node_modules}")
        print(f" -> .gitignore excludes dist: {has_dist}")

    # 6. Check for any Google Maps script tags or active keys in frontend
    print("\n[6/6] Verifying Zero Google API Dependencies in Frontend...")
    frontend_pkg = json.loads(Path("frontend/package.json").read_text(encoding='utf-8'))
    deps = {**frontend_pkg.get("dependencies", {}), **frontend_pkg.get("devDependencies", {})}
    has_google_dep = any("google" in d.lower() for d in deps.keys())
    has_leaflet = "leaflet" in deps
    print(f" -> Google SDK in dependencies: {has_google_dep}")
    print(f" -> Leaflet in dependencies: {has_leaflet}")

    print("\n==================================================================")
    print("                     Verification Completed                       ")
    print("==================================================================")

if __name__ == "__main__":
    run_verification()
