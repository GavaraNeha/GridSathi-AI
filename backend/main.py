"""
GridSathi AI — Backend API (OpenStreetMap & Overpass Edition)
100% Free & Open-Source EV Charging Station Discovery & Microgrid Orchestration.
Powered by Leaflet, OpenStreetMap, Nominatim Geocoding, and Overpass API.
Zero Google API keys or billing accounts required.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx
from fastapi import FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("gridsathi.backend")

# Resolve repository paths
ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"

# OpenStreetMap & Overpass public service endpoints
NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search"
OVERPASS_ENDPOINTS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]
USER_AGENT = "GridSathi-AI/2.0 (EV Microgrid Orchestrator India; https://github.com/GavaraNeha/GridSathi-AI)"

# ==============================================================================
# Pre-seeded Indian Cities (Zero-latency offline resolution & OSM load reduction)
# ==============================================================================
PRESEEDED_INDIAN_CITIES: Dict[str, Tuple[float, float, str]] = {
    "hyderabad": (17.3850, 78.4867, "Hyderabad, Telangana, India"),
    "bengaluru": (12.9716, 77.5946, "Bengaluru, Karnataka, India"),
    "bangalore": (12.9716, 77.5946, "Bengaluru, Karnataka, India"),
    "delhi": (28.6139, 77.2090, "New Delhi, Delhi, India"),
    "new delhi": (28.6139, 77.2090, "New Delhi, Delhi, India"),
    "mumbai": (19.0760, 72.8777, "Mumbai, Maharashtra, India"),
    "chennai": (13.0827, 80.2707, "Chennai, Tamil Nadu, India"),
    "pune": (18.5204, 73.8567, "Pune, Maharashtra, India"),
    "kochi": (9.9312, 76.2673, "Kochi, Kerala, India"),
    "vijayawada": (16.5062, 80.6480, "Vijayawada, Andhra Pradesh, India"),
    "rajahmundry": (17.0005, 81.8040, "Rajamahendravaram (Rajahmundry), Andhra Pradesh, India"),
    "rajamahendravaram": (17.0005, 81.8040, "Rajamahendravaram, Andhra Pradesh, India"),
    "kolkata": (22.5726, 88.3639, "Kolkata, West Bengal, India"),
    "ahmedabad": (23.0225, 72.5714, "Ahmedabad, Gujarat, India"),
    "jaipur": (26.9124, 75.7873, "Jaipur, Rajasthan, India"),
    "visakhapatnam": (17.6868, 83.2185, "Visakhapatnam, Andhra Pradesh, India"),
}

# ==============================================================================
# In-Memory Cache & Throttling
# ==============================================================================
class CacheManager:
    def __init__(self):
        # Geocode cache: query -> (timestamp, lat, lng, display_name)
        self.geocodes: Dict[str, Tuple[float, float, float, str]] = {}
        # Stations cache: (round_lat, round_lng) -> (timestamp, stations_list)
        self.stations: Dict[Tuple[float, float], Tuple[float, List[Dict[str, Any]]]] = {}
        self.last_nominatim_time: float = 0.0
        self.last_overpass_time: float = 0.0
        self.overpass_lock = asyncio.Lock()

    def get_geocode(self, query: str) -> Optional[Tuple[float, float, str]]:
        key = query.strip().lower()
        # Check pre-seeded cities first
        if key in PRESEEDED_INDIAN_CITIES:
            return PRESEEDED_INDIAN_CITIES[key]
        for name, data in PRESEEDED_INDIAN_CITIES.items():
            if name in key or key in name:
                return data

        # Check memory cache (TTL: 24 hours)
        if key in self.geocodes:
            ts, lat, lng, name = self.geocodes[key]
            if time.time() - ts < 86400:
                return lat, lng, name
        return None

    def set_geocode(self, query: str, lat: float, lng: float, name: str):
        self.geocodes[query.strip().lower()] = (time.time(), lat, lng, name)

    def get_stations(self, lat: float, lng: float) -> Optional[List[Dict[str, Any]]]:
        # Spatial bucket: ~1.1 km precision
        bucket = (round(lat, 2), round(lng, 2))
        if bucket in self.stations:
            ts, stations = self.stations[bucket]
            # TTL: 1 hour (3600 seconds)
            if time.time() - ts < 3600:
                return stations
        return None

    def set_stations(self, lat: float, lng: float, stations: List[Dict[str, Any]]):
        bucket = (round(lat, 2), round(lng, 2))
        self.stations[bucket] = (time.time(), stations)


cache_manager = CacheManager()

# Rate limiting per client IP
class SimpleRateLimiter:
    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.clients: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        self.clients[client_ip] = [t for t in self.clients[client_ip] if t > cutoff]
        if len(self.clients[client_ip]) >= self.max_requests:
            return False
        self.clients[client_ip].append(now)
        return True


rate_limiter = SimpleRateLimiter(max_requests=60, window_seconds=60)

# ==============================================================================
# Pydantic Schemas
# ==============================================================================
class ConfigResponse(BaseModel):
    provider: str = Field("openstreetmap", description="Mapping and geospatial data provider")
    live_enabled: bool = Field(True, description="Always true; zero API keys or billing required")
    requires_keys: bool = Field(False, description="Zero API keys or payment accounts needed")
    country: str = Field("IN", description="Default country code")
    rate_limit_per_minute: int = Field(60, description="Allowed queries per minute per client")
    message: str = Field(..., description="Configuration description")


class LocationSuggestion(BaseModel):
    label: str = Field(..., description="City or locality display name")
    place_id: str = Field("", description="OpenStreetMap Place ID")
    lat: Optional[float] = Field(None, description="Latitude")
    lng: Optional[float] = Field(None, description="Longitude")


class LocationsResponse(BaseModel):
    mode: str = Field("osm-nominatim-geocoding", description="Operating mode")
    locations: List[LocationSuggestion] = Field(default_factory=list)
    message: Optional[str] = None


class StationListing(BaseModel):
    id: str = Field(..., description="OpenStreetMap node/way identifier")
    name: str = Field(..., description="Charging station or hub name")
    address: str = Field(..., description="Formatted physical address or locality")
    place_id: str = Field(..., description="Identifier")
    maps_url: str = Field(..., description="Directions link")
    lat: Optional[float] = Field(None, description="Latitude coordinate")
    lng: Optional[float] = Field(None, description="Longitude coordinate")
    primary_type: str = Field("electric_vehicle_charging_station", description="Type")
    operator: Optional[str] = Field(None, description="Charge point operator (e.g. Tata Power, Ather Grid)")
    capacity: Optional[str] = Field(None, description="Number of bays if recorded in OSM")
    fee: Optional[str] = Field(None, description="Fee info if recorded in OSM")
    sockets: Optional[str] = Field(None, description="Available socket connectors")
    source: str = Field("OpenStreetMap", description="Data provenance")


class StationsResponse(BaseModel):
    mode: str = Field("osm-overpass-live-search", description="Search mode")
    city: str = Field(..., description="Searched city or town")
    lat: Optional[float] = None
    lng: Optional[float] = None
    stations: List[StationListing] = Field(default_factory=list)
    total: int = Field(0, description="Number of station listings returned")
    message: str = Field(..., description="Informational message")
    disclaimer: str = Field(
        "Station data is mapped by OpenStreetMap contributors. Real-time bay occupancy, "
        "electrical tariffs, and live queue status are not monitored by physical hardware. "
        "The microgrid optimization below is a high-fidelity software simulation.",
        description="Mandatory disclaimer distinguishing discovery from simulated scheduling",
    )


class SampleStationsResponse(BaseModel):
    mode: str = Field("offline-sample-data", description="Data mode")
    city: str = Field(..., description="Searched city")
    stations: List[StationListing] = Field(default_factory=list)
    total: int = Field(0, description="Number of sample station listings")
    is_sample: bool = True
    disclaimer: str = Field(
        "Historical offline sample records for demonstration. Not a live OpenStreetMap query.",
        description="Disclaimer for sample data",
    )


# ==============================================================================
# FastAPI Application Factory
# ==============================================================================
app = FastAPI(
    title="GridSathi AI — OpenStreetMap Edition",
    description=(
        "Software-only EV charging station discovery and microgrid charging management "
        "for India. 100% free and open-source using Leaflet, OpenStreetMap, Nominatim, and Overpass API."
    ),
    version="2.0.0",
)

# CORS configuration (Supports Local Dev, Vercel Previews, & Custom Cloud Domains)
cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if cors_origins_env:
    for o in cors_origins_env.split(","):
        cleaned = o.strip()
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        client_ip = request.client.host if request.client else "127.0.0.1"
        if not rate_limiter.is_allowed(client_ip):
            logger.warning(f"Rate limit exceeded for client {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "detail": "Maximum queries per minute reached. Please slow down your requests.",
                },
            )
    return await call_next(request)


# ==============================================================================
# Helper Services: Nominatim Geocoding & Overpass Query
# ==============================================================================
async def geocode_city_nominatim(city: str) -> Optional[Tuple[float, float, str]]:
    """Geocode an Indian city or town using Nominatim with caching and throttling."""
    cached = cache_manager.get_geocode(city)
    if cached:
        return cached

    # Throttle Nominatim calls: minimum 1.0s between requests per usage policy
    elapsed = time.time() - cache_manager.last_nominatim_time
    if elapsed < 1.0:
        await asyncio.sleep(1.0 - elapsed)

    cache_manager.last_nominatim_time = time.time()

    params = {
        "q": f"{city}, India",
        "countrycodes": "in",
        "format": "jsonv2",
        "addressdetails": "1",
        "limit": "1",
    }
    headers = {"User-Agent": USER_AGENT}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(NOMINATIM_BASE_URL, params=params, headers=headers)
            if resp.status_code == 200:
                results = resp.json()
                if results and len(results) > 0:
                    first = results[0]
                    lat = float(first["lat"])
                    lng = float(first["lon"])
                    display_name = first.get("display_name", city)
                    cache_manager.set_geocode(city, lat, lng, display_name)
                    return lat, lng, display_name
    except Exception as exc:
        logger.warning(f"Nominatim geocoding failed for '{city}': {exc}")

    return None


async def query_overpass_ev_stations(lat: float, lng: float, radius_meters: int = 15000) -> List[Dict[str, Any]]:
    """
    Query Overpass API for amenity=charging_station using fast bounding-box filter
    and multi-mirror failover across global public Overpass endpoints.
    """
    cached = cache_manager.get_stations(lat, lng)
    if cached is not None:
        return cached

    async with cache_manager.overpass_lock:
        # Check cache again inside lock
        cached = cache_manager.get_stations(lat, lng)
        if cached is not None:
            return cached

        # Throttle Overpass calls: minimum 1.0s between requests per OSM usage policy
        elapsed = time.time() - cache_manager.last_overpass_time
        if elapsed < 1.0:
            await asyncio.sleep(1.0 - elapsed)
        cache_manager.last_overpass_time = time.time()

        # Fast bounding box query (~13km box, limited to 25 results)
        d = 0.12
        bbox = f"{lat-d:.4f},{lng-d:.4f},{lat+d:.4f},{lng+d:.4f}"
        overpass_query = f'[out:json][timeout:4];nwr["amenity"="charging_station"]({bbox});out center 25;'

        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
        }
        raw_elements = []
        last_error: Optional[str] = None
        succeeded_mirror: Optional[str] = None

        # Try distinct global endpoints with bounded 5.0s timeout and automatic failover
        for endpoint in OVERPASS_ENDPOINTS:
            try:
                logger.info(f"Querying Overpass mirror: {endpoint} for ({lat:.4f}, {lng:.4f})")
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(endpoint, data={"data": overpass_query}, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_elements = data.get("elements", [])
                        succeeded_mirror = endpoint
                        logger.info(f"Overpass mirror {endpoint} succeeded with {len(raw_elements)} elements")
                        break
                    elif resp.status_code in (429, 502, 503, 504):
                        logger.warning(f"Overpass mirror {endpoint} busy/rate-limited (HTTP {resp.status_code})")
                        last_error = f"HTTP {resp.status_code}"
                        continue
                    else:
                        logger.warning(f"Overpass mirror {endpoint} returned HTTP {resp.status_code}")
                        last_error = f"HTTP {resp.status_code}"
                        continue
            except httpx.TimeoutException:
                logger.warning(f"Overpass mirror {endpoint} timed out after 5.0s")
                last_error = "Timeout"
                continue
            except Exception as exc:
                logger.warning(f"Overpass mirror {endpoint} error: {exc}")
                last_error = str(exc)
                continue

        stations: List[Dict[str, Any]] = []
        for el in raw_elements:
            tags = el.get("tags", {})
            el_id = el.get("id")
            el_type = el.get("type", "node")

            # Extract coordinates
            if "lat" in el and "lon" in el:
                s_lat = el["lat"]
                s_lng = el["lon"]
            elif "center" in el:
                s_lat = el["center"].get("lat")
                s_lng = el["center"].get("lon")
            else:
                continue

            if s_lat is None or s_lng is None:
                continue

            # Name and operator derivation
            operator = tags.get("operator") or tags.get("brand") or tags.get("network")
            name = tags.get("name")
            if not name:
                name = f"{operator} EV Station" if operator else "EV Charging Station"

            # Address compilation from OSM tags
            addr_parts = [
                tags.get("addr:street"),
                tags.get("addr:suburb") or tags.get("addr:neighbourhood"),
                tags.get("addr:city") or tags.get("addr:district"),
                tags.get("addr:state"),
            ]
            clean_addr = ", ".join([p for p in addr_parts if p])
            if not clean_addr:
                clean_addr = f"Near {name}, Coordinates: {s_lat:.4f}, {s_lng:.4f}"

            # Sockets / connector details
            socket_list = []
            for k, v in tags.items():
                if k.startswith("socket:") and v not in ("no", "0"):
                    socket_list.append(k.replace("socket:", "").replace("_", " ").title())
            sockets_str = ", ".join(socket_list) if socket_list else None

            station_dict = {
                "id": f"osm-{el_type}-{el_id}",
                "name": name,
                "address": clean_addr,
                "place_id": f"osm-{el_id}",
                "maps_url": f"https://www.google.com/maps/dir/?api=1&destination={s_lat},{s_lng}",
                "lat": float(s_lat),
                "lng": float(s_lng),
                "primary_type": "electric_vehicle_charging_station",
                "operator": operator,
                "capacity": tags.get("capacity"),
                "fee": tags.get("fee"),
                "sockets": sockets_str,
                "source": "OpenStreetMap",
            }
            stations.append(station_dict)

        if succeeded_mirror is not None:
            cache_manager.set_stations(lat, lng, stations)
            return stations

        # If all mirrors failed or timed out, raise to trigger osm-overpass-unavailable
        if last_error:
            raise RuntimeError(f"All Overpass mirrors unavailable ({last_error})")

        cache_manager.set_stations(lat, lng, stations)
        return stations


# ==============================================================================
# API Endpoints
# ==============================================================================
@app.get("/api/health", tags=["System"])
async def health_check():
    """Service health check endpoint."""
    return {
        "status": "ok",
        "app": "GridSathi AI Backend",
        "version": "2.0.0",
        "provider": "OpenStreetMap",
        "country": "IN",
        "zero_keys_required": True,
    }


@app.get("/api/config", response_model=ConfigResponse, tags=["Configuration"])
async def get_config():
    """Returns application configuration indicating 100% free OSM mode."""
    return ConfigResponse(
        provider="openstreetmap",
        live_enabled=True,
        requires_keys=False,
        country="IN",
        rate_limit_per_minute=rate_limiter.max_requests,
        message="100% Free OpenStreetMap & Overpass API Active (No API keys or billing required).",
    )


@app.get("/api/locations", response_model=LocationsResponse, tags=["Discovery"])
async def search_locations(
    q: str = Query(
        ...,
        min_length=2,
        max_length=100,
        description="Search term for Indian cities or localities (2–100 characters)",
    )
):
    """
    India-wide city & locality suggestions using OpenStreetMap Nominatim and local pre-seeded registry.
    Completely free with zero API key dependencies.
    """
    term = q.strip().lower()
    if len(term) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter at least 2 characters to search Indian locations.",
        )

    matched: List[LocationSuggestion] = []

    # 1. Check pre-seeded cities (instant, zero external calls)
    for city_key, (lat, lng, display_name) in PRESEEDED_INDIAN_CITIES.items():
        if term in city_key or city_key in term:
            matched.append(
                LocationSuggestion(
                    label=display_name,
                    place_id=f"osm-seed-{city_key}",
                    lat=lat,
                    lng=lng,
                )
            )

    # 2. Query Nominatim if needed
    if len(matched) < 3:
        try:
            params = {
                "q": f"{term}, India",
                "countrycodes": "in",
                "format": "jsonv2",
                "addressdetails": "1",
                "limit": "5",
            }
            headers = {"User-Agent": USER_AGENT}
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(NOMINATIM_BASE_URL, params=params, headers=headers)
                if resp.status_code == 200:
                    for item in resp.json():
                        label = item.get("display_name", "")
                        if label and not any(m.label == label for m in matched):
                            matched.append(
                                LocationSuggestion(
                                    label=label,
                                    place_id=str(item.get("place_id", "")),
                                    lat=float(item["lat"]),
                                    lng=float(item["lon"]),
                                )
                            )
        except Exception as exc:
            logger.warning(f"Nominatim autocomplete error: {exc}")

    return LocationsResponse(
        mode="osm-nominatim-geocoding",
        locations=matched[:8],
        message=f"Found {len(matched[:8])} Indian locations via OpenStreetMap.",
    )


@app.get("/api/stations", response_model=StationsResponse, tags=["Discovery"])
async def search_stations(
    city: str = Query(
        ...,
        min_length=2,
        max_length=120,
        description="Indian city or town name (2–120 characters)",
    ),
    lat: Optional[float] = Query(None, description="Optional latitude coordinate"),
    lng: Optional[float] = Query(None, description="Optional longitude coordinate"),
):
    """
    Discovers authentic EV charging station listings across India via OpenStreetMap Overpass API.
    Zero synthetic or fake station listings are displayed.
    """
    cleaned_city = city.strip()
    if not 2 <= len(cleaned_city) <= 120 or not re.fullmatch(r"[\w\s,.'()/-]+", cleaned_city, re.UNICODE):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter a valid Indian city or town name (2–120 characters).",
        )

    target_lat = lat
    target_lng = lng

    # If coordinates are not provided, geocode using Nominatim / pre-seeded registry
    if target_lat is None or target_lng is None:
        geo = await geocode_city_nominatim(cleaned_city)
        if geo:
            target_lat, target_lng, _ = geo
        else:
            return StationsResponse(
                mode="osm-overpass-live-search",
                city=cleaned_city,
                stations=[],
                total=0,
                message=f"Could not resolve geographical coordinates for '{cleaned_city}'. Please check the city name.",
            )

    try:
        raw_stations = await query_overpass_ev_stations(target_lat, target_lng, radius_meters=20000)

        # Convert to StationListing models
        stations: List[StationListing] = [StationListing(**s) for s in raw_stations]

        msg = (
            f"Discovered {len(stations)} EV charging stations near {cleaned_city} via OpenStreetMap Overpass API."
            if stations
            else f"No charging stations currently mapped in OpenStreetMap within 20 km of {cleaned_city}."
        )

        return StationsResponse(
            mode="osm-overpass-live-search",
            city=cleaned_city,
            lat=target_lat,
            lng=target_lng,
            stations=stations,
            total=len(stations),
            message=msg,
        )

    except Exception as exc:
        logger.warning(f"Overpass query notice for {cleaned_city}: {exc}")
        return StationsResponse(
            mode="osm-overpass-unavailable",
            city=cleaned_city,
            lat=target_lat,
            lng=target_lng,
            stations=[],
            total=0,
            message="OpenStreetMap Overpass servers are currently experiencing high global load. Please wait a moment and try again, or explore verified sample stations.",
        )


@app.get("/api/stations/sample", response_model=SampleStationsResponse, tags=["Discovery"])
async def get_sample_stations(
    city: str = Query("Rajahmundry", description="City to get offline verified examples for (Rajahmundry or Vijayawada)")
):
    """
    Provides verified offline historical examples as a fallback.
    Explicitly labeled as offline sample data to prevent confusion with live discovery.
    """
    file_path = DATA_DIR / "verified_station_examples.json"
    if not file_path.exists():
        return SampleStationsResponse(
            mode="offline-sample-data",
            city=city,
            stations=[],
            total=0,
        )

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            all_samples = json.load(f)

        matched_city = None
        for key in all_samples.keys():
            if key.lower() == city.strip().lower():
                matched_city = key
                break

        raw_list = all_samples.get(matched_city, []) if matched_city else []
        stations: List[StationListing] = []
        for i, s in enumerate(raw_list):
            place_id = s.get("place_id", f"sample-{i+1}")
            stations.append(
                StationListing(
                    id=place_id,
                    name=s.get("name", "Sample Charging Point"),
                    address=s.get("address", "Sample Address"),
                    place_id=place_id,
                    maps_url=f"https://www.google.com/maps/search/?api=1&query={s.get('name')} {s.get('address')}",
                    primary_type="electric_vehicle_charging_station",
                    source="Offline Verified Sample",
                )
            )

        return SampleStationsResponse(
            mode="offline-sample-data",
            city=matched_city or city,
            stations=stations,
            total=len(stations),
        )
    except Exception as exc:
        logger.error(f"Error reading sample stations: {exc}")
        return SampleStationsResponse(
            mode="offline-sample-data",
            city=city,
            stations=[],
            total=0,
        )


# ==============================================================================
# Preserved Legacy Prototype Serving (100% Backward Compatibility)
# ==============================================================================
@app.get("/", include_in_schema=False)
async def serve_index():
    index_file = ROOT_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "GridSathi AI Backend running. Visit /docs for OpenAPI documentation."}


if (ROOT_DIR / "styles.css").exists():
    app.mount("/static", StaticFiles(directory=str(ROOT_DIR)), name="static_root")

    @app.get("/{filename}.{ext}", include_in_schema=False)
    async def serve_root_assets(filename: str, ext: str):
        target = ROOT_DIR / f"{filename}.{ext}"
        if target.exists() and target.is_file() and ext in ("js", "css", "html", "json", "png", "svg", "ico"):
            return FileResponse(target)
        raise HTTPException(status_code=404, detail="File not found")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0" if os.getenv("PORT") else "127.0.0.1")
    print(f"Starting GridSathi AI (OpenStreetMap Edition) on http://{host}:{port}")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
