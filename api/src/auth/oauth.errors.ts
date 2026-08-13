import { BadRequestException, ConflictException } from '@nestjs/common';

/**
 * The two social sign-in failures a user can actually do something about.
 * They are distinct classes so OAuthFailureFilter can turn each into its own
 * message on the login page instead of a generic "something went wrong" —
 * and so unrelated 400s and 409s are not mistaken for them.
 */

export class OAuthEmailMissingException extends BadRequestException {}

export class OAuthEmailTakenException extends ConflictException {}
