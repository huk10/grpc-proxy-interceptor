import jestConfig from "./jest.config.mjs";

export default {
  ...jestConfig,
  testPathIgnorePatterns: [
    "tests/unit"
  ],
}
