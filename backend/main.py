"""
GridSathi AI — Backend API (National EV Dataset & OpenStreetMap Edition)
100% Free & Open-Source EV Charging Station Discovery & Microgrid Orchestration.
Powered by Nationwide EV Charging Dataset (28,553 authentic stations across India,
ODbL / CC-BY 4.0), Leaflet, OpenStreetMap, Nominatim Geocoding, and Overpass API.
Zero Google API keys or billing accounts required.
"""

from __future__ import annotations

import asyncio
import json
import logging
import math
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
DATASET_PATH = DATA_DIR / "charging_stations.json"
OSM_DISK_CACHE_FILE = DATA_DIR / "osm_stations_cache.json"

# OpenStreetMap & Overpass public service endpoints
NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search"
OVERPASS_ENDPOINTS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]
USER_AGENT = "GridSathi-AI/2.1 (EV Microgrid Orchestrator India; https://github.com/GavaraNeha/GridSathi-AI)"

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


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in kilometers between two coordinates."""
    R = 6371.0  # Earth's radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


# ==============================================================================
# Nationwide EV Dataset Manager (Primary Discovery Source: 28,553 Stations)
# ==============================================================================
class DatasetManager:
    """
    In-memory manager and spatial/text search engine for the 28,553 authentic
    Indian EV charging stations dataset (ODbL / CC-BY 4.0).
    Provides sub-millisecond bounding-box and Haversine proximity queries.
    """

    def __init__(self, data_path: Path):
        self.data_path = data_path
        self.stations: List[Dict[str, Any]] = []
        # Spatial grid bucket: (round(lat, 1), round(lng, 1)) -> list of station indices
        self.spatial_grid: Dict[Tuple[float, float], List[int]] = defaultdict(list)
        # Normalized city name -> list of station indices
        self.city_index: Dict[str, List[int]] = defaultdict(list)
        # City centroids: normalized_city -> (centroid_lat, centroid_lng, display_label, count)
        self.city_centroids: Dict[str, Tuple[float, float, str, int]] = {}
        self.loaded = False
        self.total_count = 0
        self.unique_cities_count = 0

    def load(self):
        if self.loaded:
            return
        if not self.data_path.exists():
            logger.warning(f"Dataset file not found at {self.data_path}")
            return
        t0 = time.time()
        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
            self.stations = raw_data
            self.total_count = len(self.stations)

            city_accum = defaultdict(
                lambda: {"lats": [], "lngs": [], "state": "", "name": "", "indices": []}
            )

            for idx, s in enumerate(self.stations):
                lat = s.get("lat")
                lng = s.get("lng")
                if lat is not None and lng is not None:
                    # Spatial bucket (0.1 degree is ~11 km)
                    bucket = (round(float(lat), 1), round(float(lng), 1))
                    self.spatial_grid[bucket].append(idx)

                city_name = (s.get("city") or "").strip()
                if city_name:
                    norm_city = city_name.lower()
                    self.city_index[norm_city].append(idx)
                    entry = city_accum[norm_city]
                    entry["indices"].append(idx)
                    entry["name"] = city_name
                    if s.get("state"):
                        entry["state"] = s["state"]
                    if lat is not None and lng is not None:
                        entry["lats"].append(float(lat))
                        entry["lngs"].append(float(lng))

            # Compute centroids for each city
            for norm_city, data in city_accum.items():
                if data["lats"] and data["lngs"]:
                    c_lat = sum(data["lats"]) / len(data["lats"])
                    c_lng = sum(data["lngs"]) / len(data["lngs"])
                    state_str = f", {data['state']}" if data["state"] else ""
                    label = f"{data['name']}{state_str}, India"
                    self.city_centroids[norm_city] = (c_lat, c_lng, label, len(data["indices"]))

            self.unique_cities_count = len(self.city_centroids)
            self.loaded = True
            t1 = time.time()
            logger.info(
                f"Loaded {self.total_count} stations across {self.unique_cities_count} cities "
                f"into spatial grid ({len(self.spatial_grid)} buckets) in {t1 - t0:.2f}s"
            )
        except Exception as exc:
            logger.error(f"Failed to load EV stations dataset: {exc}")

    def search_nearby(
        self,
        lat: float,
        lng: float,
        radius_km: float = 30.0,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        self.load()
        if not self.stations:
            return []

        # Convert radius to rough degree bounding box (~111 km per lat degree)
        d_deg = (radius_km / 111.0) * 1.15
        lat_min, lat_max = lat - d_deg, lat + d_deg
        lng_min, lng_max = lng - d_deg, lng + d_deg

        candidate_indices = set()
        r_lat_min, r_lat_max = int(math.floor(lat_min * 10)), int(math.ceil(lat_max * 10))
        r_lng_min, r_lng_max = int(math.floor(lng_min * 10)), int(math.ceil(lng_max * 10))

        for rlat in range(r_lat_min, r_lat_max + 1):
            for rlng in range(r_lng_min, r_lng_max + 1):
                bucket = (round(rlat / 10.0, 1), round(rlng / 10.0, 1))
                if bucket in self.spatial_grid:
                    candidate_indices.update(self.spatial_grid[bucket])

        results = []
        for idx in candidate_indices:
            s = self.stations[idx]
            s_lat = s.get("lat")
            s_lng = s.get("lng")
            if s_lat is None or s_lng is None:
                continue
            dist = haversine_distance_km(lat, lng, float(s_lat), float(s_lng))
            if dist <= radius_km:
                formatted = self.format_station(s, idx, dist)
                results.append(formatted)

        # If too few stations found and radius was small, try expanding once to 60 km
        if len(results) < 3 and radius_km < 55.0:
            return self.search_nearby(lat, lng, radius_km=60.0, limit=limit)

        results.sort(key=lambda x: x.get("distance_km") if x.get("distance_km") is not None else 9999.0)
        return results[:limit]

    def resolve_city_coords(self, city: str) -> Optional[Tuple[float, float, str]]:
        self.load()
        norm = city.strip().lower()
        # 1. Exact or partial match in pre-seeded cities
        if norm in PRESEEDED_INDIAN_CITIES:
            return PRESEEDED_INDIAN_CITIES[norm]
        for p_name, data in PRESEEDED_INDIAN_CITIES.items():
            if p_name in norm or norm in p_name:
                return data

        # 2. Exact match in dataset city centroids
        if norm in self.city_centroids:
            c_lat, c_lng, label, _ = self.city_centroids[norm]
            return c_lat, c_lng, label

        # 3. Substring match in dataset city centroids
        for c_norm, (c_lat, c_lng, label, _) in self.city_centroids.items():
            if norm == c_norm or norm in c_norm or c_norm in norm:
                return c_lat, c_lng, label

        return None

    def suggest_locations(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        self.load()
        q = query.strip().lower()
        if len(q) < 2:
            return []

        suggestions = []
        seen = set()

        # Check preseeded first
        for name, (c_lat, c_lng, display_name) in PRESEEDED_INDIAN_CITIES.items():
            if q in name or name in q:
                key = (round(c_lat, 3), round(c_lng, 3))
                if key not in seen:
                    seen.add(key)
                    suggestions.append({
                        "label": display_name,
                        "place_id": f"seed-{name}",
                        "lat": c_lat,
                        "lng": c_lng,
                    })

        # Match city centroids from dataset
        matches = []
        for c_norm, (c_lat, c_lng, label, count) in self.city_centroids.items():
            if q in c_norm:
                matches.append((count, c_norm, c_lat, c_lng, label))

        # Sort matches by count descending so prominent cities show first
        matches.sort(key=lambda x: x[0], reverse=True)

        for count, c_norm, c_lat, c_lng, label in matches:
            key = (round(c_lat, 3), round(c_lng, 3))
            if key not in seen:
                seen.add(key)
                suggestions.append({
                    "label": f"{label} ({count} EV Stations)",
                    "place_id": f"dataset-city-{c_norm}",
                    "lat": c_lat,
                    "lng": c_lng,
                })
            if len(suggestions) >= limit:
                break

        return suggestions[:limit]

    def format_station(
        self, s: Dict[str, Any], idx: int, distance_km: Optional[float] = None
    ) -> Dict[str, Any]:
        s_lat = float(s["lat"])
        s_lng = float(s["lng"])
        operator = s.get("operator") or s.get("network") or "Independent CPO"
        name = s.get("name") or f"{operator} EV Station"

        address = s.get("address")
        if not address:
            addr_parts = [s.get("city"), s.get("district"), s.get("state"), s.get("postcode")]
            address = ", ".join([str(p) for p in addr_parts if p])
        if not address:
            address = f"Coordinates: {s_lat:.4f}, {s_lng:.4f}"

        # Connectors / Sockets
        connectors = s.get("connectors") or []
        socket_items = []
        for c in connectors:
            if isinstance(c, dict):
                c_type = c.get("type", "EV")
                p_kw = c.get("power_kw")
                if p_kw:
                    socket_items.append(f"{c_type} ({int(p_kw)} kW)")
                else:
                    socket_items.append(str(c_type))
            elif isinstance(c, str):
                socket_items.append(c)

        sockets_str = ", ".join(socket_items) if socket_items else "Unspecified"
        has_connector_data = bool(socket_items)

        # Capacity string
        n_points = s.get("n_points")
        max_kw = s.get("max_power_kw")
        if n_points and max_kw:
            capacity_str = f"{n_points} bays ({int(max_kw)} kW max)"
        elif n_points:
            capacity_str = f"{n_points} bays"
        elif max_kw:
            capacity_str = f"{int(max_kw)} kW fast charger"
        else:
            capacity_str = "Standard EV Bay"

        pricing = s.get("pricing")
        sources_list = s.get("sources") or []
        n_src = s.get("n_sources") or len(sources_list) or 1
        last_up = s.get("last_updated")
        station_id = f"in-ev-{idx + 1}"
        maps_url = f"https://www.google.com/maps/dir/?api=1&destination={s_lat},{s_lng}"

        return {
            "id": station_id,
            "name": name,
            "address": address,
            "place_id": station_id,
            "maps_url": maps_url,
            "lat": s_lat,
            "lng": s_lng,
            "distance_km": distance_km,
            "primary_type": "electric_vehicle_charging_station",
            "operator": operator,
            "capacity": capacity_str,
            "fee": pricing,
            "sockets": sockets_str,
            "has_connector_data": has_connector_data,
            "connectors": connectors if has_connector_data else [],
            "max_power_kw": float(max_kw) if max_kw is not None else None,
            "n_points": int(n_points) if n_points is not None else None,
            "source": "National EV Dataset (India)",
            "sources_count": n_src,
            "last_updated": last_up,
        }


dataset_manager = DatasetManager(DATASET_PATH)
dataset_manager.load()

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
        if key in PRESEEDED_INDIAN_CITIES:
            return PRESEEDED_INDIAN_CITIES[key]
        for name, data in PRESEEDED_INDIAN_CITIES.items():
            if name in key or key in name:
                return data

        if key in self.geocodes:
            ts, lat, lng, name = self.geocodes[key]
            if time.time() - ts < 86400:
                return lat, lng, name
        return None

    def set_geocode(self, query: str, lat: float, lng: float, name: str):
        self.geocodes[query.strip().lower()] = (time.time(), lat, lng, name)

    def get_stations(self, lat: float, lng: float) -> Optional[List[Dict[str, Any]]]:
        bucket = (round(lat, 2), round(lng, 2))
        if bucket in self.stations:
            ts, stations = self.stations[bucket]
            if time.time() - ts < 3600:
                return stations
        return None

    def set_stations(self, lat: float, lng: float, stations: List[Dict[str, Any]]):
        bucket = (round(lat, 2), round(lng, 2))
        self.stations[bucket] = (time.time(), stations)


cache_manager = CacheManager()


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
    provider: str = Field(
        "National EV Dataset & OpenStreetMap",
        description="Mapping and geospatial data provider",
    )
    live_enabled: bool = Field(True, description="Always true; zero API keys or billing required")
    requires_keys: bool = Field(False, description="Zero API keys or payment accounts needed")
    country: str = Field("IN", description="Default country code")
    total_stations: int = Field(28553, description="Total verified EV charging stations in India")
    attribution: str = Field(
        "Nationwide EV Charging Infrastructure Dataset (India) by ReclaimChennai & Open EV Data contributors (ODbL / CC-BY 4.0)",
        description="Dataset licensing and attribution statement",
    )
    rate_limit_per_minute: int = Field(60, description="Allowed queries per minute per client")
    message: str = Field(
        "28,553 authentic Indian EV charging stations active (No API keys or billing required).",
        description="Configuration description",
    )


class LocationSuggestion(BaseModel):
    label: str = Field(..., description="City or locality display name")
    place_id: str = Field("", description="Place ID or identifier")
    lat: Optional[float] = Field(None, description="Latitude")
    lng: Optional[float] = Field(None, description="Longitude")


class LocationsResponse(BaseModel):
    mode: str = Field("osm-nominatim-geocoding", description="Operating mode")
    locations: List[LocationSuggestion] = Field(default_factory=list)
    message: Optional[str] = None


class StationListing(BaseModel):
    id: str = Field(..., description="Unique station identifier")
    name: str = Field(..., description="Charging station or hub name")
    address: str = Field(..., description="Formatted physical address or locality")
    place_id: str = Field(..., description="Identifier")
    maps_url: str = Field(..., description="Directions link")
    lat: Optional[float] = Field(None, description="Latitude coordinate")
    lng: Optional[float] = Field(None, description="Longitude coordinate")
    distance_km: Optional[float] = Field(None, description="Distance from search location in kilometers")
    primary_type: str = Field("electric_vehicle_charging_station", description="Type")
    operator: Optional[str] = Field(None, description="Charge point operator (e.g. Tata Power, ChargeZone)")
    capacity: Optional[str] = Field(None, description="Number of bays or power capacity")
    fee: Optional[str] = Field(None, description="Fee / tariff info")
    sockets: Optional[str] = Field(None, description="Available socket connectors")
    has_connector_data: Optional[bool] = Field(None, description="Whether authentic connector metadata is available")
    connectors: Optional[List[Dict[str, Any]]] = Field(None, description="Detailed connector list")
    max_power_kw: Optional[float] = Field(None, description="Maximum charging power rating in kW")
    n_points: Optional[int] = Field(None, description="Total bay count")
    source: str = Field("National EV Dataset (India)", description="Data provenance")
    sources_count: Optional[int] = Field(None, description="Number of corroborating registry sources")
    last_updated: Optional[str] = Field(None, description="Metadata verification timestamp")


class StationsResponse(BaseModel):
    mode: str = Field("dataset-search", description="Search mode")
    city: str = Field(..., description="Searched city or town")
    lat: Optional[float] = None
    lng: Optional[float] = None
    stations: List[StationListing] = Field(default_factory=list)
    total: int = Field(0, description="Number of station listings returned")
    message: str = Field(..., description="Informational message")
    attribution: str = Field(
        "Data provided by Nationwide EV Charging Dataset (India) under ODbL / CC-BY 4.0 (incorporating OpenStreetMap, OpenChargeMap, and verified CPO records).",
        description="Dataset licensing and attribution statement",
    )
    disclaimer: str = Field(
        "Station data reflects mapped charging infrastructure. Real-time bay occupancy, "
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
    title="GridSathi AI — EV Infrastructure & Microgrid Platform",
    description=(
        "Software-only EV charging station discovery and microgrid charging management "
        "for India. 100% free and open-source using Nationwide EV Dataset (28,553 stations), "
        "Leaflet, OpenStreetMap, Nominatim, and Overpass API."
    ),
    version="2.1.0",
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
# Helper Services: Nominatim Geocoding & Supplementary Overpass Query
# ==============================================================================
async def geocode_city_nominatim(city: str) -> Optional[Tuple[float, float, str]]:
    """Geocode an Indian city or town using Nominatim with caching and throttling."""
    cached = cache_manager.get_geocode(city)
    if cached:
        return cached

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
    Supplementary query: query Overpass API for amenity=charging_station using fast
    bounding-box filter and multi-mirror failover across global public Overpass endpoints.
    """
    cached = cache_manager.get_stations(lat, lng)
    if cached is not None:
        return cached

    async with cache_manager.overpass_lock:
        cached = cache_manager.get_stations(lat, lng)
        if cached is not None:
            return cached

        elapsed = time.time() - cache_manager.last_overpass_time
        if elapsed < 1.0:
            await asyncio.sleep(1.0 - elapsed)
        cache_manager.last_overpass_time = time.time()

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

            operator = tags.get("operator") or tags.get("brand") or tags.get("network")
            name = tags.get("name")
            if not name:
                name = f"{operator} EV Station" if operator else "EV Charging Station"

            addr_parts = [
                tags.get("addr:street"),
                tags.get("addr:suburb") or tags.get("addr:neighbourhood"),
                tags.get("addr:city") or tags.get("addr:district"),
                tags.get("addr:state"),
            ]
            clean_addr = ", ".join([p for p in addr_parts if p])
            if not clean_addr:
                clean_addr = f"Near {name}, Coordinates: {s_lat:.4f}, {s_lng:.4f}"

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
                "sockets": sockets_str or "Unspecified",
                "has_connector_data": bool(socket_list),
                "source": "OpenStreetMap",
            }
            stations.append(station_dict)

        if succeeded_mirror is not None:
            cache_manager.set_stations(lat, lng, stations)
            return stations

        if last_error:
            raise RuntimeError(f"All Overpass mirrors unavailable ({last_error})")

        cache_manager.set_stations(lat, lng, stations)
        return stations


