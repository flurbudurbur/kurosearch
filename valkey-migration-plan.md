# Plan: Replace /api/sync File Storage with Valkey

## Overview

Migrate the `/api/sync` endpoint from OS temp directory file storage to Valkey (Redis-compatible) in-memory storage with enhanced features.

## Implementation Steps

### 1. **Setup & Dependencies**

- Install `valkey` official client package: `pnpm add valkey`
- Install compression library: `pnpm add pako` and `pnpm add -D @types/pako`
- Create `.env.example` with Valkey configuration template
- Document environment variables in README/CLAUDE.md

### 2. **Create Valkey Client Module** (`src/lib/server/valkey.ts`)

- Import SvelteKit env vars (`$env/static/private`)
- Implement singleton Valkey client with connection pooling
- Add key prefix constant: `KUROSEARCH_SYNC_PREFIX = "kurosearch:sync:"`
- Implement graceful degradation (return null client if connection fails)
- Add structured logging for connection status
- Export helper functions:
  - `getValkeyClient()` - returns client or null
  - `isValkeyAvailable()` - health check
  - `closeValkeyConnection()` - cleanup for tests

### 3. **Create Compression Utility** (`src/lib/server/compression.ts`)

- Implement `compress(data: string): Buffer` using pako gzip
- Implement `decompress(buffer: Buffer): string`
- Add error handling with fallback to uncompressed data
- Export compression utilities

### 4. **Update /api/sync POST Endpoint** (`src/routes/api/sync/+server.ts`)

- Remove file system imports (`fs`, `os`, `path`)
- Remove in-memory `tempFiles` Map
- Remove cleanup interval and setTimeout logic
- Replace file write with Valkey operations:
  - Compress config data
  - Store with `SET {prefix}{code} {compressed-data} EX {ttl-seconds}`
  - Log success/failure metrics
- Add fallback: return 503 if Valkey unavailable
- Keep 6-digit code generation logic unchanged

### 5. **Update /api/sync GET Endpoint** (`src/routes/api/sync/[code]/+server.ts`)

- Remove file system operations
- Replace file read with Valkey operations:
  - `GET {prefix}{code}` to retrieve data
  - Decompress retrieved data
  - `DEL {prefix}{code}` for one-time use (atomic operation)
  - Handle key not found (404)
- Add fallback: return 503 if Valkey unavailable
- Add metrics logging

### 6. **Update Test Helpers**

- Update exported test functions `_getTempFile()` and `_consumeTempFile()`:
  - Query Valkey directly for test assertions
  - Return appropriate mock data structures
- Keep function signatures compatible with existing tests

### 7. **Update Integration Tests**

- Update `tests/integration/mocks/mocker.ts` (lines 263-362):
  - Replace file-based mock with in-memory Map for test environment
  - Keep same API behavior (one-time use, expiry)
- Update `tests/integration/api-routes.spec.ts` (lines 128-222):
  - May need adjustments if test helpers change
- Update `tests/integration/account-sync.spec.ts`:
  - Ensure E2E tests still pass with new backend
- Add cleanup in test teardown to clear Valkey test keys

### 8. **Documentation & Configuration**

- Update `CLAUDE.md` with Valkey setup instructions
- Add environment variable documentation
- Document key prefixing scheme
- Add troubleshooting section for Valkey connection issues

### 9. **Error Handling & Monitoring**

- Implement structured logging throughout:
  - Connection attempts (success/failure)
  - SET/GET/DEL operations with latency
  - Compression ratio metrics
  - Error rates
- Add user-friendly error responses when Valkey is unavailable
- Consider adding retry logic for transient failures

## Configuration Structure

**Environment Variables** (via `$env/static/private`):

```
VALKEY_HOST=localhost (default)
VALKEY_PORT=6379 (default)
VALKEY_PASSWORD= (optional)
VALKEY_DB=0 (default)
VALKEY_ENABLED=true (feature flag)
```

## Key Benefits

- ✅ No file system cleanup needed (TTL automatic)
- ✅ Better performance with connection pooling
- ✅ Reduced storage footprint with compression
- ✅ Atomic one-time use with GET+DEL
- ✅ Observable with metrics/logging
- ✅ Namespace isolation with key prefixing
- ✅ Graceful degradation if Valkey unavailable

## Testing Strategy

- Unit tests for compression utilities
- Integration tests for Valkey client connection
- E2E tests for sync flow (already exist, ensure they pass)
- Test graceful degradation (mock Valkey unavailable)

## Rollout Considerations

- Requires Valkey instance in production
- Old codes stored in files will not be migrated (acceptable - 5min TTL)
- Feature can be disabled via `VALKEY_ENABLED=false` env var

## Current Implementation Summary

### What /api/sync Currently Does

The sync endpoint provides one-time code-based configuration synchronization:

1. Generate a 6-digit code on one device with current settings
2. Use that code on another device to retrieve and apply those settings
3. Codes are single-use and expire after time limit

### Current Storage Method

- **Storage:** File-based in OS temp directory
- **File naming:** `{tmpdir}/{code}.cfg`
- **File format:** JSON string of SettingsObject
- **In-memory tracking:** `Map<string, TempFile>` with filepath, expires timestamp, inUse flag

### Data Being Persisted

SettingsObject containing:

- Theme preferences (dark/light)
- Blocked content settings
- Result column configuration
- Supertags (custom tag groups)
- Saved posts

### Current TTL/Cleanup

- **Production:** 5 minutes (300,000ms)
- **Test:** 30 seconds (30,000ms)
- **Cleanup mechanisms:**
  1. setTimeout scheduled deletion
  2. Pre-creation cleanup of expired files
  3. 60-second periodic cleanup interval
  4. Immediate deletion after successful retrieval (one-time use)

### Files to Modify

- `src/routes/api/sync/+server.ts` - POST handler, cleanup logic
- `src/routes/api/sync/[code]/+server.ts` - GET handler
- `tests/integration/mocks/mocker.ts` - Mock implementation (lines 263-362)
- `tests/integration/api-routes.spec.ts` - API tests (lines 128-222)
- `tests/integration/account-sync.spec.ts` - E2E tests

### Files to Create

- `src/lib/server/valkey.ts` - Valkey client singleton
- `src/lib/server/compression.ts` - Compression utilities
- `.env.example` - Environment variable template
