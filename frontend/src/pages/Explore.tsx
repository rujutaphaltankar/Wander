import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { PlaceCard } from "../components/PlaceCard";
import { MapView, MapPlaceItem } from "../components/MapView";
import { api } from "../api/client";
import { Place } from "../types";
import {
  Cloud, Wind, MapPin, Sparkles, UtensilsCrossed, Landmark, Star,
  Loader2, LayoutGrid, Map as MapIcon, Filter, X
} from "lucide-react";

const ALL_CATEGORIES = [
  "All",
  // Food
  "Street food", "Café", "Fine dining", "Local cuisine", "Seafood", "Asian", "Mediterranean", "Fast food",
  // Attractions
  "Historical", "Museum", "Nature", "Beach", "Viewpoint", "Religious", "Architecture",
  // Activities
  "Tours", "Nightlife", "Adventure", "Shopping", "Cultural experience", "Sports", "Entertainment",
];

const BUDGETS = [200, 500, 1000, 2500, 5000];

type TabType = "food" | "sights" | "activities";
type ViewMode = "grid" | "map";

const WMO_CODES: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  80: "Showers", 81: "Rain showers", 82: "Heavy showers",
  95: "Thunderstorm", 99: "Heavy thunderstorm",
};

export default function Explore() {
  const [activeTab, setActiveTab] = useState<TabType>("food");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [foodPlaces, setFoodPlaces] = useState<Place[]>([]);
  const [attractionPlaces, setAttractionPlaces] = useState<Place[]>([]);
  const [activityPlaces, setActivityPlaces] = useState<Place[]>([]);
  const [category, setCategory] = useState("All");
  const [budget, setBudget] = useState<number | null>(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState<string>(searchParams.get("q") ?? "");
  const [city, setCity] = useState<string | null>(searchParams.get("city") ?? null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityData, setCityData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [selectedMapPlace, setSelectedMapPlace] = useState<Place | null>(null);

  useEffect(() => {
    const urlCity = searchParams.get("city");
    if (urlCity && urlCity !== city) setCity(urlCity);
  }, [searchParams]);

  // Fetch city metadata & weather
  useEffect(() => {
    if (city) {
      api.get("/cities", { params: { q: city } })
        .then((res) => {
          if (res.data.count > 0) {
            const found = res.data.cities.find((c: any) => c.name.toLowerCase() === city.toLowerCase()) ?? res.data.cities[0];
            setCityData(found);
            if (found.latitude && found.longitude) {
              fetch(`https://api.open-meteo.com/v1/forecast?latitude=${found.latitude}&longitude=${found.longitude}&current_weather=true&timezone=auto`)
                .then((r) => r.json())
                .then((data) => { if (data.current_weather) setWeatherData(data.current_weather); })
                .catch(() => {});
            }
          }
        })
        .catch(() => {});
    } else {
      setCityData(null);
      setWeatherData(null);
    }
  }, [city]);

  // Fetch all place types in parallel
  useEffect(() => {
    setLoading(true);
    const base: Record<string, string | number> = {};
    if (city) base.city = city;
    if (category !== "All") base.category = category;
    if (budget) base.maxPrice = budget;
    if (q) base.q = q;
    if (vegOnly) base.veg = "true";

    Promise.all([
      api.get("/places", { params: { ...base, type: "RESTAURANT" } }),
      api.get("/places", { params: { ...base, type: "ATTRACTION" } }),
      api.get("/places", { params: { ...base, type: "ACTIVITY" } }),
      api.get("/favorites").catch(() => ({ data: { favorites: [] } })),
    ])
      .then(([foodRes, attrRes, actRes, favRes]) => {
        setFoodPlaces(foodRes.data.places);
        setAttractionPlaces(attrRes.data.places);
        setActivityPlaces(actRes.data.places);
        setFavorites(favRes.data.favorites.map((f: any) => f.placeId));
      })
      .finally(() => setLoading(false));
  }, [category, budget, q, city, vegOnly]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (city) params.city = city;
    setSearchParams(params);
  }, [q, city, setSearchParams]);

  async function toggleFavorite(placeId: string) {
    if (favorites.includes(placeId)) {
      await api.delete(`/favorites/${placeId}`);
      setFavorites((f) => f.filter((id) => id !== placeId));
    } else {
      await api.post("/favorites", { placeId });
      setFavorites((f) => [...f, placeId]);
    }
  }

  const currentPlaces =
    activeTab === "food" ? foodPlaces :
    activeTab === "sights" ? attractionPlaces :
    activityPlaces;

  const tabConfig: { key: TabType; label: string; icon: any; count: number }[] = [
    { key: "food", label: "Food & Dining", icon: UtensilsCrossed, count: foodPlaces.length },
    { key: "sights", label: "Sights & Attractions", icon: Landmark, count: attractionPlaces.length },
    { key: "activities", label: "Activities", icon: Star, count: activityPlaces.length },
  ];

  const totalCount = foodPlaces.length + attractionPlaces.length + activityPlaces.length;

  const mapPlaces: MapPlaceItem[] = currentPlaces
    .filter((p) => typeof p.latitude === "number" && typeof p.longitude === "number")
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      category: p.category,
      description: p.description ?? undefined,
      latitude: p.latitude!,
      longitude: p.longitude!,
      costInr: p.avgCostInr || p.entryFeeInr || undefined,
      rating: p.rating,
      visitDuration: p.visitDuration ?? undefined,
    }));

  return (
    <div className="pb-8">
      <TopBar
        title={city ? `Explore ${city}` : "Explore Worldwide"}
        sub={loading ? "Loading places…" : `${totalCount} place${totalCount !== 1 ? "s" : ""} found`}
      />

      {/* City Dashboard */}
      {cityData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 mt-2 animate-fadeIn">
          {/* Interactive Map View */}
          <div className="md:col-span-2 relative h-64">
            <MapView
              places={mapPlaces}
              center={[cityData.latitude, cityData.longitude]}
              zoom={13}
              heightClass="h-64"
            />
          </div>

          {/* Weather + City Info */}
          <div className="card p-5 rounded-3xl flex flex-col justify-between bg-gradient-to-br from-blue to-navy text-white shadow-sm">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display font-bold text-xl">{cityData.name}</h3>
                  <p className="text-xs opacity-75">{cityData.country}</p>
                </div>
                {weatherData && (
                  <div className="text-right">
                    <div className="text-2xl font-display font-semibold">{Math.round(weatherData.temperature)}°C</div>
                    <div className="text-[10px] opacity-75">{WMO_CODES[weatherData.weathercode] ?? ""}</div>
                  </div>
                )}
              </div>
              <p className="text-xs opacity-85 mt-3 leading-relaxed line-clamp-3">
                {cityData.description || `Discover amazing food, sights, and activities in ${cityData.name}.`}
              </p>
              {weatherData && (
                <div className="flex items-center gap-3 mt-3 text-[11px] opacity-80">
                  <div className="flex items-center gap-1"><Wind size={11} /> {weatherData.windspeed} km/h</div>
                  <div className="flex items-center gap-1"><MapPin size={11} /> {cityData.latitude?.toFixed(2)}°, {cityData.longitude?.toFixed(2)}°</div>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(`/planner?city=${encodeURIComponent(cityData.name)}`)}
              className="w-full flex items-center justify-center gap-2 bg-green text-ink hover:bg-green-soft font-semibold text-xs py-2.5 rounded-xl transition-all shadow-sm mt-4"
            >
              <Sparkles size={14} /> Generate AI Itinerary
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-5 mb-6 space-y-4 transition-colors">
        {/* Search + city */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={city ?? ""}
            onChange={(e) => setCity(e.target.value || null)}
            placeholder="City (e.g. Paris, Tokyo, Mumbai)"
            className="card w-full rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-[#122029]"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search place name…"
            className="card w-full rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-[#122029]"
          />
        </div>

        {/* Category chips */}
        <div className="space-y-1.5">
          <div className="text-xs text-muted font-semibold">Category</div>
          <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto">
            {ALL_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                data-active={category === c}
                className="chip text-xs"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Budget + Veg */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <div className="text-xs text-muted font-semibold">Max Cost Per Person</div>
            <div className="flex gap-2 flex-wrap">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBudget(budget === b ? null : b)}
                  data-active={budget === b}
                  className="chip font-mono text-xs"
                >
                  ₹{b.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setVegOnly(!vegOnly)}
              data-active={vegOnly}
              className="chip text-xs"
            >
              🥦 Veg only
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-1 gap-1 bg-cloud dark:bg-[#122029] p-1 rounded-2xl border border-line dark:border-[#22333A]">
          {tabConfig.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-white dark:bg-[#0B171E] text-green shadow-sm"
                  : "text-muted hover:text-ink dark:hover:text-[#EAF3EF]"
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
              <span className="text-xs font-mono bg-line dark:bg-[#22333A] px-1.5 py-0.5 rounded-full">{count}</span>
            </button>
          ))}
        </div>

        {/* Grid vs Map Toggle */}
        <div className="flex bg-cloud dark:bg-[#122029] p-1 rounded-2xl border border-line dark:border-[#22333A] self-end sm:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              viewMode === "grid"
                ? "bg-white dark:bg-[#0B171E] text-green shadow-sm"
                : "text-muted hover:text-ink dark:hover:text-[#EAF3EF]"
            }`}
          >
            <LayoutGrid size={14} />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              viewMode === "map"
                ? "bg-white dark:bg-[#0B171E] text-green shadow-sm"
                : "text-muted hover:text-ink dark:hover:text-[#EAF3EF]"
            }`}
          >
            <MapIcon size={14} />
            <span>Interactive Map</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 size={28} className="animate-spin text-green mx-auto mb-3" />
          <div className="text-sm text-muted">
            {city ? `Loading places in ${city}…` : "Loading places…"}
          </div>
          {city && (
            <div className="text-xs text-muted mt-1 opacity-70">
              First visit to a new city generates AI-powered places — may take 10-15s
            </div>
          )}
        </div>
      ) : viewMode === "map" ? (
        <div className="space-y-4">
          <MapView
            places={mapPlaces}
            center={cityData ? [cityData.latitude, cityData.longitude] : undefined}
            zoom={12}
            heightClass="h-[520px]"
            onSelectPlace={(item) => {
              const matched = currentPlaces.find((p) => p.id === item.id);
              if (matched) setSelectedMapPlace(matched);
            }}
          />

          {selectedMapPlace && (
            <div className="p-3 bg-white dark:bg-[#0E1A22] rounded-2xl border border-line dark:border-[#22333A] shadow-lg max-w-md mx-auto">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-green">Selected Map Pin</span>
                <button onClick={() => setSelectedMapPlace(null)} className="text-muted hover:text-ink">
                  <X size={14} />
                </button>
              </div>
              <PlaceCard
                place={selectedMapPlace}
                isFavorite={favorites.includes(selectedMapPlace.id)}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          )}
        </div>
      ) : (
        <>
          {currentPlaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPlaces.map((p) => (
                <PlaceCard
                  key={p.id}
                  place={p}
                  isFavorite={favorites.includes(p.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="card rounded-3xl p-10 text-center">
              {activeTab === "food" && <UtensilsCrossed size={32} className="text-muted mx-auto mb-3" />}
              {activeTab === "sights" && <Landmark size={32} className="text-muted mx-auto mb-3" />}
              {activeTab === "activities" && <Star size={32} className="text-muted mx-auto mb-3" />}
              <div className="text-sm font-semibold text-ink dark:text-[#EAF3EF] mb-1">No places found</div>
              <div className="text-xs text-muted mb-4">
                {city
                  ? `Try removing filters, or this city may still be generating.`
                  : "Enter a city name above to discover places worldwide."}
              </div>
              {city && (
                <button
                  onClick={() => { setCategory("All"); setBudget(null); setVegOnly(false); setQ(""); }}
                  className="chip text-xs mx-auto"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
