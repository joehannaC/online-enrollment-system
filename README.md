# Overview of the Online Enrollment System

The Online Enrollment System is a distributed web-based enrollment platform designed to manage student enrollment, academic records, grades, faculty grade submission, student profiles, and real-time updates.

The system follows a service-oriented/distributed architecture where the frontend communicates with an API Gateway, which routes requests to independent backend services. The backend services share the MongoDB persistence layer configured as a three-member replica set for database redundancy and fault tolerance. 

## Dependencies

This project consists of the following applications:

* **API Gateway** — Express + Socket.IO
* **Auth Service** — Express + gRPC + MongoDB
* **Enrollment Service** — Express + gRPC + MongoDB
* **Grade Service** — Express + gRPC + MongoDB
* **Profile Service** — Express + gRPC + MongoDB
* **Frontend** — Next.js + React + Socket.IO Client
* **Shared Package** — Shared types and utilities used by the services

All application dependencies are already defined in their respective `package.json` files.

## Creating environment for each services

## Frontend Environment

Create or update:

```text
apps/frontend/.env.local
```
Format / Structure of .env can be found in apps/README.md

The frontend communicates with the backend through the API Gateway.


## Api-Gateway Environment

Create or update:

```text
apps/api-gateway/.env
```

Format / Structure of .env can be found in apps/README.md

## Auth Service Environment

Create or update:

```text
apps/auth-service/.env
```

Format / Structure of .env can be found in apps/README.md
## Enrollment Service Environment

Create or update:

```text
apps/enrollment-service/.env
```

Format / Structure of .env can be found in apps/README.md

## Grade Service Environment

Create or update:

```text
apps/grade-service/.env
```

Format / Structure of .env can be found in apps/README.md

## Profile Service Environment

Create or update:

```text
apps/profile-service/.env
```

Format / Structure of .env can be found in apps/README.md

### Install Dependencies

From the project root:

```bash
npm install
```

For each application, install its dependencies:

#### API Gateway

```bash
cd apps/api-gateway
npm install
```

#### Auth Service

```bash
cd apps/auth-service
npm install
```

#### Enrollment Service

```bash
cd apps/enrollment-service
npm install
```

#### Grade Service

```bash
cd apps/grade-service
npm install
```

#### Profile Service

```bash
cd apps/profile-service
npm install
```

#### Frontend

```bash
cd apps/frontend
npm install
```
---

## Running the Services

Open separate terminal windows for each service.

### API Gateway

```bash
cd apps/api-gateway
npm run dev
```

### Auth Service

```bash
cd apps/auth
npm run dev
```

### Enrollment Service

```bash
cd apps/enrollment
npm run dev
```

### Grade Service

```bash
cd apps/grade
npm run dev
```

### Profile Service

```bash
cd apps/profile
npm run dev
```

### Frontend

```bash
cd apps/frontend
npm run dev
```


## Recommended Startup Order

Start the backend services first:

```text
1. Auth Service
2. Enrollment Service
3. Grade Service
4. Profile Service
5. API Gateway
6. Frontend
```

The API Gateway acts as the browser-facing backend endpoint and forwards requests to the backend services.

---

## Build Shared Package

If the shared package is used by the services, build it before starting the applications:

```bash
npm run build --prefix packages/shared
```

Then start the services normally.