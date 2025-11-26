---
title: API Documentation Example
description: Use eziwiki for beautiful API documentation
---

# API Documentation Example

![eziwiki](/images/eziwiki.png)

eziwiki is perfect for creating clean, organized API documentation.

## Example Structure

```typescript
navigation: [
  {
    name: '🏠 Introduction',
    path: 'intro',
  },
  {
    name: '🚀 Getting Started',
    color: '#dbeafe',
    children: [
      { name: 'Authentication', path: 'getting-started/authentication' },
      { name: 'Quick Start', path: 'getting-started/quick-start' },
      { name: 'Rate Limiting', path: 'getting-started/rate-limiting' },
    ],
  },
  {
    name: '📡 API Reference',
    color: '#fef3c7',
    children: [
      {
        name: 'Users',
        children: [
          { name: 'List Users', path: 'api/users/list' },
          { name: 'Get User', path: 'api/users/get' },
          { name: 'Create User', path: 'api/users/create' },
          { name: 'Update User', path: 'api/users/update' },
          { name: 'Delete User', path: 'api/users/delete' },
        ],
      },
      {
        name: 'Posts',
        children: [
          { name: 'List Posts', path: 'api/posts/list' },
          { name: 'Get Post', path: 'api/posts/get' },
          { name: 'Create Post', path: 'api/posts/create' },
          { name: 'Update Post', path: 'api/posts/update' },
          { name: 'Delete Post', path: 'api/posts/delete' },
        ],
      },
    ],
  },
  {
    name: '🔧 SDKs',
    color: '#e9d5ff',
    children: [
      { name: 'JavaScript', path: 'sdks/javascript' },
      { name: 'Python', path: 'sdks/python' },
      { name: 'Ruby', path: 'sdks/ruby' },
    ],
  },
  {
    name: '📚 Guides',
    color: '#d1fae5',
    children: [
      { name: 'Webhooks', path: 'guides/webhooks' },
      { name: 'Pagination', path: 'guides/pagination' },
      { name: 'Error Handling', path: 'guides/error-handling' },
    ],
  },
];
```

## Example API Endpoint Page

```markdown
---
title: List Users
description: Retrieve a list of users
---

# List Users

Retrieve a paginated list of users.

## Endpoint

\`\`\`
GET /api/v1/users
\`\`\`

## Authentication

Requires a valid API key in the `Authorization` header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Query Parameters

| Parameter | Type    | Required | Description                                   |
| --------- | ------- | -------- | --------------------------------------------- |
| `page`    | integer | No       | Page number (default: 1)                      |
| `limit`   | integer | No       | Items per page (default: 20, max: 100)        |
| `sort`    | string  | No       | Sort field (default: `created_at`)            |
| `order`   | string  | No       | Sort order: `asc` or `desc` (default: `desc`) |
| `status`  | string  | No       | Filter by status: `active`, `inactive`        |

## Request Example

\`\`\`bash
curl -X GET "https://api.example.com/v1/users?page=1&limit=20" \\
-H "Authorization: Bearer YOUR_API_KEY"
\`\`\`

\`\`\`javascript
const response = await fetch('https://api.example.com/v1/users?page=1&limit=20', {
headers: {
'Authorization': 'Bearer YOUR_API_KEY'
}
});

const data = await response.json();
\`\`\`

\`\`\`python
import requests

response = requests.get(
'https://api.example.com/v1/users',
params={'page': 1, 'limit': 20},
headers={'Authorization': 'Bearer YOUR_API_KEY'}
)

data = response.json()
\`\`\`

## Response

### Success Response (200 OK)

\`\`\`json
{
"data": [
{
"id": "usr_1234567890",
"email": "alice@example.com",
"name": "Alice Johnson",
"status": "active",
"created_at": "2024-01-15T10:30:00Z",
"updated_at": "2024-01-15T10:30:00Z"
},
{
"id": "usr_0987654321",
"email": "bob@example.com",
"name": "Bob Smith",
"status": "active",
"created_at": "2024-01-14T15:20:00Z",
"updated_at": "2024-01-14T15:20:00Z"
}
],
"pagination": {
"page": 1,
"limit": 20,
"total": 150,
"pages": 8
}
}
\`\`\`

### Response Fields

| Field               | Type    | Description                         |
| ------------------- | ------- | ----------------------------------- |
| `data`              | array   | Array of user objects               |
| `data[].id`         | string  | Unique user identifier              |
| `data[].email`      | string  | User email address                  |
| `data[].name`       | string  | User full name                      |
| `data[].status`     | string  | User status: `active` or `inactive` |
| `data[].created_at` | string  | ISO 8601 timestamp                  |
| `data[].updated_at` | string  | ISO 8601 timestamp                  |
| `pagination`        | object  | Pagination metadata                 |
| `pagination.page`   | integer | Current page number                 |
| `pagination.limit`  | integer | Items per page                      |
| `pagination.total`  | integer | Total number of items               |
| `pagination.pages`  | integer | Total number of pages               |

## Error Responses

### 401 Unauthorized

\`\`\`json
{
"error": {
"code": "unauthorized",
"message": "Invalid or missing API key"
}
}
\`\`\`

### 429 Too Many Requests

\`\`\`json
{
"error": {
"code": "rate_limit_exceeded",
"message": "Rate limit exceeded. Try again in 60 seconds."
}
}
\`\`\`

### 500 Internal Server Error

\`\`\`json
{
"error": {
"code": "internal_error",
"message": "An unexpected error occurred"
}
}
\`\`\`

## Rate Limiting

- **Rate Limit**: 100 requests per minute
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests per minute
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

## Related Endpoints

- [Get User](/api/users/get) - Get a single user by ID
- [Create User](/api/users/create) - Create a new user
- [Update User](/api/users/update) - Update an existing user
```

