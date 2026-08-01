import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Cloud, Sparkles, UtensilsCrossed, Wallet, Shield, Heart,
  Clock, Landmark, MapPin, Wind, Thermometer, TrendingUp, Globe, ArrowRight, X
} from "lucide-react";
import { TopBar } from "../components/TopBar";
import { api } from "../api/client";
import { Place } from "../types";
import { useAuthStore } from "../store/authStore";

const POPULAR_DESTINATIONS = [
  { name: "Paris", country: "France", emoji: "🗼" },
  { name: "Tokyo", country: "Japan", emoji: "⛩️" },
  { name: "New York", country: "USA", emoji: "🗽" },
  { name: "Dubai", country: "UAE", emoji: "🏙️" },
  { name: "London", country: "UK", emoji: "🎡" },
  { name: "Bali", country: "Indonesia", emoji: "🌴" },
  { name: "Bangkok", country: "Thailand", emoji: "🛕" },
  { name: "Rome", country: "Italy", emoji: "🏛️" },
  { name: "Mumbai", country: "India", emoji: "🌊" },
  { name: "Singapore", country: "Singapore", emoji: "🦁" },
];

const WMO_CODES: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Icy fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow",
  80: "Rain showers", 81: "Showers", 82: "Heavy showers", 95: "Thunderstorm", 99: "Heavy thunderstorm",
};

