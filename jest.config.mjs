/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
  clearMocks: true,

  collectCoverage: true,

  coverageDirectory: "coverage",

  coverageProvider: "v8",

  testMatch: [
    "**/__tests__/**/*.(mjs|cjs|js|ts|tsx|jsx)",
    "**/?(*.)+(spec|test).(mjs|cjs|js|ts|tsx|jsx)"
  ] ,
  transform: {
    "^.+\\.(m|c)(t|j)sx?$": ["@swc/jest"],
  },

  moduleFileExtensions: ["ts", "tsx", "js", "mjs", "cjs", "jsx", "json", "node"],
};
