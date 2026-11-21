import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Navigation, AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';

// Custom dark mode styling for Google Maps
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#131b2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#131b2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#889bb8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#b9cbe6' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6882a8' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1b2c3d' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1f2d47' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#162238' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7a91b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#273c5c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1b2840' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0c1220' }],
  },
];

export default function GoogleMapView({
  stations = [],
  selectedStation,
  onSelectStation,
  city = 'India',
  browserKey,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [mapState, setMapState] = useState({
    loading: true,
    error: null,
    apiLoaded: false,
  });

  const activeKey =
    browserKey ||
    import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY ||
    '';

  // Initialize Google Maps JavaScript API
  useEffect(() => {
    if (!activeKey) {
      setMapState({
        loading: false,
        error: 'NO_BROWSER_KEY',
        apiLoaded: false,
      });
      return;
    }

    let isMounted = true;
    const loader = new Loader({
      apiKey: activeKey,
      version: 'weekly',
      libraries: ['places'],
    });

    loader
      .load()
      .then((google) => {
        if (!isMounted || !mapContainerRef.current) return;

        // Default center: India
        const defaultCenter = { lat: 20.5937, lng: 78.9629 };
        const map = new google.maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 5,
          styles: DARK_MAP_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();

        // Listen for auth failure
        window.gm_authFailure = () => {
          if (isMounted) {
            setMapState({
              loading: false,
              error: 'AUTH_FAILURE',
              apiLoaded: false,
            });
          }
        };

        setMapState({ loading: false, error: null, apiLoaded: true });
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Google Maps JS API load error:', err);
          setMapState({
            loading: false,
            error: err.message || 'FAILED_TO_LOAD',
            apiLoaded: false,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeKey]);

  // Update Markers whenever stations list or map instance changes
  useEffect(() => {
    if (!mapState.apiLoaded || !mapInstanceRef.current || !window.google) return;

    const google = window.google;
    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const validStations = stations.filter(
      (s) => typeof s.lat === 'number' && typeof s.lng === 'number'
    );

    if (validStations.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    validStations.forEach((station) => {
      const pos = { lat: station.lat, lng: station.lng };
      bounds.extend(pos);

      // Custom SVG marker pin
      const isSelected = selectedStation?.id === station.id;
      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: station.name,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm-1 12.5V11H9.5L13 5.5v3.5h1.5L11 14.5z',
          fillColor: isSelected ? '#38bdf8' : '#10b981',
          fillOpacity: 1,
          strokeColor: '#0a0e17',
          strokeWeight: 1.5,
          scale: isSelected ? 1.8 : 1.5,
          anchor: new google.maps.Point(12, 22),
        },
      });

      marker.addListener('click', () => {
        if (onSelectStation) onSelectStation(station);

        const directionsUrl =
          station.maps_url ||
          `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            `${station.lat},${station.lng}`
          )}`;

        const content = `
          <div style="font-family:'Plus Jakarta Sans',sans-serif;max-width:260px;color:#f8fafc;padding:4px 0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <span style="background:#10b981;color:#0a0e17;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:800;letter-spacing:0.5px;">EV CHARGING</span>
              ${station.rating ? `<span style="color:#fbbf24;font-size:11px;font-weight:700;">★ ${station.rating.toFixed(1)}</span>` : ''}
            </div>
            <h4 style="margin:0 0 4px;font-size:14px;font-weight:700;color:#ffffff;line-height:1.3;">${station.name}</h4>
            <p style="margin:0 0 10px;font-size:12px;color:#94a3b8;line-height:1.4;">${station.address}</p>
            <div style="display:flex;align-items:center;gap:8px;">
              <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;background:#10b981;color:#022c22;padding:6px 10px;border-radius:6px;text-decoration:none;font-size:11px;font-weight:700;">
                Get Directions ↗
              </a>
            </div>
          </div>
        `;

        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    if (validStations.length > 1) {
      map.fitBounds(bounds);
    } else if (validStations.length === 1) {
      map.setCenter({ lat: validStations[0].lat, lng: validStations[0].lng });
      map.setZoom(14);
    }
  }, [stations, selectedStation, mapState.apiLoaded, onSelectStation]);

  // Center on selected station if clicked from list
  useEffect(() => {
    if (
      selectedStation &&
      typeof selectedStation.lat === 'number' &&
      typeof selectedStation.lng === 'number' &&
      mapInstanceRef.current
    ) {
      mapInstanceRef.current.panTo({
        lat: selectedStation.lat,
        lng: selectedStation.lng,
      });
      mapInstanceRef.current.setZoom(15);
    }
  }, [selectedStation]);

  // Fallback view when browser key is missing or failed
  if (mapState.error === 'NO_BROWSER_KEY' || mapState.error === 'AUTH_FAILURE') {
    const validStations = stations.filter(
      (s) => typeof s.lat === 'number' && typeof s.lng === 'number'
    );

    return (
      <div className="relative w-full h-[480px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center shadow-xl">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="relative z-10 max-w-md space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">
              Google Maps JavaScript API Key Required
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              To render the interactive Google Map canvas with custom station pins, configure your browser-restricted key.
            </p>
          </div>

          <div className="text-left bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2 font-mono">
            <div className="text-slate-400 font-sans font-semibold text-[11px] uppercase tracking-wider">
              1. Add key to frontend/.env:
            </div>
            <div className="text-emerald-400 select-all overflow-x-auto p-1.5 bg-slate-900 rounded">
              VITE_GOOGLE_MAPS_BROWSER_KEY=YOUR_KEY
            </div>
            <div className="text-slate-400 font-sans font-semibold text-[11px] uppercase tracking-wider pt-1">
              2. Google Cloud Referrer Restrictions:
            </div>
            <ul className="text-slate-300 list-disc list-inside space-y-0.5 text-[11px]">
              <li>http://localhost:5173/*</li>
              <li>http://127.0.0.1:5173/*</li>
              <li>http://localhost:8000/*</li>
            </ul>
          </div>

          {validStations.length > 0 && (
            <div className="pt-2">
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                {validStations.length} genuine station coordinates retrieved from backend
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[480px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
      {mapState.loading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-300 font-medium">
            Initializing Google Maps JavaScript API…
          </span>
        </div>
      )}

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Overlay Badge */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Google Maps JS API · {stations.length} pins loaded</span>
      </div>
    </div>
  );
}
