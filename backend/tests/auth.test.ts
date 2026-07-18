import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/db";

// These tests expect a real (test) PostgreSQL database configured via DATABASE_URL.
// Run `npm run prisma:migrate` against a disposable test DB before running `npm test`.

const testUser = {
  name: "Test Traveler",
  email: `test-${Date.now()}@wander.app`,
  password: "SuperSecret123",
};

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

describe("Auth flow", () => {
  let accessToken: string;

  it("registers a new user", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.accessToken).toBeDefined();
  });

  it("rejects duplicate registration", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);
    expect(res.status).toBe(409);
  });

  it("rejects invalid input", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "not-an-email" });
    expect(res.status).toBe(422);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    accessToken = res.body.accessToken;
    expect(accessToken).toBeDefined();
  });

  it("rejects login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: "wrong-password",
    });
    expect(res.status).toBe(401);
  });

  it("returns the current user for a valid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
