import * as Joi from 'joi';

const LOOPBACK_HOSTNAMES = new Set(['localhost', '0.0.0.0', '::1']);

/**
 * Is this hostname the local machine?
 *
 * Parsed rather than pattern-matched against the whole URL, so credentials
 * (`https://user:pw@localhost`) cannot smuggle a loopback host past the check.
 * Covers the whole `127.0.0.0/8` block, the IPv4-mapped IPv6 form, and the
 * trailing-dot FQDN spelling.
 */
function isLoopbackHostname(hostname: string): boolean {
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');

  return (
    LOOPBACK_HOSTNAMES.has(host) ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    // `URL` normalises an IPv4-mapped address to hex, so ::ffff:127.0.0.1
    // arrives as ::ffff:7f00:1 — `7f` being 127.
    /^::ffff:(127\.|7f[0-9a-f]{2}:)/.test(host)
  );
}

/** Joi rule: reject a URL whose host is the local machine. */
function rejectLoopback(value: string, helpers: Joi.CustomHelpers) {
  let hostname: string;
  try {
    hostname = new URL(value).hostname;
  } catch {
    return value; // malformed URLs are the `uri()` rule's to report
  }
  return isLoopbackHostname(hostname) ? helpers.error('url.loopback') : value;
}

/**
 * What a public URL must look like in production: a real https origin.
 *
 * Neither failure mode is loud on its own. A localhost value sends real users
 * to their own machine mid-redirect, and a plain-http one drops the `secure`
 * cookies the flow depends on — both surface as "that sign-in took too long"
 * on the login page, which points nowhere near the mistake. Refusing to boot
 * is far cheaper to diagnose.
 */
// Rules run in the order declared, and `abortEarly` reports only the first to
// fail — so the loopback check goes first, being the likelier mistake and the
// more specific diagnosis of the two.
const PRODUCTION_URL = Joi.string()
  .custom(rejectLoopback)
  .uri({ scheme: ['https'] })
  .required()
  .messages({
    'url.loopback':
      '{{#label}} must be the public URL in production, not a localhost ' +
      'address — social sign-in would send real users to their own machine',
    'string.uriCustomScheme':
      '{{#label}} must be an https URL in production — the sign-in cookies ' +
      'are `secure` and a browser will not send them over http',
  });

/** Applies the production rules only once the provider's pair is configured. */
const whenProviderEnabled = { is: Joi.exist(), then: PRODUCTION_URL };

export const configValidationSchema = Joi.object({
  // Social sign-in (optional — a provider is offered only when its pair is set).
  // `.empty('')` maps a blank value to undefined, so the placeholders in
  // .env.example and docker-compose read as "not configured" rather than
  // as an invalid empty credential.
  GOOGLE_CLIENT_ID: Joi.string().empty('').optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().empty('').optional(),
  FACEBOOK_APP_ID: Joi.string().empty('').optional(),
  FACEBOOK_APP_SECRET: Joi.string().empty('').optional(),

  // Database
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .empty('')
    .optional(),
  DB_HOST: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_PASS: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_NAME: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_SSL: Joi.boolean().default(false),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean().default(true),
  DB_POOL_MAX: Joi.number().integer().min(1).max(20).default(5),
  DB_CONNECTION_TIMEOUT_MS: Joi.number().integer().min(1000).default(10000),
  // Optional so the TypeORM factory can choose safe context-aware defaults:
  // local DB => true, hosted DATABASE_URL => false.
  DB_SYNCHRONIZE: Joi.boolean().optional(),
  DB_RUN_MIGRATIONS: Joi.boolean().optional(),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // QR Code Security
  QR_HMAC_SECRET: Joi.string().min(32).required(),

  // Email
  MAIL_HOST: Joi.string().optional(),
  MAIL_PORT: Joi.number().optional(),
  MAIL_USER: Joi.string().optional(),
  MAIL_PASS: Joi.string().optional(),
  MAIL_FROM: Joi.string().email().optional(),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),

  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  // Where the API sends the browser back to after a social callback.
  FRONTEND_URL: Joi.string()
    .uri()
    .empty('')
    .required()
    .when('NODE_ENV', { is: 'production', then: PRODUCTION_URL }),
  // Base URL the browser and the OAuth providers use to reach this API.
  // Only the social strategies read it, so it is held to the production rules
  // just when a provider is switched on — an API deployed without social
  // sign-in must not fail to boot over a URL nothing consults.
  API_PUBLIC_URL: Joi.string()
    .uri()
    .empty('')
    .default('http://localhost:4000')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.any()
        .when('GOOGLE_CLIENT_ID', whenProviderEnabled)
        .when('FACEBOOK_APP_ID', whenProviderEnabled),
    }),
})
  // Half a credential pair is a misconfiguration, not a disabled provider.
  .and('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET')
  .and('FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET');
