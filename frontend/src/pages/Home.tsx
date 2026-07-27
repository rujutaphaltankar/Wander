import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Cloud, CloudRain, Sunrise, Sunset, Sparkles, UtensilsCrossed, Wallet, Shield, Heart, Clock, Landmark } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { api } from "../api/client";
import { Place } from "../types";
import { useAuthStore } from "../store/authStore";

export default function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [q, setQ] = useState("");
  const [nearby, setNearby] = useState<Place[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [weather, setWeather] = useState<any>({
    temp: 29,
    condition: "Partly cloudy",
    feelsLike: 32,
    city: "Pune",
    wind: 12
  });

  useEffect(() => {
    api
      .get("/places", { params: { type: "ATTRACTION" } })
      .then((res) => setNearby(res.data.places.slice(0, 4)))
      .catch(() => setNearby([]));

    api
      .get("/favorites")
      .then((res) => setFavorites(res.data.favorites.map((f: any) => f.placeId)))
      .catch(() => setFavorites([]));

    // Fetch live weather for Pune
    fetch("https://api.open-meteo.com/v1/forecast?latitude=18.5204&longitude=73.8567&current_weather=true")
      .then((r) => r.json())
      .then((data) => {
        if (data.current_weather) {
          const w = data.current_weather;
          setWeather({
            temp: Math.round(w.temperature),
            condition: w.weathercode <= 3 ? "Clear/Partly cloudy" : "Rain/Showers",
            feelsLike: Math.round(w.temperature),
            city: "Pune",
            wind: w.windspeed
          });
        }
      })
      .catch(() => {});
  }, []);


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
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-soft/30 via-cloud to-green-soft/20 dark:from-navy/20 dark:via-[#122029] dark:to-green/5 rounded-3xl p-6 sm:p-8 md:p-12 mb-8 border border-line dark:border-[#22333A] transition-colors">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-ink dark:text-[#EAF3EF] leading-tight mb-2">
            Where to, {user?.name?.split(" ")[0] ?? "traveler"}?
          </h1>
          <p className="text-sm sm:text-base text-muted mb-6">
            Good to see you! Search for a city, place, or dish to start planning your perfect trip.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await api.get("/cities", { params: { q } });
                if (res.data.count > 0) {
                  const found = res.data.cities.find((c: any) => c.name.toLowerCase() === q.trim().toLowerCase()) ?? res.data.cities[0];
                  navigate(`/explore?city=${encodeURIComponent(found.name)}`);
                  return;
                }
              } catch (err) {
                // ignore and fallback to place search
              }
              navigate(`/explore?q=${encodeURIComponent(q)}`);
            }}
            className="max-w-lg"
          >
            <div className="card w-full rounded-2xl px-4 py-3 flex items-center gap-2 text-left text-muted shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-[#122029]">
              <Search size={16} className="text-green" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search a city, place, or dish (e.g. Pune, Vaishali)"
                className="bg-transparent outline-none w-full text-sm text-ink dark:text-[#EAF3EF]"
              />
              <button type="submit" className="text-sm text-green font-semibold px-2 py-1">Search</button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left main area: Attractions grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-line dark:border-[#22333A] pb-3">
            <h2 className="font-display font-bold text-lg text-ink dark:text-[#EAF3EF]">Near you right now</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nearby.map((a) => (
              <div key={a.id} className="card rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all duration-200">
                <div>
                  <div className="rounded-xl mb-3 flex items-center justify-center h-28 bg-green-soft text-green">
                    <Landmark size={30} />
                  </div>
                  <div className="text-base font-bold leading-tight text-ink dark:text-[#EAF3EF]">{a.name}</div>
                  <div className="text-xs mt-1.5 flex items-center gap-1.5 text-muted">
                    <Clock size={12} /> {a.visitDuration ?? "—"} · {a.crowdLevel ?? "Unknown"} crowd
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(a.id)}
                  className="mt-4 flex items-center gap-1.5 text-xs font-semibold self-start"
                  style={{ color: favorites.includes(a.id) ? "#FF8A3D" : "#6B7C79" }}
                >
                  <Heart size={14} fill={favorites.includes(a.id) ? "#FF8A3D" : "none"} /> Save
                </button>
              </div>
            ))}
            {nearby.length === 0 && (
              <div className="text-sm text-muted py-6 col-span-2">
                No places yet — run the seed script to load sample data.
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar: Weather and Quick Actions */}
        <div className="space-y-6">
          {/* Weather dashboard widget */}
          <div className="rounded-3xl p-5 text-white relative overflow-hidden bg-gradient-to-br from-blue to-navy shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs opacity-80">{weather.city} · live</div>
                <div className="font-display text-3xl font-semibold mt-1">{weather.temp}°C</div>
                <div className="text-xs opacity-85 mt-1">{weather.condition} · feels like {weather.feelsLike}°</div>
              </div>
              <Cloud size={34} strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs opacity-90">
              <div className="flex items-center gap-1">
                <Sunrise size={13} /> 6:05 AM
              </div>
              <div className="flex items-center gap-1">
                <Sunset size={13} /> 7:18 PM
              </div>
              <div className="flex items-center gap-1">
                <Wind size={13} /> Wind: {weather.wind} km/h
              </div>
            </div>
            <div className="text-[10px] opacity-70 mt-3">
              Powered by Open-Meteo API.
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-sm mb-4 text-ink dark:text-[#EAF3EF]">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Sparkles, label: "Plan trip", to: "/planner", color: "text-green bg-green-soft/30 dark:bg-green/10" },
                { icon: UtensilsCrossed, label: "Eat", to: "/explore", color: "text-orange bg-orange/10" },
                { icon: Wallet, label: "Budget", to: "/budget", color: "text-blue bg-blue-soft/50 dark:bg-blue/10" },
              ].map((qa, i) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={i}
                    onClick={() => navigate(qa.to)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-line dark:border-[#22333A] hover:bg-cloud dark:hover:bg-[#1C2C35] transition-all hover:scale-105"
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
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-line dark:border-[#22333A] hover:bg-cloud dark:hover:bg-[#1C2C35] transition-all hover:scale-105"
              >
                <div className="rounded-xl p-2.5 text-red-500 bg-red-500/10">
                  <Shield size={18} />
                </div>
                <span className="text-xs font-semibold text-ink dark:text-[#EAF3EF]">Safety</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety modal */}
      {safetyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setSafetyOpen(false)}>
          <div className="card w-full max-w-md rounded-3xl p-6 shadow-xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="font-display text-xl font-bold mb-3 flex items-center gap-2 text-ink dark:text-[#EAF3EF]">
              <Shield size={20} className="text-red-500" /> Safety controls
            </div>
            <p className="text-sm text-muted mb-5 leading-relaxed">
              This panel provides quick access to security alerts and sharing features.
            </p>
            <button className="w-full rounded-2xl py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm mb-4">
              Send SOS to emergency contacts
            </button>
            <div className="text-xs text-muted leading-relaxed">
              This panel is a UI stub — connect it to a real emergency-contacts API and a geolocation-sharing
              endpoint before shipping.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
