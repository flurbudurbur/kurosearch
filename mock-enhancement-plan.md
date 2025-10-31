# Integration Test Mocks Enhancement Plan

## Overview

This document outlines the plan to enhance integration test mocks with real API data from the Rule34 API and create a comprehensive OpenAPI specification.

## Current State Analysis

### Existing Mock Structure

- **Location**: `tests/integration/mocks/`
- **Mock Data Files**:
  - `data/posts.ts` - 3 basic posts
  - `data/tags.ts` - 5 tag suggestions
  - `data/comments.ts` - Basic comment XML
  - `data/sync.ts` - Sync code and config mocks
- **Mocker Class**: `mocker.ts` - ApiMocker class with methods for all endpoints

### API Endpoints to Query

**Base URL**: `https://api.rule34.xxx/`

1. **GET /api/posts** (Proxy to: `?page=dapi&s=post&q=index`)
   - Query params: `tags`, `limit`, `pid`, `id`, `json=1`
   - Returns: JSON array of posts

2. **GET /api/tags**
   - Autocomplete: `/autocomplete.php?q={query}` → JSON suggestions
   - Tag details: `?page=dapi&s=tag&q=index&name={name}` → XML metadata

3. **GET /api/comments** (Proxy to: `?page=dapi&s=comment&q=index`)
   - Query params: `post_id` (required)
   - Returns: XML with comments

4. **POST /api/sync**
   - Body: JSON configuration
   - Returns: `{ code: "123456" }`

5. **GET /api/sync/[code]**
   - Returns: JSON configuration (one-time use)

## Implementation Plan

### Phase 1: Fetch Real API Responses

#### 1.1 Query GET /api/posts

Fetch multiple scenarios:

- Basic search with popular tags:
  - `?tags=solo&limit=5&json=1`
  - `?tags=sfw+smile&limit=5&json=1`
  - `?tags=scenery&limit=5&json=1`
- Pagination:
  - `?tags=solo&pid=1&limit=5&json=1`
  - `?tags=solo&pid=2&limit=5&json=1`
- Single post by ID:
  - `?id=12345&json=1`
- Count query:
  - `?tags=solo&limit=0` (returns XML with count)
- Different content types:
  - Look for posts with different file extensions (mp4, gif, jpg, png)
  - Different ratings (safe, questionable, explicit)

#### 1.2 Query GET /api/tags

- Autocomplete queries:
  - `/autocomplete.php?q=so` (partial match)
  - `/autocomplete.php?q=smile`
  - `/autocomplete.php?q=sce`
- Tag details:
  - `?page=dapi&s=tag&q=index&name=solo` (XML)
  - `?page=dapi&s=tag&q=index&name=smile`

#### 1.3 Query GET /api/comments

- Comments for posts with activity:
  - `?page=dapi&s=comment&q=index&id={post_id}`
- Try multiple post IDs to find varied comment structures

### Phase 2: Analyze Response Structures

#### 2.1 Document Post Response Structure

Analyze and document:

- Required vs optional fields
- Field data types (string, number, array, etc.)
- Nested structures
- Array formats
- Edge cases (null values, empty strings, missing fields)

Expected fields from codebase analysis:

```typescript
{
  id: number,
  score: number,
  tags: string,
  file_url: string,
  width: number,
  height: number,
  preview_url: string,
  sample_url: string,
  rating: string,
  source?: string,
  parent_id?: number,
  comment_count?: number,
  created_at?: string,
  // ... other fields
}
```

#### 2.2 Document Tag Response Structures

- Autocomplete JSON format
- Tag details XML format
- Tag types and counts

#### 2.3 Document Comment Response Structure

- XML structure for comments
- Comment fields and types
- Nested elements

### Phase 3: Create OpenAPI 3.0 Specification

Create `openapi.yaml` or `openapi.json` in project root with:

#### 3.1 API Metadata