def get_osm_disk_cached_stations(
    city: str, lat: Optional[float] = None, lng: Optional[float] = None
) -> List[Dict[str, Any]]:
    """Retrieve authentic OSM stations from persistent local cache."""
    if not OSM_DISK_CACHE_FILE.exists():
        return []
    try:
        with open(OSM_DISK_CACHE_FILE, "r", encoding="utf-8") as f:
            cache_obj = json.load(f)
            cities_data = cache_obj.get("cities", {})

            target = city.strip().lower()
            for c_name, stns in cities_data.items():
                if c_name.lower() == target or target in c_name.lower() or c_name.lower() in target:
                    res = []
                    for s in stns:
                        s_copy = dict(s)
                        if lat is not None and lng is not None and s_copy.get("lat") and s_copy.get("lng"):
                            s_copy["distance_km"] = haversine_distance_km(
                                lat, lng, float(s_copy["lat"]), float(s_copy["lng"])
                            )
                        res.append(s_copy)
                    return res

            if lat is not None and lng is not None:
                nearby = []
                for _, stns in cities_data.items():
                    for s in stns:
                        if s.get("lat") and s.get("lng"):
                            d = haversine_distance_km(lat, lng, float(s["lat"]), float(s["lng"]))
                            if d <= 50.0:
                                s_copy = dict(s)
                                s_copy["distance_km"] = d
                                nearby.append(s_copy)
                if nearby:
                    nearby.sort(key=lambda x: x.get("distance_km", 999))
                    return nearby
    except Exception as exc:
        logger.error(f"Error reading OSM disk cache: {exc}")
    return []


