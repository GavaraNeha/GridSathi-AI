import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Zap, Layers, ExternalLink } from 'lucide-react';

// Custom SVG EV Pin Generator
const createEvIcon = (isSelected = false) => {
  const pinColor = isSelected ? '#38bdf8' : '#10b981';
  const strokeColor = isSelected ? '#0284c7' : '#059669';

  return L.divIcon({
    className: 'custom-ev-pin',
    html: `
      <div style="position: relative; width: 32px; height: 40px; cursor: pointer; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6));">
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40C16 40 32 28 32 16C32 7.16 24.84 0 16 0Z" fill="${pinColor}" stroke="${strokeColor}" stroke-width="1.5"/>
          <circle cx="16" cy="16" r="12" fill="#090d16"/>
          <path d="M17.5 7L10.5 16.5H16L14 24.5L22 14.5H16.5L17.5 7Z" fill="${pinColor}"/>
        </svg>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -38],
  });
};

export default function LeafletMapView({
  stations = [],
  selectedStation,
  onSelectStation,
  onSetSimulationContext,
  city = 'India',
  centerLat = 20.5937,
  centerLng = 78.9629,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = [centerLat || 20.5937, centerLng || 78.9629];
    const initialZoom = centerLat && centerLat !== 20.5937 ? 12 : 5;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap standard tile layer
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    });

    tileLayer.addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers whenever stations list or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const validStations = stations.filter(
      (s) => typeof s.lat === 'number' && typeof s.lng === 'number'
    );

    if (validStations.length === 0) {
      if (centerLat && centerLng) {
        map.setView([centerLat, centerLng], 12);
      }
      return;
    }

    const latLngBounds = [];

    validStations.forEach((station) => {
      const isSelected = selectedStation?.id === station.id;
      const marker = L.marker([station.lat, station.lng], {
        icon: createEvIcon(isSelected),
        title: station.name,
      });

      const directionsUrl =
        station.maps_url ||
        `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;

      const popupHtml = `
        <div style="font-family:'Plus Jakarta Sans',sans-serif;color:#f8fafc;padding:4px 0;min-width:210px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
            <span style="background:#10b981;color:#022c22;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:800;">
              OPENSTREETMAP EV
            </span>
            ${station.operator ? `<span style="background:#1e293b;color:#38bdf8;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">${station.operator}</span>` : ''}
            ${station.distance_km != null ? `<span style="background:#334155;color:#f8fafc;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">📍 ${station.distance_km} km</span>` : ''}
          </div>
          <h4 style="margin:0 0 4px;font-size:13px;font-weight:700;color:#ffffff;line-height:1.3;">
            ${station.name}
          </h4>
          <p style="margin:0 0 8px;font-size:11px;color:#94a3b8;line-height:1.4;">
            ${station.address}
          </p>
          ${station.capacity ? `<div style="font-size:11px;color:#cbd5e1;margin-bottom:6px;">⚡ Capacity: <strong>${station.capacity} bays</strong></div>` : ''}
          ${station.sockets ? `<div style="font-size:11px;color:#cbd5e1;margin-bottom:8px;">🔌 Connectors: <strong>${station.sockets}</strong></div>` : ''}
          <div style="display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap;">
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;background:#10b981;color:#022c22;padding:5px 9px;border-radius:6px;text-decoration:none;font-size:11px;font-weight:700;">
              Get Directions ↗
            </a>
            ${onSetSimulationContext ? `
            <button id="sim-btn-${station.id}" style="display:inline-flex;align-items:center;gap:4px;background:#4163F5;color:#ffffff;border:none;cursor:pointer;padding:5px 9px;border-radius:6px;font-size:11px;font-weight:700;">
              ⚡ Simulate Charging Here
            </button>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-osm-popup',
        maxWidth: 280,
      });

      marker.on('popupopen', () => {
        if (onSetSimulationContext) {
          const btn = document.getElementById(`sim-btn-${station.id}`);
          if (btn) {
            btn.onclick = () => onSetSimulationContext(station);
          }
        }
      });

      marker.on('click', () => {
        if (onSelectStation) onSelectStation(station);
      });

      marker.addTo(markersLayer);
      latLngBounds.push([station.lat, station.lng]);
    });

    if (latLngBounds.length > 1) {
      map.fitBounds(latLngBounds, { padding: [40, 40], maxZoom: 15 });
    } else if (latLngBounds.length === 1) {
      map.setView(latLngBounds[0], 14);
    }
  }, [stations, selectedStation, centerLat, centerLng, onSelectStation]);

  // Center on selected station if clicked from list
  useEffect(() => {
    if (
      selectedStation &&
      typeof selectedStation.lat === 'number' &&
      typeof selectedStation.lng === 'number' &&
      mapInstanceRef.current
    ) {
      mapInstanceRef.current.panTo([selectedStation.lat, selectedStation.lng], {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedStation]);

  return (
    <div className="relative w-full h-[500px] rounded-3xl overflow-hidden border-2 border-[#111827] shadow-[5px_5px_0px_#111827] bg-white">
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Status Pill */}
      <div className="absolute bottom-3 left-3 z-10 bg-white border-2 border-[#111827] rounded-xl px-3.5 py-1.5 text-xs text-[#111827] font-bold flex items-center gap-2 shadow-[2px_2px_0px_#111827] pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-[#55BD8D] animate-pulse"></span>
        <span>OpenStreetMap + Leaflet · {stations.length} chargers mapped</span>
      </div>
    </div>
  );
}
