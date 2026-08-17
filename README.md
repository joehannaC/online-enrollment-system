Dependencies
-
-
-


Root:
```bash
npm i or npm install
```

API gateway:
```bash
cd apps/api-gateway
npm install socket.io jsonwebtoken
npm install -D @types/jsonwebtoken
```

Auth:
```bash
npm run dev:auth
```

Enrollment:
```bash
npm run dev:enrollment
```

Grade:
```bash
npm run dev:grade
```

Profile:
```bash
npm run build --prefix packages/shared
npm run dev:profile
```

Frontend:
```bash
cd apps/frontend
npm install socket.io-client
npm run dev:frontend
```