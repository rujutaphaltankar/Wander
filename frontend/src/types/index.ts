export interface Place {
  id: string;
  name: string;
  type: "ATTRACTION" | "RESTAURANT";
  category: string;
  description?: string | null;
  rating: number;
  ratingCount: number;
  avgCostInr?: number | null;
  priceLevel?: number | null;
  entryFeeInr?: number | null;
  openingHours?: string | null;
  visitDuration?: string | null;
  crowdLevel?: string | null;
  cuisine?: string | null;
  isVegFriendly: boolean;
  imageUrl?: string | null;
  tag?: string | null;
}

export interface ItineraryActivity {
  id?: string;
  time: string;
  title: string;
  type: "FOOD" | "ATTRACTION" | "TRANSPORT" | "SHOPPING" | "REST" | "HOTEL";
  durationLabel?: string | null;
  costInr: number;
  note?: string | null;
}

export interface ItineraryDay {
  dayNumber: number;
  activities: ItineraryActivity[];
}

export interface Trip {
  id: string;
  title: string;
  days: number;
  people: number;
  budgetInr: number;
  hotelName?: string | null;
  travelMode: "WALK" | "BIKE" | "TRANSIT" | "CAR";
  foodPref?: string | null;
  interests: string[];
  itineraryDays: ItineraryDay[];
  city?: { name: string; country: string };
}

export interface Budget {
  id: string;
  totalInr: number;
  spentFoodInr: number;
  spentTransportInr: number;
  spentTicketsInr: number;
  spentShoppingInr: number;
  spentHotelInr: number;
  tripId?: string | null;
}