- Title: "Kurosearch API"
- Version: Current app version
- Description: Internal API routes for Kurosearch
- Base URL: `/api`

#### 3.2 Endpoint Definitions

**GET /api/posts**

- Parameters:
  - `tags` (query, string) - Space-separated tag list
  - `limit` (query, integer) - Number of results (0 for count)
  - `pid` (query, integer) - Page number
  - `id` (query, integer) - Specific post ID
  - `api_key` (query, string) - Optional API key
  - `user_id` (query, string) - Optional user ID
- Responses:
  - 200: Array of Post objects (JSON)
  - 200: Count XML (when limit=0)
  - 403: Missing x-requested-by header
- Request headers:
  - `x-requested-by: frontend` (required)
- Response schema: Define Post object with all fields
- Examples: Include 2-3 real response examples

**GET /api/tags**

- Parameters:
  - `autocomplete` (query, boolean) - Enable autocomplete mode
  - `q` (query, string) - Search query for autocomplete
  - `name` (query, string) - Tag name for details
  - `api_key` (query, string) - Optional API key
  - `user_id` (query, string) - Optional user ID
- Responses:
  - 200: Array of TagSuggestion objects (JSON) or Tag XML
  - 403: Missing x-requested-by header
- Request headers:
  - `x-requested-by: frontend` (required)
- Response schemas: Define TagSuggestion and TagDetail
- Examples: Include autocomplete and detail examples

**GET /api/comments**

- Parameters:
  - `post_id` (query, integer, required) - Post ID
  - `api_key` (query, string) - Optional API key
  - `user_id` (query, string) - Optional user ID
- Responses:
  - 200: Comments XML
  - 400: Missing post_id
  - 403: Missing x-requested-by header
- Request headers:
  - `x-requested-by: frontend` (required)
- Response schema: Define Comment XML structure
- Examples: Include real comment XML

**POST /api/sync**

- Request body:
  ```json
  {
  	"theme": "string",
  	"blocked": ["string"],
  	"supertags": [[{ "label": "string", "value": "string" }]]
  }
  ```
- Responses:
  - 200: `{ code: "string" }` (6-digit code)
  - 403: Missing x-requested-by header
- Request headers:
  - `x-requested-by: frontend` (required)
- Examples: Include request/response examples

**GET /api/sync/{code}**

- Parameters:
  - `code` (path, string, required) - 6-digit sync code
- Responses:
  - 200: Configuration JSON
  - 404: Code not found/expired/consumed
  - 403: Missing x-requested-by header
- Request headers:
  - `x-requested-by: frontend` (required)
- Examples: Include configuration example

#### 3.3 Schema Definitions

Define reusable schemas:

- `Post` - Complete post object with all fields
- `TagSuggestion` - Autocomplete suggestion object
- `TagDetail` - Tag metadata (XML represented as schema)
- `Comment` - Comment structure (XML represented as schema)
- `SyncConfig` - Sync configuration object
- `Error` - Error response object

#### 3.4 Security Schemes

Document:

- Custom header requirement: `x-requested-by: frontend`
- Optional authentication: `api_key` and `user_id` query params

### Phase 4: Update Mock Data Files

#### 4.1 Update tests/integration/mocks/data/posts.ts

Changes:

- Expand from 3 posts to 10-15 posts
- Include diverse data:
  - Different file types: `.jpg`, `.png`, `.gif`, `.mp4`
  - Different ratings: `s` (safe), `q` (questionable), `e` (explicit)
  - Various dimensions and file sizes
  - Posts with `source` field populated
  - Posts with `parent_id` relationships
  - Posts with varying `comment_count` (0, 1, 5, 10+)
  - Real tag combinations from API responses
  - Different score ranges
- Use real data structure from API responses
- Keep factory function `createMockPost()` for flexibility
- Export named arrays for different scenarios:
  - `mockPosts` - Default diverse set
  - `mockSafePosts` - Only safe-rated posts
  - `mockPostsWithComments` - Posts with comment_count > 0
  - `mockVideoPost` - Example video post
  - `mockGifPost` - Example GIF post

