import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(1, "Password is required."),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    avatarUrl: z.string().url().optional(),
  }),
});

export const createReviewSchema = z.object({
  body: z.object({
    placeId: z.string().optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});

export const generateItinerarySchema = z.object({
  body: z.object({
    cityName: z.string().min(2),
    days: z.number().int().min(1).max(10),
    people: z.number().int().min(1).max(20),
    budgetInr: z.number().int().min(500),
    hotelName: z.string().optional(),
    travelMode: z.enum(["WALK", "BIKE", "TRANSIT", "CAR"]).default("WALK"),
    foodPref: z.string().optional(),
    interests: z.array(z.string()).default([]),
  }),
});

export const updateBudgetSchema = z.object({
  body: z.object({
    totalInr: z.number().int().min(0).optional(),
    spentFoodInr: z.number().int().min(0).optional(),
    spentTransportInr: z.number().int().min(0).optional(),
    spentTicketsInr: z.number().int().min(0).optional(),
    spentShoppingInr: z.number().int().min(0).optional(),
    spentHotelInr: z.number().int().min(0).optional(),
  }),
});

export const chatMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(500),
    cityName: z.string().optional(),
  }),
});

export const addFavoriteSchema = z.object({
  body: z.object({
    placeId: z.string().uuid(),
  }),
});
