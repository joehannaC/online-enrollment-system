# API Gateway

The gateway is the only backend endpoint used by the browser. It applies CORS for the frontend node and forwards the existing routes without changing payloads or business rules.

## Install and run

```bash
npm install
npm run dev
```

Default URL: `http://localhost:4000`

Start the existing services on ports 4100–4103 before testing the gateway.

## Health check

```bash
curl http://localhost:4000/health
```

## Frontend

Set this in `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:4000
```
