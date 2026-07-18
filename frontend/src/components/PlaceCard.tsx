import { Star, Clock, Heart, UtensilsCrossed, Landmark } from "lucide-react";
import { Place } from "../types";

export function PlaceCard({
  place,
  isFavorite,
  onToggleFavorite,
}: {
  place: Place;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const isFood = place.type === "RESTAURANT";
  return (
    <div className="card p-3 flex gap-3">
      <div className="rounded-xl shrink-0 flex items-center justify-center w-16 h-16 bg-blue-soft text-blue">
        {isFood ? <UtensilsCrossed size={22} /> : <Landmark size={22} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm font-semibold leading-tight truncate">{place.name}</div>
          <button onClick={() => onToggleFavorite(place.id)} aria-label="Toggle favorite">
            <Heart size={15} className={isFavorite ? "text-orange" : "text-muted"} fill={isFavorite ? "#FF8A3D" : "none"} />
          </button>
        </div>
        <div className="text-[11px] mt-0.5 text-muted">
          {place.category}
          {isFood && place.cuisine ? ` · ${place.cuisine}` : ""}
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-[11px]">
          <span className="flex items-center gap-1">
            <Star size={11} className="text-yellow" fill="#FFC94D" /> {place.rating.toFixed(1)}
          </span>
          {isFood && place.avgCostInr != null && <span className="font-mono text-green">₹{place.avgCostInr} avg</span>}
          {!isFood && place.visitDuration && (
            <span className="flex items-center gap-1 text-muted">
              <Clock size={11} /> {place.visitDuration}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
