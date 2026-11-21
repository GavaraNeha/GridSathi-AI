import urllib.request
import urllib.parse
import time
import json

lat, lon = 17.3850, 78.4867
d = 0.15
bbox = f"{lat-d:.4f},{lon-d:.4f},{lat+d:.4f},{lon+d:.4f}"
query = f'[out:json][timeout:10];nwr["amenity"="charging_station"]({bbox});out center 25;'
print(f"Testing bounding box query: {query}")

servers = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

for server in servers:
    t0 = time.time()
    try:
        data = urllib.parse.urlencode({'data': query}).encode()
        req = urllib.request.Request(server, data=data, headers={'User-Agent': 'GridSathi-AI/2.0 (contact: info@gridsathi.ai)'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read()
            parsed = json.loads(body.decode())
            elements = parsed.get('elements', [])
            print(f"SUCCESS from {server} in {time.time()-t0:.2f}s! Found: {len(elements)} EV stations!")
            for el in elements[:3]:
                tags = el.get('tags', {})
                name = tags.get('name') or tags.get('operator') or 'EV Station'
                print(f" - {name} ({el.get('lat') or el.get('center',{}).get('lat')}, {el.get('lon') or el.get('center',{}).get('lon')})")
            break
    except Exception as exc:
        print(f"Endpoint {server} failed ({time.time()-t0:.2f}s): {exc}")
