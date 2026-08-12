# Free deployment: Supabase + Render + Vercel

This deployment keeps the existing application architecture:

- Supabase Free hosts PostgreSQL.
- Render Free hosts the NestJS API.
- Vercel Hobby hosts the Next.js frontend.

The NestJS API remains the only application allowed to access database rows.
Supabase Data API roles (`anon` and `authenticated`) have no table privileges,
and RLS is enabled on every public table.

## 1. Apply the Supabase schema

An empty Supabase project is required. From the repository root:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The versioned schema is in `supabase/migrations`. It creates all application
tables, constraints, indexes, RLS settings, and the four application roles.

Do not enable TypeORM `synchronize` against the hosted database. Supabase CLI
migrations are the production schema source of truth.

## 2. Copy the runtime database URL

In Supabase, open the project's **Connect** panel and copy the **Session
pooler** connection string (port `5432`). Replace the password placeholder with
your database password.

Use the Session pooler for Render because NestJS is a persistent backend. The
Transaction pooler on port `6543` is intended for short-lived/serverless
connections and does not support prepared statements.

The API production variables are:

```env
NODE_ENV=production
DATABASE_URL=postgres://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_POOL_MAX=5
DB_SYNCHRONIZE=false
DB_RUN_MIGRATIONS=false
```

Never expose `DATABASE_URL`, a Supabase secret/service-role key, Stripe secrets,
or the JWT secrets to the Next.js client.

## 3. Deploy the API on Render Free

1. Push this repository to GitHub.
2. In Render, create a **Blueprint** from the repository. Render reads the
   root `render.yaml` file.
3. Enter the requested secret values:
   - `DATABASE_URL`: the Supabase Session pooler URL from step 2.
   - `FRONTEND_URL`: your final Vercel URL (a temporary valid HTTPS URL is okay
     until the frontend exists).
   - `STRIPE_SECRET_KEY`: your Stripe test or live secret key.
   - `STRIPE_WEBHOOK_SECRET`: your Stripe endpoint signing secret.
4. Wait for `/health/ready` to report a healthy database connection.

Render generates the JWT and QR HMAC secrets automatically. Keep them stable:
changing them logs users out and invalidates previously generated QR codes.

Render Free sleeps after inactivity, so the first API request after a quiet
period can take about a minute. Its filesystem is ephemeral; do not store
uploads there permanently.

Render Free blocks outbound SMTP ports `25`, `465`, and `587`. If ticket email
delivery is required, use an allowed alternative port such as Mailtrap `2525`
or an email provider with an HTTPS API, then add the `MAIL_*` variables in the
Render dashboard.

## 4. Deploy the frontend on Vercel Hobby

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `web`.
3. Keep the detected framework as **Next.js**.
4. Add this server-only environment variable for Production, Preview, and
   Development:

```env
API_URL=https://YOUR-RENDER-SERVICE.onrender.com
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_server_only_key
SUPABASE_STORAGE_BUCKET=event-images
```

`SUPABASE_SECRET_KEY` must come from Supabase **Settings > API Keys > Secret
keys**. It bypasses Storage RLS and must never use a `NEXT_PUBLIC_` prefix.

5. Deploy. Do not rename `API_URL` to `NEXT_PUBLIC_API_URL`; the browser must
   call the Next.js BFF routes, which keep JWT cookies HTTP-only. Event images
   are uploaded server-side to the public `event-images` Storage bucket.
6. Return to Render and set `FRONTEND_URL` to the final Vercel production URL,
   then redeploy the API.

## 5. Finish Stripe configuration

Create a Stripe webhook endpoint pointing to:

```text
https://YOUR-RENDER-SERVICE.onrender.com/payments/webhook
```

Subscribe to the Checkout events used by the API and copy the endpoint signing
secret into Render as `STRIPE_WEBHOOK_SECRET`.

## 6. Create the first administrator

Register normally through the deployed app. Then run this once in the Supabase
SQL editor, replacing the email:

```sql
update public.users
set "roleId" = (select id from public.roles where name = 'ADMIN')
where email = 'you@example.com';
```

Log out and log back in so the new role is included in a fresh JWT.

## 7. Verification checklist

- `GET https://YOUR-RENDER-SERVICE.onrender.com/health/ready` returns `ok`.
- Registration and login work from the Vercel URL.
- A public event page loads through `/api/events`.
- A free ticket can be booked and its QR code downloaded.
- A Stripe test checkout creates tickets after the webhook runs.
- Supabase Security Advisor has no exposed-table/RLS errors.

## Local development

Local Docker PostgreSQL remains supported. Leave `DATABASE_URL` empty and use
the existing `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, and `DB_NAME`
variables. For local schema synchronization only:

```env
DB_SSL=false
DB_SYNCHRONIZE=true
DB_RUN_MIGRATIONS=true
```
