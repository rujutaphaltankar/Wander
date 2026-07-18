# Wander API Documentation

Base URL: `http://localhost:4000/api` (development)

All request/response bodies are JSON. Authenticated routes require:
```
Authorization: Bearer <accessToken>
```

---

## Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create an account. Body: `{ name, email, password }` |
| POST | `/auth/login` | — | Log in. Body: `{ email, password }` |
| POST | `/auth/refresh` | — | Exchange a refresh token for a new access token. Body: `{ refreshToken }` |
| POST | `/auth/logout` | — | Invalidate a refresh token. Body: `{ refreshToken }` |
| GET | `/auth/me` | ✅ | Get the current user |
| POST | `/auth/google` | — | Stub — returns 501 until Google Sign-In is wired up |
| POST | `/auth/apple` | — | Stub — returns 501 until Apple Sign-In is wired up |

Register/login responses: `{ success, user, accessToken, refreshToken }`

---

## Users

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | ✅ | Full profile incl. recent trips & favorites |
| PATCH | `/users/me` | ✅ | Update `{ name?, avatarUrl? }` |
| GET | `/users/me/history` | ✅ | All trips for the user |

---

## Places (attractions + restaurants)

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/places` | — | List/filter places. Query: `city, type (ATTRACTION\|RESTAURANT), category, maxPrice, veg, q` |
| GET | `/places/:id` | — | Place detail + approved reviews |
| POST | `/places/:id/reviews` | ✅ | Add a review. Body: `{ placeId, rating(1-5), comment? }` |
| POST | `/places` | Admin | Create a place |
| PATCH | `/places/:id` | Admin | Update a place |
| DELETE | `/places/:id` | Admin | Delete a place |

The budget-based food finder is just `GET /places?type=RESTAURANT&maxPrice=250`.

---

## AI Trip Planner (itineraries)

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/itineraries` | ✅ | Generate a new AI itinerary. Body: `{ cityName, days, people, budgetInr, hotelName?, travelMode, foodPref?, interests[] }` |
| GET | `/itineraries` | ✅ | List the user's trips |
| GET | `/itineraries/:id` | ✅ | Get a trip with full day-by-day itinerary |
| DELETE | `/itineraries/:id` | ✅ | Delete a trip |

Generating an itinerary also auto-creates a matching `Budget` record, so the client can jump straight to `/budgets`.

---

## Budget tracker

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/budgets` | ✅ | List the user's budgets |
| POST | `/budgets` | ✅ | Create a standalone budget. Body: `{ totalInr }` |
| GET | `/budgets/:id` | ✅ | Get one budget |
| PATCH | `/budgets/:id` | ✅ | Update any of `totalInr, spentFoodInr, spentTransportInr, spentTicketsInr, spentShoppingInr, spentHotelInr` |

---

## Favorites

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/favorites` | ✅ | List favorites with place details |
| POST | `/favorites` | ✅ | Add. Body: `{ placeId }` |
| DELETE | `/favorites/:placeId` | ✅ | Remove |

---

## AI Chat Assistant

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/chat` | ✅ | Body: `{ message, cityName? }` → `{ reply }` |

---

## Admin

All routes require an `ADMIN` role user (see seed data: `admin@wander.app` / `Admin@12345`).

| Method | Route | Description |
|---|---|---|
| GET | `/admin/stats` | User/trip/place/review counts |
| GET | `/admin/users` | Paginated user list (`?page=&pageSize=`) |
| PATCH | `/admin/users/:id/role` | Body: `{ role }` |
| DELETE | `/admin/users/:id` | Remove a user |
| GET | `/admin/reviews` | Reviews for moderation |
| PATCH | `/admin/reviews/:id/moderate` | Body: `{ isApproved }` |

---

## Error format

```json
{ "success": false, "message": "Human-readable message" }
```

Validation errors additionally include an `errors` array of `{ path, message }`.

## Rate limits

- General API: 200 requests / 15 min per IP (configurable via `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS`)
- Auth routes: 20 requests / 15 min per IP
