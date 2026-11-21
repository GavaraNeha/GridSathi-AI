"""
GridSathi AI — Backend Test Suite (OpenStreetMap Edition)
Automated regression tests for FastAPI endpoints, Nominatim geocoding,
Overpass caching, input validation, and legacy prototype fallback.
"""

import os
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from backend.main import app, rate_limiter, cache_manager, SimpleRateLimiter


class TestGridSathiBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        rate_limiter.clients.clear()

    def test_health_check(self):
        """Verify service health endpoint and OSM provider status."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("provider"), "OpenStreetMap")
        self.assertEqual(data.get("country"), "IN")
        self.assertTrue(data.get("zero_keys_required"))

    def test_config_endpoint_zero_keys(self):
        """Verify config endpoint confirms zero API keys required."""
        res = self.client.get("/api/config")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("provider"), "openstreetmap")
        self.assertTrue(data.get("live_enabled"))
        self.assertFalse(data.get("requires_keys"))
        self.assertEqual(data.get("country"), "IN")
        self.assertIn("no api keys", data.get("message", "").lower())

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
        self.assertEqual(data.get("mode"), "osm-nominatim-geocoding")
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
        # Test geocode cache
        cache_manager.set_geocode("testcity", 12.34, 56.78, "Test City, India")
        cached = cache_manager.get_geocode("testcity")
        self.assertIsNotNone(cached)
        self.assertEqual(cached[0], 12.34)
        self.assertEqual(cached[1], 56.78)

        # Test stations cache
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


if __name__ == "__main__":
    unittest.main()
