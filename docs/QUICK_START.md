# Quick Start Guide — Morocco360 QR Scanning System

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)

---

## 1. Clone & Setup

```bash
git clone https://github.com/Keltoummalouki/Morocco360.git
cd Morocco360
```

---

## 2. Backend Setup

### Install dependencies

```bash
cd api
npm install
```

### Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=morocco360
DB_PASS=morocco360
DB_NAME=morocco360

# Generate these with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_ACCESS_SECRET=<your-32-char-secret>
JWT_REFRESH_SECRET=<your-32-char-secret>
QR_HMAC_SECRET=<your-32-char-secret>

# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Start database

```bash
cd ..  # Back to root
docker compose up -d
```

### Run migrations & seed

```bash
cd api
npm run migration:run
npm run seed
```

### Start API

```bash
npm run start:dev
```

API running at: `http://localhost:3001`

---

## 3. Test Accounts

The seeder creates these accounts:

| Email | Password | Role |
|-------|----------|------|
| admin@morocco360.ma | Admin1234 | ADMIN |
| organizer@morocco360.ma | Organizer1234 | ORGANIZER |
| staff@morocco360.ma | Staff1234 | STAFF |
| user@morocco360.ma | User1234 | USER |

---

## 4. API Documentation

Open Swagger docs: `http://localhost:3001/api/docs`

---

## 5. Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "storage": { "status": "up" }
  }
}
```

---

## 6. Test Scanner Flow

### Step 1: Login as ORGANIZER

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "organizer@morocco360.ma",
    "password": "Organizer1234"
  }'
```

Save the `accessToken` from response.

### Step 2: Get assigned events

```bash
curl http://localhost:3001/organizer/events \
  -H "Authorization: Bearer <your-access-token>"
```

### Step 3: Get event stats

```bash
curl http://localhost:3001/organizer/events/1/stats \
  -H "Authorization: Bearer <your-access-token>"
```

### Step 4: Scan a ticket

```bash
curl -X POST http://localhost:3001/scanner/scan \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "<qr-code-from-seeded-ticket>",
    "eventId": "1",
    "deviceInfo": "Test Device"
  }'
```

---

## 7. Frontend Setup (Next.js)

```bash
cd web
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Start dev server:

```bash
npm run dev
```

Frontend running at: `http://localhost:3000`

---

## 8. Key Endpoints

### Authentication
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login
- POST `/auth/refresh` - Refresh tokens
- POST `/auth/logout` - Logout

### Scanner
- POST `/scanner/scan` - Scan QR code
- GET `/scanner/events` - Get assigned events

### Organizer
- GET `/organizer/events` - Get events with stats
- GET `/organizer/events/:id/stats` - Detailed stats
- GET `/organizer/users/search` - Search users
- POST `/organizer/events/:id/staff` - Assign staff
- DELETE `/organizer/events/:id/staff/:userId` - Remove staff
- GET `/organizer/events/:id/staff` - List staff
- GET `/organizer/events/:id/attendees/export` - Export CSV

### Health
- GET `/health` - Full health check
- GET `/health/ready` - Readiness probe
- GET `/health/live` - Liveness probe

---

## 9. Common Issues

### "Cannot find module" error

```bash
cd api
rm -rf node_modules package-lock.json
npm install
```

### Database connection failed

Check Docker container is running:
```bash
docker compose ps
```

Restart if needed:
```bash
docker compose restart
```

### Config validation error

Make sure all required env vars are set in `.env`:
- `QR_HMAC_SECRET` (32+ chars)
- `JWT_ACCESS_SECRET` (32+ chars)
- `JWT_REFRESH_SECRET` (32+ chars)
- Database credentials

### Port already in use

Change port in `.env`:
```env
PORT=3002
```

---

## 10. Development Workflow

### Run tests

```bash
cd api
npm run test           # Unit tests
npm run test:cov       # With coverage
npm run test:e2e       # E2E tests
```

### Check diagnostics

```bash
npm run lint           # ESLint
npm run format         # Prettier
npm run build          # TypeScript build
```

### Database commands

```bash
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert
npm run seed
```

---

## 11. Production Deployment

### Build

```bash
cd api
npm run build
```

### Run production

```bash
NODE_ENV=production npm run start:prod
```

### Docker

```bash
docker build -t morocco360-api ./api
docker run -p 3001:3001 --env-file ./api/.env morocco360-api
```

---

## 12. Documentation

- [QR Scanning System](./QR_SCANNING_SYSTEM.md) - Complete system documentation
- [Best Practices](./BEST_PRACTICES_IMPLEMENTATION.md) - Implementation details
- [API Docs](http://localhost:3001/api/docs) - Swagger/OpenAPI

---

## Support

For issues:
1. Check logs: `docker compose logs api`
2. Check health: `http://localhost:3001/health`
3. Check Swagger: `http://localhost:3001/api/docs`
4. Review documentation in `docs/`

---

**Happy coding! 🚀**
