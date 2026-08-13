import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';

/** Seconds a `state` value stays valid — one browser redirect to the provider. */
const STATE_TTL = 600;
/** Seconds an exchange code stays valid — one redirect back to the web app. */
const CODE_TTL = 60;

interface StatePayload {
  typ: 'oauth_state';
  /** SHA-256 of the nonce the web app stored in the browser's cookie. */
  nonce: string;
  redirect?: string;
}

interface CodePayload {
  typ: 'oauth_code';
  sub: number;
  jti: string;
  nonce: string;
}

export interface VerifiedState {
  nonce: string;
  redirect: string | null;
}

/**
 * Short-lived tokens for the OAuth redirect dance.
 *
 * Both are JWTs signed with keys *derived* from `JWT_ACCESS_SECRET` rather than
 * the secret itself, so neither can ever be replayed as an access or refresh
 * token even though both travel through the browser's address bar.
 *
 * - **state** protects the callback against login CSRF and carries the
 *   post-login redirect path across the round trip.
 * - **code** is handed to the web app, which trades it server-to-server for the
 *   real token pair. It is single-use and expires in a minute.
 */
@Injectable()
export class OAuthTokenService {
  /** jti → expiry (ms) of codes already spent, so a code cannot be replayed. */
  private readonly spentCodes = new Map<string, number>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  signState(nonce: string, redirect?: string): string {
    const payload: StatePayload = { typ: 'oauth_state', nonce };
    if (redirect) payload.redirect = redirect;
    return this.jwt.sign(payload, {
      secret: this.key('state'),
      expiresIn: STATE_TTL,
    });
  }

  verifyState(state: unknown): VerifiedState {
    if (typeof state !== 'string' || !state) {
      throw new UnauthorizedException('Missing OAuth state');
    }
    const payload = this.verify<StatePayload>(state, 'state');
    if (payload.typ !== 'oauth_state' || !payload.nonce) {
      throw new UnauthorizedException('Invalid OAuth state');
    }
    return { nonce: payload.nonce, redirect: payload.redirect ?? null };
  }

  signExchangeCode(userId: number, nonce: string): string {
    const payload: CodePayload = {
      typ: 'oauth_code',
      sub: userId,
      jti: randomUUID(),
      nonce,
    };
    return this.jwt.sign(payload, {
      secret: this.key('code'),
      expiresIn: CODE_TTL,
    });
  }

  /**
   * @param nonce the raw value from the browser's cookie; its hash must match
   *   the one baked into the code, which is what stops a code stolen from a URL
   *   from being redeemed in someone else's browser.
   * @returns the user id the code was issued for. Each code works once.
   */
  consumeExchangeCode(code: string, nonce: string): number {
    const payload = this.verify<CodePayload>(code, 'code');
    if (payload.typ !== 'oauth_code' || typeof payload.sub !== 'number') {
      throw new UnauthorizedException('Invalid sign-in code');
    }

    if (!timingSafeEqualHex(sha256(nonce), payload.nonce)) {
      throw new UnauthorizedException(
        'This sign-in link was started in a different browser',
      );
    }

    this.pruneSpentCodes();
    if (this.spentCodes.has(payload.jti)) {
      throw new UnauthorizedException('Sign-in code already used');
    }
    this.spentCodes.set(payload.jti, Date.now() + CODE_TTL * 1000);

    return payload.sub;
  }

  /**
   * Purpose-bound key derived from the access secret: a token minted here can
   * never validate against the access or refresh secret, and vice versa.
   */
  private key(purpose: 'state' | 'code'): string {
    const secret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    return createHmac('sha256', secret)
      .update(`oauth:${purpose}`)
      .digest('hex');
  }

  private verify<T extends object>(
    token: string,
    purpose: 'state' | 'code',
  ): T {
    try {
      return this.jwt.verify<T>(token, { secret: this.key(purpose) });
    } catch {
      throw new UnauthorizedException(
        'Sign-in link expired — please try again',
      );
    }
  }

  /**
   * Codes expire in a minute, so dropping the stale entries keeps the map tiny.
   *
   * This lives in process memory: across several API replicas a code could be
   * spent once per replica. The nonce binding is the real defence — replay also
   * needs the browser cookie — so this stays a local backstop rather than a
   * reason to pull in shared storage.
   */
  private pruneSpentCodes(): void {
    const now = Date.now();
    for (const [jti, expiresAt] of this.spentCodes) {
      if (expiresAt <= now) this.spentCodes.delete(jti);
    }
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
