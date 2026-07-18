import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/db";

// Assumes `npm run prisma:seed` has been run against the test database.

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Places discovery", () => {
  it("lists places", async () => {
    const res = await request(app).get("/api/places");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.places)).toBe(true);
  });

  it("filters restaurants by max price", async () => {
    const res = await request(app).get("/api/places").query({ type: "RESTAURANT", maxPrice: 300 });
    expect(res.status).toBe(200);
    res.body.places.forEach((p: { avgCostInr: number | null }) => {
      if (p.avgCostInr !== null) expect(p.avgCostInr).toBeLessThanOrEqual(300);
    });
  });

  it("returns 404 for a place that doesn't exist", async () => {
    const res = await request(app).get("/api/places/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
  });
});
