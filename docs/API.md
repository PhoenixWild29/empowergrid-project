# EmpowerGRID API Documentation

## Overview

The EmpowerGRID API provides RESTful endpoints for managing renewable energy projects, user authentication, and blockchain interactions. All endpoints return JSON responses and use standard HTTP status codes.

## Authentication

Most endpoints require authentication via wallet signature or session token. Include the authorization header:

```
Authorization: Bearer <session-token>
```

## Endpoints

### Authentication

#### POST /api/auth/login
Authenticate user with wallet signature.

**Request Body:**
```json
{
  "walletAddress": "string",
  "signature": "string",
  "message": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": "string",
    "walletAddress": "string",
    "username": "string",
    "role": "FUNDER" | "CREATOR" | "ADMIN",
    "reputation": "number",
    "verified": "boolean"
  },
  "session": {
    "token": "string",
    "expiresAt": "string"
  }
}
```

#### POST /api/auth/logout
Terminate user session.

**Response:**
```json
{
  "success": true
}
```

#### GET /api/auth/session
Get current session information.

**Response:**
```json
{
  "user": {
    "id": "string",
    "walletAddress": "string",
    "username": "string",
    "role": "string"
  },
  "expiresAt": "string"
}
```

### Projects

#### GET /api/projects
List projects with optional filtering and pagination.

**Query Parameters:**
- `status`: ACTIVE | FUNDED | COMPLETED
- `category`: string
- `creatorId`: string
- `search`: string
- `page`: number (default: 1)
- `limit`: number (default: 10)

**Response:**
```json
{
  "projects": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "category": "string",
      "status": "ACTIVE",
      "targetAmount": "number",
      "currentAmount": "number",
      "creator": {
        "id": "string",
        "username": "string",
        "reputation": "number"
      },
      "milestones": [
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "targetValue": "number",
          "rewardAmount": "number",
          "status": "PENDING"
        }
      ],
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

#### POST /api/projects
Create a new project.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "tags": ["string"],
  "targetAmount": "number",
  "milestoneCount": "number",
  "duration": "number",
  "programId": "string",
  "projectPDA": "string",
  "images": ["string"],
  "videoUrl": "string"
}
```

**Response:**
```json
{
  "project": {
    "id": "string",
    "title": "string",
    "status": "ACTIVE",
    "creatorId": "string"
  }
}
```

#### GET /api/projects/[id]
Get detailed project information.

**Response:**
```json
{
  "project": {
    "id": "string",
    "title": "string",
    "description": "string",
    "category": "string",
    "status": "ACTIVE",
    "targetAmount": "number",
    "currentAmount": "number",
    "milestoneCount": "number",
    "duration": "number",
    "creator": {
      "id": "string",
      "username": "string",
      "reputation": "number",
      "verified": "boolean"
    },
    "milestones": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "targetValue": "number",
        "rewardAmount": "number",
        "status": "PENDING",
        "order": "number"
      }
    ],
    "fundingHistory": [
      {
        "id": "string",
        "amount": "number",
        "funderId": "string",
        "transactionHash": "string",
        "createdAt": "string"
      }
    ],
    "comments": [
      {
        "id": "string",
        "content": "string",
        "authorId": "string",
        "createdAt": "string"
      }
    ],
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

#### PUT /api/projects/[id]/fund
Fund a project.

**Request Body:**
```json
{
  "amount": "number",
  "transactionHash": "string"
}
```

**Response:**
```json
{
  "funding": {
    "id": "string",
    "amount": "number",
    "projectId": "string",
    "funderId": "string",
    "transactionHash": "string"
  },
  "project": {
    "id": "string",
    "currentAmount": "number",
    "status": "FUNDED"
  }
}
```

### Users

#### GET /api/users/profile
Get current user profile.

**Response:**
```json
{
  "user": {
    "id": "string",
    "walletAddress": "string",
    "username": "string",
    "email": "string",
    "role": "FUNDER",
    "reputation": "number",
    "verified": "boolean",
    "bio": "string",
    "website": "string",
    "avatar": "string",
    "socialLinks": {},
    "createdAt": "string",
    "updatedAt": "string"
  },
  "stats": {
    "projectsCreated": "number",
    "projectsFunded": "number",
    "totalFunded": "number",
    "successfulProjects": "number"
  }
}
```

#### PUT /api/users/profile
Update user profile.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "bio": "string",
  "website": "string",
  "avatar": "string",
  "socialLinks": {}
}
```

