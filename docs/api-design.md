# QuickNotes API Design

## 1. Overview

QuickNotes is a note-taking application that allows authenticated users to create, view, update, and delete their notes.

This document describes the REST API that the QuickNotes backend team should build. The API uses HTTP methods to perform operations and JSON to exchange data.

**Base URL:** `https://api.quicknotes.com/v1`

All endpoints that access a user's notes require authentication unless stated otherwise. Authenticated requests send a token in the `Authorization` header.

Example:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Each user may access only their own notes. The server must validate requests and enforce permissions before returning or modifying data.

## 2. REST API Endpoints

| Method | Path          | Description                                                                               | Success status   |
| ------ | ------------- | ----------------------------------------------------------------------------------------- | ---------------- |
| GET    | `/notes`      | Retrieves the authenticated user's notes, optionally filtered by category or search text. | `200 OK`         |
| GET    | `/notes/{id}` | Retrieves one note belonging to the authenticated user.                                   | `200 OK`         |
| POST   | `/notes`      | Creates a new note for the authenticated user.                                            | `201 Created`    |
| PUT    | `/notes/{id}` | Replaces all editable fields of an existing note.                                         | `200 OK`         |
| PATCH  | `/notes/{id}` | Updates selected fields of an existing note.                                              | `200 OK`         |
| DELETE | `/notes/{id}` | Deletes a note belonging to the authenticated user.                                       | `204 No Content` |
| POST   | `/auth/login` | Authenticates a user and returns an access token.                                         | `200 OK`         |

### Query parameters

The `GET /notes` endpoint supports optional query parameters:

* `category`: returns notes in the specified category.
* `search`: searches note titles and bodies for matching text.
* `limit`: limits the number of returned notes.
* `offset`: specifies how many records to skip for pagination.

Example:

```http
GET /notes?category=study&limit=10&offset=0
```

This requests the first ten notes in the `study` category.

## 3. Create a Note: POST /notes

This endpoint creates a new note for the authenticated user.

### Request

```http
POST /notes
Content-Type: application/json
Authorization: Bearer <access_token>
```

Request body:

```json
{
  "title": "Revise HTTP methods",
  "body": "Review GET, POST, PUT, PATCH and DELETE.",
  "category": "study"
}
```

The title is required and must not exceed 100 characters. The body is optional. The server obtains the owner of the note from the authenticated user's identity rather than trusting a user ID supplied in the request.

### Successful response

Status: `201 Created`

```json
{
  "id": 42,
  "title": "Revise HTTP methods",
  "body": "Review GET, POST, PUT, PATCH and DELETE.",
  "category": "study",
  "createdAt": "2026-10-19T09:00:00Z",
  "updatedAt": "2026-10-19T09:00:00Z"
}
```

The server assigns the unique ID and timestamps.

## 4. List Notes: GET /notes

This endpoint returns notes belonging to the authenticated user.

### Request

```http
GET /notes?limit=10&offset=0
Authorization: Bearer <access_token>
```

### Successful response

Status: `200 OK`

```json
{
  "items": [
    {
      "id": 42,
      "title": "Revise HTTP methods",
      "body": "Review GET, POST, PUT, PATCH and DELETE.",
      "category": "study",
      "createdAt": "2026-10-19T09:00:00Z",
      "updatedAt": "2026-10-19T09:00:00Z"
    },
    {
      "id": 43,
      "title": "Buy milk",
      "body": "Buy two litres of milk.",
      "category": "personal",
      "createdAt": "2026-10-19T10:00:00Z",
      "updatedAt": "2026-10-19T10:00:00Z"
    }
  ],
  "count": 2,
  "limit": 10,
  "offset": 0
}
```

The `items` array contains the matching notes. The `count`, `limit`, and `offset` fields help the client understand the results and implement pagination.

If the user has no notes, the server returns `200 OK` with an empty `items` array.

## 5. Get One Note: GET /notes/{id}

Retrieves a particular note if it exists and belongs to the authenticated user.

Example request:

```http
GET /notes/42
Authorization: Bearer <access_token>
```

A successful response returns `200 OK` with the note object.

## 6. Replace a Note: PUT /notes/{id}

Replaces the editable fields of an existing note.

Example request:

```http
PUT /notes/42
Content-Type: application/json
Authorization: Bearer <access_token>
```

Request body:

```json
{
  "title": "Updated study notes",
  "body": "Review all five HTTP methods.",
  "category": "study"
}
```

A successful response returns `200 OK` with the updated note object.

## 7. Partially Update a Note: PATCH /notes/{id}

Changes only the specified fields of an existing note.

Example request:

```http
PATCH /notes/42
Content-Type: application/json
Authorization: Bearer <access_token>
```

Request body:

```json
{
  "title": "Revise REST APIs"
}
```

A successful response returns `200 OK` with the updated note object.

## 8. Delete a Note: DELETE /notes/{id}

Deletes a note belonging to the authenticated user.

Example request:

```http
DELETE /notes/42
Authorization: Bearer <access_token>
```

A successful deletion returns `204 No Content`. The response has no body.

## 9. Authenticate a User: POST /auth/login

Authenticates a user and returns an access token.

Example request:

```http
POST /auth/login
Content-Type: application/json
```

Request body:

```json
{
  "email": "amina@example.com",
  "password": "example-password"
}
```

A successful response returns `200 OK`:

```json
{
  "accessToken": "<access_token>",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

This is an illustrative request and response. A real implementation must store passwords securely using an appropriate password-hashing algorithm and must never store them as plain text.

## 10. Error Responses

The API uses standard HTTP status codes to describe unsuccessful requests.

| Status code                 | Meaning                                                                              | Example                                                           |
| --------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `400 Bad Request`           | The request contains invalid data.                                                   | A note has a missing title or a title longer than 100 characters. |
| `401 Unauthorized`          | Authentication is missing or invalid.                                                | The access token is missing or expired.                           |
| `403 Forbidden`             | The user is authenticated but is not permitted to perform an operation.              | The user is not allowed to access a protected resource.           |
| `404 Not Found`             | The endpoint or requested resource does not exist or is not accessible to that user. | A requested note does not exist.                                  |
| `500 Internal Server Error` | An unexpected server error occurred.                                                 | A database operation fails unexpectedly.                          |

### Example error body

The API uses a consistent JSON structure for error responses.

For example, a `400 Bad Request` response might contain:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required and must not exceed 100 characters."
  }
}
```

A `401 Unauthorized` response might contain:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid access token is required."
  }
}
```

A `403 Forbidden` response might contain:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not permitted to perform this operation."
  }
}
```

A `404 Not Found` response might contain:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested note was not found."
  }
}
```

A `500 Internal Server Error` response might contain:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

Error responses must not expose passwords, access tokens, database credentials, or sensitive internal implementation details.

## 11. Security and Validation

The backend must authenticate requests, verify that users can access only their own notes, validate request bodies, and use parameterised database queries.

The API should use HTTPS to protect data in transit. Access tokens should expire, and sensitive information must not be included in error messages.

## 12. Conclusion

The QuickNotes REST API separates the client interface from the backend services. Consistent resource URLs, HTTP methods, status codes, and JSON formats make the API easier to use, test, maintain, and extend.
