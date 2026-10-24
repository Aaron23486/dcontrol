import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { ApiError, ErrorCode } from '@cedi/shared';
import type { Response } from 'express';
import { AppException } from './app.exception';

const GENERIC_BY_STATUS: Partial<Record<number, ApiError>> = {
  [HttpStatus.BAD_REQUEST]: {
    code: ErrorCode.VALIDATION_ERROR,
    message: 'La petición no es válida.',
  },
  [HttpStatus.UNAUTHORIZED]: {
    code: ErrorCode.UNAUTHENTICATED,
    message: 'Inicia sesión para continuar.',
  },
  [HttpStatus.FORBIDDEN]: {
    code: ErrorCode.FORBIDDEN,
    message: 'No tienes permiso para realizar esta acción.',
  },
  [HttpStatus.NOT_FOUND]: { code: ErrorCode.NOT_FOUND, message: 'El recurso no existe.' },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    code: ErrorCode.TOO_MANY_REQUESTS,
    message: 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',
  },
};

const INTERNAL_ERROR: ApiError = {
  code: ErrorCode.INTERNAL_ERROR,
  message: 'Ocurrió un error inesperado. Intenta de nuevo; si continúa, avisa al administrador.',
};

/** Convierte cualquier error en `{ code, message }` sin exponer detalles internos. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toApiError(exception);
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }
    response.status(status).json(body);
  }

  private toApiError(exception: unknown): { status: number; body: ApiError } {
    if (exception instanceof AppException) {
      return { status: exception.getStatus(), body: exception.getResponse() as ApiError };
    }
    if (exception instanceof ThrottlerException) {
      const status = HttpStatus.TOO_MANY_REQUESTS;
      return { status, body: GENERIC_BY_STATUS[status] as ApiError };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return { status, body: GENERIC_BY_STATUS[status] ?? INTERNAL_ERROR };
    }
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, body: INTERNAL_ERROR };
  }
}
