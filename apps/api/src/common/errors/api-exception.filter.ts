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
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../auth/authenticated-request';
import { SESSION_COOKIE } from '../../auth/session-cookie';
import { SecurityEvents } from '../../security/security-events';
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
  [HttpStatus.PAYLOAD_TOO_LARGE]: {
    code: ErrorCode.PAYLOAD_TOO_LARGE,
    message: 'La petición es demasiado grande.',
  },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    code: ErrorCode.TOO_MANY_REQUESTS,
    message: 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',
  },
};

const INTERNAL_ERROR: ApiError = {
  code: ErrorCode.INTERNAL_ERROR,
  message: 'Ocurrió un error inesperado. Intenta de nuevo; si continúa, avisa al administrador.',
};

/**
 * Error del lector del cuerpo de Express (body-parser): cuerpo demasiado grande, JSON mal
 * formado, codificación no soportada… Trae su propio `status` 4xx (SEC-06).
 */
function bodyParserStatus(exception: unknown): number | null {
  if (typeof exception !== 'object' || exception === null) return null;
  const { type, status } = exception as { type?: unknown; status?: unknown };
  const isBodyError =
    typeof type === 'string' &&
    /^(entity\.|encoding\.|charset\.|request\.(aborted|size))/.test(type);
  return isBodyError && typeof status === 'number' && status >= 400 && status < 500 ? status : null;
}

/** Convierte cualquier error en `{ code, message }` sin exponer detalles internos. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly events: SecurityEvents) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const { status, body } = this.toApiError(exception);
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }
    this.recordSecurityEvent(exception, status, body, http.getRequest<Request>());
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
    const bodyStatus = bodyParserStatus(exception);
    if (bodyStatus !== null) {
      return {
        status: bodyStatus,
        body:
          GENERIC_BY_STATUS[bodyStatus] ?? (GENERIC_BY_STATUS[HttpStatus.BAD_REQUEST] as ApiError),
      };
    }
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, body: INTERNAL_ERROR };
  }

  /**
   * SEC-04: accesos denegados, sesiones rechazadas y límites de intentos alcanzados.
   * Solo la ruta, sin la cadena de búsqueda (puede llevar nombres o cédulas).
   */
  private recordSecurityEvent(
    exception: unknown,
    status: number,
    body: ApiError,
    request: Request | undefined,
  ): void {
    if (!request) return;
    const context = { ip: request.ip, method: request.method, path: request.path };
    if (status === HttpStatus.FORBIDDEN && body.code === ErrorCode.FORBIDDEN) {
      const { user } = request as Partial<AuthenticatedRequest>;
      this.events.record({
        event: 'access.forbidden',
        level: 'warn',
        userId: user?.id,
        reason: user?.role,
        ...context,
      });
    } else if (exception instanceof ThrottlerException) {
      this.events.record({ event: 'auth.rate_limited', level: 'warn', ...context });
    } else if (
      body.code === ErrorCode.UNAUTHENTICATED &&
      typeof request.cookies?.[SESSION_COOKIE] === 'string'
    ) {
      // Sin cookie es lo normal antes de iniciar sesión; con cookie es una sesión inválida,
      // vencida o revocada (o un token manipulado).
      this.events.record({ event: 'auth.session_rejected', level: 'warn', ...context });
    }
  }
}
