/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["dotenv/config"],
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts"],
};
