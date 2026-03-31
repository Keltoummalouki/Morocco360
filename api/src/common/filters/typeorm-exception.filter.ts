import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface PgDriverError {
  code?: string;
  detail?: string;
  message?: string;
}

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const error = exception.driverError as PgDriverError;
    const code = error?.code;
    const detail = error?.detail;
    const errorMessage = error?.message;

    this.logger.error(
      `TypeORM error: ${code ?? 'UNKNOWN'} - ${detail ?? errorMessage ?? ''}`,
      exception.stack,
    );

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Une erreur de base de données est survenue';

    // PostgreSQL error codes mapping
    switch (code) {
      case '23505': // unique_violation
        status = HttpStatus.CONFLICT;
        message = 'Cette ressource existe déjà';
        break;
      case '23503': // foreign_key_violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Référence invalide';
        break;
      case '23502': // not_null_violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Champ requis manquant';
        break;
      case '22P02': // invalid_text_representation
        status = HttpStatus.BAD_REQUEST;
        message = 'Format de données invalide';
        break;
      case '23514': // check_violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Contrainte de validation non respectée';
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
