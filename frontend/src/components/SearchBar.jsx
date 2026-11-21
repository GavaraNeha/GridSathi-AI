import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Navigation } from 'lucide-react';
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

export default function SearchBar({ onSearch, isLoading, currentCity }) {
  const [query, setQuery] = useState(currentCity || 'Rajahmundry');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
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
  };

  return (
    <div className="w-full space-y-3" ref={containerRef}>
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {isFetchingSuggestions ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            ) : (
              <Search className="w-5 h-5 text-slate-400" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Search any Indian city, town, or locality (e.g. Hyderabad, Pune, Vijayawada)..."
            className="w-full pl-11 pr-10 py-3.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            disabled={isLoading}
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-800">
              <li className="px-3.5 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase bg-slate-950/60">
                OpenStreetMap Suggestions (India)
              </li>
              {suggestions.map((item, idx) => (
                <li key={item.place_id || idx}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(item.label)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 hover:text-emerald-400 flex items-center gap-2.5 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || query.trim().length < 2}
          className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 fill-slate-950" />
          )}
          <span className="hidden sm:inline">Search EV Stations</span>
          <span className="sm:hidden">Search</span>
        </button>
      </form>

      {/* Quick search chips */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs">
        <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
          <span>Quick Hubs:</span>
        </span>
        {QUICK_CITIES.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => {
              setQuery(city);
              setShowDropdown(false);
              onSearch(city);
            }}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              currentCity?.toLowerCase() === city.toLowerCase()
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}
