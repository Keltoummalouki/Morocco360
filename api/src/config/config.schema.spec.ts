import { configValidationSchema } from './config.schema';

const SECRET = 'x'.repeat(32);

/** Smallest env that validates, so each test can vary one thing. */
const baseEnv = {
  DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/morocco360',
  JWT_ACCESS_SECRET: SECRET,
  JWT_REFRESH_SECRET: SECRET,
  QR_HMAC_SECRET: SECRET,
  FRONTEND_URL: 'https://morocco360.example.com',
};

/** Mirrors the options AppModule passes to ConfigModule.forRoot. */
const validate = (env: Record<string, unknown>) =>
  configValidationSchema.validate(
    { ...baseEnv, ...env },
    { allowUnknown: true, abortEarly: true },
  );

describe('configValidationSchema', () => {
  describe('API_PUBLIC_URL in production with a provider configured', () => {
    // Only the social strategies read API_PUBLIC_URL, so the strict rules
    // apply from the moment a provider pair is set.
    const prod = {
      NODE_ENV: 'production',
      GOOGLE_CLIENT_ID: 'client-id',
      GOOGLE_CLIENT_SECRET: 'client-secret',
    };

    it('accepts a public https URL', () => {
      const { error, value } = validate({
        ...prod,
        API_PUBLIC_URL: 'https://api.morocco360.example.com',
      });

      expect(error).toBeUndefined();
      expect(value.API_PUBLIC_URL).toBe('https://api.morocco360.example.com');
    });

    it('rejects a localhost URL', () => {
      const { error } = validate({
        ...prod,
        API_PUBLIC_URL: 'http://localhost:4000',
      });

      expect(error?.message).toContain('API_PUBLIC_URL');
      expect(error?.message).toContain('not a localhost address');
    });

    // The loopback spellings a deploy is most likely to inherit from dev.
    it.each([
      'https://127.0.0.1',
      'https://0.0.0.0',
      'https://[::1]',
      'https://localhost',
      'https://localhost/api',
    ])('rejects %s', (url) => {
      const { error } = validate({ ...prod, API_PUBLIC_URL: url });

      expect(error).toBeDefined();
    });

    // The `secure` sign-in cookies never survive plain http.
    it('rejects a public http URL', () => {
      const { error } = validate({
        ...prod,
        API_PUBLIC_URL: 'http://api.morocco360.example.com',
      });

      expect(error?.message).toContain('https');
    });

    // The Docker service name docker-compose.yml warns against. Caught by the
    // https rule rather than the hostname rule, but caught.
    it('rejects the Docker service name', () => {
      const { error } = validate({ ...prod, API_PUBLIC_URL: 'http://api:4000' });

      expect(error?.message).toContain('https');
    });

    // Loopback has more spellings than `localhost`, and a URL can hide the
    // host behind credentials.
    it.each([
      'https://127.0.0.2',
      'https://127.1.2.3',
      'https://localhost.',
      'https://user:pw@localhost',
      'https://[::ffff:127.0.0.1]',
    ])('rejects the loopback spelling %s', (url) => {
      const { error } = validate({ ...prod, API_PUBLIC_URL: url });

      expect(error?.message).toContain('not a localhost address');
    });

    // Otherwise the deploy silently keeps the localhost dev default.
    it('is required rather than defaulted', () => {
      const { error } = validate(prod);

      expect(error?.message).toContain('API_PUBLIC_URL');
      expect(error?.message).toContain('required');
    });

    it('treats a blank value as missing', () => {
      const { error } = validate({ ...prod, API_PUBLIC_URL: '' });

      expect(error?.message).toContain('API_PUBLIC_URL');
    });

    // A host merely containing "localhost" is a real domain, not the loopback.
    it('accepts a public host whose name embeds localhost', () => {
      const { error } = validate({
        ...prod,
        API_PUBLIC_URL: 'https://localhost.morocco360.example.com',
      });

      expect(error).toBeUndefined();
    });

    it('applies the same rules to Facebook', () => {
      const { error } = validate({
        NODE_ENV: 'production',
        FACEBOOK_APP_ID: 'app-id',
        FACEBOOK_APP_SECRET: 'app-secret',
        API_PUBLIC_URL: 'http://localhost:4000',
      });

      expect(error?.message).toContain('API_PUBLIC_URL');
    });
  });

  // An API deployed without social sign-in must not fail to boot over a URL
  // nothing consults — that would take ticketing down to protect OAuth.
  describe('API_PUBLIC_URL in production with no provider configured', () => {
    it('is not required', () => {
      const { error, value } = validate({ NODE_ENV: 'production' });

      expect(error).toBeUndefined();
      expect(value.API_PUBLIC_URL).toBe('http://localhost:4000');
    });

    it('tolerates a leftover localhost value', () => {
      const { error } = validate({
        NODE_ENV: 'production',
        API_PUBLIC_URL: 'http://localhost:4000',
      });

      expect(error).toBeUndefined();
    });
  });

  describe('FRONTEND_URL in production', () => {
    const prod = { NODE_ENV: 'production' };

    it('accepts a public https URL', () => {
      const { error } = validate({
        ...prod,
        FRONTEND_URL: 'https://morocco360.example.com',
      });

      expect(error).toBeUndefined();
    });

    // Half of the reported bug: the callback bounces the browser here.
    it('rejects a localhost URL', () => {
      const { error } = validate({
        ...prod,
        FRONTEND_URL: 'http://localhost:4001',
      });

      expect(error?.message).toContain('FRONTEND_URL');
      expect(error?.message).toContain('not a localhost address');
    });

    it('rejects a public http URL', () => {
      const { error } = validate({
        ...prod,
        FRONTEND_URL: 'http://morocco360.example.com',
      });

      expect(error?.message).toContain('https');
    });
  });

  describe('public URLs outside production', () => {
    it('defaults API_PUBLIC_URL for local dev', () => {
      const { error, value } = validate({ NODE_ENV: 'development' });

      expect(error).toBeUndefined();
      expect(value.API_PUBLIC_URL).toBe('http://localhost:4000');
    });

    it('allows localhost URLs', () => {
      const { error } = validate({
        NODE_ENV: 'development',
        API_PUBLIC_URL: 'http://localhost:4000',
        FRONTEND_URL: 'http://localhost:4001',
      });

      expect(error).toBeUndefined();
    });

    it('applies the dev rules when NODE_ENV is absent', () => {
      const { error, value } = validate({});

      expect(error).toBeUndefined();
      expect(value.API_PUBLIC_URL).toBe('http://localhost:4000');
    });

    it('still requires FRONTEND_URL, which has no default', () => {
      const { error } = validate({ FRONTEND_URL: '' });

      expect(error?.message).toContain('FRONTEND_URL');
    });
  });

  describe('social credentials', () => {
    it('treats a blank pair as "provider disabled"', () => {
      const { error } = validate({
        GOOGLE_CLIENT_ID: '',
        GOOGLE_CLIENT_SECRET: '',
      });

      expect(error).toBeUndefined();
    });

    it('rejects half a credential pair', () => {
      const { error } = validate({ GOOGLE_CLIENT_ID: 'client-id' });

      expect(error?.message).toContain('GOOGLE_CLIENT_SECRET');
    });
  });
});
