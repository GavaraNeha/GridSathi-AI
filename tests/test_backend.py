"""
GridSathi AI — Backend Test Suite (National EV Dataset & OpenStreetMap Edition)
Automated regression tests for FastAPI endpoints, Nationwide EV Dataset discovery,
Nominatim geocoding, Overpass multi-mirror failover, error handling, mock fixtures,
input validation, data isolation, and legacy prototype fallback.
"""

import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from backend.main import (
    app,
    rate_limiter,
    cache_manager,
    dataset_manager,
    SimpleRateLimiter,
)

FIXTURES_PATH = ROOT / "tests" / "fixtures" / "osm_mock_responses.json"
with open(FIXTURES_PATH, "r", encoding="utf-8") as f:
    OSM_MOCKS = json.load(f)


class TestGridSathiBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Ensure dataset is loaded
        dataset_manager.load()

    def setUp(self):
        rate_limiter.clients.clear()
        cache_manager.stations.clear()
        cache_manager.last_overpass_time = 0.0

    def test_health_check(self):
        """Verify service health endpoint and provider status."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertIn("National EV Dataset", data.get("provider", ""))
        self.assertEqual(data.get("country"), "IN")
        self.assertGreaterEqual(data.get("total_stations", 0), 28000)
        self.assertTrue(data.get("zero_keys_required"))

    def test_config_endpoint_zero_keys(self):
        """Verify config endpoint confirms zero API keys required and 28k+ dataset."""
        res = self.client.get("/api/config")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("live_enabled"))
        self.assertFalse(data.get("requires_keys"))
        self.assertEqual(data.get("country"), "IN")
        self.assertGreaterEqual(data.get("total_stations", 0), 28000)
        self.assertIn("no api keys", data.get("message", "").lower())
        self.assertIn("ODbL", data.get("attribution", ""))

    def test_locations_validation(self):
        """Verify input validation on location query parameter."""
        res = self.client.get("/api/locations?q=a")
        self.assertIn(res.status_code, (400, 422))

        res = self.client.get("/api/locations?q=")
        self.assertIn(res.status_code, (400, 422))

    def test_locations_preseeded_instant_resolution(self):
        """Verify preseeded Indian cities resolve instantly without external network."""
        res = self.client.get("/api/locations?q=Hyderabad")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data.get("locations", [])), 0)
        first = data["locations"][0]
        self.assertIn("Hyderabad", first["label"])
        self.assertIsNotNone(first.get("lat"))
        self.assertIsNotNone(first.get("lng"))

    def test_stations_validation(self):
        """Verify input validation on city parameter."""
        res = self.client.get("/api/stations?city=X")
        self.assertIn(res.status_code, (400, 422))

        res = self.client.get("/api/stations?city=City%3Cscript%3E")
        self.assertEqual(res.status_code, 400)

    def test_sample_stations_endpoint(self):
        """Verify verified offline sample stations endpoint."""
        res = self.client.get("/api/stations/sample?city=Rajahmundry")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("is_sample"))
        self.assertEqual(data.get("mode"), "offline-sample-data")
        self.assertGreater(data.get("total"), 0)
        first = data["stations"][0]
        self.assertTrue(first.get("name"))
        self.assertTrue(first.get("address"))
        self.assertTrue(first.get("maps_url"))

    def test_rate_limiter(self):
        """Verify rate limiter blocks excessive requests."""
        limiter = SimpleRateLimiter(max_requests=3, window_seconds=10)
        self.assertTrue(limiter.is_allowed("192.168.1.1"))
        self.assertTrue(limiter.is_allowed("192.168.1.1"))
        self.assertTrue(limiter.is_allowed("192.168.1.1"))
        self.assertFalse(limiter.is_allowed("192.168.1.1"))
        self.assertTrue(limiter.is_allowed("192.168.1.2"))

    def test_cache_manager(self):
        """Verify in-memory geocoding and station caching."""
        cache_manager.set_geocode("testcity", 12.34, 56.78, "Test City, India")
        cached = cache_manager.get_geocode("testcity")
        self.assertIsNotNone(cached)
        self.assertEqual(cached[0], 12.34)
        self.assertEqual(cached[1], 56.78)

        test_stations = [{"id": "test-1", "name": "Test Charger"}]
        cache_manager.set_stations(12.34, 56.78, test_stations)
        cached_stations = cache_manager.get_stations(12.34, 56.78)
        self.assertIsNotNone(cached_stations)
        self.assertEqual(len(cached_stations), 1)

    def test_static_fallback_serving(self):
        """Verify legacy prototype files remain served by FastAPI."""
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("GridSathi", res.text)

        for asset in ("styles.css", "engine.js", "app.js", "stations.js"):
            res = self.client.get(f"/{asset}")
            self.assertEqual(res.status_code, 200, f"Failed serving {asset}")
            self.assertGreater(len(res.content), 50)

    # ==========================================================================
    # Primary Discovery Tests: Nationwide EV Dataset (28,553 Authentic Stations)
    # ==========================================================================

    def test_primary_dataset_hyderabad(self):
        """Verify primary discovery returns authentic stations for Hyderabad with distance sorting."""
        res = self.client.get("/api/stations?city=Hyderabad")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["mode"], "dataset-search")
        self.assertGreater(data["total"], 10)
        first = data["stations"][0]
        self.assertTrue(first["name"])
        self.assertTrue(first["operator"])
        self.assertIsNotNone(first["lat"])
        self.assertIsNotNone(first["lng"])
        self.assertIsNotNone(first["distance_km"])
        self.assertIn("google.com/maps/dir", first["maps_url"])
        self.assertIn("National EV Dataset", first["source"])
        # Verify distance sorting
        distances = [s["distance_km"] for s in data["stations"] if s["distance_km"] is not None]
        self.assertEqual(distances, sorted(distances))

    def test_primary_dataset_rajahmundry(self):
        """Verify primary discovery returns authentic stations for Rajahmundry."""
        res = self.client.get("/api/stations?city=Rajahmundry")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["mode"], "dataset-search")
        self.assertGreater(data["total"], 5)
        for s in data["stations"][:5]:
            self.assertIsNotNone(s["lat"])
            self.assertIsNotNone(s["lng"])
            self.assertLessEqual(s["distance_km"], 35.0)

    def test_primary_dataset_vijayawada(self):
        """Verify primary discovery returns authentic stations for Vijayawada."""
        res = self.client.get("/api/stations?city=Vijayawada")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["mode"], "dataset-search")
        self.assertGreater(data["total"], 10)
        first = data["stations"][0]
        self.assertLessEqual(first["distance_km"], 10.0)

    def test_primary_dataset_bengaluru(self):
        """Verify primary discovery returns authentic stations for Bengaluru."""
        res = self.client.get("/api/stations?city=Bengaluru")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["mode"], "dataset-search")
        self.assertGreater(data["total"], 20)

    def test_primary_dataset_delhi(self):
        """Verify primary discovery returns authentic stations for Delhi."""
        res = self.client.get("/api/stations?city=Delhi")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["mode"], "dataset-search")
        self.assertGreater(data["total"], 20)

    def test_dataset_gps_nearby_search(self):
        """Verify 'Near Me' GPS coordinate search calculates accurate Haversine distances."""
        # Query near Hyderabad center (17.3850, 78.4867)
        res = self.client.get("/api/stations?city=Nearby&lat=17.3850&lng=78.4867")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["total"], 10)
        first = data["stations"][0]
        # First station must be within 2 km of the query center
        self.assertLessEqual(first["distance_km"], 2.0)

    def test_dataset_attribution_and_licensing(self):
        """Verify dataset attribution and simulation transparency disclaimers."""
        res = self.client.get("/api/stations?city=Hyderabad")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("ODbL", data.get("attribution", ""))
        self.assertIn("software simulation", data.get("disclaimer", "").lower())

    # ==========================================================================
    # Supplementary Overpass Multi-Mirror Failover Tests (source=overpass)
    # ==========================================================================

    @patch("httpx.AsyncClient.post", new_callable=AsyncMock)
    def test_overpass_mock_200_valid_stations(self, mock_post):
        """Verify successful Overpass query maps OSM tags to StationListing models."""
        mock_post.return_value = httpx.Response(200, json=OSM_MOCKS["http_200_valid_stations"])
        res = self.client.get("/api/stations?city=Hyderabad&source=overpass")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["mode"], "osm-overpass-live-search")
        self.assertEqual(data["total"], 2)
        self.assertEqual(len(data["stations"]), 2)

        s1 = data["stations"][0]
        self.assertEqual(s1["name"], "Tata Power EZ Charge - Abids")
        self.assertEqual(s1["operator"], "Tata Power")
        self.assertEqual(s1["capacity"], "4")
        self.assertIn("Type2 Combo", s1["sockets"])
        self.assertEqual(s1["source"], "OpenStreetMap")
        self.assertAlmostEqual(s1["lat"], 17.3854, places=3)
        self.assertAlmostEqual(s1["lng"], 78.4862, places=3)

    @patch("httpx.AsyncClient.post", new_callable=AsyncMock)
    def test_overpass_mock_200_genuine_empty_result(self, mock_post):
        """Verify genuine empty result in OSM is reported as 0 stations mapped without error."""
        mock_post.return_value = httpx.Response(200, json=OSM_MOCKS["http_200_empty_elements"])
        res = self.client.get("/api/stations?city=Hyderabad&source=overpass")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["mode"], "osm-overpass-live-search")
        self.assertEqual(data["total"], 0)
        self.assertEqual(len(data["stations"]), 0)
        self.assertIn("No charging stations currently mapped", data["message"])

    @patch("httpx.AsyncClient.post", new_callable=AsyncMock)
    def test_overpass_mock_mirror_failover_success(self, mock_post):
        """Verify mirror failover rotates through endpoints until a healthy mirror responds."""
        mock_post.side_effect = [
            httpx.Response(502, text=OSM_MOCKS["http_502_bad_gateway"]["body"]),
            httpx.Response(429, text=OSM_MOCKS["http_429_rate_limited"]["body"]),
            httpx.Response(200, json=OSM_MOCKS["http_200_valid_stations"]),
        ]
        res = self.client.get("/api/stations?city=Hyderabad&source=overpass")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(mock_post.call_count, 3)
        self.assertEqual(data["mode"], "osm-overpass-live-search")
        self.assertEqual(data["total"], 2)

    @patch("httpx.AsyncClient.post", new_callable=AsyncMock)
    def test_overpass_mock_all_mirrors_unavailable_returns_graceful_notice(self, mock_post):
        """Verify graceful failure with status notice when all Overpass mirrors fail or time out in live_only mode."""
        mock_post.side_effect = [
            httpx.TimeoutException("Connection timed out"),
            httpx.Response(502, text=OSM_MOCKS["http_502_bad_gateway"]["body"]),
            httpx.Response(504, text=OSM_MOCKS["http_504_gateway_timeout"]["body"]),
        ]
        res = self.client.get("/api/stations?city=Hyderabad&live_only=true")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["mode"], "osm-overpass-unavailable")
        self.assertEqual(data["total"], 0)
        self.assertEqual(data["stations"], [])
        self.assertIn("high global load", data["message"].lower())
        self.assertNotEqual(data["mode"], "osm-overpass-live-search")

    @patch("httpx.AsyncClient.post", new_callable=AsyncMock)
    def test_overpass_mock_malformed_json_failover(self, mock_post):
        """Verify malformed JSON from an upstream mirror triggers failover to next mirror."""
        mock_post.side_effect = [
            httpx.Response(200, text=OSM_MOCKS["malformed_json"]["body"]),
            httpx.Response(200, json=OSM_MOCKS["http_200_valid_stations"]),
        ]
        res = self.client.get("/api/stations?city=Hyderabad&source=overpass")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["mode"], "osm-overpass-live-search")
        self.assertEqual(data["total"], 2)

    @patch("httpx.AsyncClient.post", new_callable=AsyncMock)
    def test_live_search_never_silently_injects_sample_data(self, mock_post):
        """Verify live discovery endpoint NEVER silently injects sample stations upon failure."""
        mock_post.side_effect = [
            httpx.TimeoutException("All mirrors timed out"),
            httpx.TimeoutException("All mirrors timed out"),
            httpx.TimeoutException("All mirrors timed out"),
        ]
        res = self.client.get("/api/stations?city=Rajahmundry&live_only=true")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["mode"], "osm-overpass-unavailable")
        self.assertEqual(data["total"], 0)
        self.assertEqual(data["stations"], [])
        self.assertFalse(data.get("is_sample", False))

    def test_offline_sample_endpoint_explicitly_isolated(self):
        """Verify offline sample endpoint is strictly isolated and explicitly labeled."""
        res = self.client.get("/api/stations/sample?city=Rajahmundry")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("is_sample"))
        self.assertEqual(data.get("mode"), "offline-sample-data")
        self.assertGreater(data.get("total"), 0)
        self.assertIn("Historical offline sample records", data.get("disclaimer", ""))
        for stn in data.get("stations", []):
            self.assertEqual(stn.get("source"), "Offline Verified Sample")


if __name__ == "__main__":
    unittest.main()