async def search_nominatim_ev_stations(city: str, lat: float, lng: float) -> List[Dict[str, Any]]:
    """Fallback search using OpenStreetMap Nominatim when Overpass servers are overloaded."""
    headers = {"User-Agent": USER_AGENT}
    results = []
    seen_ids = set()

    queries = [
        f"charging station in {city}",
        f"EV charging {city}",
    ]

    async with httpx.AsyncClient(timeout=4.5) as client:
        for q in queries:
            try:
                params = {
                    "q": q,
                    "countrycodes": "in",
                    "format": "jsonv2",
                    "addressdetails": "1",
                    "extratags": "1",
                    "limit": "15",
                }
                resp = await client.get(NOMINATIM_BASE_URL, params=params, headers=headers)
                if resp.status_code == 200:
                    for item in resp.json():
                        osm_id = f"osm-{item.get('osm_type', 'node')}-{item.get('osm_id')}"
                        if osm_id in seen_ids:
                            continue
                        seen_ids.add(osm_id)

                        extra = item.get("extratags") or {}
                        name = (
                            item.get("name")
                            or extra.get("name")
                            or extra.get("operator")
                            or f"{city} EV Charging Point"
                        )
                        addr_info = item.get("address") or {}
                        addr_parts = [
                            addr_info.get("road"),
                            addr_info.get("suburb") or addr_info.get("neighbourhood"),
                            addr_info.get("city") or addr_info.get("county") or city,
                            addr_info.get("state"),
                        ]
                        clean_addr = ", ".join([p for p in addr_parts if p]) or item.get("display_name", "")

                        s_lat = float(item["lat"])
                        s_lng = float(item["lon"])
                        dist = haversine_distance_km(lat, lng, s_lat, s_lng)

                        operator = extra.get("operator") or extra.get("brand") or extra.get("network")
                        capacity = extra.get("capacity") or extra.get("socket:count")
                        fee = extra.get("fee")

                        sockets = []
                        for k, v in extra.items():
                            if k.startswith("socket:") and v not in ("no", "0"):
                                sockets.append(k.replace("socket:", "").replace("_", " ").title())

                        results.append({
                            "id": osm_id,
                            "name": name,
                            "address": clean_addr,
                            "place_id": f"osm-{item.get('place_id')}",
                            "maps_url": f"https://www.google.com/maps/dir/?api=1&destination={s_lat},{s_lng}",
                            "lat": s_lat,
                            "lng": s_lng,
                            "distance_km": dist,
                            "primary_type": "electric_vehicle_charging_station",
                            "operator": operator,
                            "capacity": capacity,
                            "fee": fee,
                            "sockets": ", ".join(sockets) if sockets else "Unspecified",
                            "has_connector_data": bool(sockets),
                            "source": "OpenStreetMap Nominatim (Live)",
                        })
            except Exception as exc:
                logger.warning(f"Nominatim EV search warning for '{q}': {exc}")
                continue

    return results


