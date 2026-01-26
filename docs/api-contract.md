# API Contract

All API responses follow a strict envelope format to ensure consistency across the platform.

## Response Format

Every API response is a JSON object with the following structure:

```json
{
  "data": <any | null>,
  "meta": {
    "requestId": <string>,
    "pagination": <PaginationObject | undefined>
  },
  "error": <ErrorObject | null>
}
```

### Fields

- **`data`**: The result of the operation. Can be an object, array, or null. Present on success.
- **`meta`**: Metadata about the request.
  - `requestId`: A unique identifier for the request (used for tracing/debugging).
  - `pagination`: (Optional) Pagination details for list endpoints.
- **`error`**: Error details. Present only if the request failed.

### Pagination Object

If the response is a list of items, `meta.pagination` will contain:

```json
{
  "page": <number>,       // Current page number (1-indexed)
  "pageSize": <number>,   // Items per page
  "total": <number>,      // Total number of items
  "totalPages": <number>  // Total number of pages
}
```

### Error Object

```json
{
  "code": <string>,       // specific error code (e.g., "VALIDATION_ERROR", "NOT_FOUND")
  "message": <string>,    // Human-readable message (safe for display)
  "details": <any>        // (Optional) Detailed validation errors or context
}
```

## HTTP Status Codes

| Code | Meaning | Description |
| :--- | :--- | :--- |
| **200** | OK | Request successful. |
| **400** | Bad Request | Validation failed or invalid input. |
| **401** | Unauthorized | Authentication required or invalid token. |
| **403** | Forbidden | Authenticated but access denied. |
| **404** | Not Found | Resource not found. |
| **429** | Too Many Requests | Rate limit exceeded. |
| **500** | Internal Server Error | Unexpected server error. |

## Examples

### Success: Get Item

```json
// GET /api/aides/slug-123
{
  "data": {
    "id": "1",
    "slug": "slug-123",
    "title": "Aide Title"
  },
  "meta": {
    "requestId": "req_12345"
  },
  "error": null
}
```

### Success: List Items with Pagination

```json
// GET /api/aides?page=1&pageSize=20
{
  "data": [
    { "id": "1", "title": "Aide 1" },
    { "id": "2", "title": "Aide 2" }
  ],
  "meta": {
    "requestId": "req_67890",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  },
  "error": null
}
```

### Error: Validation Failed

```json
// POST /api/appointments
{
  "data": null,
  "meta": {
    "requestId": "req_abcde"
  },
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "path": ["email"], "message": "Invalid email format" }
    ]
  }
}
```
