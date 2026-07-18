import { UtensilsCrossed, Landmark, Bus, ShoppingBag, Sunrise, Building2, LucideIcon } from "lucide-react";
import { ItineraryActivity } from "../types";

const TYPE_META: Record<string, { icon: LucideIcon; color: string }> = {
  FOOD: { icon: UtensilsCrossed, color: "#FF8A3D" },
  ATTRACTION: { icon: Landmark, color: "#2E6CA4" },
  TRANSPORT: { icon: Bus, color: "#1E9E6B" },
  SHOPPING: { icon: ShoppingBag, color: "#FFC94D" },
  REST: { icon: Sunrise, color: "#6B7C79" },
  HOTEL: { icon: Building2, color: "#0E2A3D" },
};

export function RouteTimeline({ activities }: { activities: ItineraryActivity[] }) {
  return (
    <div className="flex flex-col">
      {activities.map((a, idx) => {
        const meta = TYPE_META[a.type] ?? TYPE_META.REST;
        const Icon = meta.icon;
        const last = idx === activities.length - 1;
        return (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="rounded-full shrink-0 w-2.5 h-2.5" style={{ background: meta.color }} />
              {!last && <div className="route-line flex-1" style={{ minHeight: 36 }} />}
            </div>
            <div className="pb-4 flex-1 min-w-0">
              <div className="text-[11px] font-mono text-muted">
                {a.time} {a.durationLabel ? `· ${a.durationLabel}` : ""}
              </div>
              <div className="card p-3 mt-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={14} style={{ color: meta.color }} className="shrink-0" />
                    <span className="text-sm font-medium truncate">{a.title}</span>
                  </div>
                  <span className="font-mono text-xs shrink-0 text-green">{a.costInr ? `₹${a.costInr}` : "Free"}</span>
                </div>
                {a.note && <div className="text-[11px] mt-1 text-muted">{a.note}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
