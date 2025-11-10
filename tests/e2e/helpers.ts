/**
 * E2E Test Helpers
 *
 * E2E tests now use a mock HTTP server (tests/e2e/mock-server.ts) that runs
 * during test execution. The server intercepts requests to api.rule34.xxx
 * and returns mock data from the same mock fixtures used in integration tests.
 *
 * No setup is required in individual tests - the mock server is automatically
 * started via Playwright's global setup and stopped via global teardown.
 *
 * The mock server reuses all mock data from:
 * - tests/integration/mocks/data/posts.ts
 * - tests/integration/mocks/data/tags.ts
 * - tests/integration/mocks/data/comments.ts
 */

// This file is intentionally minimal - E2E tests now work automatically
// without any per-test setup thanks to the mock server running globally.
