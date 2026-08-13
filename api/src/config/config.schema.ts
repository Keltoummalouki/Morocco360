import * as Joi from 'joi';

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
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  DB_NAME: Joi.string().required(),

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
  FRONTEND_URL: Joi.string().uri().required(),
  // Base URL the browser and the OAuth providers use to reach this API.
  API_PUBLIC_URL: Joi.string().uri().empty('').default('http://localhost:4000'),
})
  // Half a credential pair is a misconfiguration, not a disabled provider.
  .and('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET')
  .and('FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET');
