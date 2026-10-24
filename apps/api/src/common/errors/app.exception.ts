import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiError, ErrorCode } from '@cedi/shared';

/** Error de negocio con código estable y mensaje apto para el usuario final. */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
  ) {
    super({ code, message } satisfies ApiError, status);
  }

  static unauthenticated(message = 'Inicia sesión para continuar.'): AppException {
    return new AppException(ErrorCode.UNAUTHENTICATED, message, HttpStatus.UNAUTHORIZED);
  }

  static forbidden(message = 'No tienes permiso para realizar esta acción.'): AppException {
    return new AppException(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }

  static validation(message: string): AppException {
    return new AppException(ErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST);
  }
}
