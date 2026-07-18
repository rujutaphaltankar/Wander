# Wander Database Schema

SQLite, managed with Prisma (`backend/prisma/schema.prisma`). It's a single file on disk — no server to install or run. Set up with:

```bash
npm run prisma:migrate -- --name init   # creates backend/prisma/dev.db and all tables
npm run prisma:seed                     # loads sample cities, places, and an admin account
```

SQLite doesn't support Postgres/MySQL features like native enums or array columns, so a few fields that would otherwise be enums (`role`, `type`, `travelMode`, activity `type`) are plain `String` columns validated by Zod at the API layer, and `Trip.interests` is stored as a JSON-encoded string (see `backend/src/utils/json.ts`). If you move this to Postgres later, those can become real enums/arrays again — see the comments at the top of `schema.prisma`.

## Entity overview

```
User ──< RefreshToken
User ──< Trip ──< ItineraryDay ──< ItineraryActivity >── Place
User ──< Favorite >── Place
User ──< Review >── Place
User ──< Budget >── Trip (one-to-one, optional)
City ──< Place
City ──< Trip
```

## Tables

### User
Core account record. `passwordHash` is null for OAuth-only accounts (Google/Apple). `role` is `USER` or `ADMIN`.

### RefreshToken
Long-lived tokens issued at login, stored so they can be revoked on logout. Cascades on user delete.

### City
Minimal city record (`name + country` unique). Created on-the-fly the first time a user plans a trip there.

### Place
Unified table for both attractions and restaurants, distinguished by `type`. Restaurant-specific fields (`avgCostInr`, `cuisine`, `isVegFriendly`) and attraction-specific fields (`entryFeeInr`, `visitDuration`, `crowdLevel`) live side-by-side and are simply left null for the other type. This keeps discovery/filtering (`GET /places`) to a single query instead of a join across two tables.

### Review
User ratings/comments on a Place. `isApproved` supports the admin moderation queue — unapproved reviews are excluded from the public place detail endpoint and from rating averages.

### Favorite
Join table between User and Place. Unique on `(userId, placeId)` so favoriting twice is a no-op (handled with `upsert`).

### Trip
One AI-generated (or manually created) trip plan. Stores the original planning inputs (`days`, `people`, `budgetInr`, `interests`, etc.) alongside the generated itinerary.

### ItineraryDay / ItineraryActivity
Normalized day-by-day breakdown of a Trip. Each activity has a `type` field (`FOOD | ATTRACTION | TRANSPORT | SHOPPING | REST | HOTEL`, validated by Zod) used both for icon/color in the UI and for rolling activity costs up into the Budget by category.

### Budget
Tracks spend against a total, either standalone or tied 1:1 to a Trip. Split into the five categories the product spec calls for (food, transport, tickets, shopping, hotel).

## Indexes

- `Place(cityId, type)` and `Place(cityId, category)` — the two most common discovery filters
- `Review(placeId)`, `Review(userId)`
- `Trip(userId)`
- `RefreshToken(userId)`

## Migrations

Prisma migrations live in `backend/prisma/migrations/` once generated (not checked in until you run `prisma migrate dev` locally, since migration files are environment-specific timestamps). To generate the first migration:

```bash
cd backend
cp .env.example .env   # then fill in DATABASE_URL
npm run prisma:migrate -- --name init
npm run prisma:seed
```
