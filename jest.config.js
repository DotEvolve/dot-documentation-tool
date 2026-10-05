module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test.json" }]
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
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
