# Production Deployment Checklist

## Pre-Deployment

### Security

- [ ] All secrets are 32+ characters (JWT, QR_HMAC_SECRET)
- [ ] Secrets generated with cryptographically secure random generator
- [ ] No secrets committed to Git (check `.gitignore`)
- [ ] Environment variables set in production environment (not in code)
- [ ] HTTPS enabled on all endpoints
- [ ] CORS configured for production frontend domain only
- [ ] Rate limiting configured appropriately
- [ ] SQL injection protection verified (TypeORM parameterized queries)
- [ ] XSS protection enabled (helmet middleware)
- [ ] CSRF protection enabled for state-changing operations

### Database

- [ ] PostgreSQL 16+ running
- [ ] Database backups configured (daily minimum)
- [ ] Connection pooling configured
- [ ] Database credentials rotated from defaults
- [ ] `synchronize: false` in TypeORM config (use migrations only)
- [ ] All migrations tested and applied
- [ ] Database indexes verified on:
  - `tickets.event_id`
  - `tickets.qr_code` (unique)
  - `event_staff.event_id, event_staff.user_id` (unique composite)
  - `qr_scan_logs.ticket_id`
  - `qr_scan_logs.scanned_at`

### Configuration

- [ ] `NODE_ENV=production` set
- [ ] Config validation passing (Joi schema)
- [ ] All required env vars present:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
  - `QR_HMAC_SECRET`
  - `FRONTEND_URL`
  - `MAIL_*` (if using email)
  - `STRIPE_*` (if using payments)
- [ ] Logging level appropriate for production
- [ ] Error tracking configured (Sentry, etc.)

### Performance

- [ ] Database query optimization verified (no N+1)
- [ ] Response DTOs configured (prevent over-fetching)
- [ ] Caching strategy implemented (Redis recommended)
- [ ] CDN configured for static assets
- [ ] Compression enabled (gzip/brotli)
- [ ] Connection pooling tuned for expected load

### Monitoring

- [ ] Health check endpoints working:
  - `/health` - full check
  - `/health/ready` - readiness probe
  - `/health/live` - liveness probe
- [ ] Application logs centralized (CloudWatch, Datadog, etc.)
- [ ] Error alerting configured
- [ ] Performance monitoring enabled (APM)
- [ ] Database monitoring enabled
- [ ] Uptime monitoring configured

### Testing

- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Load testing completed for expected traffic
- [ ] Scanner flow tested end-to-end
- [ ] Concurrent scan testing completed (double-scan prevention)
- [ ] All scan result types tested:
  - SUCCESS
  - ALREADY_USED
  - INVALID
  - WRONG_EVENT
  - EXPIRED

---

## Deployment

### Build

