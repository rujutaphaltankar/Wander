# Wander — Full Functionality & Integration Guide

A systematic, comprehensive guide to every feature, configuration, and step required to make **Wander** 100% production-ready and fully functional.

---

## 1. System Status & Architecture Overview

```
wander/
├── backend/          Node.js + Express + TypeScript + Prisma + SQLite / PostgreSQL
│   ├── src/
│   │   ├── controllers/   (Auth, Itinerary, Place, City, Budget, Favorite, Admin, Chat)
│   │   ├── services/      (AI Service via Groq/OpenAI/Anthropic, CityPopulator)
│   │   ├── routes/        (REST Endpoints)
│   │   └── middleware/    (JWT Auth, Rate Limit, Error Handling)
│   └── prisma/            (Schema, Migrations, Seed data)
│
├── frontend/         React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── pages/         (Home, Explore, Planner, TripDetail, Budget, Profile, Login, Register)
│   │   ├── components/    (Navbar, TopBar, PlaceCard, RouteTimeline, ProtectedRoute)
│   │   └── store/         (Zustand Auth Store)
│   └── public/
```

### Feature Status Matrix

| Feature | Current Status | Description | Action Required |
|---|---|---|---|
| **Email/Password Auth** | 🟢 Fully Functional | Registration, Login, JWT access/refresh tokens | None (Working) |
| **Database & ORM** | 🟢 Fully Functional | Prisma with SQLite (`dev.db`) | Swap to PostgreSQL for production |
| **AI Trip Planner** | 🟢 Fully Functional | Day-by-day itineraries via Groq (`llama-3.3-70b`) | Can swap to OpenAI/Anthropic via `.env` |
| **Dynamic City Populator** | 🟢 Fully Functional | Auto-generates places for unseeded cities | None (Working) |
| **Live Weather** | 🟢 Fully Functional | Open-Meteo real-time coordinates forecast | Optional: OpenWeatherMap API |
| **Budget Tracker** | 🟢 Fully Functional | Expense categories, limits, trip syncing | None (Working) |
| **Admin Dashboard** | 🟢 Fully Functional | User list, review moderation, system metrics | None (Working) |
| **Interactive Map View** | 🟡 Needs UI Hookup | Places have lat/lng; currently rendered as cards | Integrate Leaflet or Google Maps |
| **Google & Apple OAuth** | 🟡 Stubbed (501) | Endpoints prepared in `auth.controller.ts` | Add OAuth client IDs & token validation |
| **Image & Avatar Uploads** | 🟡 Static URLs | Uses default avatars and place URLs | Integrate Cloudinary or Multer |
| **Push Notifications** | 🟡 Stubbed | Firebase env vars defined in `.env.example` | Connect FCM / Web Push / Resend Email |

---

## 2. Step-by-Step Implementation Guide for Pending Features

---

### Step 1: Interactive Map Integration (Explore & Trip Timeline)

Currently, places have geographical coordinates (`latitude`, `longitude`) saved in the database. Adding an interactive map allows users to see pins for attractions, hotels, and route waypoints.

#### Option A: Leaflet + OpenStreetMap (100% Free, No API Key Required) — Recommended

1. **Install dependencies in `frontend`**:
   ```bash
   cd frontend
   npm install leaflet react-leaflet @types/leaflet
   ```
2. **Add Leaflet CSS in `frontend/src/main.tsx` or `index.html`**:
   ```typescript
   import "leaflet/dist/leaflet.css";
   ```
3. **Create `frontend/src/components/MapView.tsx`**:
   ```tsx
   import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
   import { Place } from "../types";

   interface MapViewProps {
     places: Place[];
     center?: [number, number];
     zoom?: number;
   }

   export function MapView({ places, center = [18.5204, 73.8567], zoom = 12 }: MapViewProps) {
     const validPlaces = places.filter((p) => p.latitude && p.longitude);
     const mapCenter: [number, number] = validPlaces.length > 0
       ? [validPlaces[0].latitude!, validPlaces[0].longitude!]
       : center;

     return (
       <div className="h-96 w-full rounded-2xl overflow-hidden shadow-md">
         <MapContainer center={mapCenter} zoom={zoom} style={{ height: "100%", width: "100%" }}>
           <TileLayer
             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
           />
           {validPlaces.map((place) => (
             <Marker key={place.id} position={[place.latitude!, place.longitude!]}>
               <Popup>
                 <strong>{place.name}</strong>
                 <br />
                 {place.category} · ₹{place.avgCostInr || place.entryFeeInr || 0}
               </Popup>
             </Marker>
           ))}
         </MapContainer>
       </div>
     );
   }
   ```
4. **Import `<MapView />` into `frontend/src/pages/Explore.tsx` and `TripDetail.tsx`**.

#### Option B: Google Maps API

