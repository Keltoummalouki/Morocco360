import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { OAuthTokenService } from './oauth-token.service';

const ACCESS_SECRET = 'a-test-access-secret-long-enough-for-joi';

/** Raw nonce from the browser cookie, and the hash the API carries around. */
const NONCE = 'a'.repeat(64);
const NONCE_HASH = createHash('sha256').update(NONCE).digest('hex');

describe('OAuthTokenService', () => {
  let service: OAuthTokenService;
  let jwt: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthTokenService,
        JwtService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue(ACCESS_SECRET) },
        },
      ],
    }).compile();

    service = module.get(OAuthTokenService);
    jwt = module.get(JwtService);
  });

  // ── state ────────────────────────────────────────────────
  describe('state', () => {
    it('round-trips the nonce and redirect path', () => {
      const state = service.signState(NONCE_HASH, '/user/events');

      expect(service.verifyState(state)).toEqual({
        nonce: NONCE_HASH,
        redirect: '/user/events',
      });
    });

    it('returns a null redirect when none was carried', () => {
      expect(service.verifyState(service.signState(NONCE_HASH))).toEqual({
        nonce: NONCE_HASH,
        redirect: null,
      });
    });

    it('rejects a missing state', () => {
      expect(() => service.verifyState(undefined)).toThrow(
        UnauthorizedException,
      );
      expect(() => service.verifyState('')).toThrow(UnauthorizedException);
    });

    it('rejects a state signed with the raw access secret', () => {
      // The whole point of the derived key: a token minted with the access
      // secret must not pass as OAuth state, and vice versa.
      const forged = jwt.sign(
        { typ: 'oauth_state', nonce: NONCE_HASH, redirect: '/dashboard/admin' },
        { secret: ACCESS_SECRET, expiresIn: '5m' },
      );

      expect(() => service.verifyState(forged)).toThrow(UnauthorizedException);
    });

    it('rejects an exchange code presented as state', () => {
      const code = service.signExchangeCode(7, NONCE_HASH);

      expect(() => service.verifyState(code)).toThrow(UnauthorizedException);
    });
  });

  // ── exchange code ────────────────────────────────────────
  describe('exchange code', () => {
    it('returns the user id it was issued for', () => {
      const code = service.signExchangeCode(42, NONCE_HASH);

      expect(service.consumeExchangeCode(code, NONCE)).toBe(42);
    });

    it('refuses to spend the same code twice', () => {
      const code = service.signExchangeCode(42, NONCE_HASH);
      service.consumeExchangeCode(code, NONCE);

      expect(() => service.consumeExchangeCode(code, NONCE)).toThrow(
        UnauthorizedException,
      );
    });

    it('issues a distinct code each time so replay protection is per-sign-in', () => {
      service.consumeExchangeCode(
        service.signExchangeCode(42, NONCE_HASH),
        NONCE,
      );

      expect(
        service.consumeExchangeCode(
          service.signExchangeCode(42, NONCE_HASH),
          NONCE,
        ),
      ).toBe(42);
    });

    it('rejects an expired code', () => {
      jest.useFakeTimers();
      try {
        const code = service.signExchangeCode(42, NONCE_HASH);
        jest.advanceTimersByTime(61_000);

        expect(() => service.consumeExchangeCode(code, NONCE)).toThrow(
          UnauthorizedException,
        );
      } finally {
        jest.useRealTimers();
      }
    });

    it('rejects a state token presented as a code', () => {
      const state = service.signState(NONCE_HASH, '/user/events');

      expect(() => service.consumeExchangeCode(state, NONCE)).toThrow(
        UnauthorizedException,
      );
    });

    // The session-fixation defence: an attacker who completes the flow and
    // hands the victim the resulting URL has no way to plant their own nonce
    // cookie in the victim's browser, so the code cannot be redeemed there.
    it('rejects a code redeemed with a different browser nonce', () => {
      const code = service.signExchangeCode(42, NONCE_HASH);

      expect(() => service.consumeExchangeCode(code, 'b'.repeat(64))).toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a code redeemed with no nonce at all', () => {
      const code = service.signExchangeCode(42, NONCE_HASH);

      expect(() => service.consumeExchangeCode(code, '')).toThrow(
        UnauthorizedException,
      );
    });

    it('leaves the code spendable after a failed nonce attempt', () => {
      const code = service.signExchangeCode(42, NONCE_HASH);
      expect(() => service.consumeExchangeCode(code, 'c'.repeat(64))).toThrow();

      expect(service.consumeExchangeCode(code, NONCE)).toBe(42);
    });
  });
});
