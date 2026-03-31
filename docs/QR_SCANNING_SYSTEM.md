# Morocco360 — QR Scanning System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Roles & Permissions](#roles--permissions)
3. [QR Code Security](#qr-code-security)
4. [API Endpoints](#api-endpoints)
5. [Scanner Setup](#scanner-setup)
6. [Best Practices](#best-practices)

---

## Overview

The QR Scanning System enables secure, real-time ticket validation for events. Key features:

- **HMAC-SHA256 signed QR codes** — prevents forgery
- **Pessimistic locking** — prevents double-scan race conditions
- **Per-event staff assignment** — granular access control
- **Full audit trail** — every scan logged with timestamp, device, result
- **Rate limiting** — 30 scans/minute per user
- **Offline detection** — frontend warns when network unavailable

---

## Roles & Permissions

### Role Matrix

| Role | Can Scan | Assign Staff | View Stats | Export CSV | Manage Events |
|------|----------|--------------|------------|------------|---------------|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ORGANIZER** | ✅ | ✅ | ✅ | ✅ | ✅ (own events) |
| **STAFF** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **USER** | ❌ | ❌ | ❌ | ❌ | ❌ |

### Role Descriptions

**ADMIN**
- Full system access
- Can manage all events
- Can assign/remove staff globally

**ORGANIZER**
- Creates and manages their own events
- Assigns STAFF to their events
- Views stats and exports attendee lists
- Can scan tickets at their events

**STAFF**
- Scans tickets at assigned events only
- Views basic event stats
- Cannot assign other staff
- Cannot export data

**USER**
- Regular attendee
- Purchases tickets
- No scanning privileges

---

## QR Code Security

### Payload Structure

Each QR code contains a JSON payload with HMAC signature:

```json
{
  "t": "123",        // ticket ID
  "e": "456",        // event ID
  "sig": "abc123..."  // HMAC-SHA256 signature
}
```

The payload is base64url-encoded and embedded in the QR image.

### Signature Generation

```typescript
const payload = JSON.stringify({ t: ticketId, e: eventId });
const sig = crypto
  .createHmac('sha256', process.env.QR_HMAC_SECRET)
  .update(payload)
  .digest('hex');
```

### Verification Process

1. Decode base64url payload
2. Extract `t`, `e`, `sig`
3. Recompute HMAC using same secret
4. Compare using `crypto.timingSafeEqual()` (prevents timing attacks)
5. If mismatch → reject immediately (no DB query)

### Security Properties

- **Unforgeable**: Cannot create valid QR without secret key
- **Tamper-proof**: Any modification invalidates signature
- **Event-bound**: QR for Event A cannot be used at Event B
- **Timing-safe**: Comparison resistant to timing attacks

---

## API Endpoints

### Scanner Endpoints

#### POST `/scanner/scan`
Scan a QR code ticket.

**Auth**: JWT Bearer token (ORGANIZER, STAFF, ADMIN)  
**Rate Limit**: 30 requests/minute  
**Guards**: EventAccessGuard (checks staff assignment)

**Request Body**:
```json
{
  "qrCode": "eyJ0IjoiMTIzIiwiZSI6IjQ1NiIsInNpZyI6ImFiYzEyMyJ9",
  "eventId": "456",
  "deviceInfo": "iPhone 13 Pro / Safari 15.0"
}
```

**Response (SUCCESS)**:
```json
{
  "result": "SUCCESS",
  "holderName": "John Doe",
  "category": "VIP",
  "eventName": "Festival Gnaoua 2026",
  "seat": "A12"
}
```

**Response (ALREADY_USED)**:
```json
{
  "result": "ALREADY_USED",
  "message": "Billet déjà utilisé",
  "checkedAt": "2026-03-27T14:30:00Z"
}
```

**Other Results**: `INVALID`, `WRONG_EVENT`, `EXPIRED`

---

#### GET `/scanner/events`
Get events assigned to current scanner.

**Auth**: JWT Bearer token (ORGANIZER, STAFF, ADMIN)

**Response**:
```json
[
  {
    "id": 1,
    "name": "Festival Gnaoua 2026",
    "date": "2026-06-15T20:00:00Z",
    "venue": "Place Moulay Hassan",
    "coverImage": "https://example.com/image.jpg"
  }
]
```

---

### Organizer Endpoints

#### GET `/organizer/events`
Get all events assigned to current user with stats.

**Auth**: JWT Bearer token (ORGANIZER, STAFF, ADMIN)

**Response**:
```json
[
  {
    "id": 1,
    "title": "Festival Gnaoua 2026",
    "date_start": "2026-06-15T20:00:00Z",
    "location_name": "Place Moulay Hassan",
    "city": "Essaouira",
    "image_url": "https://example.com/image.jpg",
    "staffRole": "ORGANIZER",
    "stats": {
      "totalTickets": 500,
      "checkedIn": 247,
      "pending": 203,
      "cancelled": 50
    }
  }
]
```

---

#### GET `/organizer/events/:eventId/stats`
Get detailed stats for an event.

**Auth**: JWT Bearer token (ORGANIZER, STAFF, ADMIN)  
**Access**: Must be assigned to this event

**Response**:
```json
{
  "capacity": 500,
  "sold": 450,
  "checkedIn": 247,
  "remaining": 50,
  "byCategory": [
    {
      "name": "VIP",
      "total": 100,
      "checked": 45,
      "remaining": 55
    },
    {
      "name": "Standard",
      "total": 350,
      "checked": 202,
      "remaining": 148
    }
  ]
}
```

---

#### GET `/organizer/users/search`
Search users by email or username for staff assignment.

**Auth**: JWT Bearer token (ORGANIZER, ADMIN)

**Query Params**:
- `email` (optional): Email to search (partial match)
- `username` (optional): Username to search (partial match)

**Response**:
```json
[
  {
    "id": 42,
    "email": "john@example.com",
    "username": "john_doe",
    "full_name": "John Doe"
  }
]
```

---

#### POST `/organizer/events/:eventId/staff`
Assign staff to an event.

**Auth**: JWT Bearer token (ORGANIZER, ADMIN only)

**Request Body**:
```json
{
  "userId": 42,
  "staffRole": "STAFF"
}
```

**Response**: EventStaff entity

---

#### DELETE `/organizer/events/:eventId/staff/:userId`
Remove staff from an event.

**Auth**: JWT Bearer token (ORGANIZER, ADMIN only)

---

#### GET `/organizer/events/:eventId/staff`
Get all staff assigned to an event.

**Auth**: JWT Bearer token (ORGANIZER, STAFF, ADMIN)

**Response**:
```json
[
  {
    "id": "uuid-here",
    "staffRole": "STAFF",
    "assignedAt": "2026-03-15T10:00:00Z",
    "user": {
      "id": 42,
      "username": "john_doe",
      "email": "john@example.com",
      "full_name": "John Doe"
    }
  }
]
```

---

#### GET `/organizer/events/:eventId/attendees/export`
Export attendees as CSV.

**Auth**: JWT Bearer token (ORGANIZER, ADMIN only)

**Response**: CSV file download
```csv
holderName,email,category,status,checkedAt,qrCode
"John Doe","john@example.com","VIP","CHECKED","2026-03-27T14:30:00Z","eyJ0IjoiM****"
```

---

### Health Check Endpoints

#### GET `/health`
Full health check (database, memory, disk).

**Response**:
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

#### GET `/health/ready`
Readiness probe (database only).

#### GET `/health/live`
Liveness probe (always returns 200).

---

## Scanner Setup

### Mobile Browser Requirements

The scanner requires:
- **HTTPS** (camera access blocked on HTTP)
- **Camera permission** granted by user
- **Modern browser**: Safari 14+, Chrome 90+, Firefox 88+

### Frontend Implementation

The scanner page (`/dashboard/scanner/[eventId]`) uses:

**Library**: `@zxing/browser` (ZXing TypeScript port)

**Key Features**:
- Continuous scan mode (doesn't stop after one scan)
- Animated corner brackets for visual feedback
- Audio feedback (beep on success, buzz on error)
- Auto-reset to IDLE after 3 seconds
- Offline detection with sticky banner

**Camera Setup**:
```typescript
import { BrowserMultiFormatReader } from '@zxing/browser';

const codeReader = new BrowserMultiFormatReader();
await codeReader.decodeFromVideoDevice(
  undefined, // auto-select camera
  'video-element-id',
  (result, error) => {
    if (result) {
      handleScan(result.getText());
    }
  }
);
```

### Offline Handling

```typescript
window.addEventListener('offline', () => {
  showBanner('⚠️ Hors ligne — les scans ne fonctionnent pas');
});

window.addEventListener('online', () => {
  dismissBanner();
});
```

---

## Best Practices

### 1. Environment Variables

**Never hardcode secrets**. Always use `process.env`:

```typescript
// ❌ BAD
const secret = 'my-secret-key';

// ✅ GOOD
const secret = process.env.QR_HMAC_SECRET;
```

**Generate strong secrets** (32+ characters):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 2. Database Queries

**Use aggregation instead of N+1**:

```typescript
// ❌ BAD (N+1 queries)
const events = await eventRepo.find();
for (const event of events) {
  const count = await ticketRepo.count({ where: { event_id: event.id } });
}

// ✅ GOOD (single query)
const result = await eventRepo
  .createQueryBuilder('e')
  .leftJoin('tickets', 't', 't.event_id = e.id')
  .select(['e.id', 'COUNT(t.id) AS ticket_count'])
  .groupBy('e.id')
  .getRawMany();
```

---

### 3. Concurrency Control

**Use pessimistic locking for critical sections**:

```typescript
const ticket = await queryRunner.manager.findOne(Ticket, {
  where: { id: ticketId },
  lock: { mode: 'pessimistic_write' }, // FOR UPDATE
});
```

This prevents double-scan race conditions.

---

### 4. Error Handling

**Map database errors to HTTP responses**:

```typescript
@Catch(QueryFailedError)
export class TypeOrmExceptionFilter {
  catch(exception: QueryFailedError) {
    if (exception.code === '23505') {
      return new ConflictException('Resource already exists');
    }
    // ...
  }
}
```

---

### 5. API Documentation

**Use Swagger decorators**:

```typescript
@ApiTags('Scanner')
@ApiBearerAuth()
@ApiOperation({ summary: 'Scan a QR code ticket' })
@ApiResponse({ status: 200, type: ScanResultDto })
@Post('scan')
scanTicket(@Body() dto: ScanTicketDto) {
  // ...
}
```

Access docs at: `http://localhost:3001/api/docs`

---

### 6. Security

**Hide sensitive fields**:

```typescript
@Column({ select: false })
qr_code: string;
```

QR codes won't appear in queries unless explicitly selected.

**Rate limiting**:

```typescript
@Throttle({ default: { limit: 30, ttl: 60000 } })
```

Prevents abuse (30 requests/minute).

---

### 7. Testing

**Test all scan outcomes**:

1. Valid QR, valid ticket → SUCCESS
2. Invalid HMAC → INVALID (no DB call)
3. Wrong event → WRONG_EVENT
4. Already checked → ALREADY_USED
5. Cancelled ticket → INVALID
6. Expired event → EXPIRED
7. Concurrent scans → only one SUCCESS

---

### 8. Monitoring

**Health checks for orchestration**:

```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health/ready"]
  interval: 30s
  timeout: 10s
  retries: 3
```

**Logging**:

```typescript
this.logger.log(`SCAN SUCCESS ticket=${ticketId} by user=${userId}`);
this.logger.error(`Scan failed ticket=${ticketId}`, error.stack);
```

---

## Troubleshooting

### Camera not working

1. Check HTTPS (required for camera access)
2. Check browser permissions
3. Check browser console for errors

### QR code invalid

1. Verify `QR_HMAC_SECRET` matches between generation and verification
2. Check QR code hasn't been truncated
3. Verify event ID in payload matches requested event

### Double-scan detected

This is expected behavior. The pessimistic lock ensures only one scan succeeds. The second scan will receive `ALREADY_USED`.

### Rate limit exceeded

User is scanning too fast (>30/minute). This is intentional to prevent abuse. Wait 60 seconds and try again.

---

## Support

For issues or questions:
- Check logs: `docker-compose logs api`
- Check Swagger docs: `http://localhost:3001/api/docs`
- Check health: `http://localhost:3001/health`
