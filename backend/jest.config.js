/**
 * Jest Configuration
 */
module.exports = {
  // The root directory that Jest should scan for tests and modules
  rootDir: "./",

  // The test environment that will be used for testing
  testEnvironment: "node",

  // The glob patterns Jest uses to detect test files
  testMatch: ["**/__tests__/**/*.test.js"],

  // Files to ignore
  testPathIgnorePatterns: ["/node_modules/", "/data/"],

  // Setup files that run before each test file
  setupFilesAfterEnv: ["./__tests__/setupTests.js"],

  // Whether to use watchman for file crawling
  watchman: true,

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  // testPathIgnorePatterns: ['/node_modules/'],

  // An array of regexp pattern strings that are matched against all source file paths, matched files will be skipped
  // transformIgnorePatterns: ['<rootDir>/node_modules/'],

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // A list of paths to directories that Jest should use to search for files in
  roots: ["<rootDir>"],

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    "**/*.{js,jsx}",
    "!**/node_modules/**",
    "!**/vendor/**",
    "!**/coverage/**",
    "!jest.config.js",
  ],

  // The maximum amount of workers used to run your tests. Can be specified as % or a number
  maxWorkers: "50%",
};