1. Set `VITE_GOOGLE_MAPS_API_KEY=AIzaSy...` in `frontend/.env`.
2. Install `@react-google-maps/api`:
   ```bash
   npm install @react-google-maps/api
   ```

---

### Step 2: Social OAuth Logins (Google & Apple)

File to edit: [`backend/src/controllers/auth.controller.ts`](file:///c:/Users/Rujuta/Downloads/Wander%20App/wander/backend/src/controllers/auth.controller.ts#L95-L111)

#### Google Sign-In Implementation:

1. **Install backend dependency**:
   ```bash
   cd backend
   npm install google-auth-library
   ```
2. **Update `googleSignIn` in `auth.controller.ts`**:
   ```typescript
   import { OAuth2Client } from "google-auth-library";

   const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

   export async function googleSignIn(req: Request, res: Response) {
     const { idToken } = req.body;
     if (!idToken) throw new UnauthorizedError("Missing Google ID token.");

     const ticket = await googleClient.verifyIdToken({
       idToken,
       audience: process.env.GOOGLE_CLIENT_ID,
     });
     const payload = ticket.getPayload();
     if (!payload || !payload.email) {
       throw new UnauthorizedError("Invalid Google token payload.");
     }

     let user = await prisma.user.findUnique({ where: { email: payload.email } });
     if (!user) {
       user = await prisma.user.create({
         data: {
           email: payload.email,
           name: payload.name || "Traveler",
           avatarUrl: payload.picture || null,
         },
       });
     }

     const tokens = await issueTokens(user.id, user.role as "USER" | "ADMIN");
     res.json({ success: true, user: publicUser(user), ...tokens });
   }
   ```
3. **Frontend Integration**:
   Install `@react-oauth/google` in `frontend` and add `<GoogleLogin />` component to `frontend/src/pages/Login.tsx`.

---

### Step 3: Media & Image Uploads (Profile Pictures & Place Photos)

1. **Install upload handling packages in `backend`**:
   ```bash
   cd backend
   npm install multer cloudinary
   npm install --save-dev @types/multer
   ```
2. **Configure Cloudinary in `backend/.env`**:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
3. **Create `backend/src/routes/upload.routes.ts`**:
   - Accept multipart image data (`image/jpeg`, `image/png`, `image/webp`).
   - Stream upload directly to Cloudinary storage.
   - Return `{ secure_url: "https://res.cloudinary.com/..." }`.
4. **Update `Profile.tsx`** to allow users to pick a local image file and upload their avatar.

---

### Step 4: Push Notifications & Trip Reminders

1. **Email Alerts (Resend / Nodemailer)**:
   - Install `resend` or `nodemailer`:
     ```bash
     npm install resend
     ```
   - Send automatic booking receipts, trip summary PDFs, or budget warning emails when spend exceeds 90% of limit.
2. **Push Notifications (Firebase Cloud Messaging - FCM)**:
   - Provide Firebase service account key credentials in `backend/.env`.
   - Send daily itinerary morning digests: "Good morning! Today in Paris: 9:00 AM visit to Louvre Museum."

---

### Step 5: Production Database Migration (PostgreSQL)

When moving from local SQLite development to production hosting:

1. **Update `backend/prisma/schema.prisma`**:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Set production database URL in `backend/.env`**:
   ```env
   DATABASE_URL="postgresql://postgres:password@db.example.com:5432/wander_db?sslmode=require"
   ```
3. **Deploy migrations**:
   ```bash
   npm run prisma:deploy
   npm run prisma:seed
   ```

---

## 3. Environment Variables Reference

### Backend (`backend/.env`)

```env
# Server
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL="file:./dev.db"

# Auth Secrets (Generate with `openssl rand -hex 32`)
JWT_SECRET=dev_secret_change_me
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=dev_refresh_secret_change_me
REFRESH_TOKEN_EXPIRES_IN=30d
BCRYPT_SALT_ROUNDS=10

# AI Provider ("groq", "openai", or "anthropic")
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=

# Media Storage (Optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000/api
VITE_GOOGLE_MAPS_API_KEY=
```

---

## 4. Quick Execution & Verification Commands

### Start Development Servers

```bash
# Terminal 1 — Backend API (Port 4000)
cd backend
npm run dev

# Terminal 2 — Frontend App (Port 5173)
cd frontend
npm run dev
```

### Reset & Re-seed Local Database
```bash
cd backend
rm prisma/dev.db
npm run prisma:migrate -- --name init
npm run prisma:seed
```

### Run Backend Test Suite
```bash
cd backend
npm test
```

---

## 5. Deployment Options

- **Frontend**: Deploy to **Vercel**, **Netlify**, or **Cloudflare Pages** (`npm run build` -> output folder `dist`).
- **Backend API**: Deploy to **Railway**, **Render**, **Fly.io**, or **AWS ECS** using the included `Dockerfile`.
- **Database**: Use managed PostgreSQL via **Neon.tech**, **Supabase**, or **Railway Postgres**.