# ==============================================================================
# API Endpoints
# ==============================================================================
@app.get("/api/health", tags=["System"])
async def health_check():
    """Service health check endpoint."""
    return {
        "status": "ok",
        "app": "GridSathi AI Backend",
        "version": "2.1.0",
        "provider": "National EV Dataset & OpenStreetMap",
        "country": "IN",
        "total_stations": dataset_manager.total_count,
        "zero_keys_required": True,
    }


@app.get("/api/config", response_model=ConfigResponse, tags=["Configuration"])
async def get_config():
    """Returns application configuration indicating primary National EV Dataset & OSM mode."""
    return ConfigResponse(
        provider="National EV Dataset & OpenStreetMap",
        live_enabled=True,
        requires_keys=False,
        country="IN",
        total_stations=dataset_manager.total_count or 28553,
        rate_limit_per_minute=rate_limiter.max_requests,
        message="28,553 authentic Indian EV charging stations active (No API keys or billing required).",
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
    India-wide city & locality suggestions using nationwide EV charging station index,
    pre-seeded Indian registry, and OpenStreetMap Nominatim.
    Completely free with zero API key dependencies.
    """
    term = q.strip().lower()
    if len(term) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter at least 2 characters to search Indian locations.",
        )

    # 1. Dataset & Pre-seeded registry matching (instant, sub-millisecond)
    matched_dicts = dataset_manager.suggest_locations(term, limit=8)
    matched: List[LocationSuggestion] = [LocationSuggestion(**d) for d in matched_dicts]

    # 2. Supplementary Nominatim query if fewer than 3 matches and network available
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
            async with httpx.AsyncClient(timeout=4.0) as client:
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
            logger.warning(f"Nominatim autocomplete fallback note: {exc}")

    return LocationsResponse(
        mode="osm-nominatim-geocoding",
        locations=matched[:8],
        message=f"Found {len(matched[:8])} Indian locations via National EV Dataset & OpenStreetMap.",
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
    live_only: bool = Query(
        False, description="Strict live network only; disables verified local cache and dataset"
    ),
    source: Optional[str] = Query(
        None, description="Discovery source ('dataset', 'overpass', or None for primary dataset)"
    ),
    radius_km: float = Query(30.0, description="Search radius in kilometers (default 30 km)"),
    limit: int = Query(50, description="Maximum number of stations to return (default 50)"),
):
    """
    Discovers authentic EV charging station listings across India.
    Architecture:
      1. Primary Discovery: Nationwide EV Charging Infrastructure Dataset (28,553 authentic
         stations across India, ODbL / CC-BY 4.0). Instant, offline-capable, zero Overpass timeouts.
      2. Optional Supplementary Discovery: Live Overpass API queries across global mirrors
         (invoked when source='overpass' or live_only=True).
      3. Supplementary Fallbacks: OSM Nominatim and verified disk cache.
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

    # Resolve coordinates if not provided
    if target_lat is None or target_lng is None:
        coords = dataset_manager.resolve_city_coords(cleaned_city)
        if coords:
            target_lat, target_lng = coords[0], coords[1]
        else:
            geo = await geocode_city_nominatim(cleaned_city)
            if geo:
                target_lat, target_lng = geo[0], geo[1]
            else:
                return StationsResponse(
                    mode="dataset-search",
                    city=cleaned_city,
                    stations=[],
                    total=0,
                    message=f"Could not resolve geographical coordinates for '{cleaned_city}'. Please check the city name.",
                )

    # --------------------------------------------------------------------------
    # Tier A: Explicit Overpass Query (When requested via source='overpass' or live_only=True)
    # --------------------------------------------------------------------------
    if source == "overpass" or (live_only and source != "dataset"):
        try:
            raw_stations = await query_overpass_ev_stations(target_lat, target_lng, radius_meters=20000)
            stations: List[StationListing] = [StationListing(**s) for s in raw_stations]

            for s in stations:
                if s.lat is not None and s.lng is not None:
                    s.distance_km = haversine_distance_km(target_lat, target_lng, s.lat, s.lng)
            stations.sort(key=lambda s: s.distance_km if s.distance_km is not None else 9999.0)

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
            logger.warning(f"Overpass live query notice for {cleaned_city}: {exc}")
            if live_only:
                return StationsResponse(
                    mode="osm-overpass-unavailable",
                    city=cleaned_city,
                    lat=target_lat,
                    lng=target_lng,
                    stations=[],
                    total=0,
                    message="OpenStreetMap Overpass servers are currently experiencing high global load. Please wait a moment and try again, or explore verified sample stations.",
                )

    # --------------------------------------------------------------------------
    # Tier B: Primary Discovery — Nationwide EV Infrastructure Dataset (28,553 Stations)
    # --------------------------------------------------------------------------
    dataset_matches = dataset_manager.search_nearby(
        target_lat, target_lng, radius_km=radius_km, limit=limit
    )

    if dataset_matches:
        stations: List[StationListing] = [StationListing(**s) for s in dataset_matches]
        msg = f"Discovered {len(stations)} authentic EV charging stations near {cleaned_city} from National EV Dataset (28,553 mapped across India)."

        return StationsResponse(
            mode="dataset-search",
            city=cleaned_city,
            lat=target_lat,
            lng=target_lng,
            stations=stations,
            total=len(stations),
            message=msg,
            attribution="Data provided by Nationwide EV Charging Dataset (India) under ODbL / CC-BY 4.0.",
        )

    # --------------------------------------------------------------------------
    # Tier C: Supplementary Fallback (OSM Disk Cache & Nominatim)
    # --------------------------------------------------------------------------
    cached_raw: List[Dict[str, Any]] = []
    if not live_only:
        cached_raw = get_osm_disk_cached_stations(cleaned_city, target_lat, target_lng)

    if cached_raw:
        stations: List[StationListing] = [StationListing(**s) for s in cached_raw]
        return StationsResponse(
            mode="osm-cached",
            city=cleaned_city,
            lat=target_lat,
            lng=target_lng,
            stations=stations,
            total=len(stations),
            message=f"Discovered {len(stations)} authentic EV charging stations near {cleaned_city} via OpenStreetMap cache.",
        )

    # --------------------------------------------------------------------------
    # Tier D: Genuine Empty State
    # --------------------------------------------------------------------------
    return StationsResponse(
        mode="dataset-search",
        city=cleaned_city,
        lat=target_lat,
        lng=target_lng,
        stations=[],
        total=0,
        message=f"No charging stations found within {int(radius_km)} km of {cleaned_city} in the nationwide dataset.",
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
# Unified Application Serving (React SPA + Preserved Legacy Prototype)
# ==============================================================================
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"

if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="frontend_assets")


@app.get("/", include_in_schema=False)
async def serve_index():
    # Prefer production-built compact React SPA when available
    dist_index = FRONTEND_DIST / "index.html"
    if dist_index.exists():
        return FileResponse(dist_index)

    # Fallback to root index.html
    root_index = ROOT_DIR / "index.html"
    if root_index.exists():
        return FileResponse(root_index)
    return {"message": "GridSathi AI Backend running. Visit /docs for OpenAPI documentation."}


@app.get("/legacy", include_in_schema=False)
async def serve_legacy():
    """Direct route to access the preserved legacy prototype."""
    legacy_file = ROOT_DIR / "index.html"
    if legacy_file.exists():
        return FileResponse(legacy_file)
    raise HTTPException(status_code=404, detail="Legacy prototype file not found.")


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
    print(f"Starting GridSathi AI (National EV Dataset Edition) on http://{host}:{port}")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
