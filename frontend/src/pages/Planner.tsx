import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, Loader2, AlertTriangle, Plus, Minus,
  Footprints, Bike, Bus, Car, ArrowRight, Globe, DollarSign
} from "lucide-react";
import { TopBar } from "../components/TopBar";
import { RouteTimeline } from "../components/RouteTimeline";
import { api } from "../api/client";
import { Trip } from "../types";

const INTERESTS = [
  "Food", "History", "Nature", "Nightlife", "Shopping", "Photography",
  "Adventure", "Art & Culture", "Beaches", "Wellness & Spa", "Museums",
  "Local Experiences", "Sports", "Architecture", "Wildlife",
];

const MODES = [
  { key: "WALK", label: "Walk", icon: Footprints },
  { key: "BIKE", label: "Bike", icon: Bike },
  { key: "TRANSIT", label: "Transit", icon: Bus },
  { key: "CAR", label: "Car", icon: Car },
];

const CURRENCIES = [
  { code: "INR", symbol: "₹", rate: 1, label: "Indian Rupee (₹)" },
  { code: "USD", symbol: "$", rate: 84, label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", rate: 92, label: "Euro (€)" },
  { code: "GBP", symbol: "£", rate: 108, label: "British Pound (£)" },
  { code: "AED", symbol: "د.إ", rate: 23, label: "UAE Dirham" },
  { code: "JPY", symbol: "¥", rate: 0.55, label: "Japanese Yen (¥)" },
];

export default function Planner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCity = searchParams.get("city") ?? "";

  const [form, setForm] = useState({
    cityName: initialCity,
    days: 2,
    people: 2,
    budgetInr: 15000,
    hotelName: "City Center",
    travelMode: "WALK",
    foodPref: "No preference",
  });

  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [interests, setInterests] = useState<string[]>(["Food", "History"]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  // Budget in selected currency (display only — converts to INR when sending)
  const budgetDisplay = Math.round(form.budgetInr / currency.rate);

  const toggleInterest = (i: string) =>
    setInterests((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  function setBudgetFromDisplay(displayVal: number) {
    setForm((f) => ({ ...f, budgetInr: Math.round(displayVal * currency.rate) }));
  }

  async function generate() {
    if (!form.cityName.trim()) {
      setErrMsg("Please enter a destination city.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrMsg("");
    try {
      const { data } = await api.post("/itineraries", { ...form, interests });
      setTrip(data.trip);
      setActiveDay(0);
      setStatus("done");
    } catch (err: any) {
      setErrMsg(
        err.response?.data?.message ?? "Couldn't generate that itinerary. Try fewer days or check your API key."
      );
      setStatus("error");
    }
  }

  // Compute estimated spend from form (rough: budget / days is daily, show progress)
  const perDayCost = form.days > 0 ? Math.round(form.budgetInr / form.days) : 0;

  return (
    <div className="pb-8">
      <TopBar title="AI Trip Planner" sub="Any city in the world — Wander builds the full route." />

      {status !== "done" && (
        <div className="card p-6 mt-4 space-y-6 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Trip Details */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-base text-ink dark:text-[#EAF3EF] border-b border-line dark:border-[#22333A] pb-2 flex items-center gap-2">
                <Globe size={16} className="text-green" /> Trip Details
              </h3>

              <label className="text-xs text-muted block">
                Destination city (anywhere in the world)
                <input
                  value={form.cityName}
                  onChange={(e) => setForm({ ...form, cityName: e.target.value })}
                  placeholder="e.g. Tokyo, Paris, New York, Bali…"
                  className="card w-full rounded-xl px-3 py-2.5 mt-1 text-sm bg-white dark:bg-[#122029]"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-muted block">
                  Days
                  <div className="card rounded-xl flex items-center justify-between px-3 py-2 mt-1 bg-white dark:bg-[#122029]">
                    <button onClick={() => setForm((f) => ({ ...f, days: Math.max(1, f.days - 1) }))}><Minus size={14} /></button>
                    <span className="font-mono text-sm">{form.days}</span>
                    <button onClick={() => setForm((f) => ({ ...f, days: Math.min(14, f.days + 1) }))}><Plus size={14} /></button>
                  </div>
                </label>
                <label className="text-xs text-muted block">
                  People
                  <div className="card rounded-xl flex items-center justify-between px-3 py-2 mt-1 bg-white dark:bg-[#122029]">
                    <button onClick={() => setForm((f) => ({ ...f, people: Math.max(1, f.people - 1) }))}><Minus size={14} /></button>
                    <span className="font-mono text-sm">{form.people}</span>
                    <button onClick={() => setForm((f) => ({ ...f, people: f.people + 1 }))}><Plus size={14} /></button>
                  </div>
                </label>
              </div>

              {/* Currency selector */}
              <label className="text-xs text-muted block">
                Currency
                <select
                  value={currency.code}
                  onChange={(e) => {
                    const c = CURRENCIES.find((x) => x.code === e.target.value) ?? CURRENCIES[0];
                    setCurrency(c);
                  }}
                  className="card w-full rounded-xl px-3 py-2.5 mt-1 text-sm bg-white dark:bg-[#122029] cursor-pointer"
                >
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </label>

              {/* Budget in selected currency */}
              <label className="text-xs text-muted block">
                Total budget ({currency.symbol})
                <input
                  type="number"
                  value={budgetDisplay}
                  onChange={(e) => setBudgetFromDisplay(Number(e.target.value))}
                  className="card w-full rounded-xl px-3 py-2.5 mt-1 text-sm font-mono bg-white dark:bg-[#122029]"
                />
                <div className="text-xs text-muted mt-1 flex items-center gap-1">
                  <DollarSign size={11} />
                  ≈ ₹{form.budgetInr.toLocaleString()} · ₹{perDayCost.toLocaleString()}/day · ₹{Math.round(form.budgetInr / form.people).toLocaleString()}/person
                </div>
              </label>

              <label className="text-xs text-muted block">
                Hotel / base location
                <input
                  value={form.hotelName}
                  onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
                  placeholder="Hotel name or area (e.g. City Center, Downtown)"
                  className="card w-full rounded-xl px-3 py-2.5 mt-1 text-sm bg-white dark:bg-[#122029]"
                />
              </label>
            </div>

            {/* Right: Preferences */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-base text-ink dark:text-[#EAF3EF] border-b border-line dark:border-[#22333A] pb-2">
                Preferences
              </h3>

              <div className="space-y-2">
                <div className="text-xs text-muted font-medium">Travel mode</div>
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
                <div className="text-xs text-muted font-medium">Interests (select all that apply)</div>
                <div className="flex gap-2 flex-wrap max-h-36 overflow-y-auto">
                  {INTERESTS.map((i) => (
                    <button key={i} onClick={() => toggleInterest(i)} data-active={interests.includes(i)} className="chip text-xs">
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {status === "error" && (
            <div className="rounded-xl px-3 py-2.5 text-xs flex items-start gap-2 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {errMsg}
            </div>
          )}

          <div className="border-t border-line dark:border-[#22333A] pt-4 flex justify-end">
            <button
              onClick={generate}
              disabled={status === "loading"}
              className="btn-primary flex items-center justify-center gap-2 px-8 min-w-[220px]"
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating itinerary…
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Generate Itinerary
                </>
              )}
            </button>
          </div>

          {status === "loading" && (
            <div className="text-xs text-muted text-center pb-2">
              AI is building your itinerary for {form.cityName || "your destination"} — this takes 10–20 seconds.
            </div>
          )}
        </div>
      )}

      {status === "done" && trip && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          {/* Day tabs + Timeline */}
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

            {/* Cost for this day */}
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="font-semibold text-ink dark:text-[#EAF3EF]">Day {trip.itineraryDays[activeDay]?.dayNumber} cost:</span>
              <span className="font-mono text-green">
                ₹{trip.itineraryDays[activeDay]?.activities.reduce((s: number, a: any) => s + (a.costInr ?? 0), 0).toLocaleString()}
              </span>
            </div>

            <div className="card p-6 bg-white dark:bg-[#122029]">
              <RouteTimeline activities={trip.itineraryDays[activeDay].activities} />
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <div className="card p-5 space-y-4">
              <h3 className="font-display font-bold text-base text-ink dark:text-[#EAF3EF] border-b border-line dark:border-[#22333A] pb-2">
                Trip Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Destination</span>
                  <span className="font-semibold text-ink dark:text-[#EAF3EF]">{trip.city?.name || form.cityName}</span>
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
                  <span className="font-semibold font-mono text-green">₹{trip.budgetInr.toLocaleString()}</span>
                </div>
                {/* Total itinerary cost */}
                {(() => {
                  const totalCost = trip.itineraryDays.reduce(
                    (s: number, d: any) => s + d.activities.reduce((ds: number, a: any) => ds + (a.costInr ?? 0), 0), 0
                  );
                  const diff = trip.budgetInr - totalCost;
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted">Estimated total</span>
                        <span className="font-semibold font-mono text-ink dark:text-[#EAF3EF]">₹{totalCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">{diff >= 0 ? "Under budget" : "Over budget"}</span>
                        <span className={`font-semibold font-mono ${diff >= 0 ? "text-green" : "text-red-500"}`}>
                          {diff >= 0 ? "+" : ""}₹{diff.toLocaleString()}
                        </span>
                      </div>
                      {/* Budget progress bar */}
                      <div className="space-y-1 pt-1">
                        <div className="h-2 rounded-full bg-line dark:bg-[#22333A] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (totalCost / Math.max(1, trip.budgetInr)) * 100)}%`,
                              background: diff >= 0 ? "#1E9E6B" : "#D6455D",
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-muted text-right">
                          {Math.round((totalCost / Math.max(1, trip.budgetInr)) * 100)}% of budget used
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-line dark:border-[#22333A]">
                <button
                  onClick={() => navigate("/budget")}
                  className="btn-primary w-full flex items-center justify-center gap-1.5 py-3"
                >
                  View Budget Tracker <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  className="card w-full rounded-2xl py-3 text-center text-sm font-semibold hover:bg-cloud dark:hover:bg-[#1C2C35] transition-colors"
                >
                  Full Trip Detail
                </button>
                <button
                  onClick={() => { setStatus("idle"); setTrip(null); }}
                  className="text-xs text-muted text-center py-1 hover:text-ink dark:hover:text-[#EAF3EF] transition-colors"
                >
                  ← Start over
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
