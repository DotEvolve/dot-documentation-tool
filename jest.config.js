module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.property.test.ts",
  ],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/index.ts"],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 75,
      functions: 90,
      statements: 80,
    },
  },
  coverageDirectory: "coverage",
  verbose: true,
  testTimeout: 10000,
};
