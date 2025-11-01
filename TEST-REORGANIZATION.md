# Test Suite Reorganization Summary

## Overview

The test suite has been reorganized to better align with testing best practices, separating tests by their purpose and scope.

## Changes Made

### 1. Created New Test Directory Structure

```
tests/
├── unit/           # Vitest tests for utilities, stores, business logic
├── integration/    # Playwright tests for UI workflows and user interactions
└── e2e/           # Playwright tests for API routes and server-side behavior
```

### 2. Moved API Route Tests

**Before:** `tests/integration/api-routes.spec.ts`
**After:** `tests/e2e/api-routes.spec.ts`

**Reason:** These tests use Playwright's `request` fixture to test API endpoints directly without browser UI, making them End-to-End tests rather than integration tests.

### 3. Extracted Mock API Utility Tests

**Before:** API Verification section in `tests/integration/error-handling.spec.ts` (lines 408-483)
**After:** `tests/integration/mock-api.spec.ts`

**Reason:** These tests verify the mock API fixture utility itself. While they need Playwright fixtures, they're testing the test infrastructure rather than the application, so they belong in a separate file.

### 4. Updated error-handling.spec.ts

Removed the "API Verification" describe block (75 lines) that was testing the mock API utility rather than application error handling.

### 5. Updated Configuration Files

#### package.json

Added new test scripts:

- `pnpm test:integration` - Run only integration tests (UI workflows)
- `pnpm test:e2e` - Run only E2E tests (API routes)
- `pnpm test:all` - Run all tests (unit, integration, and E2E)

#### playwright.config.ts

Changed `testDir` from `'tests/integration'` to `'tests'` to support both integration and e2e directories.

#### CLAUDE.md

Updated testing documentation to reflect the new structure with clear examples of what belongs in each category.

## Test Categories Explained

### Unit Tests (`tests/unit/`)

- **Tool:** Vitest with jsdom
- **Purpose:** Test individual functions, utilities, stores, and business logic in isolation
- **Examples:** Formatters, parsers, store logic
- **Run with:** `pnpm test:unit`

### Integration Tests (`tests/integration/`)

- **Tool:** Playwright (Chromium, Firefox, WebKit)
- **Purpose:** Test user workflows and UI interactions in a real browser
- **Uses:** Mock API fixtures for consistent testing
- **Examples:**
  - Navigation flows
  - Search functionality
  - User account workflows
  - Accessibility testing
  - Error handling in UI
- **Run with:** `pnpm test:integration`

### E2E Tests (`tests/e2e/`)

- **Tool:** Playwright request fixture
- **Purpose:** Test API routes and server-side behavior
- **No browser UI:** Uses HTTP requests directly
- **Examples:**
  - API endpoint responses
  - Security header validation
  - API contracts
  - Server-side error handling
- **Run with:** `pnpm test:e2e`

## Benefits of This Organization

1. **Clearer Test Purpose:** Each test type has a specific focus and runs in the appropriate environment
2. **Faster Feedback:** Can run integration tests without E2E tests when working on UI
3. **Better CI/CD:** Can run different test suites at different stages of the pipeline
4. **Easier Maintenance:** Tests are organized by what they're testing (UI vs API vs logic)
5. **Correct Tooling:** Each test uses the most appropriate testing tool for its purpose

## Migration Guide

If you need to add new tests:

- **Testing a utility function?** → `tests/unit/` (Vitest)
- **Testing user interaction with UI?** → `tests/integration/` (Playwright with page)
- **Testing an API endpoint directly?** → `tests/e2e/` (Playwright with request)

## Files Modified

1. ✅ Created `tests/e2e/api-routes.spec.ts`
2. ✅ Created `tests/integration/mock-api.spec.ts`
3. ✅ Deleted `tests/integration/api-routes.spec.ts`
4. ✅ Updated `tests/integration/error-handling.spec.ts` (removed API Verification section)
5. ✅ Updated `package.json` (new test scripts)
6. ✅ Updated `playwright.config.ts` (testDir change)
7. ✅ Updated `CLAUDE.md` (documentation)

## Verification

All tests can still be discovered and run:

```bash
# List all E2E tests
pnpm test:e2e --list

# List all integration tests
pnpm test:integration --list

# Run all tests
pnpm test:all
```

Total test count remains the same, just better organized! 🎉
