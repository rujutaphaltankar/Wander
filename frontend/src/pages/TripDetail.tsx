import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Trip } from "../types";
import { TopBar } from "../components/TopBar";
import { RouteTimeline } from "../components/RouteTimeline";
import { MapView, MapPlaceItem } from "../components/MapView";
import {
  MapPin, Clock, Users, Wallet, Hotel, Car, UtensilsCrossed,
  Landmark, Star, ShoppingBag, Building2, ArrowLeft, Loader2,
  CalendarDays, Sparkles, Printer, Download, Share2, Check
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
  const [trip, setTrip] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

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
  const dayCosts = trip.itineraryDays.map((d: any) =>
    (d.activities ?? []).reduce((s: number, a: any) => s + (a.costInr ?? 0), 0)
  );
  const totalCost = dayCosts.reduce((s: number, v: number) => s + v, 0);
  const budgetDiff = trip.budgetInr - totalCost;
  const budgetPct = Math.min(100, Math.round((totalCost / Math.max(1, trip.budgetInr)) * 100));

  // Category breakdown
  const catTotals: Record<string, number> = {};
  trip.itineraryDays.forEach((d: any) => {
    (d.activities ?? []).forEach((a: any) => {
      catTotals[a.type] = (catTotals[a.type] ?? 0) + (a.costInr ?? 0);
    });
  });

  // Calculate day route map pins
  const currentDayActivities = trip.itineraryDays[activeDay]?.activities ?? [];
  const cityPlaces: any[] = trip.city?.places ?? [];
  const cityLat = trip.city?.latitude || 18.5204;
  const cityLng = trip.city?.longitude || 73.8567;

  // Match activities to places by title/name or placeId, with simulated offset for distinct stops
  const dayMapPins: MapPlaceItem[] = currentDayActivities.map((act: any, idx: number) => {
    let lat: number = cityLat;
    let lng: number = cityLng;

    const matchedPlace = act.place || cityPlaces.find((p: any) =>
      act.title.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(act.title.toLowerCase())
    );

    if (matchedPlace && matchedPlace.latitude && matchedPlace.longitude) {
      lat = matchedPlace.latitude;
      lng = matchedPlace.longitude;
    } else {
      // Offset slightly per activity so they don't overlap if exact place coords aren't matched
      const angle = (idx / Math.max(1, currentDayActivities.length)) * 2 * Math.PI;
      const radius = 0.015 * (1 + (idx % 3) * 0.4);
      lat = cityLat + Math.sin(angle) * radius;
      lng = cityLng + Math.cos(angle) * radius;
    }

    return {
      id: act.id || String(idx),
      name: act.title,
      type: act.type,
      category: act.type,
      description: `${act.time} · ${act.durationLabel || ""} ${act.note ? `— ${act.note}` : ""}`,
      latitude: lat,
      longitude: lng,
      costInr: act.costInr,
      orderNumber: idx + 1,
    };
  });

  function handlePrint() {
    window.print();
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleExportICS() {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//Wander App//${trip.title}//EN`,
      `X-WR-CALNAME:${trip.title}`,
    ];

    trip.itineraryDays.forEach((d: any) => {
      d.activities.forEach((a: any) => {
        lines.push(
          "BEGIN:VEVENT",
          `SUMMARY:Day ${d.dayNumber}: ${a.title}`,
          `DESCRIPTION:${a.time} - ${a.note || a.type} (Cost: INR ${a.costInr})`,
          `LOCATION:${trip.city?.name || "Trip"}`,
          "END:VEVENT"
        );
      });
    });

    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${trip.title.replace(/\s+/g, "_")}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="pb-12 print:p-0 print:m-0">
      {/* Back nav & Actions */}
      <div className="flex items-center justify-between gap-3 mb-4 print:hidden">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-ink dark:hover:text-[#EAF3EF] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Profile
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="card px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-cloud dark:hover:bg-[#122029]"
          >
            {copied ? <Check size={13} className="text-green" /> : <Share2 size={13} />}
            {copied ? "Link Copied!" : "Share"}
          </button>
          <button
            onClick={handleExportICS}
            className="card px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-cloud dark:hover:bg-[#122029]"
          >
            <Download size={13} /> Export Calendar (.ics)
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Printer size={13} /> Print Itinerary
          </button>
        </div>
      </div>

      <TopBar
        title={`${trip.city?.name ?? ""} Trip`}
        sub={`${trip.itineraryDays.length}-day itinerary · ${trip.people} traveler${trip.people !== 1 ? "s" : ""}`}
      />

      {/* City Map + Overview banner */}
      {trip.city && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-6 print:grid-cols-2">
          <div className="md:col-span-2 h-56 rounded-3xl overflow-hidden print:hidden">
            <MapView
              places={dayMapPins}
              center={[cityLat, cityLng]}
              zoom={13}
              heightClass="h-56"
              showRouteLine={true}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        {/* Day tabs + Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-line dark:border-[#22333A] print:hidden">
            {trip.itineraryDays.map((d: any, i: number) => (
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
            <span className="font-mono text-green font-bold">₹{(dayCosts[activeDay] ?? 0).toLocaleString()}</span>
          </div>

          <div className="card p-6 bg-white dark:bg-[#122029]">
            {trip.itineraryDays[activeDay] && (
              <RouteTimeline activities={trip.itineraryDays[activeDay].activities} />
            )}
          </div>
        </div>

        {/* Right: Budget Summary */}
        <div className="space-y-5 print:mt-6">
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
          </div>

          {/* Actions */}
          <div className="space-y-2 print:hidden">
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
