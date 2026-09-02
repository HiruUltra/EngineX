# EngineX

EngineX is a production-oriented demo of an Uber-style roadside vehicle assistance platform for Sri Lankan users. It has separate Next.js and Express applications, MongoDB persistence, JWT auth with refresh cookies, role-based APIs, Socket.IO events, GeoJSON mechanic assignment, quotes, test payments and role dashboards.

## Structure

```text
frontend/                 Next.js App Router mobile-first web app
frontend/public/brand/    Uploaded EngineX logo asset
backend/                  Express, Socket.IO and MongoDB API
backend/src/models/       Mongoose models and geospatial indexes
backend/src/routes/       Versioned REST routes under /api/v1
backend/src/services/     Auth, assignment, status and payment workflow logic
backend/tests/            Vitest workflow tests
docker-compose.yml        MongoDB, backend and frontend development stack
```

## Environment

Create local `.env` files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Important values:

```env
MONGODB_URI=mongodb://localhost:27017/enginex
JWT_ACCESS_SECRET=replace_with_secure_value
JWT_REFRESH_SECRET=replace_with_secure_value
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_MAP_PROVIDER=osm
PAYMENT_PROVIDER=mock
```

Production deployments still need user-owned credentials for MongoDB hosting, SMTP, Cloudinary and a Sri Lankan payment gateway such as PayHere.

## Run

```bash
npm install
npm run seed
npm run dev
```

Frontend: `http://localhost:3000`
Backend health: `http://localhost:5000/api/v1/health`
Swagger shell: `http://localhost:5000/api/docs`

Docker:

```bash
docker compose up --build
```

## Demo Accounts

All seeded accounts use `EngineXDemo123!`.

```text
admin@enginex.lk       ADMIN
manager@enginex.lk     MANAGER
mechanic@enginex.lk    MECHANIC
customer@enginex.lk    CUSTOMER
```

## Verification

Run:

```bash
npm run lint
npm run test
npm run build
```

The test suite covers registration/login, vehicle ownership, request creation with nearby mechanic assignment, and invalid status transition protection. The UI includes dark/light theme support, responsive layouts, live tracking through Socket.IO, OSM maps, development mock payments and clearly marked demo content.
