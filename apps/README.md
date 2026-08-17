# Environment setup for each services

## API-GATEWAY (.env)

```text
NODE_ENV=development
SERVICE_NAME=api-gateway

HTTP_HOST=0.0.0.0
HTTP_PORT=4000

FRONTEND_URL=http://localhost:3001 -> replace-with-frontend-vm-ip-address
FRONTEND_URLS=http://localhost:3001,https://h61zcjl1-3001.asse.devtunnels.ms -> replace-with-frontend-vm-ip-address

AUTH_SERVICE_URL=http://127.0.0.1:4100 -> replace-with-auth-service-vm-ip-address
ENROLLMENT_SERVICE_URL=http://127.0.0.1:4101 -> replace-with-enrollment-service-vm-ip-address
GRADE_SERVICE_URL=http://127.0.0.1:4102 -> replace-with-grade-service-vm-ip-address
PROFILE_SERVICE_URL=http://127.0.0.1:4103 -> replace-with-profile-service-vm-ip-address

JWT_ACCESS_SECRET=replace-me-with-a-secure-secret-key
JWT_SECRET=replace-me-with-a-secure-secret-key

JWT_ISSUER=online-enrollment-auth-service
JWT_AUDIENCE=online-enrollment-system

PROXY_TIMEOUT_MS=15000

REALTIME_INTERNAL_SECRET=replace-me-with-a-long-random-secret
```


## AUTH SERVICE (.env)

```text
NODE_ENV=development

HTTP_HOST=0.0.0.0
HTTP_PORT=4100

GRPC_HOST=0.0.0.0
GRPC_PORT=5100

MONGODB_URI=mongodb://mongo1:27117,mongo2:27118,mongo3:27119/online_enrollment?replicaSet=enrollment-rs

JWT_ACCESS_SECRET=replace-me-with-a-secure-secret-key
JWT_SECRET=replace-me-with-a-secure-secret-key
JWT_ISSUER=online-enrollment-auth-service
JWT_AUDIENCE=online-enrollment-system


JWT_EXPIRES_IN=1h
JWT_ACCESS_EXPIRES_IN=1h

FRONTEND_URL=http://localhost:3001 -> replace-with-frontend-vm-ip-address
```

## ENROLLMENT SERVICE (.env)

```text
NODE_ENV=development

SERVICE_NAME=enrollment-service

HTTP_HOST=0.0.0.0
HTTP_PORT=4101

GRPC_HOST=0.0.0.0
GRPC_PORT=5101

AUTH_GRPC_ADDRESS=localhost:5100 -> replace-with-auth-service-vm-ip-address

MONGODB_URI=mongodb://mongo1:27117,mongo2:27118,mongo3:27119/online_enrollment?replicaSet=enrollment-rs&retryWrites=true&w=majority
MONGODB_DATABASE=online_enrollment

JWT_SECRET=replace-me-with-a-secure-secret-key
JWT_ACCESS_SECRET=replace-me-with-a-secure-secret-key
JWT_ISSUER=online-enrollment-auth-service
JWT_AUDIENCE=online-enrollment-system

FRONTEND_URL=http://localhost:3001 -> replace-with-frontend-vm-ip-address

ENROLLMENT_MAX_CONCURRENT_SUBMISSIONS=24

API_GATEWAY_URL=http://127.0.0.1:4000 -> replace-with-api-gateway-vm-ip-address

REALTIME_INTERNAL_SECRET=replace-me-with-the-same-long-random-secret
```

## GRADE SERVICE (.env)

```text
NODE_ENV=development

SERVICE_NAME=grade-service

HTTP_HOST=0.0.0.0
HTTP_PORT=4102

GRPC_HOST=0.0.0.0
GRPC_PORT=5102

AUTH_GRPC_ADDRESS=localhost:5100 -> replace-with-auth-service-vm-ip-address
ENROLLMENT_GRPC_ADDRESS=localhost:5101 -> replace-with-enrollment-service-vm-ip-address

MONGODB_URI=mongodb://mongo1:27117,mongo2:27118,mongo3:27119/online_enrollment?replicaSet=enrollment-rs&retryWrites=true&w=majority
MONGODB_DATABASE=online_enrollment

JWT_ACCESS_SECRET=replace-me-with-a-secure-secret-key
JWT_SECRET=replace-me-with-a-secure-secret-key
JWT_ISSUER=online-enrollment-auth-service
JWT_AUDIENCE=online-enrollment-system

FRONTEND_URL=http://localhost:3001 -> replace-with-frontend-vm-ip-address

API_GATEWAY_URL=http://127.0.0.1:4000 -> replace-with-api-gateway-vm-ip-address

REALTIME_INTERNAL_SECRET=replace-me-with-the-same-long-random-secret
```

## PROFILE SERVICE (.env)

```text
NODE_ENV=development

SERVICE_NAME=profile-service

HTTP_HOST=0.0.0.0
HTTP_PORT=4103

GRPC_HOST=0.0.0.0
GRPC_PORT=5103

MONGODB_URI=mongodb://mongo1:27117,mongo2:27118,mongo3:27119/online_enrollment?replicaSet=enrollment-rs&retryWrites=true&w=majority
MONGODB_DATABASE=online_enrollment

JWT_ACCESS_SECRET=replace-me-with-a-secure-secret-key
JWT_SECRET=replace-me-with-a-secure-secret-key
JWT_ISSUER=online-enrollment-auth-service
JWT_AUDIENCE=online-enrollment-system

FRONTEND_URL=http://localhost:3001 -> replace-with-frontend-vm-ip-addr
```

## FRONTEND (.env.local)
NEXT_PUBLIC_API_GATEWAY_URL=http://127.0.0.1:4000 -> replace-with-api-gateway-vm-ip-address
