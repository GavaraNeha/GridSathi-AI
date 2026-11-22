import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Navigation, Crosshair } from 'lucide-react';
import { fetchLocations } from '../services/api';

const QUICK_CITIES = [
  'Hyderabad',
  'Bengaluru',
  'Delhi',
  'Mumbai',
  'Chennai',
  'Pune',
  'Kochi',
  'Vijayawada',
  'Rajahmundry',
  'Kolkata',
  'Ahmedabad',
];

export default function SearchBar({ onSearch, onSearchNearMe, isLoading, currentCity }) {
  const [query, setQuery] = useState(currentCity || 'Hyderabad');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (currentCity && currentCity !== query) {
      setQuery(currentCity);
    }
  }, [currentCity]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      setIsFetchingSuggestions(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetchLocations(val);
          if (res?.locations && res.locations.length > 0) {
            setSuggestions(res.locations);
            setShowDropdown(true);
          } else {
            setSuggestions([]);
            setShowDropdown(false);
          }
        } catch {
          setSuggestions([]);
        } finally {
          setIsFetchingSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
      setIsFetchingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (label) => {
    setQuery(label);
    setShowDropdown(false);
    onSearch(label);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setShowDropdown(false);
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setGeoError(null);
  };

  const handleLocateNearMe = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setQuery(`Near Me (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`);
        setShowDropdown(false);
        if (onSearchNearMe) {
          onSearchNearMe(latitude, longitude);
        } else {
          onSearch('Nearby', latitude, longitude);
        }
      },
      (err) => {
        setIsLocating(false);
        setGeoError(
          err.code === 1
            ? 'Location permission denied. Please allow location access or select a city below.'
            : 'Unable to retrieve your current location. Please select a city below.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full space-y-3" ref={containerRef}>
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            {isFetchingSuggestions ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#4163F5]" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Search any Indian city, district, or PIN (e.g. Hyderabad, Vijayawada, Connaught Place)..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border-2 border-[#111827] text-[#111827] placeholder:text-slate-400 font-bold text-sm shadow-[3px_3px_0px_#111827] focus:outline-none transition-all"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#111827]"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#111827] rounded-2xl shadow-[5px_5px_0px_#111827] z-50 overflow-hidden max-h-64 overflow-y-auto">
              <div className="p-2 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 px-3">
                OpenStreetMap Geocoded Suggestions
              </div>
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item.name || item.display_name)}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-[#111827] hover:bg-slate-100 flex items-center gap-2.5 border-b border-slate-50 last:border-0 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#4163F5] shrink-0" />
                  <span className="truncate">{item.display_name || item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Locate Near Me Button */}
        <button
          type="button"
          onClick={handleLocateNearMe}
          disabled={isLoading || isLocating}
          title="Locate EV chargers near my current GPS location"
          className="px-3.5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-[#111827] font-bold text-xs border-2 border-[#111827] shadow-[3px_3px_0px_#111827] transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 active:translate-y-0.5"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#4163F5]" />
          ) : (
            <Crosshair className="w-4 h-4 text-[#4163F5] stroke-[2.5]" />
          )}
          <span className="hidden sm:inline">Near Me</span>
        </button>

        {/* Submit Search Button */}
        <button
          type="submit"
          disabled={isLoading || query.trim().length < 2}
          className="px-5 py-3 rounded-2xl bg-[#4163F5] hover:bg-[#3452d9] text-white font-black text-sm border-2 border-[#111827] shadow-[3px_3px_0px_#111827] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0 active:translate-y-0.5"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4 stroke-[2.5]" />
          )}
          <span>Search</span>
        </button>
      </form>

      {/* Geolocation feedback / warning */}
      {geoError && (
        <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between">
          <span>{geoError}</span>
          <button
            type="button"
            onClick={() => setGeoError(null)}
            className="text-amber-700 hover:text-amber-950 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick City Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0 mr-1">
          Quick Hubs:
        </span>
        {QUICK_CITIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setQuery(c);
              onSearch(c);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 border border-[#111827] ${
              currentCity?.toLowerCase() === c.toLowerCase()
                ? 'bg-[#111827] text-white shadow-[2px_2px_0px_#111827]'
                : 'bg-white text-[#111827] hover:bg-slate-100 shadow-[1px_1px_0px_#111827]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
