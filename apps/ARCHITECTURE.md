# Distributed MVC Deployment

## Node 1 — View
`apps/frontend` contains React/Next.js pages, components, client validation, and API clients only. It has no MongoDB dependency, no database URI, no API controllers, and no backend route handlers. Browser requests are sent to `NEXT_PUBLIC_API_GATEWAY_URL`.

## Node 2 — API and Controllers
`apps/api-gateway` is the single public backend endpoint. It applies CORS for the View node and forwards the existing API paths without changing request or response payloads:

- `/api/auth/*` → auth-service
- `/api/students/grades*` and `/api/faculty/*` → grade-service
- `/api/profiles/*` → profile-service
- remaining `/api/students/*` → enrollment-service

The gateway contains routing infrastructure only; business rules remain in the existing service/controller code.

## Model layer
Each backend service has `src/models`. Auth, enrollment, and grade retain their existing models. Profile now has explicit MongoDB document contracts in `src/models/ProfileDocuments.ts`. Existing service logic is unchanged.

## Database access
Only backend services contain MongoDB configuration and `MONGODB_URI`. The frontend contains only the gateway URL and cannot connect directly to MongoDB.

## Local ports
- Frontend: 3001
- API gateway: 4000
- Auth: 4100
- Enrollment: 4101
- Grade: 4102
- Profile: 4103
