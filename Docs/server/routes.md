# routes.ts

## High-Level Summary

This file defines and registers all **API routes** for the Eco-Haat backend. Currently, it contains a minimal route setup with a single user lookup endpoint, designed to be extended with additional routes.

## Architecture & Logic

The module exports a route registration function that attaches API endpoints to the Express app:

```mermaid
graph LR
    A[registerRoutes Called] --> B[Attach API Endpoints]
    B --> C[GET /api/users/:id]
    C --> D[Return HTTP Server]
```

## Functions/Methods

### `registerRoutes(httpServer: Server, app: Express): Promise<Server>`

**Purpose**: Registers all API routes with the Express application.

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `httpServer` | `Server` | HTTP server instance (for WebSocket setup if needed) |
| `app` | `Express` | Express application instance |

**Returns**: `Promise<Server>` - The HTTP server instance

---

## API Endpoints

### `GET /api/users/:id`

**Purpose**: Retrieve a user by their ID.

**Parameters**:
| Param | Type | Location | Description |
|-------|------|----------|-------------|
| `id` | number | URL path | User's database ID |

**Responses**:

| Status | Condition | Response Body |
|--------|-----------|---------------|
| `200` | User found | User object |
| `400` | Invalid ID | `{ "error": "Invalid ID" }` |
| `404` | User not found | `{ "error": "User not found" }` |

**Example Request**:
```bash
GET /api/users/1
```

**Example Response**:
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "buyer"
}
```

## Dependencies

### External Modules
| Module | Purpose |
|--------|---------|
| `express` | Web framework types |
| `http` | Server type definitions |

### Internal Modules
| Module | Purpose |
|--------|---------|
| `./storage` | Database access layer |

## Extension Points

To add new routes, follow this pattern:

```typescript
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Existing routes...
  
  // Add new routes
  app.get("/api/products", async (req, res) => {
    // Handler logic
  });

  app.post("/api/orders", async (req, res) => {
    // Handler logic
  });

  return httpServer;
}
```

## Notes

> [!NOTE]
> The current routes file is minimal. Most data operations in Eco-Haat are handled directly via Supabase client on the frontend, rather than through this Express server.

> [!TIP]
> The `httpServer` parameter is passed through to support future WebSocket integration (e.g., for real-time notifications).

> [!IMPORTANT]
> Input validation is basic (only checking for valid number). Consider adding more robust validation with Zod or similar for production use.