export default function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nearby, setNearby] = useState<Place[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [recentCities, setRecentCities] = useState<string[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [weatherCity, setWeatherCity] = useState<string>("");
  const [weatherLoading, setWeatherLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load recent cities from localStorage
    const stored = localStorage.getItem("wander_recent_cities");
    if (stored) {
      try { setRecentCities(JSON.parse(stored)); } catch {}
    }

    api.get("/places", { params: { type: "ATTRACTION" } })
      .then((res) => setNearby(res.data.places.slice(0, 4)))
      .catch(() => setNearby([]));

    api.get("/favorites")
      .then((res) => setFavorites(res.data.favorites.map((f: any) => f.placeId)))
      .catch(() => setFavorites([]));
  }, []);

  // Autocomplete suggestions against DB cities
  useEffect(() => {
    if (q.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      api.get("/cities", { params: { q } })
        .then((res) => setSuggestions(res.data.cities.map((c: any) => c.name)))
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  // Close suggestions on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function fetchWeatherForCity(cityName: string) {
    setWeatherLoading(true);
    try {
      const res = await api.get("/cities", { params: { q: cityName } });
      if (res.data.count > 0) {
        const city = res.data.cities.find((c: any) => c.name.toLowerCase() === cityName.toLowerCase()) ?? res.data.cities[0];
        if (city.latitude && city.longitude) {
          const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current_weather=true&timezone=auto`);
          const wData = await wRes.json();
          if (wData.current_weather) {
            setWeather(wData.current_weather);
            setWeatherCity(city.name);
          }
        }
      }
    } catch {}
    setWeatherLoading(false);
  }

  function addRecentCity(cityName: string) {
    setRecentCities((prev) => {
      const updated = [cityName, ...prev.filter((c) => c !== cityName)].slice(0, 5);
      localStorage.setItem("wander_recent_cities", JSON.stringify(updated));
      return updated;
    });
  }

  async function handleSearch(cityName?: string) {
    const searchTerm = cityName ?? q.trim();
    if (!searchTerm) return;
    addRecentCity(searchTerm);
    setShowSuggestions(false);
    try {
      const res = await api.get("/cities", { params: { q: searchTerm } });
      if (res.data.count > 0) {
        const found = res.data.cities.find((c: any) => c.name.toLowerCase() === searchTerm.toLowerCase()) ?? res.data.cities[0];
        navigate(`/explore?city=${encodeURIComponent(found.name)}`);
        return;
      }
    } catch {}
    navigate(`/explore?q=${encodeURIComponent(searchTerm)}`);
  }

  async function toggleFavorite(placeId: string) {
    if (favorites.includes(placeId)) {
      await api.delete(`/favorites/${placeId}`);
      setFavorites((f) => f.filter((id) => id !== placeId));
    } else {
      await api.post("/favorites", { placeId });
      setFavorites((f) => [...f, placeId]);
    }
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="pb-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-soft/30 via-cloud to-green-soft/20 dark:from-navy/20 dark:via-[#122029] dark:to-green/5 rounded-3xl p-6 sm:p-8 md:p-12 mb-8 border border-line dark:border-[#22333A] transition-colors relative overflow-hidden">
        {/* Decorative globe icon */}
        <div className="absolute -right-12 -top-12 opacity-5 dark:opacity-10">
          <Globe size={280} strokeWidth={0.5} />
        </div>
        <div className="max-w-2xl relative">
          <div className="text-sm font-medium text-muted mb-2 flex items-center gap-1.5">
            <Globe size={14} className="text-green" />
            {greeting()}, {user?.name?.split(" ")[0] ?? "traveler"} 👋
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-ink dark:text-[#EAF3EF] leading-tight mb-2">
            Where to next?
          </h1>
          <p className="text-sm sm:text-base text-muted mb-6">
            Search any city worldwide — Wander generates real places, itineraries, and budgets instantly.
          </p>

          {/* Search */}
          <div ref={searchRef} className="relative max-w-lg">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
              <div className="card w-full rounded-2xl px-4 py-3 flex items-center gap-2 text-left shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-[#122029]">
                <Search size={16} className="text-green shrink-0" />
                <input
                  id="city-search"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search a city — Paris, Tokyo, New York…"
                  className="bg-transparent outline-none w-full text-sm text-ink dark:text-[#EAF3EF]"
                  autoComplete="off"
                />
                {q && (
                  <button type="button" onClick={() => { setQ(""); setSuggestions([]); }}>
                    <X size={14} className="text-muted" />
                  </button>
                )}
                <button type="submit" className="text-sm text-green font-semibold px-2 py-1 shrink-0">
                  Explore
                </button>
              </div>
            </form>

            {/* Autocomplete dropdown */}
            {showSuggestions && (suggestions.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#122029] rounded-2xl border border-line dark:border-[#22333A] shadow-lg z-50 overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setQ(s); handleSearch(s); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-cloud dark:hover:bg-[#1C2C35] transition-colors text-ink dark:text-[#EAF3EF]"
                  >
                    <MapPin size={13} className="text-green shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent searches */}
          {recentCities.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted">Recent:</span>
              {recentCities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleSearch(city)}
                  className="chip text-xs py-1 px-3"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Popular Destinations */}
      <div className="mb-8">
        <div className="flex items-center justify-between border-b border-line dark:border-[#22333A] pb-3 mb-4">
          <h2 className="font-display font-bold text-lg text-ink dark:text-[#EAF3EF]">
            Popular Destinations
          </h2>
          <TrendingUp size={16} className="text-muted" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {POPULAR_DESTINATIONS.map((dest) => (
            <button
              key={dest.name}
              onClick={() => handleSearch(dest.name)}
              className="card rounded-2xl p-3 flex flex-col items-center gap-2 hover:shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="text-2xl">{dest.emoji}</div>
              <div className="text-center">
                <div className="text-sm font-semibold text-ink dark:text-[#EAF3EF]">{dest.name}</div>
                <div className="text-xs text-muted">{dest.country}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Nearby attractions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-line dark:border-[#22333A] pb-3">
            <h2 className="font-display font-bold text-lg text-ink dark:text-[#EAF3EF]">Explore Places</h2>
            <button onClick={() => navigate("/explore")} className="text-xs text-green font-semibold flex items-center gap-1">
              See all <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nearby.map((a) => (
              <div key={a.id} className="card rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all duration-200 group">
                <div>
                  <div className="rounded-xl mb-3 flex items-center justify-center h-28 bg-green-soft/40 dark:bg-green/10 text-green group-hover:bg-green-soft/60 transition-colors">
                    <Landmark size={30} />
                  </div>
                  <div className="text-base font-bold leading-tight text-ink dark:text-[#EAF3EF]">{a.name}</div>
                  <div className="text-xs mt-1.5 flex items-center gap-1.5 text-muted">
                    <Clock size={12} /> {a.visitDuration ?? "—"} · {a.crowdLevel ?? "Unknown"} crowd
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(a.id)}
                  className="mt-4 flex items-center gap-1.5 text-xs font-semibold self-start transition-colors"
                  style={{ color: favorites.includes(a.id) ? "#FF8A3D" : "#6B7C79" }}
                >
                  <Heart size={14} fill={favorites.includes(a.id) ? "#FF8A3D" : "none"} /> Save
                </button>
              </div>
            ))}
            {nearby.length === 0 && (
              <div className="col-span-2 card rounded-2xl p-8 text-center">
                <Globe size={32} className="text-muted mx-auto mb-3" />
                <div className="text-sm text-muted mb-3">Search a city above to discover attractions and restaurants</div>
                <button onClick={() => handleSearch("Paris")} className="btn-primary text-xs px-4 py-2">
                  Try Paris →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Weather + Quick Actions */}
        <div className="space-y-6">
          {/* Weather widget */}
          <div className="rounded-3xl p-5 text-white relative overflow-hidden bg-gradient-to-br from-blue to-navy shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs opacity-80 flex items-center gap-1">
                  <MapPin size={11} />
                  {weatherCity ? weatherCity : "Live Weather"}
                </div>
                {weather ? (
                  <>
                    <div className="font-display text-3xl font-semibold mt-1">{Math.round(weather.temperature)}°C</div>
                    <div className="text-xs opacity-85 mt-1">
                      {WMO_CODES[weather.weathercode] ?? "Unknown"} · Wind {weather.windspeed} km/h
                    </div>
                  </>
                ) : (
                  <div className="text-sm opacity-75 mt-2">
                    {weatherLoading ? "Fetching weather…" : "Search a city to see live weather"}
                  </div>
                )}
              </div>
              <Cloud size={34} strokeWidth={1.5} className={weatherLoading ? "animate-pulse" : ""} />
            </div>

            {/* Quick weather city buttons */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-[10px] opacity-70 mb-2">Quick weather check</div>
              <div className="flex gap-1.5 flex-wrap">
                {["London", "Tokyo", "New York", "Dubai"].map((city) => (
                  <button
                    key={city}
                    onClick={() => fetchWeatherForCity(city)}
                    className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[10px] opacity-50 mt-2">Powered by Open-Meteo (free, real-time)</div>
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-sm mb-4 text-ink dark:text-[#EAF3EF]">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Sparkles, label: "Plan Trip", to: "/planner", color: "text-green bg-green-soft/30 dark:bg-green/10" },
                { icon: UtensilsCrossed, label: "Eat", to: "/explore", color: "text-orange bg-orange/10" },
                { icon: Wallet, label: "Budget", to: "/budget", color: "text-blue bg-blue-soft/50 dark:bg-blue/10" },
              ].map((qa, i) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={i}
                    onClick={() => navigate(qa.to)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-line dark:border-[#22333A] hover:bg-cloud dark:hover:bg-[#1C2C35] transition-all hover:scale-105 active:scale-95"
                  >
                    <div className={`rounded-xl p-2.5 ${qa.color}`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-xs font-semibold text-ink dark:text-[#EAF3EF]">{qa.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setSafetyOpen(true)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-line dark:border-[#22333A] hover:bg-cloud dark:hover:bg-[#1C2C35] transition-all hover:scale-105 active:scale-95"
              >
                <div className="rounded-xl p-2.5 text-red-500 bg-red-500/10">
                  <Shield size={18} />
                </div>
                <span className="text-xs font-semibold text-ink dark:text-[#EAF3EF]">Safety</span>
              </button>
            </div>
          </div>

          {/* Plan CTA */}
          <div className="card p-5 bg-gradient-to-br from-green/5 to-green-soft/30 dark:from-green/10 dark:to-navy/30 border-green/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-green" />
              <span className="text-sm font-bold text-ink dark:text-[#EAF3EF]">AI Trip Planner</span>
            </div>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              Type any city — Wander builds a full day-by-day itinerary with budgeting in seconds.
            </p>
            <button onClick={() => navigate("/planner")} className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5">
              Start Planning <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Safety Modal */}
      {safetyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setSafetyOpen(false)}>
          <div className="card w-full max-w-md rounded-3xl p-6 shadow-xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="font-display text-xl font-bold mb-3 flex items-center gap-2 text-ink dark:text-[#EAF3EF]">
              <Shield size={20} className="text-red-500" /> Safety controls
            </div>
            <p className="text-sm text-muted mb-5 leading-relaxed">Quick access to emergency sharing features.</p>
            <button className="w-full rounded-2xl py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm mb-4">
              Send SOS to emergency contacts
            </button>
            <div className="text-xs text-muted leading-relaxed">
              Connect to an emergency-contacts API and geolocation-sharing endpoint to activate.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