**Response:**
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "bio": "string",
    "updatedAt": "string"
  }
}
```

#### GET /api/users/stats
Get user statistics.

**Response:**
```json
{
  "stats": {
    "projectsCreated": "number",
    "projectsFunded": "number",
    "totalFunded": "number",
    "successfulProjects": "number",
    "totalEarnings": "number",
    "reputation": "number"
  }
}
```

### Blockchain Integration

#### GET /api/meter/latest
Get latest meter readings (simulated).

**Response:**
```json
{
  "timestamp": "string",
  "energyGenerated": "number",
  "co2Offset": "number",
  "location": "string"
}
```

#### POST /api/actions/fund/[projectId]
Solana Actions endpoint for funding projects.

**Request Body:**
```json
{
  "account": "string"
}
```

**Response:**
```json
{
  "type": "action",
  "icon": "string",
  "title": "string",
  "description": "string",
  "label": "string",
  "links": {
    "actions": [
      {
        "label": "Fund Project",
        "href": "string"
      }
    ]
  }
}
```

### Monitoring & Health

#### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "string",
  "version": "string",
  "uptime": "number"
}
```

#### GET /api/metrics
Prometheus metrics endpoint.

**Response:**
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/projects",status="200"} 150

# HELP response_time Response time in milliseconds
# TYPE response_time histogram
response_time_bucket{le="100"} 120
response_time_bucket{le="500"} 180
response_time_bucket{le="1000"} 200
response_time_bucket{le="+Inf"} 200
response_time_count 200
response_time_sum 25000
```

### Search

#### GET /api/search
Search projects and users.

**Query Parameters:**
- `q`: search query
- `type`: "projects" | "users" | "all"
- `limit`: number

**Response:**
```json
{
  "projects": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "category": "string"
    }
  ],
  "users": [
    {
      "id": "string",
      "username": "string",
      "reputation": "number"
    }
  ]
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict
- `INTERNAL_ERROR`: Server error

## Rate Limiting

API endpoints are rate limited:
- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour
- **Blockchain operations**: 50 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1638360000
```

## Webhooks

The API supports webhooks for real-time updates:

### Project Funded Webhook
```json
{
  "event": "project.funded",
  "data": {
    "projectId": "string",
    "amount": "number",
    "funderId": "string",
    "transactionHash": "string"
  }
}
```

### Milestone Completed Webhook
```json
{
  "event": "milestone.completed",
  "data": {
    "projectId": "string",
    "milestoneId": "string",
    "verifiedMetrics": {
      "energyGenerated": "number",
      "co2Offset": "number"
    }
  }
}
```

## SDKs & Libraries

### JavaScript/TypeScript SDK
```javascript
import { EmpowerGRID } from '@empowergrid/sdk';

const client = new EmpowerGRID({
  apiKey: 'your-api-key',
  baseURL: 'https://api.empowergrid.com'
});

// Authenticate
await client.auth.login(wallet);

// Create project
const project = await client.projects.create({
  title: 'Solar Farm Project',
  targetAmount: 10000,
  category: 'Solar'
});
```

## Changelog

### v1.0.0
- Initial API release
- Authentication system
- Project management
- Basic blockchain integration

### v1.1.0
- Enhanced monitoring and logging
- Performance metrics
- Error tracking improvements
- Database optimization

### v1.2.0
- Advanced search functionality
- Webhook support
- Rate limiting
- Enhanced security features