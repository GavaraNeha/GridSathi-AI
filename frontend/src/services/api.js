/**
 * GridSathi AI - API Client Service
 * Communicates with the FastAPI backend (OpenStreetMap & Overpass Edition).
 * 100% Free & Open-Source — Zero API Keys or billing required.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Fetch public feature configuration.
 */
export async function fetchConfig() {
  try {
    const res = await fetch(`${BASE_URL}/api/config`);
    if (!res.ok) {
      throw new Error(`Config fetch failed: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error('Error fetching config:', err);
    return {
      provider: 'openstreetmap',
      live_enabled: true,
      requires_keys: false,
      country: 'IN',
      message: 'Running in offline / local mode.',
    };
  }
}

/**
 * Fetch India-wide location suggestions using OpenStreetMap Nominatim / pre-seeded registry.
 * @param {string} term
 */
export async function fetchLocations(term) {
  const query = term?.trim() || '';
  if (query.length < 2) return { mode: 'osm-nominatim-geocoding', locations: [] };

  try {
    const res = await fetch(`${BASE_URL}/api/locations?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || data.error || `HTTP error ${res.status}`);
    }

    return data;
  } catch (err) {
    console.warn('Location suggestion request failed:', err.message);
    return {
      mode: 'osm-nominatim-geocoding',
      locations: [],
      error: err.message,
    };
  }
}

/**
 * Fetch authentic EV charging stations mapped in OpenStreetMap via Overpass / Nominatim / Verified Cache.
 * @param {string} city
 * @param {number|null} lat
 * @param {number|null} lng
 * @param {boolean} live_only
 */
export async function fetchStations(city, lat = null, lng = null, live_only = false) {
  const term = city?.trim() || '';
  if (term.length < 2) {
    throw new Error('Please enter a valid Indian city or location name.');
  }

  try {
    const params = new URLSearchParams({ city: term });
    if (lat != null && lng != null) {
      params.append('lat', String(lat));
      params.append('lng', String(lng));
    }
    if (live_only) {
      params.append('live_only', 'true');
    }

    const res = await fetch(`${BASE_URL}/api/stations?${params.toString()}`);
    const data = await res.json();

    if (res.status === 429) {
      return {
        mode: 'rate-limited',
        city: term,
        stations: [],
        total: 0,
        error: 'Rate limit reached',
        message: data.detail || 'Rate limit exceeded. Please wait a moment before searching again.',
      };
    }

    if (!res.ok) {
      return {
        mode: 'error',
        city: term,
        stations: [],
        total: 0,
        error: data.detail || 'Search failed',
        message: data.detail || 'Unable to retrieve station listings from OpenStreetMap.',
      };
    }

    return data;
  } catch (err) {
    return {
      mode: 'offline',
      city: term,
      stations: [],
      total: 0,
      error: err.message,
      message: 'Failed to connect to the GridSathi backend server. Ensure FastAPI is running on port 8000.',
    };
  }
}

/**
 * Fetch verified offline sample stations (historical reference data).
 * @param {string} city
 */
export async function fetchSampleStations(city = 'Rajahmundry') {
  try {
    const res = await fetch(`${BASE_URL}/api/stations/sample?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Sample fetch failed');
    return await res.json();
  } catch (err) {
    return {
      mode: 'offline-sample-data',
      city,
      stations: [],
      total: 0,
      is_sample: true,
      disclaimer: 'Offline sample data could not be loaded.',
    };
  }
}
