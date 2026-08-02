# API Gateway and MVC Separation Changes

1. Added `apps/api-gateway` on port 4000.
2. Gateway CORS allows only `FRONTEND_URL` by default.
3. Existing public paths and request/response payloads are preserved.
4. Frontend API clients now build URLs from `NEXT_PUBLIC_API_GATEWAY_URL`.
5. Removed Next.js rewrites that made the View node proxy directly to services.
6. Frontend contains no MongoDB configuration or backend route handlers.
7. Existing controllers and service business logic were not changed.
8. Added an explicit profile-service model contract; other services retain their existing model folders and schemas.

## Root workspace scripts to add manually

The root `package.json` was not part of the uploaded archive. Add these scripts to it:

```json
{
  "scripts": {
    "dev:gateway": "npm run dev -w @enrollment/api-gateway",
    "typecheck:gateway": "npm run typecheck -w @enrollment/api-gateway"
  }
}
```

Make sure the root workspace pattern includes `apps/*`.
