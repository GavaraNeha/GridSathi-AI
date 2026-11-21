# India-wide live EV station discovery (v3)

## What works
- Search **any Indian city or town** via free-text location input; press Enter or Search stations. Quick chips are conveniences, not a fixed city whitelist.
- With a Google Places API (New) key, the backend uses Places Autocomplete (New) restricted to India to suggest cities, then Text Search (New) to find EV charging stations.
- Without a key, the location bar and Google Maps search preview work, but the station list is intentionally empty. No fabricated station records.
- Search results are limited to the first 20 results; not an exhaustive directory of every charger in a city. Text search may include nearby locations.
- Google Places data is *place discovery*, not live charger availability or queue information. No actual hardware or live charging integration.

## Start
1. Enable billing and **Places API (New)** in Google Cloud Console.
2. Create an API key and restrict it to Places API (New). For production restrict usage by server IP, put the API behind authentication/rate limiting and monitor spending.
3. Set the key in the **server environment** (not in frontend code):
   - PowerShell: `$env:GOOGLE_MAPS_API_KEY="YOUR_KEY"`
   - macOS/Linux: `export GOOGLE_MAPS_API_KEY="YOUR_KEY"`
4. From project root run `python backend/server.py` and visit `http://localhost:8000`.
5. Type `Hyderabad`, `Pune`, `Guwahati`, `Kochi`, `Rajahmundry`, or any other Indian location. Autocomplete suggestions need a valid API key.

## APIs
- `GET /api/locations?q=Hyd` -> India-only city autocomplete suggestions (requires Google key).
- `GET /api/stations?city=Hyderabad` -> live Google Places station listings (requires key).
- `GET /api/config` -> reports whether a key is configured, without revealing it.

## Limitations
- Station types are inferred from operator names for UI filtering; this is NOT connector type (CCS2, Type 2, etc.).
- The Maps iframe is a Google Maps search preview, not an embedded live occupancy map.
- Never label a simulated charging schedule as a real station reservation.
- Real occupancy and booking need an EV charge point operator integration (e.g. OCPI / operator API).
- For a production release, review Google Maps Platform usage/attribution, caching and billing policies.
