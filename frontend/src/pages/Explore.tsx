import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { PlaceCard } from "../components/PlaceCard";
import { api } from "../api/client";
import { Place } from "../types";
import { Cloud, Sunrise, Sunset, Wind, MapPin, Sparkles } from "lucide-react";

const CATEGORIES = ["All", "Street food", "South Indian", "Cafe", "Asian", "Fine dining", "Irani cafe"];
const BUDGETS = [100, 250, 500, 1000, 2000];

export default function Explore() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [attractions, setAttractions] = useState<Place[]>([]);
  const [category, setCategory] = useState("All");
  const [budget, setBudget] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState<string>(searchParams.get("q") ?? "");
  const [city, setCity] = useState<string | null>(searchParams.get("city") ?? null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityData, setCityData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);

  // Sync city parameter from URL to city state
  useEffect(() => {
    const urlCity = searchParams.get("city");
    if (urlCity && urlCity !== city) {
      setCity(urlCity);
    }
  }, [searchParams]);

  // Fetch city metadata & live weather
  useEffect(() => {
    if (city) {
      api.get("/cities", { params: { q: city } })
        .then((res) => {
          if (res.data.count > 0) {
            const found = res.data.cities.find((c: any) => c.name.toLowerCase() === city.toLowerCase()) ?? res.data.cities[0];
            setCityData(found);
            
            // Fetch weather from open-meteo
            if (found.latitude !== undefined && found.longitude !== undefined) {
              fetch(`https://api.open-meteo.com/v1/forecast?latitude=${found.latitude}&longitude=${found.longitude}&current_weather=true`)
                .then(r => r.json())
                .then(data => {
                  if (data.current_weather) {
                    setWeatherData(data.current_weather);
                  }
                })
                .catch(err => console.error("Weather fetch error", err));
            }
          }
        })
        .catch(err => console.error("City fetch error", err));
    } else {
      setCityData(null);
      setWeatherData(null);
    }
  }, [city]);

  // Fetch places
  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { type: "RESTAURANT" };
    if (city) params.city = city;
    if (category !== "All") params.category = category;
    if (budget) params.maxPrice = budget;
    if (q) params.q = q;

    const attrParams: Record<string, string | number> = { type: "ATTRACTION" };
    if (city) attrParams.city = city;
    if (q) attrParams.q = q;

    Promise.all([
      api.get("/places", { params }),
      api.get("/places", { params: attrParams }),
      api.get("/favorites").catch(() => ({ data: { favorites: [] } })),
    ])
      .then(([foodRes, attrRes, favRes]) => {
        setPlaces(foodRes.data.places);
        setAttractions(attrRes.data.places);
        setFavorites(favRes.data.favorites.map((f: any) => f.placeId));
      })
      .finally(() => setLoading(false));
  }, [category, budget, q, city]);

  useEffect(() => {
    // keep URL in sync with q and city state
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

  return (
    <div className="pb-8">
      {/* Page Header */}
      <TopBar title={`Explore ${city ?? "Pune"}`} sub={`${places.length + attractions.length} recommendations nearby`} />

      {/* Map, Weather & Travel Info Dashboard */}
      {cityData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4 animate-fadeIn">
          {/* Map Embed Card */}
          <div className="md:col-span-2 card p-0 overflow-hidden relative h-72 rounded-3xl border border-line dark:border-[#22333A] bg-white dark:bg-[#122029]">
            <iframe
              title="City Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(cityData.name + ", " + cityData.country)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              allowFullScreen
            />
          </div>

          {/* Live Weather & Info Card */}
          <div className="card p-6 rounded-3xl flex flex-col justify-between bg-gradient-to-br from-blue to-navy text-white shadow-sm relative overflow-hidden">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display font-bold text-xl">{cityData.name}</h3>
                  <p className="text-xs opacity-75">{cityData.country}</p>
                </div>
                {weatherData && (
                  <div className="text-right flex items-center gap-2">
                    <Cloud className="text-cloud" size={24} />
                    <div>
                      <div className="text-2xl font-display font-semibold">{Math.round(weatherData.temperature)}°C</div>
                      <div className="text-[10px] opacity-75 mt-0.5">Wind: {weatherData.windspeed} km/h</div>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs opacity-90 mt-4 leading-relaxed line-clamp-4">
                {cityData.description || `Explore local street food, historic monuments, and beautiful landmarks in ${cityData.name}.`}
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-[11px] opacity-85">
                <MapPin size={12} />
                <span>Lat/Lng: {cityData.latitude.toFixed(3)}°, {cityData.longitude.toFixed(3)}°</span>
              </div>
              <button
                onClick={() => navigate(`/planner?city=${encodeURIComponent(cityData.name)}`)}
                className="w-full flex items-center justify-center gap-2 bg-green text-ink hover:bg-green-soft font-semibold text-xs py-2.5 rounded-xl transition-all shadow-sm"
              >
                <Sparkles size={14} />
                Generate AI Itinerary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel Card */}
      <div className="card p-5 mb-8 space-y-4 transition-colors">
        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ pathname: "/explore", search: q ? `?q=${encodeURIComponent(q)}` : "" });
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search restaurants, cafes, attractions (e.g. 'Shaniwar', 'Vaishali')"
            className="card w-full rounded-2xl px-4 py-3 text-sm bg-white dark:bg-[#122029]"
          />
        </form>

        {/* Categories */}
        <div className="space-y-1.5">
          <div className="text-xs text-muted font-semibold">Categories</div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                data-active={category === c}
                className="chip"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Budgets */}
        <div className="space-y-1.5">
          <div className="text-xs text-muted font-semibold">Max Price Preference</div>
          <div className="flex gap-2 flex-wrap">
            {BUDGETS.map((b) => (
              <button
                key={b}
                onClick={() => setBudget(budget === b ? null : b)}
                data-active={budget === b}
                className="chip font-mono"
              >
                {b === 2000 ? "₹2000+" : `₹${b}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="py-12 text-sm text-muted text-center card rounded-2xl">
          Loading recommended places…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Restaurants list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line dark:border-[#22333A] pb-3 mb-2">
              <h2 className="font-display font-bold text-lg text-ink dark:text-[#EAF3EF]">Food & Dining</h2>
              <span className="text-xs text-muted font-mono bg-cloud dark:bg-[#122029] border border-line dark:border-[#22333A] px-2.5 py-1 rounded-full">{places.length} found</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {places.map((p) => (
                <PlaceCard key={p.id} place={p} isFavorite={favorites.includes(p.id)} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
            {places.length === 0 && (
              <div className="text-sm text-muted py-6">No restaurants match those filters yet.</div>
            )}
          </div>

          {/* Attractions list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line dark:border-[#22333A] pb-3 mb-2">
              <h2 className="font-display font-bold text-lg text-ink dark:text-[#EAF3EF]">Sights & Attractions</h2>
              <span className="text-xs text-muted font-mono bg-cloud dark:bg-[#122029] border border-line dark:border-[#22333A] px-2.5 py-1 rounded-full">{attractions.length} found</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {attractions.map((a) => (
                <PlaceCard key={a.id} place={a} isFavorite={favorites.includes(a.id)} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
            {attractions.length === 0 && (
              <div className="text-sm text-muted py-6">No attractions found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

