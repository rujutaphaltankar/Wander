import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, AlertTriangle, Plus, Minus, Footprints, Bike, Bus, Car, ArrowRight } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { RouteTimeline } from "../components/RouteTimeline";
import { api } from "../api/client";
import { Trip } from "../types";

const INTERESTS = ["Food", "History", "Nature", "Nightlife", "Shopping", "Photography", "Adventure", "Art & culture"];
const MODES = [
  { key: "WALK", label: "Walk", icon: Footprints },
  { key: "BIKE", label: "Bike", icon: Bike },
  { key: "TRANSIT", label: "Transit", icon: Bus },
  { key: "CAR", label: "Car", icon: Car },
];

export default function Planner() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    cityName: "Pune",
    days: 2,
    people: 2,
    budgetInr: 8000,
    hotelName: "Koregaon Park",
    travelMode: "WALK",
    foodPref: "Vegetarian",
  });
  const [interests, setInterests] = useState<string[]>(["Food", "History"]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  const toggleInterest = (i: string) =>
    setInterests((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  async function generate() {
    setStatus("loading");
    setErrMsg("");
    try {
      const { data } = await api.post("/itineraries", { ...form, interests });
      setTrip(data.trip);
      setActiveDay(0);
      setStatus("done");
    } catch (err: any) {
      setErrMsg(
        err.response?.data?.message ?? "Couldn't generate that itinerary. Try fewer days and generate again."
      );
      setStatus("error");
    }
  }

  return (
    <div className="pb-8">
      <TopBar title="AI Trip Planner" sub="Tell Wander what you want. It builds the route." />

      {status !== "done" && (
        <div className="card p-6 mt-4 space-y-6 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Basic Details */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-base text-ink dark:text-[#EAF3EF] border-b border-line dark:border-[#22333A] pb-2">
                Trip Details
              </h3>
              
              <label className="text-xs text-muted block">
                Destination city
                <input
                  value={form.cityName}
                  onChange={(e) => setForm({ ...form, cityName: e.target.value })}
                  className="card w-full rounded-xl px-3 py-2.5 mt-1 text-sm bg-white dark:bg-[#122029]"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-muted block">
                  Days
                  <div className="card rounded-xl flex items-center justify-between px-3 py-2 mt-1 bg-white dark:bg-[#122029]">
                    <button onClick={() => setForm((f) => ({ ...f, days: Math.max(1, f.days - 1) }))}>
                      <Minus size={14} />
                    </button>
                    <span className="font-mono text-sm">{form.days}</span>
                    <button onClick={() => setForm((f) => ({ ...f, days: Math.min(10, f.days + 1) }))}>
                      <Plus size={14} />
                    </button>
                  </div>
                </label>
                <label className="text-xs text-muted block">
                  People
                  <div className="card rounded-xl flex items-center justify-between px-3 py-2 mt-1 bg-white dark:bg-[#122029]">
                    <button onClick={() => setForm((f) => ({ ...f, people: Math.max(1, f.people - 1) }))}>
                      <Minus size={14} />
                    </button>
                    <span className="font-mono text-sm">{form.people}</span>
                    <button onClick={() => setForm((f) => ({ ...f, people: f.people + 1 }))}>
                      <Plus size={14} />
                    </button>
                  </div>
                </label>
              </div>

              <label className="text-xs text-muted block">
                Total budget (₹)
                <input
                  type="number"
                  value={form.budgetInr}
                  onChange={(e) => setForm({ ...form, budgetInr: Number(e.target.value) })}
                  className="card w-full rounded-xl px-3 py-2.5 mt-1 text-sm font-mono bg-white dark:bg-[#122029]"
                />
              </label>

              <label className="text-xs text-muted block">
                Hotel / base location
                <input
                  value={form.hotelName}
                  onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
                  className="card w-full rounded-xl px-3 py-2.5 mt-1 text-sm bg-white dark:bg-[#122029]"
                />
              </label>
            </div>

            {/* Right Column: Preferences */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-base text-ink dark:text-[#EAF3EF] border-b border-line dark:border-[#22333A] pb-2">
                Preferences
              </h3>

              <div className="space-y-2">
                <div className="text-xs text-muted font-medium">Preferred travel mode</div>
                <div className="flex gap-2 flex-wrap">
                  {MODES.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.key}
                        onClick={() => setForm({ ...form, travelMode: m.key })}
                        data-active={form.travelMode === m.key}
                        className="chip flex items-center gap-1.5"
                      >
                        <Icon size={13} /> {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted font-medium">Food preference</div>
                <div className="flex gap-2 flex-wrap">
                  {["Vegetarian", "Non-vegetarian", "Vegan", "No preference"].map((fp) => (
                    <button
                      key={fp}
                      onClick={() => setForm({ ...form, foodPref: fp })}
                      data-active={form.foodPref === fp}
                      className="chip"
                    >
                      {fp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted font-medium">Interests</div>
                <div className="flex gap-2 flex-wrap">
                  {INTERESTS.map((i) => (
                    <button key={i} onClick={() => toggleInterest(i)} data-active={interests.includes(i)} className="chip">
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {status === "error" && (
            <div className="rounded-xl px-3 py-2.5 text-xs flex items-start gap-2 bg-red-100 text-red-700">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {errMsg}
            </div>
          )}

          <div className="border-t border-line dark:border-[#22333A] pt-4 flex justify-end">
            <button
              onClick={generate}
              disabled={status === "loading"}
              className="btn-primary flex items-center justify-center gap-2 px-8 min-w-[200px]"
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Building route…
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Generate itinerary
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {status === "done" && trip && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          {/* Left Column: Itinerary Days and Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-line dark:border-[#22333A]">
              {trip.itineraryDays.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setActiveDay(i)}
                  data-active={activeDay === i}
                  className="chip shrink-0 font-mono text-sm px-4 py-2"
                >
                  Day {d.dayNumber}
                </button>
              ))}
            </div>

            <div className="card p-6 mt-3 bg-white dark:bg-[#122029]">
              <RouteTimeline activities={trip.itineraryDays[activeDay].activities} />
            </div>
          </div>

          {/* Right Column: Summary & Controls */}
          <div className="space-y-6">
            <div className="card p-5 space-y-4">
              <h3 className="font-display font-bold text-base text-ink dark:text-[#EAF3EF] border-b border-line dark:border-[#22333A] pb-2">
                Trip Summary
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Destination</span>
                  <span className="font-semibold text-ink dark:text-[#EAF3EF]">{trip.city?.name || trip.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Duration</span>
                  <span className="font-semibold text-ink dark:text-[#EAF3EF]">{trip.itineraryDays.length} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">People</span>
                  <span className="font-semibold text-ink dark:text-[#EAF3EF]">{trip.people} travelers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Hotel / Base</span>
                  <span className="font-semibold text-ink dark:text-[#EAF3EF]">{trip.hotelName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Budget limit</span>
                  <span className="font-semibold font-mono text-green">₹{trip.budgetInr}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-line dark:border-[#22333A]">
                <button
                  onClick={() => navigate("/budget")}
                  className="btn-primary w-full flex items-center justify-center gap-1.5 py-3"
                >
                  View budget tracker <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setTrip(null);
                  }}
                  className="card w-full rounded-2xl py-3 text-center text-sm font-semibold hover:bg-cloud dark:hover:bg-[#1C2C35] transition-colors"
                >
                  Start over
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