#### 4.2 Update tests/integration/mocks/data/tags.ts

Changes:

- Expand from 5 suggestions to 15-20 suggestions
- Include:
  - Different tag types (general, artist, character, copyright)
  - Varied popularity counts (real data)
  - Tags with special characters
  - Long tag names
  - Tags with underscores vs spaces
- Use real autocomplete response structure
- Add factory function `createMockTagXml()` that generates realistic XML
- Export named arrays:
  - `mockTagSuggestions` - Default diverse set
  - `mockArtistTags` - Artist-specific suggestions
  - `mockCharacterTags` - Character suggestions

#### 4.3 Update tests/integration/mocks/data/comments.ts

Changes:

- Add more varied comment data:
  - Different timestamp formats
  - Various body lengths (short, medium, long)
  - Comments with special characters and HTML entities
  - Different creator names
  - Sequential comment IDs
- Improve XML generation to match real API structure
- Export multiple comment sets:
  - `mockCommentsXml` - Default 3 comments
  - `mockManyCommentsXml` - 10+ comments
  - `mockSingleCommentXml` - Just one comment
  - `mockEmptyCommentsXml` - No comments (existing)

#### 4.4 Update tests/integration/mocks/data/sync.ts

No major changes needed, but verify structure matches any API quirks found.

### Phase 5: Verify Mocker Compatibility

#### 5.1 Review tests/integration/mocks/mocker.ts

- Ensure `mockPosts()` handles new post structures
- Verify tag filtering logic works with expanded data
- Test pagination with more posts
- Confirm comment mocking works with varied data
- Check that all existing tests still work

#### 5.2 Update mocker if needed

- Add helper methods if needed for new scenarios
- Improve filtering logic if real data reveals issues
- Add JSDoc comments documenting behavior

### Phase 6: Validation

#### 6.1 Run Integration Tests

Execute all integration tests:

```bash
pnpm playwright test
```

Verify:

- All tests pass with new mock data
- No breaking changes to test expectations
- Tests cover edge cases revealed by real data

#### 6.2 Review Test Coverage

- Identify any gaps revealed by real API responses
- Consider adding new tests for edge cases
- Document any API quirks or limitations

#### 6.3 Documentation

Update or create:

- README section on mock data
- Comments in mock files explaining data structure
- Examples of using the mocker in tests
- Notes on API limitations or quirks discovered

## Deliverables

1. **OpenAPI Specification** (`openapi.yaml`)
   - Complete API documentation
   - Based on real response structures
   - Includes examples from actual API

2. **Enhanced Mock Data**
   - `tests/integration/mocks/data/posts.ts` - 10-15 diverse posts
   - `tests/integration/mocks/data/tags.ts` - 15-20 varied tags
   - `tests/integration/mocks/data/comments.ts` - Multiple comment scenarios
   - All based on real API response structures

3. **Updated Mocker**
   - `tests/integration/mocks/mocker.ts` - Compatible with new data
   - Enhanced if needed for edge cases

4. **Passing Tests**
   - All integration tests pass with new mocks
   - No regression in existing functionality

5. **Documentation**
   - API quirks and limitations documented
   - Mock usage examples
   - OpenAPI spec serves as API reference

## Notes

- All API queries will target: `https://api.rule34.xxx/`
- Focus on data variety and real-world accuracy
- Maintain backward compatibility with existing tests
- Use real response structures, not idealized versions
- Document any surprising API behavior

## Success Criteria

- [ ] Successfully queried all endpoint variations
- [ ] Created comprehensive OpenAPI 3.0 specification
- [ ] Updated all mock data files with diverse, realistic data
- [ ] All integration tests pass
- [ ] Mock data reflects real API response structures
- [ ] OpenAPI spec includes real examples and complete schemas
- [ ] Documentation updated with findings
