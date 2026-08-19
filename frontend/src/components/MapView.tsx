import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Place } from "../types";
import { Star, MapPin, Navigation } from "lucide-react";

// Fix Leaflet default icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom SVG icon generator for places
function createPlaceIcon(type: string, numberLabel?: number) {
  let color = "#10B981"; // green (attraction)
  let bgGradient = "linear-gradient(135deg, #10B981, #059669)";
  let symbol = "🏛️";

  if (type === "RESTAURANT" || type === "FOOD") {
    color = "#F59E0B"; // orange
    bgGradient = "linear-gradient(135deg, #F59E0B, #D97706)";
    symbol = "🍽️";
  } else if (type === "ACTIVITY" || type === "SHOPPING") {
    color = "#8B5CF6"; // purple
    bgGradient = "linear-gradient(135deg, #8B5CF6, #6D28D9)";
    symbol = "✨";
  } else if (type === "HOTEL") {
    color = "#3B82F6"; // blue
    bgGradient = "linear-gradient(135deg, #3B82F6, #1D4ED8)";
    symbol = "🏨";
  } else if (type === "TRANSPORT") {
    color = "#64748B"; // slate
    bgGradient = "linear-gradient(135deg, #64748B, #475569)";
    symbol = "🚗";
  }

  const labelHtml = numberLabel !== undefined
    ? `<span style="font-size: 11px; font-weight: 700; color: white;">${numberLabel}</span>`
    : `<span style="font-size: 13px;">${symbol}</span>`;

  const html = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: ${bgGradient};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      transform: translate(-50%, -50%);
      transition: transform 0.15s ease;
    ">
      ${labelHtml}
    </div>
  `;

  return L.divIcon({
    className: "custom-map-pin",
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function MapController({ places, center, zoom }: { places?: Array<{ lat: number; lng: number }>; center?: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (places && places.length > 0) {
      const valid = places.filter((p) => typeof p.lat === "number" && typeof p.lng === "number");
      if (valid.length === 1) {
        map.setView([valid[0].lat, valid[0].lng], zoom ?? 13);
      } else if (valid.length > 1) {
        const bounds = L.latLngBounds(valid.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    } else if (center) {
      map.setView(center, zoom ?? 12);
    }
  }, [places, center, zoom, map]);

  return null;
}

export interface MapPlaceItem {
  id: string;
  name: string;
  type: string;
  category?: string;
  description?: string;
  latitude: number;
  longitude: number;
  costInr?: number;
  rating?: number;
  visitDuration?: string;
  orderNumber?: number;
}

interface MapViewProps {
  places: MapPlaceItem[];
  center?: [number, number];
  zoom?: number;
  heightClass?: string;
  showRouteLine?: boolean;
  onSelectPlace?: (place: MapPlaceItem) => void;
}

export function MapView({
  places,
  center = [18.5204, 73.8567],
  zoom = 12,
  heightClass = "h-96",
  showRouteLine = false,
  onSelectPlace,
}: MapViewProps) {
  const validPlaces = places.filter(
    (p) => typeof p.latitude === "number" && !isNaN(p.latitude) && typeof p.longitude === "number" && !isNaN(p.longitude)
  );

  const initialCenter: [number, number] = validPlaces.length > 0
    ? [validPlaces[0].latitude, validPlaces[0].longitude]
    : center;

  const polylineCoords: [number, number][] = validPlaces.map((p) => [p.latitude, p.longitude]);

  return (
    <div className={`w-full ${heightClass} rounded-3xl overflow-hidden shadow-sm border border-line dark:border-[#22333A] relative z-0`}>
      <MapContainer
        center={initialCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          places={validPlaces.map((p) => ({ lat: p.latitude, lng: p.longitude }))}
          center={initialCenter}
          zoom={zoom}
        />

        {showRouteLine && polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: "#10B981",
              weight: 4,
              opacity: 0.8,
              dashArray: "8, 8",
            }}
          />
        )}

        {validPlaces.map((item, idx) => (
          <Marker
            key={item.id || idx}
            position={[item.latitude, item.longitude]}
            icon={createPlaceIcon(item.type, item.orderNumber)}
            eventHandlers={{
              click: () => onSelectPlace?.(item),
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 max-w-[200px]">
                <div className="font-bold text-sm text-slate-800 flex items-center gap-1">
                  {item.orderNumber && (
                    <span className="w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                      {item.orderNumber}
                    </span>
                  )}
                  {item.name}
                </div>
                {item.category && (
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">{item.category}</div>
                )}
                {item.description && (
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-tight">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[11px] text-slate-700">
                  {item.rating !== undefined && item.rating > 0 ? (
                    <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                      ★ {item.rating.toFixed(1)}
                    </span>
                  ) : <span></span>}
                  {item.costInr !== undefined && (
                    <span className="font-semibold text-emerald-600">
                      ₹{item.costInr.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