- [ ] TypeScript build successful (`npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Dependencies audit clean (`npm audit`)

### Infrastructure

- [ ] Container orchestration configured (Docker, K8s, ECS)
- [ ] Auto-scaling configured
- [ ] Load balancer configured
- [ ] SSL/TLS certificates installed and valid
- [ ] Firewall rules configured
- [ ] DDoS protection enabled

### Docker (if using)

- [ ] Dockerfile optimized (multi-stage build)
- [ ] `.dockerignore` configured
- [ ] Health checks configured in docker-compose/K8s:
  ```yaml
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3001/health/ready"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
  ```
- [ ] Resource limits set (CPU, memory)
- [ ] Restart policy configured

### Database Migrations

- [ ] Backup created before migration
- [ ] Migrations tested in staging
- [ ] Rollback plan prepared
- [ ] Downtime window communicated (if needed)
- [ ] Migrations applied: `npm run migration:run`

---

## Post-Deployment

### Verification

- [ ] Health check returns 200: `curl https://api.morocco360.com/health`
- [ ] Swagger docs accessible: `https://api.morocco360.com/api/docs`
- [ ] Login flow working
- [ ] Scanner flow working
- [ ] Organizer dashboard loading
- [ ] Stats updating correctly
- [ ] CSV export working
- [ ] Email notifications sending (if configured)
- [ ] Payment processing working (if configured)

### Monitoring

- [ ] Check logs for errors
- [ ] Verify metrics are being collected
- [ ] Test alerting (trigger test alert)
- [ ] Monitor resource usage (CPU, memory, disk)
- [ ] Monitor database connections
- [ ] Monitor API response times

### Performance

- [ ] Response times acceptable (<200ms for most endpoints)
- [ ] Database query times acceptable (<50ms average)
- [ ] Scanner endpoint responding quickly (<500ms)
- [ ] No memory leaks detected
- [ ] Connection pool not exhausted

---

## Rollback Plan

If issues occur:

1. **Immediate**: Revert to previous deployment
   ```bash
   kubectl rollout undo deployment/morocco360-api
   # or
   docker service update --rollback morocco360-api
   ```

2. **Database**: Revert migrations if needed
   ```bash
   npm run migration:revert
   ```

3. **Verify**: Check health endpoint returns to normal

4. **Investigate**: Review logs and metrics to identify issue

5. **Fix**: Address issue in development/staging

6. **Redeploy**: Once fixed and tested

---

## Security Hardening

### API

- [ ] Helmet middleware enabled
  ```typescript
  app.use(helmet());
  ```

- [ ] CORS restricted to production domain
  ```typescript
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });
  ```

- [ ] Rate limiting configured per endpoint
  ```typescript
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  ```

- [ ] Request size limits set
  ```typescript
  app.use(express.json({ limit: '1mb' }));
  ```

### Database

- [ ] Least privilege principle (app user has only needed permissions)
- [ ] SSL/TLS connection to database
- [ ] Database firewall rules (only app servers can connect)
- [ ] Regular security patches applied

### Secrets Management

- [ ] Secrets stored in secure vault (AWS Secrets Manager, HashiCorp Vault)
- [ ] Secrets rotated regularly (quarterly minimum)
- [ ] Access to secrets logged and audited
- [ ] Secrets never logged or exposed in errors

---

## Compliance

### GDPR (if applicable)

- [ ] User data encrypted at rest
- [ ] User data encrypted in transit (HTTPS)
- [ ] Data retention policy implemented
- [ ] User data export functionality
- [ ] User data deletion functionality
- [ ] Privacy policy updated
- [ ] Cookie consent implemented

### PCI DSS (if handling payments)

- [ ] Payment data never stored (use Stripe tokens)
- [ ] PCI compliance verified with payment provider
- [ ] Security audit completed

---

## Documentation

- [ ] API documentation up to date (Swagger)
- [ ] README updated with production URLs
- [ ] Runbook created for common issues
- [ ] Incident response plan documented
- [ ] On-call rotation established
- [ ] Team trained on new features

---

## Maintenance

### Regular Tasks

- [ ] Weekly: Review logs for errors
- [ ] Weekly: Check resource usage trends
- [ ] Monthly: Review and rotate secrets
- [ ] Monthly: Update dependencies (`npm audit fix`)
- [ ] Quarterly: Load testing
- [ ] Quarterly: Security audit
- [ ] Yearly: Disaster recovery drill

### Monitoring Alerts

Configure alerts for:
- [ ] API error rate > 1%
- [ ] API response time > 1s (p95)
- [ ] Database connection pool > 80%
- [ ] Memory usage > 80%
- [ ] Disk usage > 80%
- [ ] Health check failures
- [ ] Failed login attempts > 10/min
- [ ] Scanner errors > 5%

---

## Emergency Contacts

Document:
- [ ] On-call engineer contact
- [ ] Database admin contact
- [ ] Infrastructure team contact
- [ ] Security team contact
- [ ] Payment provider support
- [ ] Email provider support

---

## Sign-Off

- [ ] Development team lead approval
- [ ] QA team approval
- [ ] Security team approval
- [ ] Operations team approval
- [ ] Product owner approval

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Verified By**: _________________

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
