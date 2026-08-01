import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Trip } from "../types";
import { TopBar } from "../components/TopBar";
import { RouteTimeline } from "../components/RouteTimeline";
import {
  MapPin, Clock, Users, Wallet, Hotel, Car, UtensilsCrossed,
  Landmark, Star, ShoppingBag, Building2, ArrowLeft, Loader2, CalendarDays, Sparkles
} from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  FOOD: UtensilsCrossed,
  ATTRACTION: Landmark,
  ACTIVITY: Star,
  SHOPPING: ShoppingBag,
  HOTEL: Building2,
  TRANSPORT: Car,
};

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get(`/itineraries/${id}`)
      .then((res) => setTrip(res.data.trip))
      .catch(() => setError("Trip not found or you don't have access."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={28} className="animate-spin text-green" />
        <div className="text-sm text-muted">Loading trip details…</div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="py-12 text-center">
        <div className="text-sm text-muted mb-4">{error || "Trip not found."}</div>
        <button onClick={() => navigate("/profile")} className="btn-primary text-sm px-6 py-2">
          Back to Profile
        </button>
      </div>
    );
  }

  // Compute per-day and total costs
  const dayCosts = trip.itineraryDays.map((d) =>
    (d.activities ?? []).reduce((s: number, a: any) => s + (a.costInr ?? 0), 0)
  );
  const totalCost = dayCosts.reduce((s, v) => s + v, 0);
  const budgetDiff = trip.budgetInr - totalCost;
  const budgetPct = Math.min(100, Math.round((totalCost / Math.max(1, trip.budgetInr)) * 100));

  // Category breakdown
  const catTotals: Record<string, number> = {};
  trip.itineraryDays.forEach((d) => {
    (d.activities ?? []).forEach((a: any) => {
      catTotals[a.type] = (catTotals[a.type] ?? 0) + (a.costInr ?? 0);
    });
  });

  return (
    <div className="pb-12">
      {/* Back nav */}
      <button
        onClick={() => navigate("/profile")}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink dark:hover:text-[#EAF3EF] transition-colors mb-4"
      >
        <ArrowLeft size={14} /> Back to Profile
      </button>

      <TopBar
        title={`${trip.city?.name ?? ""} Trip`}
        sub={`${trip.itineraryDays.length}-day itinerary · ${trip.people} traveler${trip.people !== 1 ? "s" : ""}`}
      />

      {/* City Map + Overview banner */}
      {trip.city && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-6">
          <div className="md:col-span-2 card p-0 overflow-hidden rounded-3xl h-56 border border-line dark:border-[#22333A]">
            <iframe
              title="Trip Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(trip.city.name + ", " + (trip.city.country ?? ""))}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
              allowFullScreen
            />
          </div>
          <div className="card rounded-3xl p-5 bg-gradient-to-br from-blue to-navy text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="opacity-75" />
                <span className="text-sm font-bold">{trip.city.name}</span>
                <span className="text-xs opacity-60">{trip.city.country}</span>
              </div>
              <p className="text-xs opacity-75 mt-2 leading-relaxed line-clamp-3">
                {trip.city.description || `Your ${trip.itineraryDays.length}-day adventure in ${trip.city.name}.`}
              </p>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 opacity-85"><CalendarDays size={12} /> {trip.itineraryDays.length} days</div>
              <div className="flex items-center gap-2 opacity-85"><Users size={12} /> {trip.people} traveler{trip.people !== 1 ? "s" : ""}</div>
              <div className="flex items-center gap-2 opacity-85"><Hotel size={12} /> {trip.hotelName ?? "City Center"}</div>
              <div className="flex items-center gap-2 opacity-85"><Car size={12} /> {trip.travelMode}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Day tabs + Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-line dark:border-[#22333A]">
            {trip.itineraryDays.map((d, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                data-active={activeDay === i}
                className="chip shrink-0 font-mono text-sm px-4 py-2 flex flex-col items-center gap-0.5"
              >
                <span>Day {d.dayNumber}</span>
                <span className="text-[9px] font-mono opacity-70">₹{dayCosts[i]?.toLocaleString()}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink dark:text-[#EAF3EF]">
              Day {trip.itineraryDays[activeDay]?.dayNumber} — {(trip.itineraryDays[activeDay]?.activities?.length ?? 0)} activities
            </span>
            <span className="font-mono text-green">₹{(dayCosts[activeDay] ?? 0).toLocaleString()}</span>
          </div>

          <div className="card p-6 bg-white dark:bg-[#122029]">
            {trip.itineraryDays[activeDay] && (
              <RouteTimeline activities={trip.itineraryDays[activeDay].activities} />
            )}
          </div>
        </div>

        {/* Right: Budget Summary */}
        <div className="space-y-5">
          {/* Trip budget card */}
          <div className="card p-5 rounded-3xl space-y-4">
            <h3 className="font-display font-bold text-base text-ink dark:text-[#EAF3EF] flex items-center gap-2 border-b border-line dark:border-[#22333A] pb-2">
              <Wallet size={16} className="text-green" /> Budget Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Budget limit</span>
                <span className="font-mono font-semibold">₹{trip.budgetInr.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Estimated cost</span>
                <span className="font-mono font-semibold">₹{totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{budgetDiff >= 0 ? "Saved" : "Over budget"}</span>
                <span className={`font-mono font-semibold ${budgetDiff >= 0 ? "text-green" : "text-red-500"}`}>
                  {budgetDiff >= 0 ? "+" : ""}₹{budgetDiff.toLocaleString()}
                </span>
              </div>
              <div className="pt-1">
                <div className="h-2 rounded-full bg-line dark:bg-[#22333A] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${budgetPct}%`, background: budgetDiff >= 0 ? "#1E9E6B" : "#D6455D" }}
                  />
                </div>
                <div className="text-[10px] text-muted mt-1 text-right">{budgetPct}% of budget used</div>
              </div>
            </div>

            {/* Per-person */}
            <div className="pt-2 border-t border-line dark:border-[#22333A]">
              <div className="text-xs text-muted mb-2">Per person (÷{trip.people})</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="card rounded-xl p-2.5 text-center bg-cloud dark:bg-[#0B171E]">
                  <div className="text-muted">Total</div>
                  <div className="font-mono font-semibold">₹{Math.round(totalCost / trip.people).toLocaleString()}</div>
                </div>
                <div className="card rounded-xl p-2.5 text-center bg-cloud dark:bg-[#0B171E]">
                  <div className="text-muted">Per day</div>
                  <div className="font-mono font-semibold">₹{Math.round(totalCost / Math.max(1, trip.itineraryDays.length) / trip.people).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="card p-5 rounded-3xl space-y-3">
            <h3 className="font-display font-bold text-sm text-ink dark:text-[#EAF3EF] border-b border-line dark:border-[#22333A] pb-2">
              Cost by Category
            </h3>
            {Object.entries(catTotals).sort(([, a], [, b]) => b - a).map(([type, val]) => {
              const Icon = TYPE_ICONS[type] ?? Sparkles;
              const pct = totalCost > 0 ? Math.round((val / totalCost) * 100) : 0;
              return (
                <div key={type} className="flex items-center gap-3 text-xs">
                  <Icon size={14} className="text-muted shrink-0" />
                  <span className="text-muted capitalize min-w-[70px]">{type.toLowerCase()}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-line dark:bg-[#22333A] overflow-hidden">
                    <div className="h-full rounded-full bg-green" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono ml-1 shrink-0">₹{val.toLocaleString()}</span>
                </div>
              );
            })}
            {Object.keys(catTotals).length === 0 && (
              <div className="text-xs text-muted">No cost data available.</div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => navigate("/budget")}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
            >
              <Wallet size={15} /> Open Budget Tracker
            </button>
            <button
              onClick={() => navigate("/planner")}
              className="card w-full rounded-2xl py-3 text-center text-sm font-semibold hover:bg-cloud dark:hover:bg-[#1C2C35] transition-colors"
            >
              Plan Another Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