## Authentication Page Example

```markdown
---
title: Authentication
description: Learn how to authenticate API requests
---

# Authentication

All API requests require authentication using an API key.

## Getting an API Key

1. Log in to your dashboard
2. Navigate to Settings → API Keys
3. Click "Create API Key"
4. Copy and securely store your key

⚠️ **Important**: Keep your API key secret. Never commit it to version control.

## Using Your API Key

Include your API key in the `Authorization` header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Example Requests

### cURL

\`\`\`bash
curl -X GET "https://api.example.com/v1/users" \\
-H "Authorization: Bearer YOUR_API_KEY"
\`\`\`

### JavaScript

\`\`\`javascript
const response = await fetch('https://api.example.com/v1/users', {
headers: {
'Authorization': 'Bearer YOUR_API_KEY'
}
});
\`\`\`

### Python

\`\`\`python
import requests

headers = {'Authorization': 'Bearer YOUR_API_KEY'}
response = requests.get('https://api.example.com/v1/users', headers=headers)
\`\`\`

## Environment Variables

Store your API key in environment variables:

\`\`\`bash

# .env

API_KEY=your_api_key_here
\`\`\`

\`\`\`javascript
const apiKey = process.env.API_KEY;
\`\`\`

## Security Best Practices

- ✅ Use HTTPS for all requests
- ✅ Store API keys in environment variables
- ✅ Rotate keys regularly
- ✅ Use different keys for development and production
- ❌ Never commit API keys to version control
- ❌ Never expose API keys in client-side code

## Error Responses

### 401 Unauthorized

Missing or invalid API key:

\`\`\`json
{
"error": {
"code": "unauthorized",
"message": "Invalid or missing API key"
}
}
\`\`\`

### 403 Forbidden

Valid key but insufficient permissions:

\`\`\`json
{
"error": {
"code": "forbidden",
"message": "Insufficient permissions"
}
}
\`\`\`
```

## Benefits for API Docs

### Clear Structure

Organize endpoints by resource with nested navigation.

### Code Examples

Show examples in multiple languages with syntax highlighting.

### Searchable

Users can quickly find what they need.

### Version Control

Track changes to your API documentation in Git.

### Easy Updates

Update docs as fast as you update your API.

## Next Steps

- [Create Your First Wiki](/getting-started/first-wiki)
- [Learn About Code Blocks](/content/code-blocks)
- [Deploy Your Docs](/deployment/static-export)
